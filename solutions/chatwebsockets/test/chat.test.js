const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { io } = require('socket.io-client');
const { createChatServer } = require('../server');

async function startChat(t, options = {}) {
  const chat = createChatServer(options);
  await new Promise((resolve, reject) => {
    chat.httpServer.once('error', reject);
    chat.httpServer.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => chat.close());
  return {
    chat,
    url: `http://127.0.0.1:${chat.httpServer.address().port}`,
  };
}

async function connectClient(t, url, username) {
  const client = io(url, {
    auth: { username },
    autoConnect: false,
    reconnection: false,
  });
  const connected = new Promise((resolve, reject) => {
    client.once('connect', resolve);
    client.once('connect_error', reject);
  });
  const history = new Promise((resolve) => client.once('chat:history', resolve));
  client.connect();
  await connected;
  t.after(() => client.disconnect());
  return { client, history: await history };
}

test('delivers a message to other connected users', async (t) => {
  const { url } = await startChat(t);
  const { client: sender } = await connectClient(t, url, 'Morgan');
  const { client: receiver } = await connectClient(t, url, 'Riley');
  const incoming = new Promise((resolve) => receiver.once('message:new', resolve));

  const result = await sender.emitWithAck('message:send', { type: 'text', text: 'Hello, chat!' });
  const message = await incoming;

  assert.equal(result.ok, true);
  assert.equal(message.text, 'Hello, chat!');
  assert.equal(message.username, 'Morgan');
  assert.equal(message.id, result.message.id);
});

test('rejects blank messages and untrusted image URLs', async (t) => {
  const { url } = await startChat(t);
  const { client } = await connectClient(t, url, 'Casey');

  const blank = await client.emitWithAck('message:send', { type: 'text', text: '   ' });
  const image = await client.emitWithAck('message:send', {
    type: 'image',
    imageUrl: 'https://example.com/image.png',
  });

  assert.equal(blank.ok, false);
  assert.equal(image.ok, false);
});

test('restores saved messages after the server restarts', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-websockets-'));
  const historyFile = path.join(directory, 'messages.json');
  t.after(() => fs.rm(directory, { recursive: true, force: true }));

  const firstRun = await startChat(t, { historyFile });
  const { client } = await connectClient(t, firstRun.url, 'Jordan');
  await client.emitWithAck('message:send', { type: 'text', text: 'Keep this message.' });
  await firstRun.chat.flushHistory();
  await firstRun.chat.close();

  const secondRun = await startChat(t, { historyFile });
  const restored = await connectClient(t, secondRun.url, 'Jordan');

  assert.equal(restored.history.length, 1);
  assert.equal(restored.history[0].text, 'Keep this message.');
});

test('serves a healthy status endpoint', async (t) => {
  const { url } = await startChat(t);
  const response = await fetch(`${url}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});