import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Hash, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUserStore } from '../store/userStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface JoinPageProps {
  onJoinSuccess?: (sessionData: any) => void
}

export function JoinPage({ onJoinSuccess }: JoinPageProps) {
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const { setSessionData, setPersonalScore, setHasSubmitted } = useUserStore()

  const joinSession = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a join code')
      return
    }

    setIsJoining(true)
    try {
      const response = await fetch(`${API_URL}/api/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinCode: joinCode.trim().toUpperCase()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to join session')
      }

      const sessionData = await response.json()

      // Save session data to store
      setSessionData({
        participantId: sessionData.participantId,
        sessionId: sessionData.sessionId,
        sessionName: sessionData.sessionName,
        hashCode: sessionData.hashCode
      })
      setHasSubmitted(false)
      setPersonalScore(null)

      toast.success(`Successfully joined "${sessionData.sessionName}"!`)

      // Call success callback if provided
      if (onJoinSuccess) {
        onJoinSuccess(sessionData)
      }

      console.log('Joined session:', sessionData)

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join session')
      console.error('Join error:', error)
    } finally {
      setIsJoining(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    joinSession()
  }

  const formatJoinCode = (value: string) => {
    // Remove non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    // Limit to 6 characters (typical join code length)
    return cleaned.slice(0, 6)
  }

  const handleJoinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatJoinCode(e.target.value)
    setJoinCode(formatted)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Users className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Join Session</h1>
            </div>
            <p className="text-white/70">
              Enter the join code provided by the session admin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">
                <Hash className="w-4 h-4 inline mr-2" />
                Join Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={handleJoinCodeChange}
                placeholder="Enter 6-character code"
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                disabled={isJoining}
              />
              <p className="text-white/50 text-sm mt-2 text-center">
                Example: ABC123, XYZ789
              </p>
            </div>

            <button
              type="submit"
              disabled={isJoining || !joinCode.trim() || joinCode.length < 4}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Joining Session...
                </>
              ) : (
                'Join Session'
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-white/5 rounded-lg">
            <h3 className="text-white font-medium mb-2">Need a join code?</h3>
            <p className="text-white/70 text-sm">
              Ask the session admin for the 6-character join code.
              It's usually displayed on their admin panel.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}