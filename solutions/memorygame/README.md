# Chapter Zero Memory Game

A standalone sci-fi novel character matching game. It runs in the browser without a backend or runtime dependencies.

## Run

No `npm install` is needed; the server uses Node's built-in modules only. From this directory, run:

```sh
npm run dev
```

Open [http://localhost:4175](http://localhost:4175). Set `PORT` to use a different port. You can also open `public/index.html` directly in a browser.

Choose a 4×4, 6×6, or 8×8 board and play solo or with two players. Match pairs of characters from a curated mix of science-fiction novels. Matches score a point; in two-player mode, a missed pair passes the turn. The game tracks elapsed time, attempts, and found pairs, and offers a fresh shuffle when restarted.

The character names and novel titles identify the literary roster. Card symbols and visual design are original and do not use book-cover artwork.

## Test

Node.js 18 or newer is required to run the game-engine tests:

```sh
npm test
```
