import { API_URL, MESSAGES_PER_PAGE } from '../constants';

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  healthCheck() {
    return request('/health');
  },

  getMessages({ page = 1, limit = MESSAGES_PER_PAGE, recipient, username, groupId } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (recipient) params.set('recipient', recipient);
    if (username) params.set('username', username);
    if (groupId) params.set('groupId', groupId);
    return request(`/messages?${params}`);
  },

  sendMessage({ username, recipient, groupId, content, clientId }) {
    return request('/messages', {
      method: 'POST',
      body: JSON.stringify({ username, recipient, groupId, content, clientId }),
    });
  },

  getConversations(username) {
    return request(`/messages/conversations?username=${encodeURIComponent(username)}`);
  },

  createGroup({ name, creator, members }) {
    return request('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, creator, members }),
    });
  },

  getGroups(username) {
    return request(`/groups?username=${encodeURIComponent(username)}`);
  },

  getGroupById(id) {
    return request(`/groups/${id}`);
  },

  addMember(groupId, username) {
    return request(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  },

  removeMember(groupId, username) {
    return request(`/groups/${groupId}/members/${encodeURIComponent(username)}`, {
      method: 'DELETE',
    });
  },

  searchUsers(query) {
    return request(`/users/search?q=${encodeURIComponent(query)}`);
  },

  registerUser(username) {
    return request('/users/register', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  },
};
