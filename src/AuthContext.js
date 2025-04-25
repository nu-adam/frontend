// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Set up axios defaults
  axios.defaults.baseURL = API_URL;

  // Set auth token in axios headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      if (token) {
        try {
          const response = await axios.get("/auth/user");
          setCurrentUser(response.data.user);
        } catch (error) {
          console.error("Failed to verify token:", error);
          // Clear invalid token
          localStorage.removeItem("authToken");
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, [token]);

  // Handle Google login success
  const handleGoogleLogin = async (googleToken) => {
    try {
      const response = await axios.post("/auth/google", { token: googleToken });

      // Very important: store the googleToken itself, not the token from the response
      localStorage.setItem("authToken", googleToken);
      setToken(googleToken);
      setCurrentUser(response.data.user);

      return true;
    } catch (error) {
      console.error("Google login failed:", error);
      return false;
    }
  };

  // Handle logout
  const logout = async () => {
    try {
      await axios.post("/auth/logout");
    } catch (error) {
      console.error("Logout API call failed:", error);
    }

    // Clear local storage and state
    localStorage.removeItem("authToken");
    setToken(null);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    token,
    handleGoogleLogin,
    logout,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
