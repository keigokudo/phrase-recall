import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'vite'

const buildResult = await build({
  configFile: false,
  logLevel: 'silent',
  build: {
    write: false,
    lib: { entry: 'src/utils/storage.ts', formats: ['es'] },
  },
})
const output = Array.isArray(buildResult) ? buildResult[0].output : buildResult.output
const moduleCode = output.find((item) => item.type === 'chunk').code
const { loadImportedPacks } = await import(`data:text/javascript;base64,${Buffer.from(moduleCode).toString('base64')}`)

test('loads stored packs with and without IPA without migration', () => {
  const storedPacks = [
    {
      id: 'old-pack',
      schemaVersion: 1,
      name: 'Old Pack',
      source: '',
      languages: { cue: 'en', answer: 'fr' },
      phrases: [{ id: 'old-phrase', cue: 'Hello', answer: 'Bonjour' }],
    },
    {
      id: 'ipa-pack',
      schemaVersion: 1,
      name: 'IPA Pack',
      source: '',
      languages: { cue: 'en', answer: 'fr' },
      phrases: [{ id: 'ipa-phrase', cue: 'A little', answer: 'Un peu', ipa: '/ɛ̃ pø/' }],
    },
  ]
  globalThis.localStorage = {
    getItem: (key) => key === 'phraseRecall.importedPacks' ? JSON.stringify(storedPacks) : null,
  }

  const packs = loadImportedPacks()

  assert.equal(Object.hasOwn(packs[0].phrases[0], 'ipa'), false)
  assert.equal(packs[1].phrases[0].ipa, '/ɛ̃ pø/')
})
