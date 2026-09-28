const assert = require('node:assert/strict');
const test = require('node:test');
const { filterMessages } = require('../public/message-search');

const messages = [
  { username: 'Morgan Lee', text: 'The launch is Friday.' },
  { username: 'Riley', text: 'I will bring coffee.' },
  { username: 'Morgan Lee', text: 'Coffee sounds good.' },
];

test('searches message text without case sensitivity', () => {
  assert.deepEqual(filterMessages(messages, 'FRIDAY'), [messages[0]]);
});

test('searches sender names as well as message text', () => {
  assert.deepEqual(filterMessages(messages, 'morgan'), [messages[0], messages[2]]);
});

test('returns all messages for an empty query', () => {
  assert.deepEqual(filterMessages(messages, '  '), messages);
});