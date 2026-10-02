import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import App from './App.jsx'
import { SessionProvider } from './session.jsx'
import './styles.css'

if (window.Capacitor?.isNativePlatform?.()) {
  import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
    StatusBar.setBackgroundColor({ color: '#0d0b10' }).catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <SessionProvider>
          <App />
        </SessionProvider>
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>,
)
