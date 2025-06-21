import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Clock, Trophy, RefreshCw } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface WaitingRoomProps {
  onComplete?: (result: any) => void
}

interface SessionStatus {
  id: string
  status: 'ACTIVE' | 'COMPLETED'
  joinedCount: number
  submittedCount: number
  totalCount: number
  groupResult?: {
    averageScore: number
    canSmoke: boolean
    appliedPenalties: number
  }
}

export function WaitingRoom({ onComplete }: WaitingRoomProps) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { personalScore, sessionName, participantId } = useUserStore()

  const fetchSessionStatus = async () => {
    if (!participantId) {
      setError('No participant ID found')
      return
    }

    try {
      console.log('Fetching session status for participant:', participantId)

      const response = await fetch(`${API_URL}/api/participant/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId })
      })

      if (!response.ok) {
        console.log('Participant endpoint failed, using fallback...')
        setSessionStatus({
          id: 'unknown',
          status: 'ACTIVE',
          joinedCount: 2,
          submittedCount: 2,
          totalCount: 2
        })
        setError('Status check failed - using fallback mode')
        return
      }

      const data = await response.json()
      console.log('Received session status:', data)
      setSessionStatus(data)
      setError(null)

      // Check if session is completed with real data
      if (data.status === 'COMPLETED' && data.groupResult && onComplete) {
        console.log('Session completed! Real group result:', data.groupResult)
        toast.success('Session completed! Showing results...')
        onComplete(data.groupResult) // Pass real data to Results
      }
    } catch (error) {
      console.error('Failed to fetch session status:', error)
      setError('Failed to check session status')

      // Show fallback status to prevent infinite loading
      setSessionStatus({
        id: 'unknown',
        status: 'ACTIVE',
        joinedCount: 2,
        submittedCount: 2,
        totalCount: 2
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchSessionStatus()

    // Poll every 3 seconds
    const interval = setInterval(fetchSessionStatus, 3000)

    return () => clearInterval(interval)
  }, [participantId, onComplete])

  if (isLoading && !sessionStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Clock className="w-8 h-8 text-white" />
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-4">Waiting for Results</h1>
        <p className="text-white/70 mb-8">Your score has been submitted. The admin is reviewing all submissions and will announce results shortly.</p>

        {/* Session Info */}
        {sessionName && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Users className="w-6 h-6 text-purple-400" />
              <span className="text-white font-medium">Session</span>
            </div>
            <div className="text-lg text-white">{sessionName}</div>
          </motion.div>
        )}

        {/* Personal Score */}
        {personalScore !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span className="text-white font-medium">Your Score</span>
            </div>
            <div className="text-3xl font-bold text-white">{personalScore} / 99</div>
            <div className="text-white/60 text-sm mt-1">
              (before group penalties)
            </div>
          </motion.div>
        )}

        {/* Status Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 rounded-lg p-6 mb-6"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
            />
            <span className="text-white font-medium">
              {sessionStatus?.status === 'COMPLETED' ? 'Processing complete...' : 'Processing submissions...'}
            </span>
          </div>
          <p className="text-white/60 text-sm mb-4">
            {sessionStatus?.status === 'COMPLETED'
              ? 'Results are ready! Redirecting...'
              : 'The admin is reviewing all submissions and applying group penalties.'
            }
          </p>

          {error && (
            <div className="text-yellow-300 text-xs mb-3">
              ⚠️ {error}
            </div>
          )}

          {/* Show session progress */}
          {sessionStatus && (
            <div className="text-white/50 text-xs">
              Progress: {sessionStatus.submittedCount}/{sessionStatus.totalCount} submitted
            </div>
          )}
        </motion.div>

        {/* Manual Refresh Button */}
        <div className="space-y-3">
          <button
            onClick={fetchSessionStatus}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Check Status
          </button>
        </div>

        <div className="text-white/50 text-xs mt-4">
          {error ? 'Using fallback mode' : 'Auto-checking every 3 seconds'}
        </div>
      </motion.div>
    </div>
  )
}