# Real-Time Chat

A browser chat built with JavaScript, Node.js, Express, and Socket.IO. It supports live messages, online presence, searchable room history, optional photo sharing, and message history that survives server restarts. Light and dark themes are available, and the selected theme is remembered in the browser.

## Requirements

- Node.js 18 or newer
- npm

## Run

From this directory:

```sh
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in two browser tabs to try a conversation. Enter a display name in each tab. Set `PORT` to use a different port.

## Test

```sh
npm test
```

Tests use Node's built-in test runner and exercise message delivery between clients, validation, history persistence, search, and the health endpoint. Search the room's recent messages and sender names with the Search button or the `/` shortcut.

Messages are stored in `data/messages.json`, which is created on first use and intentionally ignored by Git. The display name is stored in the browser so it is restored on the next visit.