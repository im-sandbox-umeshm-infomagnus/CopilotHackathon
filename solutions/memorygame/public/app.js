(() => {
  const characters = [
    { name: 'Paul Atreides', book: 'Dune', symbol: '♜' },
    { name: 'Chani', book: 'Dune', symbol: '☾' },
    { name: 'Lady Jessica', book: 'Dune', symbol: '✧' },
    { name: 'Duncan Idaho', book: 'Dune', symbol: '⚔' },
    { name: 'Stilgar', book: 'Dune', symbol: '⌖' },
    { name: 'Gurney Halleck', book: 'Dune', symbol: '♫' },
    { name: 'Liet-Kynes', book: 'Dune', symbol: '⌁' },
    { name: 'Feyd-Rautha', book: 'Dune', symbol: '♢' },
    { name: 'Hari Seldon', book: 'Foundation', symbol: '⟐' },
    { name: 'Gaal Dornick', book: 'Foundation', symbol: '〰' },
    { name: 'Salvor Hardin', book: 'Foundation', symbol: '⚑' },
    { name: 'Hober Mallow', book: 'Foundation', symbol: '◉' },
    { name: 'Bayta Darell', book: 'Foundation', symbol: '❖' },
    { name: 'Arkady Darell', book: 'Foundation', symbol: '▤' },
    { name: 'Demerzel', book: 'Foundation', symbol: '⌬' },
    { name: 'R. Daneel Olivaw', book: 'Foundation', symbol: '⟁' },
    { name: 'Ender Wiggin', book: "Ender's Game", symbol: '⊕' },
    { name: 'Valentine Wiggin', book: "Ender's Game", symbol: '♡' },
    { name: 'Peter Wiggin', book: "Ender's Game", symbol: '♛' },
    { name: 'Bean', book: "Ender's Game", symbol: '⦿' },
    { name: 'Mazer Rackham', book: "Ender's Game", symbol: '✣' },
    { name: 'Genly Ai', book: 'The Left Hand of Darkness', symbol: '❄' },
    { name: 'Estraven', book: 'The Left Hand of Darkness', symbol: '◌' },
    { name: 'The Time Traveller', book: 'The Time Machine', symbol: '⧖' },
    { name: 'Weena', book: 'The Time Machine', symbol: '❀' },
    { name: 'Captain Nemo', book: 'Twenty Thousand Leagues', symbol: '⚓' },
    { name: 'Professor Aronnax', book: 'Twenty Thousand Leagues', symbol: '⌕' },
    { name: 'Conseil', book: 'Twenty Thousand Leagues', symbol: '⚗' },
    { name: 'Arthur Dent', book: "The Hitchhiker's Guide", symbol: '☂' },
    { name: 'Ford Prefect', book: "The Hitchhiker's Guide", symbol: '⌘' },
    { name: 'Trillian', book: "The Hitchhiker's Guide", symbol: '⊹' },
    { name: 'Zaphod Beeblebrox', book: "The Hitchhiker's Guide", symbol: '☄' },
  ];

  const board = document.querySelector('[data-board]');
  const boardViewport = document.querySelector('[data-board-viewport]');
  const finishDialog = document.querySelector('[data-finish-dialog]');
  const message = document.querySelector('[data-message]');
  const timerLabel = document.querySelector('[data-timer]');
  const moveLabel = document.querySelector('[data-moves]');
  const pairLabel = document.querySelector('[data-pairs]');
  const pairTotal = document.querySelector('[data-pair-total]');
  const turn = document.querySelector('[data-turn]');
  const sizeButtons = [...document.querySelectorAll('[data-pairs]')];
  const playerButtons = [...document.querySelectorAll('[data-player-count]')];
  let pairCount = 18;
  let playerCount = 1;
  let game;
  let timerId;
  let mismatchTimeout;
  let startedAt;

  function elapsedSeconds() {
    return startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainder = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainder}`;
  }

  function startTimer() {
    if (startedAt) return;
    startedAt = Date.now();
    timerId = window.setInterval(() => {
      timerLabel.textContent = formatTime(elapsedSeconds());
    }, 1000);
  }

  function stopTimer() {
    window.clearInterval(timerId);
    timerId = undefined;
  }

  function isFaceUp(card) {
    return game.revealed.includes(card.id) || game.matched.includes(card.id);
  }

  function makeCard(card, index) {
    const button = document.createElement('button');
    button.className = 'memory-card';
    button.type = 'button';
    button.dataset.cardId = card.id;
    button.dataset.faceUp = String(isFaceUp(card));
    button.dataset.matched = String(game.matched.includes(card.id));
    button.setAttribute('aria-label', isFaceUp(card)
      ? `${card.name}, ${card.book}${game.matched.includes(card.id) ? ', matched' : ''}`
      : `Card ${index + 1}, face down`);
    button.disabled = game.matched.includes(card.id) || game.locked || game.completed;

    const back = document.createElement('span');
    back.className = 'card-back';
    back.setAttribute('aria-hidden', 'true');
    const backMark = document.createElement('span');
    backMark.className = 'back-mark';
    backMark.textContent = '✳';
    const backIndex = document.createElement('span');
    backIndex.className = 'back-index';
    backIndex.textContent = String(index + 1).padStart(2, '0');
    back.append(backMark, backIndex);

    const face = document.createElement('span');
    face.className = 'card-face';
    face.setAttribute('aria-hidden', 'true');
    const symbol = document.createElement('span');
    symbol.className = 'card-symbol';
    symbol.textContent = card.symbol;
    const name = document.createElement('span');
    name.className = 'card-name';
    name.textContent = card.name;
    const book = document.createElement('span');
    book.className = 'card-book';
    book.textContent = card.book;
    face.append(symbol, name, book);
    button.append(back, face);
    button.addEventListener('click', () => selectCard(card.id));
    return button;
  }

  function renderBoard() {
    board.dataset.size = String(Math.sqrt(game.deck.length));
    board.replaceChildren(...game.deck.map(makeCard));
  }

  function updateScoreboard() {
    moveLabel.textContent = game.moves;
    pairLabel.textContent = game.matched.length / 2;
    pairTotal.textContent = pairCount;
    turn.dataset.player = String(game.currentPlayer);
    turn.lastElementChild.textContent = game.completed
      ? 'Archive complete'
      : `Player ${game.currentPlayer}'s turn`;

    for (let player = 1; player <= 2; player += 1) {
      const card = document.querySelector(`[data-player-card="${player}"]`);
      card.hidden = player > playerCount;
      card.classList.toggle('active-player', player === game.currentPlayer && !game.completed);
      document.querySelector(`[data-player-score="${player}"]`).textContent = game.scores[player];
      document.querySelector(`[data-player-caption="${player}"]`).textContent = player > playerCount
        ? 'NOT PLAYING'
        : player === game.currentPlayer && !game.completed ? 'ON THE MOVE' : 'STANDING BY';
    }
  }

  function finishGame() {
    stopTimer();
    const title = document.querySelector('[data-finish-title]');
    const copy = document.querySelector('[data-finish-copy]');
    if (playerCount === 1) {
      title.textContent = 'Archive complete.';
      copy.textContent = `${game.moves} attempts · ${formatTime(elapsedSeconds())} · ${pairCount} pairs found.`;
    } else {
      const firstScore = game.scores[1];
      const secondScore = game.scores[2];
      title.textContent = firstScore === secondScore
        ? 'A perfect draw.'
        : `Player ${firstScore > secondScore ? '1' : '2'} wins.`;
      copy.textContent = `Player 1: ${firstScore} pairs · Player 2: ${secondScore} pairs · ${game.moves} attempts.`;
    }
    if (typeof finishDialog.showModal === 'function') finishDialog.showModal();
  }

  function selectCard(cardId) {
    if (game.completed || game.locked || game.revealed.includes(cardId) || game.matched.includes(cardId)) return;
    startTimer();
    const previousMatchedCount = game.matched.length;
    game = MemoryGame.flipCard(game, cardId);
    renderBoard();
    updateScoreboard();

    if (game.matched.length > previousMatchedCount) {
      message.textContent = game.completed ? 'Every character found.' : 'Pair found. Keep the turn.';
      if (game.completed) finishGame();
      return;
    }

    if (game.revealed.length === 1) {
      message.textContent = 'One card revealed. Find its match.';
      return;
    }

    if (game.locked) {
      message.textContent = 'No match. Passing the signal...';
      mismatchTimeout = window.setTimeout(() => {
        game = MemoryGame.resolveMismatch(game);
        renderBoard();
        updateScoreboard();
        message.textContent = `Player ${game.currentPlayer}, your move.`;
      }, 900);
    }
  }

  function startGame() {
    stopTimer();
    window.clearTimeout(mismatchTimeout);
    startedAt = undefined;
    timerLabel.textContent = '00:00';
    game = MemoryGame.createGame(MemoryGame.createDeck(characters, pairCount), playerCount);
    board.dataset.size = String(Math.sqrt(game.deck.length));
    board.setAttribute('aria-label', `${Math.sqrt(game.deck.length)} by ${Math.sqrt(game.deck.length)} memory game board`);
    document.querySelector('[data-board-label]').textContent = `${game.deck.length} RECORDS`;
    boardViewport.scrollLeft = 0;
    message.textContent = 'Find a pair. Stay curious.';
    renderBoard();
    updateScoreboard();
  }

  function setSelected(buttons, selectedButton) {
    for (const button of buttons) {
      const selected = button === selectedButton;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
  }

  for (const button of sizeButtons) {
    button.addEventListener('click', () => {
      pairCount = Number(button.dataset.pairs);
      setSelected(sizeButtons, button);
      startGame();
    });
  }

  for (const button of playerButtons) {
    button.addEventListener('click', () => {
      playerCount = Number(button.dataset.playerCount);
      setSelected(playerButtons, button);
      startGame();
    });
  }

  document.querySelectorAll('[data-restart]').forEach((button) => {
    button.addEventListener('click', () => {
      if (finishDialog.open) finishDialog.close();
      startGame();
    });
  });
  finishDialog.addEventListener('close', () => {
    if (finishDialog.returnValue === 'again') startGame();
  });

  startGame();
})();
