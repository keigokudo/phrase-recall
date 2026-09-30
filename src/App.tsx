import { useMemo, useState } from 'react'
import './App.css'
import { ImportPanel } from './components/ImportPanel'
import { PackCard } from './components/PackCard'
import { PracticeView } from './components/PracticeView'
import { samplePack } from './data/samplePack'
import type { Phrase, PhrasePack, ProgressMap, RecallRating, StudySession } from './types'
import {
  abandonStudySession,
  appendReviewEvent,
  completeStudySession,
  createStudySession,
  loadAutoPronounce,
  loadImportedPacks,
  loadProgress,
  saveAutoPronounce,
  saveImportedPacks,
  saveRating,
} from './utils/storage'

interface Session {
  studySession: StudySession
  pack: PhrasePack
  phrases: Phrase[]
}

export default function App() {
  const [importedPacks, setImportedPacks] = useState<PhrasePack[]>(loadImportedPacks)
  const [progress, setProgress] = useState<ProgressMap>(loadProgress)
  const [session, setSession] = useState<Session | null>(null)
  const [autoPronounce, setAutoPronounce] = useState(loadAutoPronounce)

  const packs = useMemo(() => [samplePack, ...importedPacks], [importedPacks])

  function handleImport(pack: PhrasePack) {
    const next = [...importedPacks, pack]
    setImportedPacks(next)
    saveImportedPacks(next)
  }

  function handleReview(measurement: {
    phraseId: string
    rating: RecallRating
    round: number
    cueToRevealMs: number
    revealToRatingMs: number
  }) {
    if (!session) return
    appendReviewEvent({
      sessionId: session.studySession.id,
      packId: session.pack.id,
      ...measurement,
    })
    const { phraseId, rating } = measurement
    setProgress((current) => saveRating(current, phraseId, rating))
  }

  function startPractice(pack: PhrasePack, difficultOnly = false) {
    const phrases = difficultOnly
      ? pack.phrases.filter((phrase) => progress[phrase.id]?.status === 'difficult')
      : pack.phrases
    if (!phrases.length) return
    const studySession = createStudySession(pack, difficultOnly ? 'difficult' : 'full')
    setSession({ studySession, pack, phrases })
  }

  function finishSession() {
    if (!session) return
    completeStudySession(session.studySession.id)
    setSession(null)
  }

  function exitSession() {
    if (!session) return
    abandonStudySession(session.studySession.id)
    setSession(null)
  }

  function handleAutoPronounceChange(value: boolean) {
    setAutoPronounce(value)
    saveAutoPronounce(value)
  }

  if (session) {
    return (
      <PracticeView
        pack={session.pack}
        phrases={session.phrases}
        progress={progress}
        session={session.studySession}
        autoPronounce={autoPronounce}
        onAutoPronounceChange={handleAutoPronounceChange}
        onReview={handleReview}
        onFinish={finishSession}
        onExit={exitSession}
      />
    )
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="brand">PhraseRecall</p>
          <h1>Useful phrases, remembered on purpose.</h1>
          <p className="hero-copy">
            Practice by recalling first, revealing second, and marking what needs another pass.
            Your packs and progress stay in this browser.
          </p>
        </div>
        <div className="hero-note" aria-label="Practice method">
          <span>01</span><p>Read the cue</p>
          <span>02</span><p>Recall from memory</p>
          <span>03</span><p>Reveal and rate</p>
        </div>
      </header>

      <section className="section-heading">
        <div>
          <p className="eyebrow">Your library</p>
          <h2>Phrase packs</h2>
        </div>
        <p className="muted">{packs.length} {packs.length === 1 ? 'pack' : 'packs'}</p>
      </section>

      <section className="pack-grid" aria-label="Phrase packs">
        {packs.map((pack) => (
          <PackCard key={pack.id} pack={pack} progress={progress} onStart={startPractice} />
        ))}
      </section>

      <ImportPanel onImport={handleImport} />

      <footer>
        <p>PhraseRecall · Local-first active recall practice</p>
      </footer>
    </main>
  )
}
