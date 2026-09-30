# PhraseRecall

PhraseRecall is a small, local-first language-learning web app for practicing useful phrases through active recall. It is designed around a simple loop: read a cue, try to recall the target phrase, reveal the answer, then rate how well you remembered it.

## Why it exists

Phrase lists are easy to collect and easy to reread, but rereading does not force retrieval. PhraseRecall keeps the interface intentionally small so learners can spend their attention on recall rather than managing a study system.

## Features

- Built-in sample French phrase pack with original generic phrases
- Paste AI-generated PhraseRecall JSON directly into the app
- Import custom phrase packs from JSON or CSV files
- Practice cue-first, then reveal the answer
- Rate each phrase as **Again**, **Hard**, **Good**, or **Easy**
- Track new, difficult, and learned phrases in localStorage
- See simple learned progress for each pack
- Practice difficult phrases only
- Retry difficult phrases in additional rounds while preserving every review attempt
- Measure cue-to-reveal recall time for each review
- Automatically pronounce answers with the browser's speech synthesis
- Use keyboard shortcuts for revealing, rating, and replaying audio
- Responsive, keyboard-accessible interface
- No account, backend, database, or external API

## Tech stack

- React
- TypeScript
- Vite
- CSS
- localStorage

## Install and run

```bash
npm install
npm run dev
```

To create a production build:

```bash
npm run build
```

## Import format

Paste a PhraseRecall JSON object directly into the import form. The app generates internal pack and phrase IDs, so imported data does not need IDs or timestamps.

### JSON

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
      "cue": "What are you doing tonight?",
      "answer": "Qu'est-ce que vous allez faire ce soir ?"
    }
  ]
}
```

The previous JSON array format remains supported. Enter a pack name in the form when importing a legacy array. JSON files also support both formats.

### CSV

```csv
cue,answer
What are you doing tonight?,Qu'est-ce que vous allez faire ce soir ?
```

Both `cue` and `answer` are required and must be non-empty. Imported packs and study progress are stored in the current browser's localStorage.

## Project structure

```text
src/
  components/    UI for pack cards, importing, and practice
  data/          Built-in sample pack
  utils/         Import parsing and localStorage helpers
  App.tsx        Application state and screen routing
  types.ts       Shared TypeScript types
```

## Future ideas

Potential extensions, not implemented in the current MVP:

- Spaced repetition
- Audio playback
- Speech recognition
- PWA/offline installation support
- Additional built-in language packs
- Export and backup of local progress

## Notes

PhraseRecall deliberately avoids a complex scheduling algorithm. **Again** and **Hard** map a phrase to `difficult`; **Good** and **Easy** map it to `learned`, while untouched phrases remain `new`. Study sessions, immutable review events, progress, and the auto-pronunciation preference are stored locally in the browser.
