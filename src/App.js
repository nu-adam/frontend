// src/App.js
import React, { useState } from "react";
import VideoUpload from "./VideoUpload";
import VideoProcess from "./VideoProcess";
import EmotionTheories from "./EmotionTheories";
import Header from "./Header";
import Login from "./Login";
import { AuthProvider, useAuth } from "./AuthContext";
import "./App.css";

// Protected content component
const ProtectedContent = () => {
  const { isAuthenticated } = useAuth();
  const [uploadResult, setUploadResult] = useState(null);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <>
      <VideoUpload onUploadSuccess={setUploadResult} />
      {uploadResult && (
        <VideoProcess
          splitFolder={uploadResult.split_folder}
          videoId={uploadResult.video_id}
        />
      )}
      <EmotionTheories />
    </>
  );
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Header />
        <main className="app-content">
          <ProtectedContent />
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
