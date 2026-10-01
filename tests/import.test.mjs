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
const { importPack, importPastedJson } = importModule

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

test('imports standard JSON without changing apostrophes or accents', () => {
  const pack = importPastedJson(`\n\uFEFF${standardJson}\n`, '')

  assert.equal(pack.phrases[0].cue, "What's your name?")
  assert.equal(pack.phrases[0].answer, "Qu'est-ce que vous faites ?")
  assert.equal(pack.phrases[1].cue, 'What’s that?')
  assert.equal(pack.phrases[1].answer, 's’il vous plaît')
  assert.equal(pack.phrases[2].cue, 'She said “bonjour”.')
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
