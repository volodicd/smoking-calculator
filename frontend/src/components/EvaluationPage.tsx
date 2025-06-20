import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Send, ArrowLeft, User, Hash } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface SessionData {
  sessionId: string
  sessionName: string
  participantId: string
  hashCode: string
}

interface EvaluationPageProps {
  sessionData: SessionData
  onBackToJoin?: () => void
}

export function EvaluationPage({ sessionData, onBackToJoin }: EvaluationPageProps) {
  const [score, setScore] = useState(50)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const submitScore = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/api/submit-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: sessionData.participantId,
          score: score
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit score')
      }

      toast.success('Score submitted successfully!')
      setHasSubmitted(true)

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit score')
      console.error('Submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-400'
    if (value >= 60) return 'text-yellow-400'
    if (value >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreDescription = (value: number) => {
    if (value >= 90) return 'Excellent condition! 🌟'
    if (value >= 80) return 'Very good condition 😊'
    if (value >= 70) return 'Good condition 👍'
    if (value >= 60) return 'Fair condition 😐'
    if (value >= 50) return 'Moderate condition 😔'
    if (value >= 40) return 'Poor condition 😟'
    if (value >= 30) return 'Very poor condition 😰'
    return 'Critical condition 🚨'
  }

  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Score Submitted!
            </h1>
            <p className="text-white/70 mb-6">
              Your evaluation has been recorded. Wait for other participants to submit their scores.
            </p>
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <div className="text-white/60 text-sm">Your Score</div>
              <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}/100
              </div>
            </div>
            {onBackToJoin && (
              <button
                onClick={onBackToJoin}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Join
              </button>
            )}
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Star className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Evaluate Yourself</h1>
            </div>
            <p className="text-white/70 mb-4">
              How do you feel right now? Rate your current condition.
            </p>

            {/* Session Info */}
            <div className="bg-white/5 rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between text-white/60">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {sessionData.sessionName}
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {sessionData.hashCode}
                </span>
              </div>
            </div>
          </div>

          {/* Score Slider */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-white font-medium">
                  Current Condition Score
                </label>
                <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                  {score}/100
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ef4444 0%, #f97316 25%, #eab308 50%, #22c55e 75%, #10b981 100%)`
                }}
              />

              <div className="flex justify-between text-white/50 text-xs mt-2">
                <span>Very Poor</span>
                <span>Poor</span>
                <span>Fair</span>
                <span>Good</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Score Description */}
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className={`text-lg font-medium ${getScoreColor(score)}`}>
                {getScoreDescription(score)}
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2 text-sm">Evaluation Guidelines:</h3>
              <div className="text-white/70 text-xs space-y-1">
                <div>• <strong>80-100:</strong> Feeling great, energetic, clear-minded</div>
                <div>• <strong>60-79:</strong> Good condition, minor fatigue</div>
                <div>• <strong>40-59:</strong> Moderate condition, some impairment</div>
                <div>• <strong>20-39:</strong> Poor condition, significant impairment</div>
                <div>• <strong>0-19:</strong> Very poor condition, should not participate</div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={submitScore}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Score
                </>
              )}
            </button>

            {/* Back Button */}
            {onBackToJoin && (
              <button
                onClick={onBackToJoin}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Join
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Custom CSS for the slider (add to your global CSS)
const sliderStyles = `
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.slider::-moz-range-thumb {
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
`