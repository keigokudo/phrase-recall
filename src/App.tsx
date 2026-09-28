import { useMemo, useState } from 'react'
import './App.css'
import { ImportPanel } from './components/ImportPanel'
import { PackCard } from './components/PackCard'
import { PracticeView } from './components/PracticeView'
import { samplePack } from './data/samplePack'
import type { Phrase, PhrasePack, ProgressMap, RecallRating } from './types'
import { loadImportedPacks, loadProgress, saveImportedPacks, saveRating } from './utils/storage'

interface Session {
  pack: PhrasePack
  phrases: Phrase[]
}

export default function App() {
  const [importedPacks, setImportedPacks] = useState<PhrasePack[]>(loadImportedPacks)
  const [progress, setProgress] = useState<ProgressMap>(loadProgress)
  const [session, setSession] = useState<Session | null>(null)

  const packs = useMemo(() => [samplePack, ...importedPacks], [importedPacks])

  function handleImport(pack: PhrasePack) {
    const next = [...importedPacks, pack]
    setImportedPacks(next)
    saveImportedPacks(next)
  }

  function handleRate(phraseId: string, rating: RecallRating) {
    setProgress((current) => saveRating(current, phraseId, rating))
  }

  function startPractice(pack: PhrasePack, difficultOnly = false) {
    const phrases = difficultOnly
      ? pack.phrases.filter((phrase) => progress[phrase.id]?.status === 'difficult')
      : pack.phrases
    setSession({ pack, phrases })
  }

  if (session) {
    return (
      <PracticeView
        pack={session.pack}
        phrases={session.phrases}
        progress={progress}
        onRate={handleRate}
        onExit={() => setSession(null)}
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
