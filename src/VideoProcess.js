import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import './VideoProcess.css';

const VideoProcess = ({ uploadResult, videoId }) => {
  const videoSplitFolder = uploadResult?.video_split_folder;
  const audioSplitFolder = uploadResult?.audio_split_folder;
  const textSplitPath = uploadResult?.text_split_path;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState([]);
  const [results, setResults] = useState([]);
  const [finalScores, setFinalScores] = useState(null);
  const { isAuthenticated, token } = useAuth();
  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  // Emotion configuration
  const emotionColors = {
    neutral: '#4e79a7',
    anger: '#e15759',
    sadness: '#59a14f',
    frustration: '#edc948',
    excited: '#b07aa1',
    happiness: '#ff9da7',
  };

  const emotionDisplayNames = {
    neutral: 'Neutral',
    anger: 'Anger',
    sadness: 'Sadness',
    frustration: 'Frustration',
    excited: 'Excited',
    happiness: 'Happiness',
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartAnalysis = () => {
    if (!videoSplitFolder || !audioSplitFolder || !textSplitPath) {
      setErrors(['Missing required video processing data']);
      return;
    }

    if (!isAuthenticated || !token) {
      setErrors(['You must be logged in to analyze videos']);
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setResults([]);
    setFinalScores(null);
    setErrors([]);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const params = new URLSearchParams();
    params.append('video_split_folder', videoSplitFolder);
    params.append('audio_split_folder', audioSplitFolder);
    params.append('text_split_path', textSplitPath);
    if (videoId) params.append('video_id', videoId);
    params.append('token', token);

    const es = new EventSource(`http://127.0.0.1:5000/analyze-clips?${params.toString()}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      clearTimeout(reconnectTimerRef.current);
    };

    es.onmessage = (event) => {
      try {
        if (event.data.startsWith(':')) return;

        const data = JSON.parse(event.data);

        if (data.error) {
          setErrors((prev) => [...prev, `Clip ${data.current}/${data.total}: ${data.error}`]);
        } else if (data.result) {
          setResults((prev) => [
            ...prev,
            {
              ...data.result,
              current: data.current,
              total: data.total,
              start_time: data.start_time,
              end_time: data.end_time,
              video_clip_path: data.video_clip_path,
            },
          ]);
          setProgress((data.current / data.total) * 100);
        }
      } catch (e) {
        console.error('Error parsing event data:', e);
        setErrors((prev) => [...prev, 'Failed to parse analysis data']);
      }
    };

    es.addEventListener('complete', (event) => {
      try {
        if (event.data && event.data.trim() !== '{}') {
          const completionData = JSON.parse(event.data);
          if (completionData.emotion_scores) {
            setFinalScores(completionData.emotion_scores);
          }
          if (completionData.errors && completionData.errors.length > 0) {
            setErrors((prev) => [...prev, ...completionData.errors]);
          }
        }
        es.close();
        setIsAnalyzing(false);
      } catch (e) {
        console.error('Error handling completion:', e);
        es.close();
        setIsAnalyzing(false);
        setErrors((prev) => [...prev, 'Analysis completed with errors']);
      }
    });

    es.onerror = (err) => {
      if (es.readyState === EventSource.CLOSED) {
        reconnectTimerRef.current = setTimeout(() => {
          handleStartAnalysis();
        }, 5000);
      }
    };
  };

  const handleStopAnalysis = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    clearTimeout(reconnectTimerRef.current);
    setIsAnalyzing(false);
    setErrors((prev) => [...prev, 'Analysis stopped by user']);
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      clearTimeout(reconnectTimerRef.current);
    };
  }, []);

  const renderFinalResults = () => {
    if (!finalScores) return null;

    let dominant = { emotion: 'neutral', value: 0 };
    Object.entries(finalScores).forEach(([emotion, value]) => {
      if (value > dominant.value) {
        dominant = { emotion, value };
      }
    });

    return (
      <div className="final-results mt-4">
        <h3 className="text-lg font-semibold">Analysis Complete</h3>
        <p className="dominant-emotion">
          Dominant emotion:{' '}
          <span style={{ color: emotionColors[dominant.emotion] }}>
            {emotionDisplayNames[dominant.emotion]} ({(dominant.value * 100).toFixed(1)}%)
          </span>
        </p>
      </div>
    );
  };

  const renderTimeline = () => {
    if (results.length === 0) return null;

    // Calculate total duration to scale the timeline
    const maxTime = Math.max(...results.map((r) => r.end_time));
    if (maxTime === 0) return null;

    return (
      <div className="timeline-container mt-6">
        <h3 className="text-lg font-semibold mb-2">Video Timeline</h3>
        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
          {results.map((result, index) => {
            const startPercent = (result.start_time / maxTime) * 100;
            const endPercent = (result.end_time / maxTime) * 100;
            const widthPercent = endPercent - startPercent;
            const middlePercent = startPercent + widthPercent / 2;

            // Find dominant emotion
            let dominantEmotion = 'neutral';
            let maxProb = 0;
            Object.entries(result.probabilities).forEach(([emotion, prob]) => {
              if (prob > maxProb) {
                maxProb = prob;
                dominantEmotion = emotion;
              }
            });

            return (
              <div
                key={index}
                className="absolute h-8"
                style={{
                  left: `${startPercent}%`,
                  width: `${widthPercent}%`,
                  backgroundColor: emotionColors[dominantEmotion],
                  opacity: 0.7,
                }}
              >
                {/* Emotion label above the segment */}
                <div
                  className="absolute -top-6 text-sm font-medium text-center w-full"
                  style={{ color: emotionColors[dominantEmotion] }}
                >
                  {emotionDisplayNames[dominantEmotion]}
                </div>
                {/* Middle screen thumbnail */}
                <div
                  className="absolute top-0 h-full"
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                >
                  <img
                    src={result.video_clip_path}
                    alt={`Clip ${result.current}`}
                    className="h-full object-cover"
                    style={{ maxWidth: '50px' }}
                    onError={(e) => {
                      e.target.style.display = 'none'; // Hide if image fails to load
                    }}
                  />
                </div>
                {/* Start and end time labels */}
                <div className="absolute -bottom-5 text-xs left-0">
                  {formatTime(result.start_time)}
                </div>
                <div className="absolute -bottom-5 text-xs right-0">
                  {formatTime(result.end_time)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="video-process-container p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Video Analysis</h2>

      {!uploadResult ? (
        <div className="no-video-message text-gray-600">
          Please upload and process a video first
        </div>
      ) : (
        <>
          <div className="analysis-controls mb-4">
            {!isAnalyzing ? (
              <button
                onClick={handleStartAnalysis}
                className="analyze-btn bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                disabled={!uploadResult || !isAuthenticated || !token}
              >
                Analyze the Video
              </button>
            ) : (
              <button
                onClick={handleStopAnalysis}
                className="stop-btn bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Stop Analysis
              </button>
            )}
          </div>

          {isAnalyzing && (
            <div className="progress-container mb-4">
              <progress value={progress} max="100" className="w-full" />
              <div className="flex justify-between text-sm mt-1">
                <span>{progress.toFixed(1)}%</span>
                <span>
                  Processing {results.length} of {results[0]?.total || 'unknown'} clips
                </span>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="error-messages mb-4">
              {errors.map((err, idx) => (
                <div key={idx} className="error-message text-red-600">
                  {err}
                </div>
              ))}
            </div>
          )}

          {finalScores && renderFinalResults()}

          <div className="results-container">
            {renderTimeline()}
            {results.length > 0 && (
              <div className="latest-result mt-4">
                <h3 className="text-lg font-semibold">
                  Latest Result (Clip {results[results.length - 1].current})
                </h3>
                <div className="result-details">
                  <p>
                    <strong>Dominant Emotion:</strong>{' '}
                    {results[results.length - 1].emotion}
                  </p>
                  <p>
                    <strong>Confidence:</strong>{' '}
                    {(results[results.length - 1].confidence * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VideoProcess;