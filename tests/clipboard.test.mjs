import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'
import { build } from 'vite'

async function importSourceModule(entry) {
  const buildResult = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      lib: { entry, formats: ['es'] },
    },
  })
  const output = Array.isArray(buildResult) ? buildResult[0].output : buildResult.output
  const moduleCode = output.find((item) => item.type === 'chunk').code
  return import(`data:text/javascript;base64,${Buffer.from(moduleCode).toString('base64')}`)
}

const { copyTextToClipboard } = await importSourceModule('src/utils/clipboard.ts')
const { buildSessionResultReport, serializeSessionResult } = await importSourceModule('src/utils/sessionResults.ts')

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')

afterEach(() => {
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator)
  else delete globalThis.navigator
  if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument)
  else delete globalThis.document
})

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, { configurable: true, value })
}

function installLegacyCopy({ result = true, throws = false } = {}) {
  const calls = []
  const previousFocus = { focus: () => calls.push(['restoreFocus']) }
  const textarea = {
    value: '',
    style: {},
    setAttribute: (...args) => calls.push(['setAttribute', ...args]),
    focus: () => calls.push(['focus']),
    select: () => calls.push(['select']),
    setSelectionRange: (...args) => calls.push(['setSelectionRange', ...args]),
    remove: () => calls.push(['remove']),
  }
  const document = {
    activeElement: previousFocus,
    body: { appendChild: (element) => calls.push(['appendChild', element]) },
    createElement: (tag) => {
      calls.push(['createElement', tag])
      return textarea
    },
    execCommand: (command) => {
      calls.push(['execCommand', command])
      if (throws) throw new Error('Copy blocked')
      return result
    },
  }
  setGlobal('document', document)
  return { calls, textarea }
}

test('uses the Clipboard API and preserves the exact report text', async () => {
  const session = {
    id: 'session-1',
    packId: 'pack-1',
    packName: 'French',
    mode: 'full',
    startedAt: '2026-10-01T10:00:00.000Z',
    endedAt: '2026-10-01T10:01:00.000Z',
    state: 'completed',
  }
  const pack = {
    id: 'pack-1',
    schemaVersion: 1,
    name: 'French',
    source: 'Lesson',
    languages: { cue: 'en', answer: 'fr' },
    phrases: [{
      id: 'phrase-1',
      cue: 'What’s this?',
      answer: 'Qu’est-ce que c’est ?',
      ipa: '/kɛs kə sɛ/',
    }],
  }
  const reviews = [{
    id: 'review-1',
    sessionId: 'session-1',
    packId: 'pack-1',
    phraseId: 'phrase-1',
    reviewedAt: '2026-10-01T10:00:30.000Z',
    round: 1,
    rating: 'good',
    cueToRevealMs: 2345,
    revealToRatingMs: 987,
  }]
  const report = buildSessionResultReport(session, pack, reviews)
  const reportText = serializeSessionResult(report)
  let copiedText = ''
  setGlobal('navigator', { clipboard: { writeText: async (text) => { copiedText = text } } })

  assert.equal(await copyTextToClipboard(reportText), true)
  assert.equal(copiedText, reportText)
  assert.match(copiedText, /"type": "phrase-recall-session-result"/)
  assert.match(copiedText, /"summary":/)
  assert.match(copiedText, /"cueToRevealMs": 2345/)
  assert.match(copiedText, /"revealToRatingMs": 987/)
  assert.equal(report.results[0].ipa, '/kɛs kə sɛ/')

  const packWithoutIpa = {
    ...pack,
    phrases: [{ id: 'phrase-1', cue: 'What’s this?', answer: 'Qu’est-ce que c’est ?' }],
  }
  const reportWithoutIpa = buildSessionResultReport(session, packWithoutIpa, reviews)
  assert.equal(Object.hasOwn(reportWithoutIpa.results[0], 'ipa'), false)
})

test('uses the legacy fallback when the Clipboard API is unavailable', async () => {
  const text = 'Line one\nL’été — s’il vous plaît'
  setGlobal('navigator', {})
  const { calls, textarea } = installLegacyCopy()

  assert.equal(await copyTextToClipboard(text), true)
  assert.equal(textarea.value, text)
  assert.deepEqual(calls.find((call) => call[0] === 'setSelectionRange'), ['setSelectionRange', 0, text.length])
  assert.ok(calls.some((call) => call[0] === 'execCommand' && call[1] === 'copy'))
  assert.ok(calls.some((call) => call[0] === 'remove'))
  assert.ok(calls.some((call) => call[0] === 'restoreFocus'))
})

test('attempts the legacy fallback when Clipboard API copying throws', async () => {
  setGlobal('navigator', { clipboard: { writeText: async () => { throw new Error('Denied') } } })
  const { calls } = installLegacyCopy()

  assert.equal(await copyTextToClipboard('Fallback text'), true)
  assert.ok(calls.some((call) => call[0] === 'execCommand'))
})

test('returns false and cleans up when both copy methods fail', async () => {
  setGlobal('navigator', { clipboard: { writeText: async () => { throw new Error('Denied') } } })
  const { calls } = installLegacyCopy({ result: false })

  assert.equal(await copyTextToClipboard('Manual copy text'), false)
  assert.ok(calls.some((call) => call[0] === 'remove'))
  assert.ok(calls.some((call) => call[0] === 'restoreFocus'))
})
