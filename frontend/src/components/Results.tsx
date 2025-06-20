import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Users, Target, PartyPopper, X } from 'lucide-react'
import { useUserStore } from '../store/userStore'

interface ResultsProps {
  result: {
    averageScore: number
    canSmoke: boolean
    totalSubmissions: number
    requiredSubmissions: number
  }
  onNewSession: () => void
}

export function Results({ result, onNewSession }: ResultsProps) {
  const { personalScore, logout } = useUserStore()

  const handleNewSession = () => {
    logout()
    onNewSession()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-lg w-full text-center"
      >
        {/* Result Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            result.canSmoke
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-red-500 to-pink-500'
          }`}
        >
          {result.canSmoke ? (
            <PartyPopper className="w-10 h-10 text-white" />
          ) : (
            <X className="w-10 h-10 text-white" />
          )}
        </motion.div>

        {/* Main Result */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h1 className={`text-4xl font-bold mb-4 ${
            result.canSmoke ? 'text-green-300' : 'text-red-300'
          }`}>
            {result.canSmoke ? '🎉 Can Smoke!' : '❌ Cannot Smoke'}
          </h1>

          <div className="text-6xl font-bold text-white mb-2">
            {result.averageScore}
          </div>
          <div className="text-white/70 text-lg">
            Average Group Score / 50
          </div>
        </motion.div>

        {/* Detailed Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-white/70 text-sm">Your Score</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {personalScore || 0}
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-white/70 text-sm">Participants</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {result.totalSubmissions}
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm">Score Progress</span>
            <span className="text-white text-sm">
              {result.averageScore} / 50
            </span>
          </div>

          <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((result.averageScore / 50) * 100, 100)}%` }}
              transition={{ duration: 1, delay: 0.6 }}
              className={`h-full rounded-full ${
                result.canSmoke
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-red-500 to-pink-500'
              }`}
            />
          </div>
        </motion.div>

        {/* Decision Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`p-4 rounded-xl mb-6 ${
            result.canSmoke
              ? 'bg-green-500/20 border border-green-500/30'
              : 'bg-red-500/20 border border-red-500/30'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-5 h-5" />
            <span className="text-white font-medium">Group Decision</span>
          </div>
          <p className="text-white/80 text-sm">
            {result.canSmoke
              ? 'The group average score meets the threshold. The event qualifies as exceptional enough for smoking.'
              : 'The group average score is below the threshold. This event does not qualify as exceptional enough for smoking.'
            }
          </p>
        </motion.div>

        {/* Action Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={handleNewSession}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
        >
          Start New Session
        </motion.button>
      </motion.div>
    </div>
  )
}