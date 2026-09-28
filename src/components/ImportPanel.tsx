import { useState, type FormEvent } from 'react'
import type { PhrasePack } from '../types'
import { importPack } from '../utils/import'

export function ImportPanel({ onImport }: { onImport: (pack: PhrasePack) => void }) {
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!file) {
      setError('Choose a JSON or CSV file.')
      return
    }

    try {
      const pack = await importPack(file, name)
      onImport(pack)
      setName('')
      setFile(null)
      const input = document.getElementById('pack-file') as HTMLInputElement | null
      if (input) input.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import this file.')
    }
  }

  return (
    <section className="import-panel" aria-labelledby="import-title">
      <div>
        <p className="eyebrow">Bring your own material</p>
        <h2 id="import-title">Import a phrase pack</h2>
        <p className="muted">Use a JSON array or CSV with <code>cue</code> and <code>answer</code> columns.</p>
      </div>
      <form onSubmit={submit} className="import-form">
        <label>
          Pack name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Travel French" />
        </label>
        <label>
          Phrase file
          <input id="pack-file" type="file" accept=".json,.csv,application/json,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" type="submit">Import pack</button>
      </form>
    </section>
  )
}
