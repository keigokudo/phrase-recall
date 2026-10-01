import { useEffect, useMemo, useRef, useState } from 'react'
import type { PhrasePack, RecallRating, ReviewEvent, StudySession } from '../types'
import { copyTextToClipboard } from '../utils/clipboard'
import { buildSessionResultReport, serializeSessionResult } from '../utils/sessionResults'

interface Props {
  session: StudySession
  pack: PhrasePack
  reviews: ReviewEvent[]
  onBack: () => void
}

function formatSeconds(milliseconds: number) {
  return `${(milliseconds / 1000).toFixed(1)} sec`
}

function formatRating(rating: RecallRating) {
  return rating.charAt(0).toUpperCase() + rating.slice(1)
}

function resultFilename(packName: string, endedAt: string) {
  const safeName = packName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'phrase-recall'
  return `${safeName}-${endedAt.slice(0, 10)}-results.json`
}

export function SessionResults({ session, pack, reviews, onBack }: Props) {
  const report = useMemo(() => buildSessionResultReport(session, pack, reviews), [pack, reviews, session])
  const reportText = useMemo(() => serializeSessionResult(report), [report])
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const [manualReport, setManualReport] = useState<string | null>(null)
  const manualReportRef = useRef<HTMLTextAreaElement>(null)
  const needsReview = report.results.filter((result) => result.needsReview)
  const completedAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(report.session.endedAt))

  useEffect(() => {
    if (copyStatus !== 'copied') return
    const timeout = window.setTimeout(() => setCopyStatus('idle'), 2200)
    return () => window.clearTimeout(timeout)
  }, [copyStatus])

  async function copyAiReport() {
    const copyResult = copyTextToClipboard(reportText)
    setCopyStatus('idle')
    setManualReport(null)

    const didCopy = await copyResult
    if (didCopy) {
      setCopyStatus('copied')
    } else {
      setManualReport(reportText)
      setCopyStatus('error')
    }
  }

  function selectManualReport() {
    const textarea = manualReportRef.current
    if (!textarea) return
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)
  }

  function downloadJson() {
    const blob = new Blob([reportText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = resultFilename(pack.name, report.session.endedAt)
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <main className="shell results-shell">
      <header className="results-header">
        <div>
          <p className="eyebrow">Session complete</p>
          <h1>{pack.name}</h1>
          <p className="muted">{completedAt} · {report.session.rounds} {report.session.rounds === 1 ? 'round' : 'rounds'}</p>
        </div>
        <div className="results-actions">
          <button className="primary" onClick={copyAiReport}>Copy AI report</button>
          <button className="secondary" onClick={downloadJson}>Download JSON</button>
          <button className="text-button" onClick={onBack}>Back to packs</button>
          {copyStatus === 'copied' && <p className="copy-confirmation" role="status">AI report copied</p>}
          {copyStatus === 'error' && <p className="error" role="alert">Automatic copy is not available in this browser.</p>}
          {manualReport !== null && (
            <div className="manual-copy">
              <p>Select and copy the report manually.</p>
              <textarea ref={manualReportRef} value={manualReport} readOnly aria-label="AI report for manual copying" rows={10} />
              <button className="secondary" type="button" onClick={selectManualReport}>Select report</button>
            </div>
          )}
        </div>
      </header>

      <section className="results-summary" aria-label="Session summary">
        <article><span>Unique phrases</span><strong>{report.summary.uniquePhrases}</strong></article>
        <article><span>Total reviews</span><strong>{report.summary.totalReviews}</strong></article>
        <article><span>Average recall</span><strong>{formatSeconds(report.summary.averageCueToRevealMs)}</strong></article>
        <article><span>Again</span><strong>{report.summary.again}</strong></article>
        <article><span>Hard</span><strong>{report.summary.hard}</strong></article>
        <article><span>Good</span><strong>{report.summary.good}</strong></article>
        <article><span>Easy</span><strong>{report.summary.easy}</strong></article>
      </section>

      <section className="needs-review" aria-labelledby="needs-review-title">
        <p className="eyebrow">Latest session ratings</p>
        <h2 id="needs-review-title">{needsReview.length ? 'Still needs review' : 'Nothing left to review'}</h2>
        {needsReview.length ? (
          <ul>
            {needsReview.map((result) => (
              <li key={result.phraseId}>
                <span>{result.cue}</span>
                <strong>{formatRating(result.latestRating)}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Every phrase ended this session with Good or Easy.</p>
        )}
      </section>

      <details className="review-history">
        <summary>Review details ({report.summary.totalReviews})</summary>
        <div className="review-history__list">
          {report.results.map((result) => (
            <article key={result.phraseId}>
              <h3>{result.cue}</h3>
              <p className="muted">{result.answer}</p>
              <ol>
                {result.reviews.map((review) => (
                  <li key={review.id}>
                    <span>Round {review.round}</span>
                    <strong>{formatRating(review.rating)}</strong>
                    <span>{formatSeconds(review.cueToRevealMs)}</span>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </details>
    </main>
  )
}
