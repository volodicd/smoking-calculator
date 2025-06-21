import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { AdminPanel } from './components/AdminPanel'
import { JoinPage } from './components/JoinPage'
import { ScoreForm } from './components/ScoreForm'
import { WaitingRoom } from './components/WaitingRoom'
import { Results } from './components/Results'
import { useUserStore } from './store/userStore'

// Simple router state management
type PageType = 'join' | 'admin' | 'evaluation' | 'waiting' | 'results'

interface SessionData {
  sessionId: string
  sessionName: string
  participantId: string
  hashCode: string
}

// Add interface for group result
interface GroupResult {
  averageScore: number
  canSmoke: boolean
  appliedPenalties: number
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('join')
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [groupResult, setGroupResult] = useState<GroupResult | null>(null) // Add this state
  const { hasSubmitted } = useUserStore()

  // Handle successful join
  const handleJoinSuccess = (data: SessionData) => {
    setSessionData(data)
    setCurrentPage('evaluation')
  }

  // Handle successful score submission
  const handleScoreSubmitted = () => {
    setCurrentPage('waiting')
  }

  // Handle waiting completion - FIXED to capture real data
  const handleWaitingComplete = (result: GroupResult) => {
    console.log('Real group result received:', result) // Debug log
    setGroupResult(result) // Store the real group result
    setCurrentPage('results')
  }

  // Handle navigation
  const navigateToAdmin = () => {
    setCurrentPage('admin')
    setSessionData(null)
    setGroupResult(null) // Clear group result
  }

  const navigateToJoin = () => {
    setCurrentPage('join')
    setSessionData(null)
    setGroupResult(null) // Clear group result
  }

  // Simple routing based on URL
  React.useEffect(() => {
    const path = window.location.pathname
    if (path === '/admin') {
      setCurrentPage('admin')
    } else if (path === '/') {
      setCurrentPage('join')
    }
  }, [])

  // Update URL when page changes
  React.useEffect(() => {
    if (currentPage === 'admin') {
      window.history.pushState({}, '', '/admin')
    } else if (currentPage === 'join') {
      window.history.pushState({}, '', '/')
    }
  }, [currentPage])

  return (
    <div className="App">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '8px',
          },
        }}
      />

      {/* Navigation Bar */}
      <nav className="fixed top-4 left-4 z-50">
        <div className="flex gap-2">
          <button
            onClick={navigateToJoin}
            className={`px-4 py-2 rounded-lg transition-all ${
              currentPage === 'join'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Join Session
          </button>
          <button
            onClick={navigateToAdmin}
            className={`px-4 py-2 rounded-lg transition-all ${
              currentPage === 'admin'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Admin Panel
          </button>
        </div>
      </nav>

      {/* Page Content */}
      {currentPage === 'join' && (
        <JoinPage onJoinSuccess={handleJoinSuccess} />
      )}

      {currentPage === 'admin' && (
        <AdminPanel />
      )}

      {currentPage === 'evaluation' && sessionData && !hasSubmitted && (
        <ScoreForm onSubmitted={handleScoreSubmitted} />
      )}

      {currentPage === 'waiting' && sessionData && hasSubmitted && (
        <WaitingRoom onComplete={handleWaitingComplete} />
      )}

      {currentPage === 'results' && sessionData && groupResult && (
        <Results
          sessionData={sessionData}
          groupResult={groupResult}  // Pass real group result
          onBackToJoin={navigateToJoin}
        />
      )}
    </div>
  )
}

export default App