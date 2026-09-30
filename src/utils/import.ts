import type { ImportedPhrasePack, PackLanguages, Phrase, PhrasePack } from '../types'

export const PHRASE_PACK_EXAMPLE = `{
  "schemaVersion": 1,
  "name": "Descriptive name",
  "source": "Source or lesson name if applicable",
  "languages": {
    "cue": "en",
    "answer": "fr"
  },
  "phrases": [
    {
      "cue": "English cue",
      "answer": "French phrase"
    }
  ]
}`

export const AI_FORMAT_PROMPT = `Return ONLY valid PhraseRecall JSON using exactly this format:

${PHRASE_PACK_EXAMPLE}

Rules:
- Output valid JSON only.
- Do not use Markdown fences.
- Do not include explanations or any text outside the JSON.
- schemaVersion must be 1.
- Every phrase must have non-empty cue and answer strings.
- Use short language identifiers for languages.cue and languages.answer.
- Do not generate pack IDs, phrase IDs, or timestamps. PhraseRecall generates its own internal IDs.
- Preserve natural spelling, accents, apostrophes, and punctuation.
- Produce the number of phrases requested by the user.`

function makeId(prefix: 'phrase' | 'pack') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function validateRows(rows: unknown[]): Phrase[] {
  if (!rows.length) throw new Error('The phrase pack does not contain any phrases.')
  return rows.map((row, index) => {
    if (!row || typeof row !== 'object') throw new Error(`Phrase ${index + 1} is not a valid object.`)
    const { cue, answer } = row as Record<string, unknown>
    if (typeof cue !== 'string' || typeof answer !== 'string' || !cue.trim() || !answer.trim()) {
      throw new Error(`Phrase ${index + 1} must contain non-empty "cue" and "answer" values.`)
    }
    return { id: makeId('phrase'), cue: cue.trim(), answer: answer.trim() }
  })
}

function readLanguages(value: unknown): PackLanguages {
  if (!value || typeof value !== 'object') {
    throw new Error('"languages" must contain "cue" and "answer" language identifiers.')
  }
  const { cue, answer } = value as Record<string, unknown>
  if (typeof cue !== 'string' || typeof answer !== 'string' || !cue.trim() || !answer.trim()) {
    throw new Error('"languages.cue" and "languages.answer" must be non-empty strings.')
  }
  return { cue: cue.trim(), answer: answer.trim() }
}

function createPack(data: ImportedPhrasePack): PhrasePack {
  return {
    id: makeId('pack'),
    schemaVersion: 1,
    name: data.name.trim(),
    source: data.source.trim(),
    languages: data.languages,
    phrases: validateRows(data.phrases),
  }
}

function parseJson(text: string, legacyName: string): PhrasePack {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('JSON could not be parsed. Check that it contains valid JSON.')
  }

  if (Array.isArray(parsed)) {
    if (!legacyName.trim()) throw new Error('Enter a pack name when importing a legacy JSON array.')
    return createPack({
      schemaVersion: 1,
      name: legacyName,
      source: '',
      languages: { cue: '', answer: '' },
      phrases: parsed as ImportedPhrasePack['phrases'],
    })
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('JSON must be a PhraseRecall pack object or a legacy array of phrases.')
  }

  const data = parsed as Record<string, unknown>
  if (data.schemaVersion !== 1) throw new Error('"schemaVersion" must be 1.')
  if (typeof data.name !== 'string' || !data.name.trim()) throw new Error('"name" must be a non-empty string.')
  if (typeof data.source !== 'string') throw new Error('"source" must be a string. It may be empty.')
  if (!Array.isArray(data.phrases)) throw new Error('"phrases" must be an array.')

  return createPack({
    schemaVersion: 1,
    name: data.name,
    source: data.source,
    languages: readLanguages(data.languages),
    phrases: data.phrases as ImportedPhrasePack['phrases'],
  })
}

function parseCsv(text: string): unknown[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) throw new Error('CSV must include a header row and at least one phrase.')
  const header = lines[0].split(',').map((cell) => cell.trim().toLowerCase())
  const cueIndex = header.indexOf('cue')
  const answerIndex = header.indexOf('answer')
  if (cueIndex < 0 || answerIndex < 0) throw new Error('CSV header must contain "cue" and "answer" columns.')

  return lines.slice(1).map((line) => {
    const cells = line.match(/("(?:[^"]|"")*"|[^,]*)/g)
      ?.filter((_, index) => index % 2 === 0)
      .map((cell) => cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"')) ?? []
    return { cue: cells[cueIndex], answer: cells[answerIndex] }
  })
}

export function importPastedJson(text: string, legacyName: string): PhrasePack {
  if (!text.trim()) throw new Error('Paste PhraseRecall JSON before importing.')
  return parseJson(text, legacyName)
}

export async function importPack(file: File, name: string): Promise<PhrasePack> {
  const text = await file.text()
  const ext = file.name.toLowerCase().split('.').pop()

  if (ext === 'json') return parseJson(text, name)
  if (ext === 'csv') {
    if (!name.trim()) throw new Error('Enter a pack name before importing a CSV file.')
    return createPack({
      schemaVersion: 1,
      name,
      source: '',
      languages: { cue: '', answer: '' },
      phrases: parseCsv(text) as ImportedPhrasePack['phrases'],
    })
  }
  throw new Error('Choose a .json or .csv file.')
}
