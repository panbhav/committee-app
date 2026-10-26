import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AppProvider } from './context/AppContext'
import './index.css'
import ErrorBoundary from './components/common/ErrorBoundary'
import StorageNotice from './components/common/StorageNotice'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
    <StorageNotice />
    <AppProvider>
      <App />
    </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
