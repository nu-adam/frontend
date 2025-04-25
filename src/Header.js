import React from "react";
import { useAuth } from "./AuthContext";
import "./Header.css";

const Header = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo">
          <h1>Emotion Analysis</h1>
        </div>

        {isAuthenticated && (
          <div className="user-info">
            <span className="user-name">Hello, {currentUser?.name}</span>
            <button className="logout-button" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
