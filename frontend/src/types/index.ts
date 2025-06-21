export interface Session {
  id: string
  name: string
  joinCode: string
  participantCount: number
  threshold: number
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  recentPenalty: boolean
  sickPenalty: boolean
  importantPenalty: boolean
  participants: Participant[]
  groupResult?: {
    averageScore: number
    canSmoke: boolean
  }
}
export interface Participant {
  id: string
  hashCode: string
  hasSubmitted: boolean
  isJoined: boolean
  score?: number
  rarity?: number
  social?: number
  distance?: number
  context?: number
}

  export interface Score {
    personalScore: number
    submittedAt: string
  }

  export interface GroupResult {
    averageScore: number  // Keep as number for frontend display
    canSmoke: boolean
    totalSubmissions: number
    requiredSubmissions: number
  }

  export interface ScoreData {
    rarity: number
    social: number
    distance: number
    context: number
    penalties: string[]
  }

  export interface UserState {
    participantId: string | null
    sessionId: string | null
    sessionName: string | null
    hashCode: string | null
    hasSubmitted: boolean
    personalScore: number | null
  }


  export interface SessionData {
    sessionId: string
    sessionName: string
    participantId: string
    hashCode: string
  }