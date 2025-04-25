import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import "./History.css";

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
                className={`video-button ${
                  expandedId === video.id ? "expanded" : ""
                }`}
                onClick={() => toggleExpand(video.id)}
              >
                <div className="video-button-content">
                  <span className="video-title">{video.title}</span>
                  <span className="video-date">
                    Analyzed: {video.analysis_data?.analysis_date || "N/A"}
                  </span>
                </div>
                <span className="expand-icon">
                  {expandedId === video.id ? "−" : "+"}
                </span>
              </button>

              {expandedId === video.id && video.analysis_data && (
                <div className="video-content">
                  {video.analysis_data.graph_image && (
                    <div className="graph-container">
                      <img
                        src={`data:image/png;base64,${video.analysis_data.graph_image}`}
                        alt="Emotion analysis graph"
                        className="analysis-graph"
                      />
                    </div>
                  )}

                  {video.analysis_data.average_emotions && (
                    <div className="emotions-summary">
                      <h3>Emotion Analysis Results</h3>
                      <div className="emotions-grid">
                        {Object.entries(video.analysis_data.average_emotions)
                          .sort((a, b) => b[1] - a[1])
                          .map(([emotion, value]) => (
                            <div key={emotion} className="emotion-item">
                              <div className="emotion-name">
                                {emotion.charAt(0).toUpperCase() +
                                  emotion.slice(1)}
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

                  <div className="video-actions">
                    <button
                      className="download-csv"
                      onClick={() =>
                        window.open(
                          `http://127.0.0.1:5000/video/${video.id}/csv`
                        )
                      }
                    >
                      Download CSV Data
                    </button>
                  </div>
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
