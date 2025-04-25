import React, { useState, useEffect, useRef } from 'react'
import { LineChart } from '@mui/x-charts/LineChart'
import { useAuth } from './AuthContext'
import './VideoProcess.css'

const VideoProcess = ({ splitFolder, videoId }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errors, setErrors] = useState([]) // Changed from error to errors array
  const [results, setResults] = useState([])
  const [finalScores, setFinalScores] = useState(null)
  const { isAuthenticated, token } = useAuth()
  const eventSourceRef = useRef(null)
  const reconnectTimerRef = useRef(null)

  // Emotion configuration
  const emotionColors = {
    neutral: '#4e79a7',
    anger: '#e15759',
    sadness: '#59a14f',
    frustration: '#edc948',
    excited: '#b07aa1',
    happiness: '#ff9da7',
  }

  const emotionDisplayNames = {
    neutral: 'Neutral',
    anger: 'Anger',
    sadness: 'Sadness',
    frustration: 'Frustration',
    excited: 'Excited',
    happiness: 'Happiness',
  }

  const getMaxConfidence = () => {
    if (results.length === 0) return 100
    const maxConfidence = Math.max(...results.map((result) => result.confidence * 100))
    return Math.min(Math.ceil(maxConfidence * 1.1), 100)
  }

  const handleStartAnalysis = () => {
    if (!splitFolder) {
      setErrors(['No video clips available for analysis'])
      return
    }

    if (!isAuthenticated || !token) {
      setErrors(['You must be logged in to analyze videos'])
      return
    }

    console.log('Starting analysis with:', { splitFolder, videoId, token: token.slice(0, 20) + '...' })

    setIsAnalyzing(true)
    setProgress(0)
    setResults([])
    setFinalScores(null)
    setErrors([])

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const params = new URLSearchParams()
    params.append('split_folder', splitFolder)
    if (videoId) params.append('video_id', videoId)
    params.append('token', token)

    const es = new EventSource(`http://127.0.0.1:5000/analyze-clips?${params.toString()}`)
    eventSourceRef.current = es

    es.onopen = () => {
      console.log('SSE connection opened for:', es.url)
      clearTimeout(reconnectTimerRef.current)
    }

    es.onmessage = (event) => {
      try {
        if (event.data.startsWith(':')) return

        console.log('SSE message received:', event.data)
        const data = JSON.parse(event.data)

        if (data.error) {
          setErrors((prev) => [...prev, `Clip ${data.current}/${data.total}: ${data.error}`])
        } else if (data.result) {
          setResults((prev) => [
            ...prev,
            {
              ...data.result,
              current: data.current,
              total: data.total,
            },
          ])
          setProgress((data.current / data.total) * 100)
        }
      } catch (e) {
        console.error('Error parsing event data:', e)
        setErrors((prev) => [...prev, 'Failed to parse analysis data'])
      }
    }

    es.addEventListener('complete', (event) => {
      try {
        if (event.data && event.data.trim() !== '{}') {
          const completionData = JSON.parse(event.data)
          if (completionData.emotion_scores) {
            setFinalScores(completionData.emotion_scores)
          }
          if (completionData.errors && completionData.errors.length > 0) {
            setErrors((prev) => [...prev, ...completionData.errors])
          }
        }
        es.close()
        setIsAnalyzing(false)
      } catch (e) {
        console.error('Error handling completion:', e)
        es.close()
        setIsAnalyzing(false)
        setErrors((prev) => [...prev, 'Analysis completed with errors'])
      }
    })

    es.onerror = (err) => {
      console.error('SSE error details:', {
        readyState: es.readyState,
        url: es.url,
        error: err,
        timestamp: new Date().toISOString(),
      })
      if (es.readyState === EventSource.CLOSED) {
        reconnectTimerRef.current = setTimeout(() => {
          console.log('Attempting SSE reconnection...')
          handleStartAnalysis()
        }, 5000)
      }
    }
  }

  const handleStopAnalysis = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    clearTimeout(reconnectTimerRef.current)
    setIsAnalyzing(false)
    setErrors((prev) => [...prev, 'Analysis stopped by user'])
  }

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      clearTimeout(reconnectTimerRef.current)
    }
  }, [])

  const emotionSeries = () => {
    const emotions = ['neutral', 'anger', 'sadness', 'frustration', 'excited', 'happiness']
    return emotions.map((emotion) => ({
      label: emotionDisplayNames[emotion],
      data: results.map((result) => parseFloat((result.probabilities[emotion] * 100).toFixed(2))),
      color: emotionColors[emotion],
      showMark: false,
      curve: 'linear',
    }))
  }

  const clipNumbers = results.map((result) => result.current)

  const renderFinalResults = () => {
    if (!finalScores) return null

    let dominant = { emotion: 'neutral', value: 0 }
    Object.entries(finalScores).forEach(([emotion, value]) => {
      if (value > dominant.value) {
        dominant = { emotion, value }
      }
    })

    return (
      <div className="final-results">
        <h3>Analysis Complete</h3>
        <p className="dominant-emotion">
          Dominant emotion:{' '}
          <span style={{ color: emotionColors[dominant.emotion] }}>
            {emotionDisplayNames[dominant.emotion]} ({(dominant.value * 100).toFixed(1)}%)
          </span>
        </p>
        <h4>Overall Emotion Distribution</h4>
        <ul className="final-scores-list">
          {Object.entries(finalScores)
            .sort((a, b) => b[1] - a[1])
            .map(([emotion, value]) => (
              <li key={emotion} style={{ color: emotionColors[emotion] }}>
                {emotionDisplayNames[emotion]}: {(value * 100).toFixed(2)}%
              </li>
            ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="video-process-container">
      <h2>Video Analysis</h2>

      {!splitFolder ? (
        <div className="no-video-message">Please upload and process a video first</div>
      ) : (
        <>
          <div className="analysis-controls">
            {!isAnalyzing ? (
              <button
                onClick={handleStartAnalysis}
                className="analyze-btn"
                disabled={!splitFolder || !isAuthenticated || !token}
              >
                Analyze the Video
              </button>
            ) : (
              <button onClick={handleStopAnalysis} className="stop-btn">
                Stop Analysis
              </button>
            )}
          </div>

          {isAnalyzing && (
            <div className="progress-container">
              <progress value={progress} max="100" />
              <span>{progress.toFixed(1)}%</span>
              <span>
                Processing {results.length} of {results[0]?.total || '?'} clips
              </span>
            </div>
          )}

          {errors.length > 0 && (
            <div className="error-messages">
              {errors.map((err, idx) => (
                <div key={idx} className="error-message">{err}</div>
              ))}
            </div>
          )}

          {finalScores && renderFinalResults()}

          <div className="results-container">
            {results.length > 0 && (
              <>
                <div className="chart-container">
                  <LineChart
                    xAxis={[{ data: clipNumbers, label: 'Clip Number', scaleType: 'point' }]}
                    yAxis={[{ label: 'Probability (%)', min: 0, max: getMaxConfidence() }]}
                    series={emotionSeries()}
                    height={400}
                    margin={{ left: 70, right: 30, top: 30, bottom: 70 }}
                    slotProps={{
                      legend: {
                        direction: 'row',
                        position: { vertical: 'bottom', horizontal: 'middle' },
                        padding: 0,
                      },
                    }}
                  />
                </div>

                <div className="latest-result">
                  <h3>Latest Result (Clip {results[results.length - 1].current})</h3>
                  <div className="result-details">
                    <p>
                      <strong>Dominant Emotion:</strong> {results[results.length - 1].emotion}
                    </p>
                    <p>
                      <strong>Confidence:</strong>{' '}
                      {(results[results.length - 1].confidence * 100).toFixed(2)}%
                    </p>
                    <p>
                      <strong>Probabilities:</strong>
                    </p>
                    <ul>
                      {Object.entries(results[results.length - 1].probabilities)
                        .sort((a, b) => b[1] - a[1])
                        .map(([emotion, prob]) => (
                          <li key={emotion} style={{ color: emotionColors[emotion] }}>
                            {emotionDisplayNames[emotion]}: {(prob * 100).toFixed(2)}%
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default VideoProcess