import type { Phrase, PhrasePack, ProgressMap, RecallRating, PhraseStatus } from '../types'

const PACKS_KEY = 'phraseRecall.importedPacks'
const PROGRESS_KEY = 'phraseRecall.progress'

export function loadImportedPacks(): PhrasePack[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(PACKS_KEY) ?? '[]')
    if (!Array.isArray(stored)) return []

    return stored.flatMap((value): PhrasePack[] => {
      if (!value || typeof value !== 'object') return []
      const pack = value as Partial<PhrasePack>
      if (typeof pack.id !== 'string' || typeof pack.name !== 'string' || !Array.isArray(pack.phrases)) return []

      const phrases = pack.phrases.filter((phrase): phrase is Phrase => (
        Boolean(phrase)
        && typeof phrase.id === 'string'
        && typeof phrase.cue === 'string'
        && typeof phrase.answer === 'string'
      ))
      if (!phrases.length) return []

      return [{
        id: pack.id,
        schemaVersion: 1,
        name: pack.name,
        source: typeof pack.source === 'string' ? pack.source : '',
        languages: {
          cue: typeof pack.languages?.cue === 'string' ? pack.languages.cue : '',
          answer: typeof pack.languages?.answer === 'string' ? pack.languages.answer : '',
        },
        phrases,
        builtIn: pack.builtIn,
      }]
    })
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
