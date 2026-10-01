# PhraseRecall

PhraseRecall is a small, local-first active-recall app for language phrases. It connects AI-generated study material with measurable practice results without embedding an AI model or sending study data to an external service.

The central workflow is:

```text
AI generates phrases → PhraseRecall tests and measures recall → AI analyses the exported results
```

## Features

- Copy a reusable prompt that tells an AI how to produce PhraseRecall JSON
- Paste AI-generated JSON directly into the app
- Continue importing legacy JSON arrays and CSV files
- Practice a full pack or only currently difficult phrases
- Reveal answers after attempting recall, then rate them **Again**, **Hard**, **Good**, or **Easy**
- Measure cue-to-reveal recall time for every attempt
- Preserve every review across retry rounds
- Pronounce answers using the browser's built-in Speech Synthesis API
- Use keyboard shortcuts for fast practice
- View a concise finished-session summary
- Copy a detailed, versioned AI report or download the same data as JSON
- Store packs, progress, sessions, review events, and preferences in localStorage
- Run without an account, backend, cloud database, AI API, or external TTS API

## Install and run

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npm run build
```

## Creating and importing a pack

Select **Copy AI prompt** in the import panel and include the copied format instructions in your request to ChatGPT, Claude, Gemini, or another AI. The prompt defines only the required format; the subject, languages, and phrase count come from your own request.

Paste the returned JSON into PhraseRecall and select **Import pasted JSON**.

### PhraseRecall input schema version 1

```json
{
  "schemaVersion": 1,
  "name": "Everyday French",
  "source": "Lesson notes",
  "languages": {
    "cue": "en",
    "answer": "fr"
  },
  "phrases": [
    {
      "cue": "Do you know him?",
      "answer": "Tu le connais ?"
    }
  ]
}
```

`name`, `source`, language identifiers, and at least one phrase are included in the preferred schema. `source` may be empty. PhraseRecall generates internal pack and phrase IDs; imported JSON does not need IDs or timestamps. Language identifiers are stored as strings and are not restricted to a fixed list.

Legacy JSON arrays remain supported:

```json
[
  {
    "cue": "Do you know him?",
    "answer": "Tu le connais ?"
  }
]
```

Enter a pack name when importing a legacy array or CSV file. CSV files require `cue` and `answer` columns.

## Practice and measurement

Recall timing starts when a cue becomes visible and stops on the first answer reveal. Audio playback and time spent choosing a rating are not included in `cueToRevealMs`.

Ratings update the simple current status as follows:

- **Again** and **Hard** → difficult
- **Good** and **Easy** → learned

At the end of a round, phrases rated Again or Hard can be retried in another round inside the same study session. Each attempt remains a separate immutable review event, so improvement across rounds is preserved.

Keyboard shortcuts:

- Space or Enter: reveal the answer
- 1: Again
- 2: Hard
- 3: Good
- 4: Easy
- R: replay answer audio

Automatic answer pronunciation is enabled by default and can be turned off during practice. Speech is generated entirely by the browser. Voice availability, pronunciation quality, and supported languages depend on the user's browser and operating system.

## Session results and AI reports

Finishing a session shows counts by rating, unique phrases studied, total attempts, rounds, average cue-to-reveal time, and phrases whose latest session rating is Again or Hard.

**Copy AI report** copies versioned JSON containing:

- session and pack metadata
- source and language identifiers
- summary statistics
- cue and answer text
- every individual review with its round, rating, timestamp, and recall timing

**Download JSON** saves the equivalent report locally. The report can be given back to an AI for analysis, progress tracking, or generation of future study material. PhraseRecall itself does not call an AI API.

## Data and privacy

All application data stays in the current browser's localStorage. PhraseRecall has no login, backend, analytics service, or cloud database. Clearing site data removes locally stored packs, progress, sessions, reviews, and preferences.

Existing packs and legacy `got-it` progress from earlier versions are normalized safely when loaded.

## Project structure

```text
src/
  components/    Pack, import, practice, and session-results UI
  data/          Built-in sample pack
  utils/         Import, persistence, speech, and report helpers
  App.tsx        Application state and screen routing
  types.ts       Shared TypeScript types
```

## Deliberate limits

PhraseRecall does not currently implement spaced repetition scheduling, speech recognition, accounts, cloud sync, or a full historical-session browser. Completed sessions and review events remain stored locally for future extensions.

## Pronunciation

PhraseRecall uses the browser's built-in Speech Synthesis API for answer pronunciation.

Voice quality and available languages depend on the browser and operating system.

If no suitable voice is installed or exposed by the browser, pronunciation
quality may be reduced.
