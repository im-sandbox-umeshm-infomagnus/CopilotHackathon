const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const http = require('node:http');
const { Server } = require('socket.io');

const MAX_MESSAGES = 150;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_USERNAME_LENGTH = 32;
const IMAGE_HOSTS = new Set(['picsum.photos']);

function readHistory(historyFile) {
  try {
    const saved = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    return Array.isArray(saved) ? saved.slice(-MAX_MESSAGES) : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function createChatServer({ historyFile = path.join(__dirname, 'data', 'messages.json') } = {}) {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer);
  const history = readHistory(historyFile);
  const onlineUsers = new Map();
  let writeQueue = Promise.resolve();

  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/health', (_request, response) => response.json({ status: 'ok' }));

  function persistHistory() {
    const serialized = JSON.stringify(history, null, 2);
    const temporaryFile = `${historyFile}.tmp`;
    writeQueue = writeQueue.then(async () => {
      await fs.promises.mkdir(path.dirname(historyFile), { recursive: true });
      await fs.promises.writeFile(temporaryFile, serialized, 'utf8');
      await fs.promises.rename(temporaryFile, historyFile);
    });
    return writeQueue;
  }

  function presenceSnapshot() {
    return [...onlineUsers.values()].map((username) => ({
      username,
      initials: username
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join(''),
    }));
  }

  io.use((socket, next) => {
    const rawName = socket.handshake.auth?.username;
    const username = typeof rawName === 'string' ? rawName.trim().replace(/\s+/g, ' ') : '';
    if (!username || username.length > MAX_USERNAME_LENGTH) {
      next(new Error(`Choose a display name between 1 and ${MAX_USERNAME_LENGTH} characters.`));
      return;
    }
    socket.data.username = username;
    next();
  });

  io.on('connection', (socket) => {
    const username = socket.data.username;
    onlineUsers.set(socket.id, username);
    socket.emit('chat:history', history);
    io.emit('presence:update', presenceSnapshot());

    socket.on('message:send', (payload, acknowledge) => {
      const reply = typeof acknowledge === 'function' ? acknowledge : () => {};
      if (!payload || typeof payload !== 'object') {
        reply({ ok: false, error: 'Message is invalid.' });
        return;
      }

      const type = payload.type === 'image' ? 'image' : 'text';
      const text = typeof payload.text === 'string' ? payload.text.trim() : '';
      let imageUrl;

      if (type === 'image') {
        try {
          const candidate = new URL(payload.imageUrl);
          if (candidate.protocol !== 'https:' || !IMAGE_HOSTS.has(candidate.hostname)) {
            throw new Error('Image URL is not allowed.');
          }
          imageUrl = candidate.toString();
        } catch {
          reply({ ok: false, error: 'Choose an image from the photo picker.' });
          return;
        }
      } else if (!text || text.length > MAX_MESSAGE_LENGTH) {
        reply({ ok: false, error: `Messages must contain 1-${MAX_MESSAGE_LENGTH} characters.` });
        return;
      }

      if (text.length > MAX_MESSAGE_LENGTH) {
        reply({ ok: false, error: `Captions must be no longer than ${MAX_MESSAGE_LENGTH} characters.` });
        return;
      }

      const message = {
        id: crypto.randomUUID(),
        type,
        text,
        imageUrl,
        username,
        createdAt: new Date().toISOString(),
      };
      history.push(message);
      if (history.length > MAX_MESSAGES) history.shift();

      io.emit('message:new', message);
      persistHistory().catch((error) => console.error('Could not save chat history:', error));
      reply({ ok: true, message });
    });

    socket.on('typing:update', (isTyping) => {
      socket.broadcast.emit('typing:update', {
        username,
        isTyping: Boolean(isTyping),
      });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      io.emit('presence:update', presenceSnapshot());
    });
  });

  return {
    app,
    httpServer,
    io,
    flushHistory: () => writeQueue,
    close: () => new Promise((resolve) => io.close(resolve)),
  };
}

if (require.main === module) {
  const chat = createChatServer();
  const port = Number(process.env.PORT || 3000);
  chat.httpServer.listen(port, () => {
    console.log(`Chat is ready at http://localhost:${port}`);
  });
}

module.exports = { createChatServer };