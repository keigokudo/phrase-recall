export type RecallRating = 'again' | 'hard' | 'got-it'
export type PhraseStatus = 'new' | 'difficult' | 'learned'

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
