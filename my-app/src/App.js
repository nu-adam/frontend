import React from 'react';
import VideoUpload from './VideoUpload';  // Make sure to import the VideoUpload component
import EmotionTheories from './EmotionTheories';
import "./App.css"

function App() {
  return (
    <div className="App">
      <VideoUpload />  {/* Include the VideoUpload component */}
      <EmotionTheories />  {/* Include the EmotionTheories component */}
    </div>
  );
}

export default App;
