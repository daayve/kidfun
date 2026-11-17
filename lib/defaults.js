// Starting content for each kid. Once the database is connected, edits made
// on the /parent page are what the games use. These are only the first seed.

export const GAMES = {
  typing: { name: 'Word Rain', emoji: '⌨️', blurb: 'Type the words before they land' },
  math: { name: 'Math Race', emoji: '🏎️', blurb: 'Answer fast to win the race' },
  words: { name: 'Listen Up', emoji: '🔊', blurb: 'Hear the word, then find it or spell it' },
};

export const DEFAULT_KIDS = [
  {
    id: 'lucas',
    name: 'Lucas',
    grade: '3rd grade',
    emoji: '🦖',
    color: '#2f80ed',
    coins: 0,
    levels: { typing: 3, math: 1, words: 1 },
    games: { typing: true, math: true, words: true },
    config: {
      words: [
        'because', 'friend', 'different', 'through', 'thought', 'enough',
        'favorite', 'people', 'again', 'beautiful', 'caught', 'question',
        'answer', 'special', 'surprise', 'weather', 'piece', 'remember',
        'important', 'together', 'minute', 'sentence', 'straight', 'believe',
        'country',
      ],
      wordsMode: 'spell',
      math: { add: true, sub: true, mul: true, addMax: 100, tables: [2, 5, 10, 3, 4, 6, 7, 8, 9] },
    },
  },
  {
    id: 'parker',
    name: 'Parker',
    grade: '1st grade',
    emoji: '🚀',
    color: '#27ae60',
    coins: 0,
    levels: { typing: 1, math: 1, words: 1 },
    games: { typing: true, math: true, words: true },
    config: {
      words: [
        'the', 'and', 'was', 'you', 'they', 'said', 'have', 'like', 'what',
        'when', 'with', 'from', 'come', 'some', 'were', 'there', 'this',
        'that', 'here', 'play', 'look', 'went', 'jump', 'good', 'make',
        'little',
      ],
      wordsMode: 'pick',
      math: { add: true, sub: true, mul: false, addMax: 20, tables: [2, 5, 10] },
    },
  },
];

export const DEFAULT_REWARDS = [
  { name: 'Choose dessert', cost: 75 },
  { name: '30 extra minutes of screen time', cost: 100 },
  { name: 'Pick the movie for movie night', cost: 150 },
];
