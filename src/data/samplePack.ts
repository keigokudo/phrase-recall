import type { PhrasePack } from '../types'

export const samplePack: PhrasePack = {
  id: 'sample-french-basics',
  name: 'French Everyday Basics',
  builtIn: true,
  phrases: [
    { id: 'sample-1', cue: 'What are you doing tonight?', answer: "Qu'est-ce que vous allez faire ce soir ?" },
    { id: 'sample-2', cue: 'I would like a coffee, please.', answer: "Je voudrais un café, s'il vous plaît." },
    { id: 'sample-3', cue: 'We have been here for a week.', answer: 'Nous sommes ici depuis une semaine.' },
    { id: 'sample-4', cue: 'Do you have time tomorrow?', answer: 'Est-ce que vous avez le temps demain ?' },
    { id: 'sample-5', cue: 'I am going to buy something to drink.', answer: "Je vais acheter quelque chose à boire." },
    { id: 'sample-6', cue: 'We do not want to leave tonight.', answer: 'Nous ne voulons pas partir ce soir.' },
  ],
}
