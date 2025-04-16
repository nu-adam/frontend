import React, { useState } from 'react';
import axios from 'axios';
import './VideoUpload.css'; // Import a separate CSS file for styling

const VideoUpload = () => {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideo(file);
    }
  };

  const handleUpload = async () => {
    if (!video) return;

    const formData = new FormData();
    formData.append('video', video);

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('YOUR_BACKEND_URL_HERE', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload successful', response.data);
    } catch (err) {
      setError('Error uploading video');
      console.error('Error uploading video:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-upload-container">
      <div className="background-image">
        <h1 className="header-title">Upload Your Video</h1>
      </div>
      <div className="upload-content">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="file-input"
        />
        <button
          onClick={handleUpload}
          disabled={loading || !video}
          className={`upload-btn ${loading ? 'loading' : ''}`}
        >
          {loading ? 'Uploading...' : 'Upload Video'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default VideoUpload;
