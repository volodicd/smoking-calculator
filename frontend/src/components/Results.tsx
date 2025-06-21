import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Users, Trophy, ArrowLeft, RotateCcw } from 'lucide-react'
import { useUserStore } from '../store/userStore'

interface SessionData {
  sessionId: string
  sessionName: string
  participantId: string
  hashCode: string
}

interface GroupResult {
  averageScore: number
  canSmoke: boolean
  appliedPenalties: number
}

interface ResultsProps {
  sessionData: SessionData
  groupResult: GroupResult  // Add this prop
  onBackToJoin: () => void
}

export function Results({ sessionData, groupResult, onBackToJoin }: ResultsProps) {
  const { personalScore } = useUserStore()

  // Use real data instead of mock data
  const { averageScore, canSmoke, appliedPenalties } = groupResult

  const threshold = 50 // This should ideally come from session data, but we know it's 50

  const handleStartNewSession = () => {
    // Reset user store and navigate back
    const userStore = useUserStore.getState()
    userStore.reset()
    onBackToJoin()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-md w-full text-center"
      >
        {/* Decision Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            canSmoke
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-red-500 to-pink-500'
          }`}
        >
          {canSmoke ? (
            <CheckCircle className="w-10 h-10 text-white" />
          ) : (
            <XCircle className="w-10 h-10 text-white" />
          )}
        </motion.div>

        {/* Decision Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className={`flex items-center justify-center gap-3 mb-4 ${
            canSmoke ? 'text-green-400' : 'text-red-400'
          }`}>
            {canSmoke ? (
              <CheckCircle className="w-8 h-8" />
            ) : (
              <XCircle className="w-8 h-8" />
            )}
            <h1 className="text-3xl font-bold">
              {canSmoke ? 'Can Smoke' : 'Cannot Smoke'}
            </h1>
          </div>

          <div className="text-6xl font-bold text-white mb-2">
            {averageScore}
          </div>
          <div className="text-white/60">
            Average Group Score / {threshold}
          </div>
        </motion.div>

        {/* Session Info */}
        {sessionData.sessionName && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 rounded-xl p-4 mb-6"
          >
            <div className="text-white/70 text-sm mb-1">Session</div>
            <div className="text-lg text-white font-medium">{sessionData.sessionName}</div>
          </motion.div>
        )}

        {/* Score Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          {/* Personal Score */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-white/70 text-sm">Your Score</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {personalScore || 'N/A'}
            </div>
          </div>

          {/* Participants Count - Mock for now since we don't have this data */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-white/70 text-sm">Participants</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {/* This should come from the API response, using placeholder for now */}
              2+
            </div>
          </div>
        </motion.div>

        {/* Score Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/70 text-sm">Score Progress</span>
            <span className="text-white text-sm">{averageScore} / {threshold}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((averageScore / threshold) * 100, 100)}%` }}
              transition={{ delay: 0.8, duration: 1 }}
              className={`h-3 rounded-full ${
                canSmoke
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-red-500 to-pink-500'
              }`}
            />
          </div>
        </motion.div>

        {/* Group Decision Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/5 rounded-xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
              <span className="text-white text-xs">ℹ</span>
            </div>
            <span className="text-white font-medium">Group Decision</span>
          </div>
          <p className="text-white/70 text-sm">
            {canSmoke
              ? 'The group average score meets or exceeds the threshold. This event qualifies as exceptional enough for smoking.'
              : 'The group average score is below the threshold. This event does not qualify as exceptional enough for smoking.'
            }
          </p>
          {appliedPenalties > 0 && (
            <p className="text-red-300 text-xs mt-2">
              Applied penalties: -{appliedPenalties} points
            </p>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <button
            onClick={handleStartNewSession}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Start New Session
          </button>

          <button
            onClick={onBackToJoin}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Join
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}