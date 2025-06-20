import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, Clock, Users, Sparkles, AlertTriangle, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUserStore } from '../store/userStore'
import { useSocket } from '../hooks/useSocket'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface ScoreFormProps {
  onSubmitted: () => void
}

const CRITERIA = [
  {
    id: 'rarity',
    icon: Clock,
    title: 'Rідкість події',
    description: 'Як часто таке трапляється?',
    labels: ['Щотижня', 'Щомісяця', 'Рідко', 'Раз на рік']
  },
  {
    id: 'social',
    icon: Users,
    title: 'Соціальна значущість',
    description: 'Важливість для стосунків та життя',
    labels: ['Звичайно', 'Важливо', 'Дуже важливо', 'Критично']
  },
  {
    id: 'distance',
    icon: Star,
    title: 'Час з останнього разу',
    description: 'Тижні з моменту останнього куріння',
    labels: ['< 1 тиждень', '1-2 тижні', '3-4 тижні', '> місяць']
  },
  {
    id: 'context',
    icon: Sparkles,
    title: 'Контекст і атмосфера',
    description: 'Унікальність обстановки та настрою',
    labels: ['Звичайно', 'Приємно', 'Особливо', 'Неповторно']
  }
]

const PENALTIES = [
  { id: 'recent', label: 'Курили протягом останніх 2 тижнів', value: 15 },
  { id: 'sick', label: 'Почуваєтеся погано', value: 10 },
  { id: 'important', label: 'Завтра важливий день', value: 5 }
]

export function ScoreForm({ onSubmitted }: ScoreFormProps) {
  const [scores, setScores] = useState({
    rarity: 5,
    social: 5,
    distance: 5,
    context: 5
  })
  const [penalties, setPenalties] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { token, setPersonalScore, setSubmitted } = useUserStore()
  const { on, off } = useSocket()

  const calculatePersonalScore = () => {
    const penaltySum = penalties.reduce((sum, penalty) => {
      const penaltyData = PENALTIES.find(p => p.id === penalty)
      return sum + (penaltyData?.value || 0)
    }, 0)

    return Math.max(0,
      ((scores.rarity - 1) * 3) +
      ((scores.social - 1) * 3) +
      ((scores.distance - 1) * 2) +
      ((scores.context - 1) * 3) -
      penaltySum
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/api/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rarity: scores.rarity,
          social: scores.social,
          distance: scores.distance,
          context: scores.context,
          penalties
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit score')
      }

      const data = await response.json()
      setPersonalScore(data.personalScore)
      setSubmitted(true)
      toast.success('Score submitted successfully!')
      onSubmitted()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit score')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateScore = (criteria: string, value: number) => {
    setScores(prev => ({ ...prev, [criteria]: value }))
  }

  const togglePenalty = (penaltyId: string) => {
    setPenalties(prev =>
      prev.includes(penaltyId)
        ? prev.filter(p => p !== penaltyId)
        : [...prev, penaltyId]
    )
  }

  const personalScore = calculatePersonalScore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Score the Event</h1>
            <p className="text-white/70">Rate each criteria from 1-10</p>
          </div>

          {/* Personal Score Display */}
          <motion.div
            key={personalScore}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={`text-center p-6 rounded-xl mb-8 ${
              personalScore >= 50
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30'
                : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30'
            }`}
          >
            <div className="text-4xl font-bold text-white mb-2">
              {personalScore} / 100
            </div>
            <div className={`text-lg font-semibold ${
              personalScore >= 50 ? 'text-green-300' : 'text-red-300'
            }`}>
              Your Personal Score
            </div>
          </motion.div>

          {/* Criteria Sliders */}
          <div className="space-y-8">
            {CRITERIA.map((criteria, index) => {
              const Icon = criteria.icon
              return (
                <motion.div
                  key={criteria.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 rounded-xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-6 h-6 text-purple-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{criteria.title}</h3>
                      <p className="text-white/60 text-sm">{criteria.description}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={scores[criteria.id as keyof typeof scores]}
                      onChange={(e) => updateScore(criteria.id, Number(e.target.value))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />

                    <div className="flex justify-between items-center">
                      <div className="flex justify-between w-full text-xs text-white/60">
                        {criteria.labels.map((label, i) => (
                          <span key={i} className="text-center max-w-[80px]">{label}</span>
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      <span className="text-2xl font-bold text-white">
                        {scores[criteria.id as keyof typeof scores]}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Penalties */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-red-500/10 border border-red-500/30 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Penalty Factors</h3>
            </div>

            <div className="space-y-3">
              {PENALTIES.map((penalty) => (
                <label
                  key={penalty.id}
                  className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={penalties.includes(penalty.id)}
                    onChange={() => togglePenalty(penalty.id)}
                    className="w-5 h-5 accent-red-500"
                  />
                  <span className="text-white flex-1">{penalty.label}</span>
                  <span className="text-red-400 font-semibold">-{penalty.value}</span>
                </label>
              ))}
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full mt-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                Submit Score
                <Send className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}