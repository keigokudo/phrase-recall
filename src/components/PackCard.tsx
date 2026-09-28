import type { PhrasePack, ProgressMap } from '../types'

interface Props {
  pack: PhrasePack
  progress: ProgressMap
  onStart: (pack: PhrasePack, difficultOnly?: boolean) => void
}

export function PackCard({ pack, progress, onStart }: Props) {
  const learned = pack.phrases.filter((phrase) => progress[phrase.id]?.status === 'learned').length
  const difficult = pack.phrases.filter((phrase) => progress[phrase.id]?.status === 'difficult').length
  const percent = pack.phrases.length ? Math.round((learned / pack.phrases.length) * 100) : 0

  return (
    <article className="pack-card">
      <div className="pack-card__top">
        <div>
          <p className="eyebrow">{pack.builtIn ? 'Starter pack' : 'Imported pack'}</p>
          <h2>{pack.name}</h2>
        </div>
        <span className="count">{pack.phrases.length} phrases</span>
      </div>
      <div className="progress-line" aria-label={percent + '% learned'}>
        <span style={{ width: percent + '%' }} />
      </div>
      <p className="muted">{learned} learned · {difficult} difficult · {percent}% complete</p>
      <div className="button-row">
        <button className="primary" onClick={() => onStart(pack)}>Start practice</button>
        <button className="secondary" onClick={() => onStart(pack, true)} disabled={!difficult}>Difficult only</button>
      </div>
    </article>
  )
}
