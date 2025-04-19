import React, { useState } from 'react';
import VideoUpload from './VideoUpload';
import VideoProcess from './VideoProcess';
import EmotionTheories from './EmotionTheories';
import "./App.css"

function App() {
  const [uploadResult, setUploadResult] = useState(null);

  return (
    <div className="App">
      <VideoUpload onUploadSuccess={setUploadResult} />
      {uploadResult && <VideoProcess splitFolder={uploadResult.split_folder} />}
      <EmotionTheories />
    </div>
  );
}

export default App;