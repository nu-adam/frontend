import React, { useEffect, useCallback } from "react"
import { useAuth } from "./AuthContext"
import "./Login.css"

const Login = () => {
  const { handleGoogleLogin } = useAuth()

  const handleCredentialResponse = useCallback(async (response) => {
    if (response.credential) {
      await handleGoogleLogin(response.credential)
    }
  }, [handleGoogleLogin])

  useEffect(() => {
    console.log("Client ID:", process.env.REACT_APP_GOOGLE_CLIENT_ID)

    const loadGoogleScript = () => {
      if (document.querySelector("script#google-login")) return

      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.id = "google-login"
      script.async = true
      script.defer = true
      document.body.appendChild(script)

      script.onload = initializeGoogleButton
    }

    const initializeGoogleButton = () => {
      if (!window.google) return

      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      })

      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          width: 250,
        }
      )
    }

    loadGoogleScript()

    return () => {
      const script = document.querySelector("script#google-login")
      if (script) script.remove()
    }
  }, [handleCredentialResponse]) // Add the function here  

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome to Emotion Analysis</h2>
        <p>Analyze emotions in your videos with AI</p>

        <div className="login-section">
          <p>Please sign in to continue:</p>
          <div id="google-signin-button"></div>
        </div>
      </div>
    </div>
  )
}

export default Login
