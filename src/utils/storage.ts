import type {
  Phrase,
  PhrasePack,
  PhraseStatus,
  ProgressMap,
  RecallRating,
  ReviewEvent,
  StudySession,
  StudySessionMode,
} from '../types'

const PACKS_KEY = 'phraseRecall.importedPacks'
const PROGRESS_KEY = 'phraseRecall.progress'
const SESSIONS_KEY = 'phraseRecall.studySessions'
const REVIEWS_KEY = 'phraseRecall.reviewEvents'
const AUTO_PRONOUNCE_KEY = 'phraseRecall.autoPronounce'

function makeId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function readArray(key: string): unknown[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function normalizeRating(value: unknown): RecallRating | undefined {
  if (value === 'got-it') return 'good'
  if (value === 'again' || value === 'hard' || value === 'good' || value === 'easy') return value
  return undefined
}

export function loadImportedPacks(): PhrasePack[] {
  return readArray(PACKS_KEY).flatMap((value): PhrasePack[] => {
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
}

export function saveImportedPacks(packs: PhrasePack[]) {
  localStorage.setItem(PACKS_KEY, JSON.stringify(packs))
}

export function loadProgress(): ProgressMap {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}')
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {}

    return Object.entries(stored).reduce<ProgressMap>((progress, [phraseId, value]) => {
      if (!value || typeof value !== 'object') return progress
      const record = value as Record<string, unknown>
      const rating = normalizeRating(record.lastRating)
      const status: PhraseStatus | undefined = record.status === 'new'
        || record.status === 'difficult'
        || record.status === 'learned'
        ? record.status
        : undefined
      if (!status) return progress
      progress[phraseId] = rating ? { status, lastRating: rating } : { status }
      return progress
    }, {})
  } catch {
    return {}
  }
}

export function saveRating(progress: ProgressMap, phraseId: string, rating: RecallRating): ProgressMap {
  const status: PhraseStatus = rating === 'again' || rating === 'hard' ? 'difficult' : 'learned'
  const next: ProgressMap = { ...progress, [phraseId]: { status, lastRating: rating } }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(next))
  return next
}

export function createStudySession(pack: PhrasePack, mode: StudySessionMode): StudySession {
  const session: StudySession = {
    id: makeId('session'),
    packId: pack.id,
    packName: pack.name,
    mode,
    startedAt: new Date().toISOString(),
    state: 'active',
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify([...loadStudySessions(), session]))
  return session
}

export function loadStudySessions(): StudySession[] {
  return readArray(SESSIONS_KEY).flatMap((value): StudySession[] => {
    if (!value || typeof value !== 'object') return []
    const session = value as Partial<StudySession>
    if (
      typeof session.id !== 'string'
      || typeof session.packId !== 'string'
      || typeof session.startedAt !== 'string'
      || (session.mode !== 'full' && session.mode !== 'difficult')
    ) return []

    return [{
      id: session.id,
      packId: session.packId,
      packName: typeof session.packName === 'string' ? session.packName : '',
      mode: session.mode,
      startedAt: session.startedAt,
      endedAt: typeof session.endedAt === 'string' ? session.endedAt : undefined,
      abandonedAt: typeof session.abandonedAt === 'string' ? session.abandonedAt : undefined,
      state: session.state === 'completed' || session.state === 'abandoned' ? session.state : 'active',
    }]
  })
}

export function completeStudySession(sessionId: string) {
  const endedAt = new Date().toISOString()
  const sessions = loadStudySessions().map((session): StudySession => (
    session.id === sessionId && session.state === 'active'
      ? { ...session, endedAt, state: 'completed' }
      : session
  ))
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function abandonStudySession(sessionId: string) {
  const abandonedAt = new Date().toISOString()
  const sessions = loadStudySessions().map((session): StudySession => (
    session.id === sessionId && session.state === 'active'
      ? { ...session, abandonedAt, state: 'abandoned' }
      : session
  ))
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function appendReviewEvent(event: Omit<ReviewEvent, 'id' | 'reviewedAt'>): ReviewEvent {
  const review: ReviewEvent = {
    ...event,
    id: makeId('review'),
    reviewedAt: new Date().toISOString(),
  }
  localStorage.setItem(REVIEWS_KEY, JSON.stringify([...loadReviewEvents(), review]))
  return review
}

export function loadReviewEvents(): ReviewEvent[] {
  return readArray(REVIEWS_KEY).flatMap((value): ReviewEvent[] => {
    if (!value || typeof value !== 'object') return []
    const event = value as Partial<ReviewEvent> & { rating?: unknown }
    const rating = normalizeRating(event.rating)
    if (
      typeof event.id !== 'string'
      || typeof event.sessionId !== 'string'
      || typeof event.packId !== 'string'
      || typeof event.phraseId !== 'string'
      || typeof event.reviewedAt !== 'string'
      || typeof event.round !== 'number'
      || typeof event.cueToRevealMs !== 'number'
      || !rating
    ) return []

    return [{
      id: event.id,
      sessionId: event.sessionId,
      packId: event.packId,
      phraseId: event.phraseId,
      reviewedAt: event.reviewedAt,
      round: event.round,
      rating,
      cueToRevealMs: event.cueToRevealMs,
      revealToRatingMs: typeof event.revealToRatingMs === 'number' ? event.revealToRatingMs : undefined,
    }]
  })
}

export function loadAutoPronounce(): boolean {
  try {
    const stored = localStorage.getItem(AUTO_PRONOUNCE_KEY)
    return stored === null ? true : JSON.parse(stored) === true
  } catch {
    return true
  }
}

export function saveAutoPronounce(value: boolean) {
  localStorage.setItem(AUTO_PRONOUNCE_KEY, JSON.stringify(value))
}
