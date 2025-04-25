import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import "./VideoUpload.css";

const VideoUpload = ({ onUploadSuccess }) => {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [eventSource, setEventSource] = useState(null);
  const { isAuthenticated, currentUser } = useAuth();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        setError("Please select a video file");
        return;
      }
      setError(null);
      setSuccess(false);
      setVideo(file);
      setProgress(0);
      setProgressMessage("");
    }
  };

  const handleUpload = async () => {
    if (!video) return;

    if (!isAuthenticated) {
      setError("You must be logged in to upload videos.");
      return;
    }

    const formData = new FormData();
    formData.append("video", video);

    setLoading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);
    setProgressMessage("Starting upload...");

    let es = null;
    let uploadCompleted = false;
    let sseCompleted = false;

    try {
      // Create SSE connection for progress updates
      es = new EventSource("http://127.0.0.1:5000/upload-progress");

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.error) {
            setError(data.error);
            es.close();
          } else {
            // Only update progress if not already at 100%
            if (data.progress > progress || !uploadCompleted) {
              setProgress(data.progress);
              setProgressMessage(data.message);
            }

            if (data.complete && data.result) {
              sseCompleted = true;
              setProgress(100);
              setProgressMessage("Upload and processing complete!");
              setSuccess(true);
              setVideo(null);
              onUploadSuccess(data.result);
              es.close();
            }
          }
        } catch (e) {
          console.error("Error parsing progress data:", e);
        }
      };

      es.onerror = (err) => {
        // Only show error if upload hasn't completed
        if (!uploadCompleted && !sseCompleted) {
          console.error("EventSource error:", err);
          setError("Connection error during upload. Please try again.");
        }
        if (es) es.close();
      };

      // Send the actual upload request
      const response = await axios.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          // Fallback progress for the upload portion (first 50%)
          const calculatedProgress = Math.round(
            (progressEvent.loaded * 50) / progressEvent.total
          );
          if (calculatedProgress > progress) {
            setProgress(calculatedProgress);
            setProgressMessage("Uploading video...");
          }
        },
      });

      uploadCompleted = true;

      // Fallback in case SSE didn't report completion
      if (!sseCompleted) {
        setProgress(100);
        setProgressMessage("Upload complete!");
        setSuccess(true);
        setVideo(null);
        onUploadSuccess(response.data);
      }
    } catch (err) {
      let errorMessage = "Error uploading video";
      if (err.response) {
        errorMessage = err.response.data.error || errorMessage;
      } else if (err.request) {
        errorMessage = "No response from server";
      }
      setError(errorMessage);
      console.error("Error uploading video:", err);
    } finally {
      if (es) es.close();
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (eventSource) {
      eventSource.close();
    }
    setLoading(false);
    setError("Upload cancelled by user");
    setProgress(0);
    setProgressMessage("");
  };

  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  return (
    <div className="video-upload-container">
      <div className="big-name">Hello, {currentUser?.name}</div>
      <div className="upload-content">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="file-input"
          id="video-upload"
          disabled={loading}
        />
        <label htmlFor="video-upload" className="file-input-label">
          {video ? video.name : "Choose a video file"}
        </label>

        {(loading || progress > 0) && (
          <div className="upload-progress">
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-info">
              <span className="progress-message">{progressMessage}</span>
              <span className="progress-percent">{Math.round(progress)}%</span>
            </div>
            {loading && (
              <button onClick={handleCancel} className="cancel-button">
                Cancel
              </button>
            )}
          </div>
        )}

        {!loading && video && (
          <button
            onClick={handleUpload}
            disabled={!video}
            className={`upload-btn ${loading ? "loading" : ""}`}
          >
            {loading ? "Uploading..." : "Upload Video"}
          </button>
        )}

        {error && <p className="error-message">{error}</p>}
        {success && (
          <p className="success-message">Video uploaded successfully!</p>
        )}
      </div>
    </div>
  );
};

export default VideoUpload;
