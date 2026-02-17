import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initializeDB } from './utils/database.js'
import './index.css'

// Initialize database before rendering
initializeDB().then(() => {
  console.log('Database initialized successfully');
}).catch((err) => {
  console.error('Failed to initialize database:', err);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
