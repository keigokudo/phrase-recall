# PhraseRecall

PhraseRecall is a small, local-first language-learning web app for practicing useful phrases through active recall. It is designed around a simple loop: read a cue, try to recall the target phrase, reveal the answer, then rate how well you remembered it.

## Why it exists

Phrase lists are easy to collect and easy to reread, but rereading does not force retrieval. PhraseRecall keeps the interface intentionally small so learners can spend their attention on recall rather than managing a study system.

## Features

- Built-in sample French phrase pack with original generic phrases
- Import custom phrase packs from JSON or CSV
- Practice cue-first, then reveal the answer
- Rate each phrase as **Again**, **Hard**, or **Got it**
- Track new, difficult, and learned phrases in localStorage
- See simple learned progress for each pack
- Practice difficult phrases only
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

Enter a pack name in the import form, then select either a `.json` or `.csv` file.

### JSON

```json
[
  {
    "cue": "What are you doing tonight?",
    "answer": "Qu'est-ce que vous allez faire ce soir ?"
  }
]
```

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

PhraseRecall deliberately avoids a complex scheduling algorithm. A rating currently maps a phrase to either `difficult` or `learned`, while untouched phrases remain `new`.
