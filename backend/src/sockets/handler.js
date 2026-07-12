const messageService = require('../services/messageService');
const Group = require('../models/Group');
const User = require('../models/User');
const { SOCKET_EVENTS } = require('../utils/constants');

const userSockets = new Map();
const unreadCounts = {};

const getOnlineUsersList = () => {
  return Array.from(userSockets.keys());
};

const broadcastOnlineUsers = (io) => {
  io.emit(SOCKET_EVENTS.ONLINE_USERS, getOnlineUsersList());
};

const incrementUnread = (conversationId, excludeUsername) => {
  for (const [username] of userSockets) {
    if (username !== excludeUsername) {
      if (!unreadCounts[username]) unreadCounts[username] = {};
      unreadCounts[username][conversationId] = (unreadCounts[username][conversationId] || 0) + 1;
    }
  }
};

const getUnreadForUser = (username) => {
  return unreadCounts[username] || {};
};

const clearUnread = (username, conversationId) => {
  if (unreadCounts[username]) {
    delete unreadCounts[username][conversationId];
  }
};

const sendUnreadUpdate = (io, username) => {
  const sockets = userSockets.get(username);
  if (sockets) {
    for (const sid of sockets) {
      io.to(sid).emit(SOCKET_EVENTS.UNREAD_UPDATED, getUnreadForUser(username));
    }
  }
};

const joinUserGroups = async (socket) => {
  try {
    const groups = await Group.find({ members: socket.data.username }).lean();
    for (const group of groups) {
      socket.join(`group:${group._id}`);
    }
  } catch (err) {
    console.error(`Failed to join groups for ${socket.data.username}:`, err.message);
  }
};

const handleConnection = (io, socket) => {
  const username = socket.data.username;
  console.log(`Socket connected: ${socket.id} (${username})`);

  if (!userSockets.has(username)) {
    userSockets.set(username, new Set());
  }
  userSockets.get(username).add(socket.id);

  socket.join(`user:${username}`);

  broadcastOnlineUsers(io);

  joinUserGroups(socket);

  User.findOneAndUpdate(
    { username },
    { username },
    { upsert: true, new: true }
  ).catch((err) => console.error('Failed to register user:', err.message));

  messageService.getUnreadCounts(username).then((dbCounts) => {
    unreadCounts[username] = dbCounts;
    socket.emit(SOCKET_EVENTS.UNREAD_COUNTS, dbCounts);
  });

  socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (data, ack) => {
    try {
      if (!data || !data.content) {
        if (ack) ack({ error: 'Invalid message data' });
        return;
      }

      const savedMessage = await messageService.createMessage({
        username,
        recipient: data.recipient,
        groupId: data.groupId,
        content: data.content,
        clientId: data.clientId,
      });

      const messageObj = savedMessage;

      if (savedMessage.groupId) {
        const room = `group:${savedMessage.groupId}`;
        io.to(room).emit(SOCKET_EVENTS.MESSAGE_NEW, messageObj);
        incrementUnread(`group:${savedMessage.groupId}`, username);

        const groupRoom = io.sockets.adapter.rooms.get(room);
        if (groupRoom) {
          for (const sid of groupRoom) {
            const sock = io.sockets.sockets.get(sid);
            if (sock && sock.data.username !== username) {
              io.to(sid).emit(SOCKET_EVENTS.UNREAD_UPDATED, getUnreadForUser(sock.data.username));
            }
          }
        }
      } else {
        const privateConversationId = `private:${[username, savedMessage.recipient].sort().join(':')}`;
        incrementUnread(privateConversationId, username);

        io.to(`user:${savedMessage.recipient}`).emit(SOCKET_EVENTS.MESSAGE_NEW, messageObj);

        const recipientSockets = userSockets.get(savedMessage.recipient);
        if (recipientSockets) {
          for (const sid of recipientSockets) {
            io.to(sid).emit(SOCKET_EVENTS.UNREAD_UPDATED, getUnreadForUser(savedMessage.recipient));
          }
        }
      }

      if (ack) ack({ message: messageObj });
    } catch (err) {
      console.error('Error saving message:', err.message);
      if (err.statusCode === 409 && err.existingMessage) {
        const msg = err.existingMessage.toObject ? { ...err.existingMessage.toObject(), status: 'sent' } : { ...err.existingMessage, status: 'sent' };
        if (ack) ack({ message: msg });
      } else {
        if (ack) ack({ error: err.message || 'Failed to send message' });
      }
    }
  });

  socket.on(SOCKET_EVENTS.MESSAGES_DELIVERED, async (data) => {
    try {
      if (!data || !data.messageId) return;

      const message = await messageService.markMessageDelivered(data.messageId);
      if (message) {
        io.to(`user:${message.username}`).emit(SOCKET_EVENTS.MESSAGE_STATUS, message);
      }
    } catch (err) {
      console.error('Error marking message delivered:', err.message);
    }
  });

  socket.on(SOCKET_EVENTS.MESSAGES_SEEN, async ({ conversationId, groupId, recipient }) => {
    try {
      if (!conversationId) return;

      clearUnread(username, conversationId);
      sendUnreadUpdate(io, username);

      const updatedMessages = await messageService.markConversationSeen({
        username,
        conversationId,
        groupId,
        recipient,
      });

      for (const msg of updatedMessages) {
        io.to(`user:${msg.username}`).emit(SOCKET_EVENTS.MESSAGE_STATUS, msg);
      }
    } catch (err) {
      console.error('Error marking messages seen:', err.message);
    }
  });

  socket.on(SOCKET_EVENTS.TYPING_START, (data) => {
    const recipient = typeof data === 'string' ? data : data?.recipient;
    const groupId = data?.groupId;

    if (groupId) {
      socket.to(`group:${groupId}`).emit(SOCKET_EVENTS.TYPING_START, {
        username,
        groupId,
      });
    } else if (recipient) {
      io.to(`user:${recipient}`).emit(SOCKET_EVENTS.TYPING_START, {
        username,
        recipient,
      });
    }
  });

  socket.on(SOCKET_EVENTS.TYPING_STOP, (data) => {
    const recipient = typeof data === 'string' ? data : data?.recipient;
    const groupId = data?.groupId;

    if (groupId) {
      socket.to(`group:${groupId}`).emit(SOCKET_EVENTS.TYPING_STOP, {
        username,
        groupId,
      });
    } else if (recipient) {
      io.to(`user:${recipient}`).emit(SOCKET_EVENTS.TYPING_STOP, {
        username,
        recipient,
      });
    }
  });

  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    console.log(`Socket disconnected: ${socket.id} (${username})`);
    const sockets = userSockets.get(username);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSockets.delete(username);
        io.emit(SOCKET_EVENTS.USER_OFFLINE, username);
        broadcastOnlineUsers(io);
      }
    }
  });
};

module.exports = { handleConnection };
