import type { Phrase, PhrasePack } from '../types'

function makeId(prefix = 'phrase') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function validateRows(rows: unknown[]): Phrase[] {
  if (!rows.length) throw new Error('The file does not contain any phrases.')
  return rows.map((row, index) => {
    if (!row || typeof row !== 'object') throw new Error(`Row ${index + 1} is not a valid object.`)
    const { cue, answer } = row as Record<string, unknown>
    if (typeof cue !== 'string' || typeof answer !== 'string' || !cue.trim() || !answer.trim()) {
      throw new Error(`Row ${index + 1} must contain non-empty "cue" and "answer" values.`)
    }
    return { id: makeId('imported'), cue: cue.trim(), answer: answer.trim() }
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

export async function importPack(file: File, name: string): Promise<PhrasePack> {
  if (!name.trim()) throw new Error('Enter a pack name before importing.')
  const text = await file.text()
  const ext = file.name.toLowerCase().split('.').pop()
  let rows: unknown[]

  if (ext === 'json') {
    try {
      const parsed: unknown = JSON.parse(text)
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array of phrase objects.')
      rows = parsed
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('JSON must')) throw error
      throw new Error('JSON could not be parsed. Check that the file contains a valid JSON array.')
    }
  } else if (ext === 'csv') {
    rows = parseCsv(text)
  } else {
    throw new Error('Choose a .json or .csv file.')
  }

  return { id: makeId('pack'), name: name.trim(), phrases: validateRows(rows) }
}
