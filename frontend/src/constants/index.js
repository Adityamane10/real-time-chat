export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGES_DELIVERED: 'messages:delivered',
  MESSAGES_SEEN: 'messages:seen',
  MESSAGE_STATUS: 'message:status',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_OFFLINE: 'user_offline',
  ONLINE_USERS: 'online_users',
  UNREAD_COUNTS: 'unread_counts',
  UNREAD_UPDATED: 'unread_updated',
  GROUP_MEMBER_ADDED: 'group_member_added',
  GROUP_CREATED: 'group_created',
};

export const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  SEEN: 'seen',
  FAILED: 'failed',
};

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const USERNAME_MAX_LENGTH = 50;
export const MESSAGE_MAX_LENGTH = 1000;
export const MESSAGES_PER_PAGE = 30;
