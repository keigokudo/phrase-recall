export type RecallRating = 'again' | 'hard' | 'got-it'
export type PhraseStatus = 'new' | 'difficult' | 'learned'

export interface Phrase {
  id: string
  cue: string
  answer: string
}

export interface PhrasePack {
  id: string
  name: string
  phrases: Phrase[]
  builtIn?: boolean
}

export interface PhraseProgress {
  status: PhraseStatus
  lastRating?: RecallRating
}

export type ProgressMap = Record<string, PhraseProgress>
