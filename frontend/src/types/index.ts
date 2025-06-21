export interface Session {
  id: string
  participantCount: number
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED'
  threshold: number
  createdAt: string
  participants: Participant[]
  scores: Score[]
  groupResult?: GroupResult

  // ADD: Penalty fields
  recentPenalty?: boolean
  sickPenalty?: boolean
  importantPenalty?: boolean
}

  export interface Participant {
    id: string
    hashCode: string
    hasSubmitted: boolean
    joinedAt: string | null
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
    token: string | null
    hasSubmitted: boolean
    personalScore: number | null
  }