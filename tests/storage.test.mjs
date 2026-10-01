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
const {
  deleteImportedPack,
  loadImportedPacks,
  loadReviewEvents,
  loadStudySessions,
} = await import(`data:text/javascript;base64,${Buffer.from(moduleCode).toString('base64')}`)

function installStorage(initialValues) {
  const values = new Map(Object.entries(initialValues))
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  return values
}

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
  installStorage({ 'phraseRecall.importedPacks': JSON.stringify(storedPacks) })

  const packs = loadImportedPacks()

  assert.equal(Object.hasOwn(packs[0].phrases[0], 'ipa'), false)
  assert.equal(packs[1].phrases[0].ipa, '/ɛ̃ pø/')
})

test('deletes one imported pack and only its associated local data', () => {
  const packs = [
    {
      id: 'delete-pack',
      schemaVersion: 1,
      name: 'Delete Me',
      source: '',
      languages: { cue: 'en', answer: 'fr' },
      phrases: [
        { id: 'delete-phrase-1', cue: 'One', answer: 'Un' },
        { id: 'delete-phrase-2', cue: 'Two', answer: 'Deux' },
      ],
    },
    {
      id: 'keep-pack',
      schemaVersion: 1,
      name: 'Keep Me',
      source: '',
      languages: { cue: 'en', answer: 'fr' },
      phrases: [{ id: 'keep-phrase', cue: 'Three', answer: 'Trois' }],
    },
  ]
  const progress = {
    'delete-phrase-1': { status: 'learned', lastRating: 'good' },
    'delete-phrase-2': { status: 'difficult', lastRating: 'hard' },
    'keep-phrase': { status: 'learned', lastRating: 'easy' },
    'starter-phrase': { status: 'difficult', lastRating: 'again' },
  }
  const sessions = [
    {
      id: 'delete-session',
      packId: 'delete-pack',
      packName: 'Delete Me',
      mode: 'full',
      startedAt: '2026-10-01T10:00:00.000Z',
      state: 'completed',
    },
    {
      id: 'keep-session',
      packId: 'keep-pack',
      packName: 'Keep Me',
      mode: 'full',
      startedAt: '2026-10-01T11:00:00.000Z',
      state: 'completed',
    },
  ]
  const reviews = [
    {
      id: 'delete-review',
      sessionId: 'delete-session',
      packId: 'delete-pack',
      phraseId: 'delete-phrase-1',
      reviewedAt: '2026-10-01T10:00:30.000Z',
      round: 1,
      rating: 'good',
      cueToRevealMs: 1200,
    },
    {
      id: 'keep-review',
      sessionId: 'keep-session',
      packId: 'keep-pack',
      phraseId: 'keep-phrase',
      reviewedAt: '2026-10-01T11:00:30.000Z',
      round: 1,
      rating: 'easy',
      cueToRevealMs: 800,
    },
  ]
  const values = installStorage({
    'phraseRecall.importedPacks': JSON.stringify(packs),
    'phraseRecall.progress': JSON.stringify(progress),
    'phraseRecall.studySessions': JSON.stringify(sessions),
    'phraseRecall.reviewEvents': JSON.stringify(reviews),
  })

  const result = deleteImportedPack('delete-pack')

  assert.equal(result.deleted, true)
  assert.deepEqual(result.importedPacks.map((pack) => pack.id), ['keep-pack'])
  assert.deepEqual(Object.keys(result.progress).sort(), ['keep-phrase', 'starter-phrase'])
  assert.deepEqual(loadStudySessions().map((session) => session.id), ['keep-session'])
  assert.deepEqual(loadReviewEvents().map((review) => review.id), ['keep-review'])
  assert.deepEqual(JSON.parse(values.get('phraseRecall.importedPacks')).map((pack) => pack.id), ['keep-pack'])
})

test('refuses to delete a pack marked as built in', () => {
  const builtInPack = {
    id: 'starter-pack',
    schemaVersion: 1,
    name: 'Starter',
    source: '',
    languages: { cue: 'en', answer: 'fr' },
    phrases: [{ id: 'starter-phrase', cue: 'Hello', answer: 'Bonjour' }],
    builtIn: true,
  }
  const values = installStorage({
    'phraseRecall.importedPacks': JSON.stringify([builtInPack]),
    'phraseRecall.progress': JSON.stringify({ 'starter-phrase': { status: 'learned' } }),
    'phraseRecall.studySessions': '[]',
    'phraseRecall.reviewEvents': '[]',
  })

  const result = deleteImportedPack('starter-pack')

  assert.equal(result.deleted, false)
  assert.equal(JSON.parse(values.get('phraseRecall.importedPacks')).length, 1)
  assert.deepEqual(JSON.parse(values.get('phraseRecall.progress')), { 'starter-phrase': { status: 'learned' } })
})
