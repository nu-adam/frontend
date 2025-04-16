import React, { useState } from 'react';
import axios from 'axios';
import './VideoUpload.css';
import emotionImage from './imgs/emotions.jpg';

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

      {/* Emotion Theory Section */}
      <div className="emotion-section">
        <h2 className="emotion-title">The Theory of Emotions</h2>
        <p className="emotion-text">
          Emotions are psychological states that involve physiological changes, behavioral responses, and conscious feelings.
          They are an integral part of human experience and can be categorized into basic emotions such as happiness, sadness, anger, fear, surprise, and disgust.
        </p>
        <div className="emotion-types">
          <div className="emotion-type happy">Happiness</div>
          <div className="emotion-type exciting">Excited</div>
          <div className="emotion-type sad">Sadness</div>
          <div className="emotion-type angry">Anger</div>
          <div className="emotion-type frustration">Frustration</div>
          <div className="emotion-type neutral">Neutral</div>
        </div>
        
      </div>
    </div>
  );
};

export default VideoUpload;
