import { useState } from 'react'
import type { Phrase, PhrasePack, ProgressMap, RecallRating } from '../types'

interface Props {
  pack: PhrasePack
  phrases: Phrase[]
  progress: ProgressMap
  onRate: (phraseId: string, rating: RecallRating) => void
  onExit: () => void
}

export function PracticeView({ pack, phrases, progress, onRate, onExit }: Props) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const phrase = phrases[index]

  if (!phrase) {
    return (
      <main className="shell">
        <section className="empty-state">
          <p className="eyebrow">All clear</p>
          <h1>No difficult phrases yet.</h1>
          <p className="muted">Practice the full pack and mark phrases Again or Hard to collect them here.</p>
          <button className="primary" onClick={onExit}>Back to packs</button>
        </section>
      </main>
    )
  }

  function rate(rating: RecallRating) {
    onRate(phrase.id, rating)
    setIndex((current) => (current + 1 >= phrases.length ? 0 : current + 1))
    setRevealed(false)
  }

  return (
    <main className="shell practice-shell">
      <header className="practice-header">
        <button className="text-button" onClick={onExit}>← Packs</button>
        <div>
          <p className="eyebrow">{pack.name}</p>
          <p className="muted">{index + 1} of {phrases.length}</p>
        </div>
      </header>

      <section className="practice-card" aria-live="polite">
        <p className="eyebrow">Cue</p>
        <h1>{phrase.cue}</h1>

        {!revealed ? (
          <div className="recall-prompt">
            <p>Recall the phrase aloud or in your head before revealing it.</p>
            <button className="primary large" onClick={() => setRevealed(true)}>Show answer</button>
          </div>
        ) : (
          <div className="answer-block">
            <p className="eyebrow">Answer</p>
            <p className="answer">{phrase.answer}</p>
            <p className="muted">Current status: {progress[phrase.id]?.status ?? 'new'}</p>
            <div className="rating-grid" aria-label="Rate your recall">
              <button onClick={() => rate('again')}>Again<span>Couldn’t recall it</span></button>
              <button onClick={() => rate('hard')}>Hard<span>Got there with effort</span></button>
              <button onClick={() => rate('got-it')}>Got it<span>Recalled confidently</span></button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
