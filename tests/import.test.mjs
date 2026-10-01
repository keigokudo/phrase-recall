import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'vite'

const buildResult = await build({
  configFile: false,
  logLevel: 'silent',
  build: {
    write: false,
    lib: { entry: 'src/utils/import.ts', formats: ['es'] },
  },
})
const output = Array.isArray(buildResult) ? buildResult[0].output : buildResult.output
const moduleCode = output.find((item) => item.type === 'chunk').code
const importModule = await import(`data:text/javascript;base64,${Buffer.from(moduleCode).toString('base64')}`)
const { AI_FORMAT_PROMPT, importPack, importPastedJson, PHRASE_PACK_EXAMPLE } = importModule

const standardJson = JSON.stringify({
  schemaVersion: 1,
  name: 'Standard Test',
  source: '',
  languages: { cue: 'en', answer: 'fr' },
  phrases: [
    { cue: "What's your name?", answer: "Qu'est-ce que vous faites ?" },
    { cue: 'What’s that?', answer: 's’il vous plaît' },
    { cue: 'She said “bonjour”.', answer: 'Très bien !' },
  ],
})

const mobileJson = `{
  “schemaVersion”: 1,
  “name”: “Mobile Test”,
  “source”: “ChatGPT mobile”,
  “languages”: {
    “cue”: “en”,
    “answer”: “fr”
  },
  “phrases”: [
    {
      “cue”: “What’s your name?”,
      “answer”: “Comment vous appelez-vous ?”
    },
    {
      “cue”: “What does ___ mean?”,
      “answer”: “Qu’est-ce que ___ veut dire ?”
    }
  ]
}`

const ipaValues = [
  '/ʒə vu.dʁɛ a.le a pa.ʁi/',
  '/ɛ̃ pø/',
  '/ɑ̃.fɑ̃/',
  '/kɛl œʁ ɛ.t‿il/',
]

const ipaJson = JSON.stringify({
  schemaVersion: 1,
  name: 'IPA Test',
  source: 'Test',
  languages: { cue: 'en', answer: 'fr' },
  phrases: ipaValues.map((ipa, index) => ({
    cue: `Cue ${index + 1}`,
    answer: `Answer ${index + 1}`,
    ipa,
  })),
})

test('imports standard JSON without changing apostrophes or accents', () => {
  const pack = importPastedJson(`\n\uFEFF${standardJson}\n`, '')

  assert.equal(pack.phrases[0].cue, "What's your name?")
  assert.equal(pack.phrases[0].answer, "Qu'est-ce que vous faites ?")
  assert.equal(pack.phrases[1].cue, 'What’s that?')
  assert.equal(pack.phrases[1].answer, 's’il vous plaît')
  assert.equal(pack.phrases[2].cue, 'She said “bonjour”.')
  assert.equal(Object.hasOwn(pack.phrases[0], 'ipa'), false)
})

test('imports and preserves optional Unicode IPA exactly', () => {
  const pack = importPastedJson(ipaJson, '')

  assert.deepEqual(pack.phrases.map((phrase) => phrase.ipa), ipaValues)
})

test('AI format guidance requests optional answer-language IPA', () => {
  assert.match(PHRASE_PACK_EXAMPLE, /"ipa":/)
  assert.match(AI_FORMAT_PROMPT, /broad IPA transcription of the answer/)
  assert.match(AI_FORMAT_PROMPT, /standard\/default pronunciation of the answer language/)
  assert.match(AI_FORMAT_PROMPT, /If IPA is not applicable or cannot be provided confidently, omit the field/)
})

test('rejects invalid or empty IPA values', () => {
  const withIpa = (ipa) => JSON.stringify({
    schemaVersion: 1,
    name: 'Invalid IPA',
    source: 'Test',
    languages: { cue: 'en', answer: 'fr' },
    phrases: [{ cue: 'Cue', answer: 'Answer', ipa }],
  })

  assert.throws(() => importPastedJson(withIpa(123), ''), /"ipa" must be a non-empty string/)
  assert.throws(() => importPastedJson(withIpa(''), ''), /"ipa" must be a non-empty string/)
  assert.throws(() => importPastedJson(withIpa('   '), ''), /"ipa" must be a non-empty string/)
})

test('imports ChatGPT mobile JSON and preserves curly apostrophes', () => {
  const pack = importPastedJson(mobileJson, '')

  assert.equal(pack.name, 'Mobile Test')
  assert.equal(pack.phrases[0].cue, 'What’s your name?')
  assert.equal(pack.phrases[1].answer, 'Qu’est-ce que ___ veut dire ?')
})

test('imports fenced JSON and legacy arrays', () => {
  assert.equal(importPastedJson(`\`\`\`json\n${standardJson}\n\`\`\``, '').name, 'Standard Test')
  assert.equal(importPastedJson('[{"cue":"Hello","answer":"Bonjour"}]', 'Legacy').name, 'Legacy')
})

test('does not silently repair malformed JSON', () => {
  assert.throws(
    () => importPastedJson('{ “schemaVersion”: 1, “name”: “Broken” ', ''),
    /Could not parse the pasted JSON/,
  )
  assert.throws(
    () => importPastedJson('{ “schemaVersion”: 1, “name”: “A ”quoted”, name” }', ''),
    /Could not parse the pasted JSON/,
  )
})

test('keeps JSON and CSV file imports working', async () => {
  const jsonPack = await importPack({ name: 'pack.json', text: async () => standardJson }, '')
  const csvPack = await importPack(
    { name: 'pack.csv', text: async () => "cue,answer\nWhat’s this?,Qu’est-ce que c’est ?" },
    'CSV Test',
  )

  assert.equal(jsonPack.name, 'Standard Test')
  assert.equal(csvPack.phrases[0].cue, 'What’s this?')
  assert.equal(csvPack.phrases[0].answer, 'Qu’est-ce que c’est ?')
})
