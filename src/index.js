import React from 'react';
import ReactDOM from 'react-dom/client';  // Import the createRoot from react-dom/client
import './index.css';  // Optional, if you have styling
import App from './App';  // Import App.js
import reportWebVitals from './reportWebVitals';

// Create a root element and render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />  {/* App is the root component */}
  </React.StrictMode>
);

reportWebVitals();
