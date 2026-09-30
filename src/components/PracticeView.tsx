import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Phrase, PhrasePack, ProgressMap, RecallRating, ReviewMeasurement, StudySession } from '../types'
import { speakAnswer, stopAnswerSpeech } from '../utils/speech'

interface Props {
  pack: PhrasePack
  phrases: Phrase[]
  progress: ProgressMap
  session: StudySession
  autoPronounce: boolean
  onAutoPronounceChange: (value: boolean) => void
  onReview: (measurement: ReviewMeasurement) => void
  onFinish: () => void
  onExit: () => void
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    && (target.matches('input, textarea, select') || target.isContentEditable)
}

export function PracticeView({
  pack,
  phrases,
  progress,
  session,
  autoPronounce,
  onAutoPronounceChange,
  onReview,
  onFinish,
  onExit,
}: Props) {
  const [round, setRound] = useState(1)
  const [roundPhrases, setRoundPhrases] = useState(phrases)
  const [difficultPhrases, setDifficultPhrases] = useState<Phrase[]>([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [roundComplete, setRoundComplete] = useState(false)
  const cueStartedAt = useRef(0)
  const cueToRevealMs = useRef<number | null>(null)
  const revealedAt = useRef<number | null>(null)
  const rated = useRef(false)
  const shouldAutoSpeak = useRef(false)
  const phrase = roundPhrases[index]

  useLayoutEffect(() => {
    stopAnswerSpeech()
    if (!phrase || roundComplete) return
    cueStartedAt.current = performance.now()
    cueToRevealMs.current = null
    revealedAt.current = null
    rated.current = false
  }, [phrase, round, roundComplete])

  useEffect(() => () => stopAnswerSpeech(), [])

  useEffect(() => {
    if (!revealed || !shouldAutoSpeak.current) return
    shouldAutoSpeak.current = false
    if (autoPronounce) speakAnswer(phrase.answer, pack.languages.answer)
  }, [autoPronounce, pack.languages.answer, phrase, revealed])

  function reveal() {
    if (revealed || roundComplete || !phrase || cueToRevealMs.current !== null) return
    cueToRevealMs.current = Math.max(0, Math.round(performance.now() - cueStartedAt.current))
    revealedAt.current = performance.now()
    shouldAutoSpeak.current = true
    setRevealed(true)
  }

  function replayAudio() {
    if (!revealed || !phrase) return
    speakAnswer(phrase.answer, pack.languages.answer)
  }

  function rate(rating: RecallRating) {
    if (!revealed || rated.current || cueToRevealMs.current === null || !phrase) return
    rated.current = true
    const needsRetry = rating === 'again' || rating === 'hard'
    const nextDifficult = needsRetry ? [...difficultPhrases, phrase] : difficultPhrases

    const ratedAt = performance.now()
    onReview({
      phraseId: phrase.id,
      rating,
      round,
      cueToRevealMs: cueToRevealMs.current,
      revealToRatingMs: Math.max(0, Math.round(ratedAt - (revealedAt.current ?? ratedAt))),
    })

    if (index + 1 >= roundPhrases.length) {
      setDifficultPhrases(nextDifficult)
      setRoundComplete(true)
      return
    }

    setDifficultPhrases(nextDifficult)
    setIndex((current) => current + 1)
    setRevealed(false)
  }

  function retryDifficult() {
    if (!difficultPhrases.length) return
    setRound((current) => current + 1)
    setRoundPhrases(difficultPhrases)
    setDifficultPhrases([])
    setIndex(0)
    setRevealed(false)
    setRoundComplete(false)
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return

      if (!revealed && !roundComplete && (event.key === ' ' || event.key === 'Enter')) {
        if (event.target instanceof HTMLElement && event.target.closest('button, a')) return
        event.preventDefault()
        reveal()
        return
      }

      if (!revealed || roundComplete) return
      const ratingByKey: Record<string, RecallRating> = {
        '1': 'again',
        '2': 'hard',
        '3': 'good',
        '4': 'easy',
      }
      const rating = ratingByKey[event.key]
      if (rating) {
        event.preventDefault()
        rate(rating)
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        replayAudio()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

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

  if (roundComplete) {
    return (
      <main className="shell practice-shell">
        <section className="empty-state round-complete">
          <p className="eyebrow">Round {round} complete</p>
          <h1>{difficultPhrases.length ? 'Keep going?' : 'Round complete.'}</h1>
          <p className="muted">
            {difficultPhrases.length
              ? `${difficultPhrases.length} ${difficultPhrases.length === 1 ? 'phrase needs' : 'phrases need'} another pass.`
              : 'No phrases from this round need another pass.'}
          </p>
          <div className="button-row">
            {difficultPhrases.length > 0 && (
              <button className="primary" onClick={retryDifficult}>Retry difficult phrases</button>
            )}
            <button className={difficultPhrases.length ? 'secondary' : 'primary'} onClick={onFinish}>Finish session</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="shell practice-shell">
      <header className="practice-header">
        <button className="text-button" onClick={onExit}>← Exit practice</button>
        <div className="practice-meta">
          <p className="eyebrow">{pack.name}</p>
          <p className="muted">Round {round} · {index + 1} of {roundPhrases.length} · {session.mode} mode</p>
          <label className="tts-preference">
            <input
              type="checkbox"
              checked={autoPronounce}
              onChange={(event) => onAutoPronounceChange(event.target.checked)}
            />
            Automatically pronounce answer
          </label>
        </div>
      </header>

      <section className="practice-card" aria-live="polite">
        <p className="eyebrow">Cue</p>
        <h1>{phrase.cue}</h1>

        {!revealed ? (
          <div className="recall-prompt">
            <p>Recall the phrase aloud or in your head before revealing it.</p>
            <button className="primary large" onClick={reveal}>Show answer <span className="key-hint">Space / Enter</span></button>
          </div>
        ) : (
          <div className="answer-block">
            <p className="eyebrow">Answer</p>
            <p className="answer">{phrase.answer}</p>
            <div className="answer-tools">
              <p className="muted">Current status: {progress[phrase.id]?.status ?? 'new'}</p>
              <button className="text-button replay-button" onClick={replayAudio}>Replay audio <span className="key-hint">R</span></button>
            </div>
            <div className="rating-grid" aria-label="Rate your recall">
              <button onClick={() => rate('again')}>Again <kbd>1</kbd><span>Couldn’t recall it</span></button>
              <button onClick={() => rate('hard')}>Hard <kbd>2</kbd><span>Recalled with significant effort</span></button>
              <button onClick={() => rate('good')}>Good <kbd>3</kbd><span>Recalled normally</span></button>
              <button onClick={() => rate('easy')}>Easy <kbd>4</kbd><span>Recalled immediately</span></button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
