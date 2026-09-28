(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MemoryGame = api;
})(globalThis, function () {
  function createDeck(characters, pairCount, random = Math.random) {
    if (!Number.isInteger(pairCount) || pairCount < 1) {
      throw new RangeError('Pair count must be a positive integer.');
    }
    if (!Array.isArray(characters) || characters.length < pairCount) {
      throw new RangeError('Not enough characters for this board size.');
    }

    const deck = characters.slice(0, pairCount).flatMap((character, pairIndex) => (
      [0, 1].map((copyIndex) => ({
        ...character,
        id: `${pairIndex}-${copyIndex}`,
        pairId: pairIndex,
      }))
    ));

    for (let index = deck.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
    }
    return deck;
  }

  function createGame(deck, playerCount = 1) {
    if (!Array.isArray(deck) || deck.length < 2 || deck.length % 2 !== 0) {
      throw new TypeError('A game deck must contain an even number of cards.');
    }
    if (playerCount !== 1 && playerCount !== 2) {
      throw new RangeError('A game must have one or two players.');
    }

    return {
      deck,
      playerCount,
      currentPlayer: 1,
      scores: { 1: 0, 2: 0 },
      moves: 0,
      revealed: [],
      matched: [],
      locked: false,
      completed: false,
    };
  }

  function flipCard(state, cardId) {
    if (state.locked || state.completed || state.revealed.length >= 2
      || state.revealed.includes(cardId) || state.matched.includes(cardId)) return state;
    if (!state.deck.some((card) => card.id === cardId)) return state;

    const revealed = [...state.revealed, cardId];
    if (revealed.length === 1) return { ...state, revealed };

    const firstCard = state.deck.find((card) => card.id === revealed[0]);
    const secondCard = state.deck.find((card) => card.id === revealed[1]);
    const moves = state.moves + 1;
    if (firstCard.pairId !== secondCard.pairId) {
      return { ...state, revealed, moves, locked: true };
    }

    const matched = [...state.matched, ...revealed];
    return {
      ...state,
      revealed: [],
      matched,
      moves,
      scores: { ...state.scores, [state.currentPlayer]: state.scores[state.currentPlayer] + 1 },
      completed: matched.length === state.deck.length,
    };
  }

  function resolveMismatch(state) {
    if (!state.locked) return state;
    return {
      ...state,
      revealed: [],
      locked: false,
      currentPlayer: state.playerCount === 2 ? (state.currentPlayer === 1 ? 2 : 1) : 1,
    };
  }

  return { createDeck, createGame, flipCard, resolveMismatch };
});
