import React, { useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import './VideoProcess.css';

const VideoProcess = ({ splitFolder }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [results, setResults] = useState([]);
    const [eventSource, setEventSource] = useState(null);
    const [totalClips, setTotalClips] = useState(0);

    // Define colors for each emotion
    const emotionColors = {
        neutral: '#4e79a7',
        happy: '#59a14f',
        sad: '#e15759',
        anger: '#edc948',
        surprise: '#b07aa1',
        disgust: '#ff9da7',
        fear: '#9c755f'
    };

    // Calculate the maximum confidence value from all results
    const getMaxConfidence = () => {
        if (results.length === 0) return 100; // Default to 100% if no results

        // Find the highest confidence value across all results
        const maxConfidence = Math.max(
            ...results.map(result => result.confidence * 100)
        );

        // Add 10% padding to the maximum value for better visualization
        return Math.min(Math.ceil(maxConfidence * 1.1), 100);
    }

    const handleStartAnalysis = () => {
        if (!splitFolder) {
            setError("No video clips available for analysis");
            return;
        }

        console.log('Split folder:', splitFolder);

        setIsAnalyzing(true);
        setProgress(0);
        setResults([]);
        setError(null);

        const es = new EventSource(
            `http://127.0.0.1:5000/analyze-clips?split_folder=${encodeURIComponent(splitFolder)}`
        );

        es.addEventListener('open', () => {
            console.log('Connection established');
        });

        es.addEventListener('message', (event) => {
            if (event.data.trim() === '{}') return; // Skip empty events

            try {
                const data = JSON.parse(event.data);

                if (data.error) {
                    setError(`Error processing clip ${data.current}/${data.total}: ${data.error}`);
                } else {
                    const result = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
                    setResults(prev => [...prev, {
                        ...result,
                        current: data.current,
                        total: data.total
                    }]);
                    setTotalClips(data.total);
                    setProgress((data.current / data.total) * 100);
                }
            } catch (e) {
                console.error('Error parsing event data:', e);
            }
        });

        es.addEventListener('complete', () => {
            console.log('Analysis complete');
            es.close();
            setIsAnalyzing(false);
        });

        es.addEventListener('error', (err) => {
            console.error('EventSource error:', err);
            setError('Analysis connection error. Please try again.');
            es.close();
            setIsAnalyzing(false);
        });

        setEventSource(es);
    };

    const handleStopAnalysis = () => {
        if (eventSource) {
            eventSource.close();
            setEventSource(null);
        }
        setIsAnalyzing(false);
        setError('Analysis stopped by user');
    };

    useEffect(() => {
        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [eventSource]);

    // Prepare data for the chart - one series per emotion
    // Prepare data for the chart - one series per emotion
    const emotionSeries = () => {
        const emotions = ['neutral', 'happy', 'sad', 'anger', 'surprise', 'disgust', 'fear'];
        return emotions.map(emotion => ({
            label: `${emotion.charAt(0).toUpperCase() + emotion.slice(1)}`,
            data: results.map(result =>
                parseFloat((result.probabilities[emotion] * 100).toFixed(2))
            ),
            color: emotionColors[emotion],
            showMark: false,
            curve: 'linear'
        }));
    };

    // Get clip numbers for x-axis
    const clipNumbers = results.map(result => result.current);

    return (
        <div className="video-process-container">
            <h2>Video Analysis</h2>

            {!splitFolder ? (
                <div className="no-video-message">
                    Please upload and process a video first
                </div>
            ) : (
                <>
                    <div className="analysis-controls">
                        {!isAnalyzing ? (
                            <button
                                onClick={handleStartAnalysis}
                                className="analyze-btn"
                                disabled={!splitFolder}
                            >
                                Analyze the Video
                            </button>
                        ) : (
                            <button
                                onClick={handleStopAnalysis}
                                className="stop-btn"
                            >
                                Stop Analysis
                            </button>
                        )}
                    </div>
                    {
                        isAnalyzing && (
                            <div className="progress-container">
                                <progress value={progress} max="100" />
                                <span>{progress.toFixed(1)}%</span>
                                <span>Processing {results.length} of {results[0]?.total || '?'} clips</span>
                            </div>
                        )
                    }

                    {error && <div className="error-message">{error}</div>}

                    <div className="results-container">
                        {results.length > 0 && (
                            <>
                                <div className="chart-container">
                                    <LineChart
                                        xAxis={[{
                                            data: clipNumbers,
                                            label: 'Clip Number',
                                            scaleType: 'point'
                                        }]}
                                        yAxis={[{
                                            label: 'Probability (%)',
                                            min: 0,
                                            max: getMaxConfidence()
                                        }]}
                                        series={emotionSeries()}
                                        height={400}
                                        margin={{ left: 70, right: 30, top: 30, bottom: 70 }}
                                        slotProps={{
                                            legend: {
                                                direction: 'row',
                                                position: { vertical: 'bottom', horizontal: 'middle' },
                                                padding: 0,
                                            },
                                        }}
                                    />
                                </div>

                                <div className="latest-result">
                                    <h3>Latest Result (Clip {results[results.length - 1].current})</h3>
                                    <div className="result-details">
                                        <p><strong>Dominant Emotion:</strong> {results[results.length - 1].emotion}</p>
                                        <p><strong>Probabilities:</strong></p>
                                        <ul>
                                            {Object.entries(results[results.length - 1].probabilities)
                                                .sort((a, b) => b[1] - a[1])
                                                .map(([emotion, prob]) => (
                                                    <li key={emotion} style={{ color: emotionColors[emotion] }}>
                                                        {emotion.charAt(0).toUpperCase() + emotion.slice(1)}: {(prob * 100).toFixed(2)}%
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default VideoProcess;