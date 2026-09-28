import type { PhrasePack, ProgressMap, RecallRating, PhraseStatus } from '../types'

const PACKS_KEY = 'phraseRecall.importedPacks'
const PROGRESS_KEY = 'phraseRecall.progress'

export function loadImportedPacks(): PhrasePack[] {
  try {
    return JSON.parse(localStorage.getItem(PACKS_KEY) ?? '[]') as PhrasePack[]
  } catch {
    return []
  }
}

export function saveImportedPacks(packs: PhrasePack[]) {
  localStorage.setItem(PACKS_KEY, JSON.stringify(packs))
}

export function loadProgress(): ProgressMap {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}') as ProgressMap
  } catch {
    return {}
  }
}

export function saveRating(progress: ProgressMap, phraseId: string, rating: RecallRating): ProgressMap {
  const status: PhraseStatus = rating === 'got-it' ? 'learned' : 'difficult'
  const next: ProgressMap = { ...progress, [phraseId]: { status, lastRating: rating } }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(next))
  return next
}
