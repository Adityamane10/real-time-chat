const SOCKET_EVENTS = {
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

module.exports = { SOCKET_EVENTS };
