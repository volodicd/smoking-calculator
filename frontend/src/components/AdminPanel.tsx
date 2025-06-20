import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Users, Trophy, Hash, Type, Copy, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface AdminPanelProps {}

export function AdminPanel({}: AdminPanelProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [participantCount, setParticipantCount] = useState(2)
  const [threshold, setThreshold] = useState(50)
  const [adminSecret, setAdminSecret] = useState('')
  const [session, setSession] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const createSession = async () => {
    if (!sessionName.trim()) {
      toast.error('Session name is required')
      return
    }
    if (!adminSecret || adminSecret.length < 6) {
      toast.error('Admin secret must be at least 6 characters')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sessionName,
          participantCount,
          adminSecret
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create session')
      }

      const data = await response.json()
      setSession(data)
      toast.success('Session created successfully!')

      // Start monitoring the session
      setTimeout(() => monitorSession(adminSecret), 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create session')
      console.error(error)
    } finally {
      setIsCreating(false)
    }
  }

  const monitorSession = async (secret: string) => {
    setIsRefreshing(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSecret: secret })
      })

      if (response.ok) {
        const data = await response.json()
        setSession(data)
      }
    } catch (error) {
      console.error('Failed to fetch session:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied!`)
  }

  const refreshSession = () => {
    if (adminSecret) {
      monitorSession(adminSecret)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <Settings className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          </div>

          {!session ? (
            <div className="space-y-6">
              {/* Session Name Input */}
              <div>
                <label className="block text-white font-medium mb-2">
                  <Type className="w-4 h-4 inline mr-2" />
                  Session Name
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Enter session name (e.g., 'Friday Night Party')"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Participants Count
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={participantCount}
                    onChange={(e) => setParticipantCount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    <Trophy className="w-4 h-4 inline mr-2" />
                    Threshold Score
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Admin Secret (min 6 characters)
                </label>
                <input
                  type="password"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="Enter admin secret"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={createSession}
                disabled={isCreating || !sessionName.trim() || !adminSecret || adminSecret.length < 6}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isCreating ? 'Creating Session...' : 'Create Session'}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Session Info */}
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Session Created</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-white/70 text-sm">Session Name</div>
                    <div className="text-white text-lg font-medium">{session.name}</div>
                  </div>
                  <div>
                    <div className="text-white/70 text-sm mb-1">Join Code</div>
                    <div className="flex items-center gap-2">
                      <div className="text-white text-lg font-mono bg-white/10 px-3 py-1 rounded">
                        {session.joinCode}
                      </div>
                      <button
                        onClick={() => copyToClipboard(session.joinCode, 'Join code')}
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-white/70 text-sm">Session ID</div>
                    <div className="text-white text-sm font-mono">{session.id}</div>
                  </div>
                  <div>
                    <div className="text-white/70 text-sm">Created</div>
                    <div className="text-white text-sm">{new Date(session.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Participants Hash Codes */}
              {session.participants && session.participants.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    Participant Hash Codes
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {session.participants.map((participant: any, index: number) => (
                      <motion.div
                        key={participant.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => copyToClipboard(participant.hashCode, 'Hash code')}
                        className={`p-4 rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                          participant.isJoined
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        }`}
                      >
                        <div className="text-white text-center">
                          <div className="text-xs opacity-80">
                            Participant {index + 1}
                            {participant.isJoined && ' ✓'}
                          </div>
                          <div className="text-lg font-mono font-bold">{participant.hashCode}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-white/70 text-sm mt-2">Click to copy hash code • Green = Joined</p>
                </div>
              )}

              {/* Session Status */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-white">Session Status</h3>
                  <button
                    onClick={refreshSession}
                    disabled={isRefreshing}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      {session.participants?.filter((p: any) => p.isJoined).length || 0}
                    </div>
                    <div className="text-white/70">Joined</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">
                      {session.participants?.filter((p: any) => p.hasSubmitted).length || 0}
                    </div>
                    <div className="text-white/70">Submitted</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">
                      {session.participantCount}
                    </div>
                    <div className="text-white/70">Total</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">
                      {session.status}
                    </div>
                    <div className="text-white/70">Status</div>
                  </div>
                </div>

                {/* Participants List */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-3">Participants</h4>
                  <div className="space-y-2">
                    {session.participants?.map((participant: any, index: number) => (
                      <div
                        key={participant.id}
                        className="flex justify-between items-center bg-white/10 p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-white font-medium">
                            Participant {index + 1}
                          </div>
                          <div className="text-white/60 font-mono text-sm">
                            {participant.hashCode}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            participant.isJoined
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {participant.isJoined ? 'Joined' : 'Not Joined'}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            participant.hasSubmitted
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {participant.hasSubmitted ? 'Submitted' : 'Waiting'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final Result */}
                {session.status === 'COMPLETED' && session.groupResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-6 rounded-xl text-center ${
                      session.groupResult.canSmoke
                        ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30'
                        : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30'
                    }`}
                  >
                    <div className="text-4xl font-bold text-white mb-2">
                      {session.groupResult.averageScore.toFixed(1)} / {threshold}
                    </div>
                    <div className={`text-xl font-semibold ${
                      session.groupResult.canSmoke ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {session.groupResult.canSmoke ? '🎉 Can Smoke!' : '❌ Cannot Smoke'}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}