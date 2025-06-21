import { create } from 'zustand'

interface UserStore {
  // Session data
  sessionId: string | null
  sessionName: string | null
  participantId: string | null
  hashCode: string | null

  // Evaluation data
  personalScore: number | null
  hasSubmitted: boolean

  // Actions
  setSessionData: (data: { sessionId: string; sessionName: string; participantId: string; hashCode: string }) => void
  setPersonalScore: (score: number) => void
  setHasSubmitted: (submitted: boolean) => void
  reset: () => void // Add reset function
}

export const useUserStore = create<UserStore>((set) => ({
  // Initial state
  sessionId: null,
  sessionName: null,
  participantId: null,
  hashCode: null,
  personalScore: null,
  hasSubmitted: false,

  // Actions
  setSessionData: (data) => set({
    sessionId: data.sessionId,
    sessionName: data.sessionName,
    participantId: data.participantId,
    hashCode: data.hashCode
  }),

  setPersonalScore: (score) => set({ personalScore: score }),

  setHasSubmitted: (submitted) => set({ hasSubmitted: submitted }),

  // Reset all data
  reset: () => set({
    sessionId: null,
    sessionName: null,
    participantId: null,
    hashCode: null,
    personalScore: null,
    hasSubmitted: false
  })
}))