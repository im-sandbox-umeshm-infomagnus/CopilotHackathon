const assert = require('node:assert/strict');
const test = require('node:test');
const { createDevServer } = require('../server');

async function startServer(t) {
  const server = createDevServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test('serves the game page and scripts without installed dependencies', async (t) => {
  const baseUrl = await startServer(t);
  const page = await fetch(`${baseUrl}/`);
  const script = await fetch(`${baseUrl}/game.js`);

  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/);
  assert.match(await page.text(), /The character/);
  assert.equal(script.status, 200);
  assert.match(script.headers.get('content-type'), /javascript/);
});

test('returns not found for missing assets', async (t) => {
  const baseUrl = await startServer(t);
  const response = await fetch(`${baseUrl}/missing.js`);

  assert.equal(response.status, 404);
});
