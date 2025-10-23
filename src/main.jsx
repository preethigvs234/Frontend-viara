import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Suppress third-party console warnings (AdUnit, browser extensions)
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('AdUnit') || 
      message.includes('Node cannot be found') ||
      message.includes('Document already loaded')
    ) {
      return; // Suppress these warnings
    }
    originalWarn.apply(console, args);
  };
}

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <StrictMode>
    <App />
  </StrictMode>
)