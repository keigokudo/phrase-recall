export type RecallRating = 'again' | 'hard' | 'good' | 'easy'
export type PhraseStatus = 'new' | 'difficult' | 'learned'
export type StudySessionMode = 'full' | 'difficult'
export type StudySessionState = 'active' | 'completed' | 'abandoned'

export interface Phrase {
  id: string
  cue: string
  answer: string
}

export interface PackLanguages {
  cue: string
  answer: string
}

export interface ImportedPhrase {
  cue: string
  answer: string
}

export interface ImportedPhrasePack {
  schemaVersion: 1
  name: string
  source: string
  languages: PackLanguages
  phrases: ImportedPhrase[]
}

export interface PhrasePack {
  id: string
  schemaVersion: 1
  name: string
  source: string
  languages: PackLanguages
  phrases: Phrase[]
  builtIn?: boolean
}

export interface PhraseProgress {
  status: PhraseStatus
  lastRating?: RecallRating
}

export type ProgressMap = Record<string, PhraseProgress>

export interface StudySession {
  id: string
  packId: string
  packName: string
  mode: StudySessionMode
  startedAt: string
  endedAt?: string
  abandonedAt?: string
  state: StudySessionState
}

export interface ReviewEvent {
  id: string
  sessionId: string
  packId: string
  phraseId: string
  reviewedAt: string
  round: number
  rating: RecallRating
  cueToRevealMs: number
  revealToRatingMs?: number
}

export interface ReviewMeasurement {
  phraseId: string
  rating: RecallRating
  round: number
  cueToRevealMs: number
  revealToRatingMs: number
}

export interface SessionResultReview {
  id: string
  round: number
  rating: RecallRating
  cueToRevealMs: number
  revealToRatingMs?: number
  reviewedAt: string
}

export interface SessionPhraseResult {
  phraseId: string
  cue: string
  answer: string
  latestRating: RecallRating
  needsReview: boolean
  reviews: SessionResultReview[]
}

export interface SessionResultReport {
  schemaVersion: 1
  type: 'phrase-recall-session-result'
  session: {
    id: string
    packId: string
    pack: string
    source: string
    languages: PackLanguages
    mode: StudySessionMode
    startedAt: string
    endedAt: string
    rounds: number
  }
  summary: {
    uniquePhrases: number
    totalReviews: number
    again: number
    hard: number
    good: number
    easy: number
    averageCueToRevealMs: number
  }
  results: SessionPhraseResult[]
}
