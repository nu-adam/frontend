import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import "./VideoUpload.css";

const VideoUpload = ({ onUploadSuccess }) => {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { isAuthenticated } = useAuth();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Basic validation for video files
      if (!file.type.startsWith("video/")) {
        setError("Please select a video file");
        return;
      }
      setError(null);
      setSuccess(false);
      setVideo(file);
      setUploadProgress(0);
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

    try {
      // Using the baseURL from axios defaults set in AuthContext
      const response = await axios.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });
      console.log("Upload successful", response.data);
      setSuccess(true);
      setVideo(null); // Clear the selected file after successful upload
      onUploadSuccess(response.data);
    } catch (err) {
      let errorMessage = "Error uploading video";
      if (err.response) {
        // Server responded with a status other than 200 range
        errorMessage = err.response.data.error || errorMessage;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "No response from server";
      }
      setError(errorMessage);
      console.error("Error uploading video:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-upload-container">
      <div className="background-image"></div>
      <div className="upload-content">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="file-input"
          id="video-upload"
        />
        <label htmlFor="video-upload" className="file-input-label">
          {video ? video.name : "Choose a video file"}
        </label>

        {video && (
          <div className="upload-progress">
            <progress value={uploadProgress} max="100" />
            <span>{uploadProgress}%</span>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading || !video}
          className={`upload-btn ${loading ? "loading" : ""}`}
        >
          {loading ? "Uploading..." : "Upload Video"}
        </button>

        {error && <p className="error-message">{error}</p>}
        {success && (
          <p className="success-message">Video uploaded successfully!</p>
        )}
      </div>
    </div>
  );
};

export default VideoUpload;
