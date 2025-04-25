import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import "./History.css";
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

const emotionColors = {
  happiness: '#4caf50',
  anger: '#f44336',
  neutral: '#9e9e9e',
  sadness: '#2196f3'
};

const emotionIcons = {
  neutral: <SentimentNeutralIcon />,
  anger: <SentimentVeryDissatisfiedIcon />,
  sadness: <SentimentDissatisfiedIcon />,
  frustration: <WarningIcon />,
  excited: <CelebrationIcon />,
  happiness: <SentimentVerySatisfiedIcon />,
};

const emotionDisplayNames = {
  happiness: 'Happiness',
  anger: 'Anger',
  neutral: 'Neutral',
  sadness: 'Sadness'
};

const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return '0:00';
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

const VideoHistory = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchVideos();
    }
  }, [isAuthenticated, token]);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get("http://127.0.0.1:5000/user/videos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setVideos(response.data.videos);
      console.log(response.data)
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("Failed to load your video history.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderTimeline = (results) => {
    if (!results || results.length === 0) return null;

    return (
      <Timeline position="alternate">
        {results.map((result, index) => {
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
                <Typography>{result.transcribed_text || 'No text available'}</Typography>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="video-history">
        <h2>Your Video Analysis History</h2>
        <p className="login-message">Please log in to view your videos.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="video-history">
        <h2>Your Video Analysis History</h2>
        <p className="loading-message">Loading your videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-history">
        <h2>Your Video Analysis History</h2>
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchVideos} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-history">
      <h2>Your Video Analysis History</h2>

      {videos.length === 0 ? (
        <p className="no-videos-message">
          You haven't analyzed any videos yet.
        </p>
      ) : (
        <div className="video-accordion">
          {videos.map((video) => (
            <div key={video.id} className="video-item">
              <button
                className={`video-button ${expandedId === video.id ? "expanded" : ""}`}
                onClick={() => toggleExpand(video.id)}
              >
                <div className="video-button-content">
                  <span className="video-title">{video.title}</span>
                  <span className="video-date">
                    Uploaded: {video.created_at}
                  </span>
                </div>
                <span className="expand-icon">
                  {expandedId === video.id ? "−" : "+"}
                </span>
              </button>

              {expandedId === video.id && video.analysis_data && (
                <div className="video-content">
                  {video.analysis_data.average_emotions && (
                    <div className="emotions-summary">
                      <h3>Average Emotion Analysis</h3>
                      <div className="emotions-grid">
                        {Object.entries(video.analysis_data.average_emotions)
                          .sort((a, b) => b[1] - a[1])
                          .map(([emotion, value]) => (
                            <div key={emotion} className="emotion-item">
                              <div className="emotion-name">
                                {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                              </div>
                              <div className="emotion-bar-container">
                                <div
                                  className="emotion-bar"
                                  style={{ width: `${value * 100}%` }}
                                />
                              </div>
                              <div className="emotion-percentage">
                                {(value * 100).toFixed(1)}%
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {video.analysis_data.detailed_results?.clips && (
                    <div className="detailed-results mt-4">
                      <h3>Detailed Analysis Timeline</h3>
                      {renderTimeline(video.analysis_data.detailed_results.clips)}
                    </div>
                  )}

                  {video.analysis_data.detailed_results?.transcription && (
                    <div className="transcription mt-4">
                      <h3>Full Transcription</h3>
                      <p>{video.analysis_data.detailed_results.transcription}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoHistory;