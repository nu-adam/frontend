import React, { useState } from "react";
import VideoUpload from "./VideoUpload";
import VideoProcess from "./VideoProcess";
import EmotionTheories from "./EmotionTheories";
import Header from "./Header";
import Login from "./Login";
import History from "./History";
import { AuthProvider, useAuth } from "./AuthContext";
import "./App.css";

// Protected content component
const ProtectedContent = ({ setIsLoginModalVisible }) => {
  const { isAuthenticated } = useAuth();
  const [uploadResult, setUploadResult] = useState(null);

  if (!isAuthenticated) {
    setIsLoginModalVisible(true); // show gradient
    return (
      <>
        <Login />
        <EmotionTheories />
      </>
    );
  }

  return (
    <>
      <VideoUpload onUploadSuccess={setUploadResult} />
      {uploadResult && (
        <VideoProcess
          uploadResult={uploadResult}
          videoId={uploadResult.video_id}
        />
      )}
      <History />
    </>
  );
};

// Main App component
function App() {
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);

  return (
    <AuthProvider>
      <div
        className={`App ${isLoginModalVisible ? "login-gradient" : "login-gradient"
          }`}
      >
        <Header />
        <main className="app-content">
          <ProtectedContent setIsLoginModalVisible={setIsLoginModalVisible} />
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;