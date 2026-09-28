function filterMessages(messages, query) {
  const term = query.trim().toLowerCase();
  if (!term) return messages;

  return messages.filter((message) => `${message.username} ${message.text || ''}`
    .toLowerCase()
    .includes(term));
}

if (typeof module === 'object' && module.exports) {
  module.exports = { filterMessages };
} else {
  window.CommonroomSearch = { filterMessages };
}