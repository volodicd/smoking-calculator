import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Hash, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUserStore } from '../store/userStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface UserLoginProps {
  onLogin: () => void
}

export function UserLogin({ onLogin }: UserLoginProps) {
  const [hashCode, setHashCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { setSessionData, setPersonalScore, setHasSubmitted } = useUserStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hashCode.length !== 6) {
      toast.error('Hash code must be 6 characters')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: hashCode.toUpperCase() })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to join session')
      }

      const data = await response.json()
      setSessionData({
        participantId: data.participantId,
        sessionId: data.sessionId,
        sessionName: data.sessionName,
        hashCode: data.hashCode
      })
      setHasSubmitted(false)
      setPersonalScore(null)

      toast.success('Successfully joined session!')
      onLogin()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join session')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Hash className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Join Session</h1>
          <p className="text-white/70">Enter your unique hash code to join the evaluation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">
              Hash Code
            </label>
            <input
              type="text"
              value={hashCode}
              onChange={(e) => setHashCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="ABC123"
              className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-lg text-white text-center text-xl font-mono placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 tracking-widest"
              disabled={isLoading}
            />
            <div className="text-right text-white/50 text-sm mt-1">
              {hashCode.length}/6
            </div>
          </div>

          <button
            type="submit"
            disabled={hashCode.length !== 6 || isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              'Joining...'
            ) : (
              <>
                Join Session
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}