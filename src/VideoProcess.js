import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import './VideoProcess.css';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import TimelineDot from '@mui/lab/TimelineDot';
import Typography from '@mui/material/Typography';
import SentimentNeutralIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import WarningIcon from '@mui/icons-material/Warning';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import CelebrationIcon from '@mui/icons-material/Celebration';

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

  // Emotion icons
  const emotionIcons = {
    neutral: <SentimentNeutralIcon />,
    anger: <SentimentVeryDissatisfiedIcon />,
    sadness: <SentimentDissatisfiedIcon />,
    frustration: <WarningIcon />,
    excited: <CelebrationIcon />,
    happiness: <SentimentVerySatisfiedIcon />,
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
              text: data.text,
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

    return (
      <div className="timeline-container mt-6">
        <h3 className="text-lg font-semibold mb-2">Video Timeline</h3>
        <Timeline position="alternate">
          {results.map((result, index) => {
            // Find dominant emotion
            let dominantEmotion = 'neutral';
            let maxProb = 0;
            Object.entries(result.probabilities || {}).forEach(([emotion, prob]) => {
              if (prob > maxProb) {
                maxProb = prob;
                dominantEmotion = emotion;
              }
            });

            const timeWindow = `${formatTime(result.start_time)} - ${formatTime(result.end_time)}`;

            return (
              <TimelineItem key={index}>
                <TimelineOppositeContent
                  sx={{ m: 'auto 0' }}
                  variant="body2"
                  color="text.secondary"
                >
                  {timeWindow}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineConnector />
                  <TimelineDot style={{ backgroundColor: emotionColors[dominantEmotion] }}>
                    {emotionIcons[dominantEmotion]}
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent sx={{ py: '12px', px: 2 }}>
                  <Typography variant="h6" component="span">
                    {emotionDisplayNames[dominantEmotion]}
                  </Typography>
                  <Typography>{result.text || 'No text available'}</Typography>
                  <img
                    src={result.video_clip_path}
                    alt={`Clip ${result.current}`}
                    style={{ maxWidth: '100px', marginTop: '8px' }}
                    onError={(e) => {
                      e.target.style.display = 'none'; // Hide if image fails to load
                    }}
                  />
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
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
                    <strong>Predicted Emotion:</strong>{' '}
                    {results[results.length - 1].emotion}
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