import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Clock, Trophy, RefreshCw } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import { useUserStore } from '../store/userStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface WaitingRoomProps {
  onComplete: (result: any) => void
}

export function WaitingRoom({ onComplete }: WaitingRoomProps) {
  const [sessionStatus, setSessionStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { token, personalScore } = useUserStore()
  const { on, off } = useSocket()

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/session/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSessionStatus(data)

        if (data.status === 'COMPLETED' && data.groupResult) {
          onComplete(data.groupResult)
        }
      }
    } catch (error) {
      console.error('Failed to fetch session status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    // Listen for real-time updates
    const handleScoreSubmitted = (data: any) => {
      setSessionStatus((prev: any) => ({
        ...prev,
        submittedCount: data.submittedCount
      }))
    }

    const handleSessionComplete = (result: any) => {
      onComplete(result)
    }

    on('score-submitted', handleScoreSubmitted)
    on('session-complete', handleSessionComplete)

    return () => {
      off('score-submitted', handleScoreSubmitted)
      off('session-complete', handleSessionComplete)
    }
  }, [token, on, off, onComplete])

  if (isLoading) {
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

  const progress = sessionStatus ? (sessionStatus.submittedCount / sessionStatus.totalCount) * 100 : 0

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

        <h1 className="text-3xl font-bold text-white mb-4">Waiting for Others</h1>
        <p className="text-white/70 mb-8">Your score has been submitted. Waiting for other participants to complete their evaluation.</p>

        {/* Personal Score */}
        {personalScore !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span className="text-white font-medium">Your Score</span>
            </div>
            <div className="text-3xl font-bold text-white">{personalScore} / 100</div>
          </motion.div>
        )}

        {/* Progress */}
        {sessionStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">Progress</span>
              <span className="text-white text-sm">
                {sessionStatus.submittedCount} / {sessionStatus.totalCount}
              </span>
            </div>

            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
              />
            </div>

            <div className="text-white/60 text-xs mt-2">
              {Math.round(progress)}% completed
            </div>
          </motion.div>
        )}

        {/* Participants Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">Participants</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: sessionStatus?.totalCount || 0 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  index < (sessionStatus?.submittedCount || 0)
                    ? 'bg-green-500 text-white'
                    : 'bg-white/20 text-white/60'
                }`}
              >
                {index + 1}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Refresh Button */}
        <button
          onClick={fetchStatus}
          className="mt-6 flex items-center gap-2 mx-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </motion.div>
    </div>
  )
}