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
