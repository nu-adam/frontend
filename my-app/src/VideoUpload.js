import React, { useState } from 'react';
import axios from 'axios';

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
    <div>
      <h1>Upload Video</h1>
      <input type="file" accept="video/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading || !video}>
        {loading ? 'Uploading...' : 'Upload Video'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default VideoUpload;
