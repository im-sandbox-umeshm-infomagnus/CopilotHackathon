const socket = io({ autoConnect: false });
const loginScreen = document.querySelector('#login-screen');
const loginForm = document.querySelector('#login-form');
const displayNameInput = document.querySelector('#display-name');
const loginError = document.querySelector('#login-error');
const messageForm = document.querySelector('#message-form');
const messageInput = document.querySelector('#message-input');
const sendButton = document.querySelector('#send-button');
const photoButton = document.querySelector('#photo-button');
const feed = document.querySelector('#feed');
const welcomeNote = document.querySelector('#welcome-note');
const peopleList = document.querySelector('#people-list');
const onlineCount = document.querySelector('#online-count');
const connectionDot = document.querySelector('#connection-dot');
const connectionLabel = document.querySelector('#connection-label');
const typingNote = document.querySelector('#typing-note');
const notice = document.querySelector('#notice');
const searchToggle = document.querySelector('#search-toggle');
const searchPanel = document.querySelector('#search-panel');
const searchInput = document.querySelector('#message-search');
const searchCount = document.querySelector('#search-count');
const clearSearch = document.querySelector('#clear-search');
const themeToggle = document.querySelector('#theme-toggle');
let currentName = '';
let typingTimer;
let noticeTimer;
let messageHistory = [];
const activeTypers = new Set();

function initialsFor(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}

function showNotice(message) {
  notice.textContent = message;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice.textContent = ''; }, 3500);
}

function applyTheme(theme, persist = true) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  themeToggle.setAttribute('aria-checked', String(isDark));
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#151d19' : '#f4f5f1';
  if (persist) localStorage.setItem('commonroom.theme', isDark ? 'dark' : 'light');
}

function setConnected(connected) {
  connectionDot.classList.toggle('is-online', connected);
  connectionDot.classList.toggle('is-offline', !connected);
  connectionLabel.textContent = connected ? 'Connected to The Commons' : 'Reconnecting…';
  messageInput.disabled = !connected;
  sendButton.disabled = !connected;
  photoButton.disabled = !connected;
}

function connectAs(name) {
  currentName = name.trim().replace(/\s+/g, ' ');
  socket.auth = { username: currentName };
  socket.connect();
  loginScreen.hidden = true;
  messageInput.focus();
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

function makeAvatar(name) {
  const avatar = document.createElement('span');
  avatar.className = 'avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = initialsFor(name);
  return avatar;
}

function renderMessage(message) {
  const isMine = message.username === currentName;
  const row = document.createElement('article');
  row.className = `message-row${isMine ? ' is-mine' : ''}`;
  row.setAttribute('aria-label', `${message.username} at ${formatTime(message.createdAt)}`);
  row.append(makeAvatar(message.username));

  const content = document.createElement('div');
  content.className = 'message-content';
  const meta = document.createElement('div');
  meta.className = 'message-meta';
  const author = document.createElement('span');
  author.className = 'message-author';
  author.textContent = isMine ? 'You' : message.username;
  const time = document.createElement('time');
  time.className = 'message-time';
  time.dateTime = message.createdAt;
  time.textContent = formatTime(message.createdAt);
  meta.append(author, time);
  content.append(meta);

  if (message.text) {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = message.text;
    content.append(bubble);
  }

  if (message.type === 'image' && message.imageUrl) {
    const image = document.createElement('img');
    image.className = 'message-photo';
    image.src = message.imageUrl;
    image.alt = message.text || `Photo shared by ${message.username}`;
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    content.append(image);
  }

  row.append(content);
  feed.append(row);
}

function renderHistory(messages) {
  messageHistory = Array.isArray(messages) ? messages.slice(-150) : [];
  renderMessages();
}

function renderMessages() {
  feed.querySelectorAll('.message-row, .search-empty').forEach((message) => message.remove());
  const query = searchInput.value.trim();
  const matches = window.CommonroomSearch.filterMessages(messageHistory, query);
  welcomeNote.hidden = messageHistory.length > 0 || Boolean(query);

  if (query) {
    const matchLabel = matches.length === 1 ? 'match' : 'matches';
    searchCount.textContent = `${matches.length} ${matchLabel} · ${messageHistory.length} messages`;
    if (matches.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'search-empty';
      empty.textContent = `No messages match “${query}”.`;
      feed.append(empty);
    }
  } else {
    searchCount.textContent = '';
  }

  matches.forEach(renderMessage);
  feed.scrollTop = query ? 0 : feed.scrollHeight;
}

function receiveMessage(message) {
  messageHistory.push(message);
  if (messageHistory.length > 150) messageHistory.shift();
  renderMessages();
}

function openSearch() {
  searchPanel.hidden = false;
  searchToggle.setAttribute('aria-expanded', 'true');
  searchInput.focus();
}

function closeSearch() {
  searchPanel.hidden = true;
  searchToggle.setAttribute('aria-expanded', 'false');
  searchInput.value = '';
  renderMessages();
}

function renderPeople(people) {
  peopleList.replaceChildren();
  onlineCount.textContent = String(people.length);
  for (const person of people) {
    const item = document.createElement('li');
    item.className = 'person';
    const avatar = makeAvatar(person.username);
    const name = document.createElement('span');
    name.className = 'person-name';
    name.textContent = person.username === currentName ? `${person.username} (you)` : person.username;
    item.append(avatar, name);
    peopleList.append(item);
  }
}

function renderTyping() {
  const names = [...activeTypers];
  if (!names.length) {
    typingNote.textContent = '';
  } else if (names.length === 1) {
    typingNote.textContent = `${names[0]} is typing…`;
  } else {
    typingNote.textContent = 'A few people are typing…';
  }
}

function sendMessage(payload) {
  socket.timeout(5000).emit('message:send', payload, (error, result) => {
    if (error) {
      showNotice('The message did not reach the room. Try again.');
      return;
    }
    if (!result?.ok) showNotice(result?.error || 'That message could not be sent.');
  });
}

socket.on('connect', () => setConnected(true));
socket.on('disconnect', () => setConnected(false));
socket.on('connect_error', (error) => {
  setConnected(false);
  showNotice(error.message || 'Could not connect to the room.');
});
socket.on('chat:history', renderHistory);
socket.on('message:new', receiveMessage);
socket.on('presence:update', renderPeople);
socket.on('typing:update', ({ username, isTyping }) => {
  if (username === currentName) return;
  if (isTyping) activeTypers.add(username);
  else activeTypers.delete(username);
  renderTyping();
});

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = displayNameInput.value.trim().replace(/\s+/g, ' ');
  if (!name || name.length > 32) {
    loginError.textContent = 'Use a display name between 1 and 32 characters.';
    return;
  }
  localStorage.setItem('commonroom.displayName', name);
  loginError.textContent = '';
  connectAs(name);
});

messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 130)}px`;
  socket.emit('typing:update', true);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => socket.emit('typing:update', false), 1200);
});

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !socket.connected) return;
  sendMessage({ type: 'text', text });
  messageInput.value = '';
  messageInput.style.height = 'auto';
  socket.emit('typing:update', false);
});

messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    messageForm.requestSubmit();
  }
});

photoButton.addEventListener('click', async () => {
  if (!socket.connected) return;
  photoButton.disabled = true;
  photoButton.textContent = 'Finding a photo…';
  try {
    const response = await fetch('https://picsum.photos/v2/list?page=2&limit=100');
    if (!response.ok) throw new Error('Photo list unavailable.');
    const photos = await response.json();
    const photo = photos[Math.floor(Math.random() * photos.length)];
    if (!photo?.id) throw new Error('No photo available.');
    const imageUrl = `https://picsum.photos/id/${encodeURIComponent(photo.id)}/900/560`;
    const caption = messageInput.value.trim();
    sendMessage({ type: 'image', imageUrl, text: caption });
    messageInput.value = '';
    messageInput.style.height = 'auto';
  } catch {
    showNotice('Could not load a photo. Check your connection and try again.');
  } finally {
    photoButton.innerHTML = '<span aria-hidden="true">＋</span> Photo';
    photoButton.disabled = !socket.connected;
  }
});

document.querySelector('#change-name').addEventListener('click', () => {
  localStorage.removeItem('commonroom.displayName');
  socket.disconnect();
  displayNameInput.value = '';
  loginScreen.hidden = false;
  displayNameInput.focus();
});

document.querySelector('#share-room').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    showNotice('Room link copied. Send it to a friend.');
  } catch {
    showNotice('Copy the room URL from your browser to invite someone.');
  }
});

searchToggle.addEventListener('click', () => {
  if (searchPanel.hidden) openSearch();
  else closeSearch();
});

themeToggle.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});

searchInput.addEventListener('input', renderMessages);

clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  renderMessages();
  searchInput.focus();
});

document.addEventListener('keydown', (event) => {
  const activeElement = document.activeElement;
  const isEditing = activeElement instanceof HTMLElement
    && (activeElement.isContentEditable || ['INPUT', 'TEXTAREA'].includes(activeElement.tagName));

  if (event.key === '/' && !isEditing && loginScreen.hidden && searchPanel.hidden) {
    event.preventDefault();
    openSearch();
  } else if (event.key === 'Escape' && !searchPanel.hidden) {
    closeSearch();
    searchToggle.focus();
  }
});

const savedName = localStorage.getItem('commonroom.displayName');
applyTheme(localStorage.getItem('commonroom.theme') === 'dark' ? 'dark' : 'light', false);
if (savedName) {
  connectAs(savedName);
} else {
  loginScreen.hidden = false;
  setConnected(false);
  requestAnimationFrame(() => displayNameInput.focus());
}