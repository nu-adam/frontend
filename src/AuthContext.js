import React, { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('authToken'))
  const [loading, setLoading] = useState(true)
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  // Set up axios defaults
  axios.defaults.baseURL = API_URL

  // Set auth token in axios headers
  useEffect(() => {
    if (token) {
      console.log('Setting axios Authorization header with token:', token.slice(0, 20) + '...')
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      console.log('Removing axios Authorization header')
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      if (token) {
        try {
          console.log('Verifying token with /auth/user')
          const response = await axios.get('/auth/user')
          setCurrentUser(response.data.user)
          console.log('User verified:', response.data.user.email)
        } catch (error) {
          console.error('Failed to verify token:', error)
          localStorage.removeItem('authToken')
          setToken(null)
        }
      }
      setLoading(false)
    }

    checkLoggedIn()
  }, [token])

  // Handle Google login success
  const handleGoogleLogin = async (googleToken) => {
    try {
      console.log('Handling Google login with token:', googleToken.slice(0, 20) + '...')
      const response = await axios.post('/auth/google', { token: googleToken })
      const { user, token } = response.data

      localStorage.setItem('authToken', token)
      setToken(token)
      setCurrentUser(user)
      console.log('Google login successful for user:', user.email)

      return true
    } catch (error) {
      console.error('Google login failed:', error)
      return false
    }
  }

  // Handle logout
  const logout = async () => {
    try {
      await axios.post('/auth/logout')
      console.log('Logout API call successful')
    } catch (error) {
      console.error('Logout API call failed:', error)
    }

    localStorage.removeItem('authToken')
    setToken(null)
    setCurrentUser(null)
    console.log('User logged out')
  }

  const value = {
    currentUser,
    handleGoogleLogin,
    logout,
    isAuthenticated: !!currentUser,
    loading,
    token, // Expose token for use in components
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export default AuthContext