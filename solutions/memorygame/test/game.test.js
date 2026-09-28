const assert = require('node:assert/strict');
const test = require('node:test');
const { createDeck, createGame, flipCard, resolveMismatch } = require('../public/game');

const characters = [
  { name: 'Paul Atreides', book: 'Dune', symbol: '◈' },
  { name: 'Chani', book: 'Dune', symbol: '✦' },
  { name: 'Hari Seldon', book: 'Foundation', symbol: '⌘' },
];

function orderedDeck(count) {
  return createDeck(characters, count, () => 0.999999);
}

test('creates a shuffled deck with exactly two cards per selected character', () => {
  const deck = createDeck(characters, 3, () => 0.4);
  const counts = new Map();
  for (const card of deck) counts.set(card.pairId, (counts.get(card.pairId) || 0) + 1);

  assert.equal(deck.length, 6);
  assert.equal(new Set(deck.map((card) => card.id)).size, 6);
  assert.deepEqual([...counts.values()], [2, 2, 2]);
  assert.throws(() => createDeck(characters, 4), /Not enough characters/);
});

test('keeps a matched pair visible, awards the current player, and detects a win', () => {
  const game = createGame(orderedDeck(1), 2);
  let state = flipCard(game, game.deck[0].id);
  state = flipCard(state, game.deck[1].id);

  assert.equal(state.moves, 1);
  assert.equal(state.scores[1], 1);
  assert.equal(state.currentPlayer, 1);
  assert.equal(state.matched.length, 2);
  assert.equal(state.completed, true);
  assert.equal(state.locked, false);
});

test('locks the board during a mismatch and switches player after it resolves', () => {
  const game = createGame(orderedDeck(3), 2);
  let state = flipCard(game, game.deck[0].id);
  state = flipCard(state, game.deck[2].id);

  assert.equal(state.moves, 1);
  assert.equal(state.locked, true);
  assert.equal(flipCard(state, game.deck[4].id), state);

  state = resolveMismatch(state);
  assert.deepEqual(state.revealed, []);
  assert.equal(state.locked, false);
  assert.equal(state.currentPlayer, 2);
});

test('does not permit a matched card to be flipped again', () => {
  const game = createGame(orderedDeck(2), 1);
  let state = flipCard(game, game.deck[0].id);
  state = flipCard(state, game.deck[1].id);
  assert.equal(flipCard(state, game.deck[0].id), state);
});
