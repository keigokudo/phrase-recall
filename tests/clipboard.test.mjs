import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'
import { build } from 'vite'

const buildResult = await build({
  configFile: false,
  logLevel: 'silent',
  build: {
    write: false,
    lib: { entry: 'src/utils/clipboard.ts', formats: ['es'] },
  },
})
const output = Array.isArray(buildResult) ? buildResult[0].output : buildResult.output
const moduleCode = output.find((item) => item.type === 'chunk').code
const { copyTextToClipboard } = await import(`data:text/javascript;base64,${Buffer.from(moduleCode).toString('base64')}`)

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
  const reportText = '{\n  "answer": "Qu’est-ce que c’est ?",\n  "cue": "What’s this?"\n}'
  let copiedText = ''
  setGlobal('navigator', { clipboard: { writeText: async (text) => { copiedText = text } } })

  assert.equal(await copyTextToClipboard(reportText), true)
  assert.equal(copiedText, reportText)
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
  const { calls } = installLegacyCopy({ throws: true })

  assert.equal(await copyTextToClipboard('Manual copy text'), false)
  assert.ok(calls.some((call) => call[0] === 'remove'))
  assert.ok(calls.some((call) => call[0] === 'restoreFocus'))
})
