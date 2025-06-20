import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserState } from '../types'

interface UserStore extends UserState {
  setUser: (user: Partial<UserState>) => void
  logout: () => void
  setPersonalScore: (score: number) => void
  setSubmitted: (submitted: boolean) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      participantId: null,
      sessionId: null,
      token: null,
      hasSubmitted: false,
      personalScore: null,

      setUser: (user) => set((state) => ({ ...state, ...user })),
      logout: () => set({
        participantId: null,
        sessionId: null,
        token: null,
        hasSubmitted: false,
        personalScore: null
      }),
      setPersonalScore: (score) => set({ personalScore: score }),
      setSubmitted: (submitted) => set({ hasSubmitted: submitted })
    }),
    {
      name: 'user-storage'
    }
  )
)