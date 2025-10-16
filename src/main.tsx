/**
 * Application Entry Point
 * 
 * Sets up:
 * - React root rendering
 * - Redux store provider (for global state)
 * - StrictMode for development warnings
 * - Global CSS styles
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App.tsx'
import './index.css'
import { store } from './store'

/**
 * Main application render
 * Wraps the app with:
 * - React.StrictMode: Highlights potential issues in components
 * - Redux Provider: Makes store available to all components
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)

