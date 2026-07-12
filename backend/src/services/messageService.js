const Message = require('../models/Message');
const Group = require('../models/Group');
const config = require('../config');

const messageService = {
  async getMessages({ page = 1, limit = 30, recipient, username, groupId } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (groupId) {
      filter.groupId = groupId;
    } else if (recipient && username) {
      filter.$or = [
        { username, recipient },
        { username: recipient, recipient: username },
      ];
      filter.groupId = { $exists: false };
    } else if (recipient) {
      filter.recipient = recipient;
      filter.groupId = { $exists: false };
    }

    const [messages, totalMessages] = await Promise.all([
      Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Message.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalMessages / limitNum);

    return {
      messages: messages.reverse(),
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalMessages,
        totalPages,
      },
    };
  },

  async createMessage({ username, recipient, groupId, content, clientId, status }) {
    const trimmedUsername = (username || '').trim().slice(0, config.usernameMaxLength);
    const trimmedContent = (content || '').trim().slice(0, config.messageMaxLength);

    if (!trimmedUsername) {
      const err = new Error('Username is required');
      err.statusCode = 400;
      throw err;
    }

    if (!trimmedContent) {
      const err = new Error('Message content cannot be empty');
      err.statusCode = 400;
      throw err;
    }

    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) {
        const err = new Error('Group not found');
        err.statusCode = 404;
        throw err;
      }
      if (!group.members.includes(trimmedUsername)) {
        const err = new Error('You are not a member of this group');
        err.statusCode = 403;
        throw err;
      }
    }

    if (!groupId && (!recipient || !recipient.trim())) {
      const err = new Error('Recipient is required for private messages');
      err.statusCode = 400;
      throw err;
    }

    if (clientId) {
      const existing = await Message.findOne({ clientId });
      if (existing) {
        const err = new Error('Duplicate message detected');
        err.statusCode = 409;
        err.existingMessage = existing;
        throw err;
      }
    }

    const messageData = {
      username: trimmedUsername,
      content: trimmedContent,
      clientId: clientId || undefined,
      status: status || 'sent',
    };

    if (groupId) {
      messageData.groupId = groupId;
    } else {
      messageData.recipient = recipient.trim().slice(0, config.usernameMaxLength);
    }

    const message = await Message.create(messageData);
    return message.toObject();
  },

  async getConversations(username) {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ username }, { recipient: username }],
          groupId: { $exists: false },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$username', username] },
              then: { $concat: ['private:', { $cond: { if: { $lt: [username, '$recipient'] }, then: { $concat: [username, ':', '$recipient'] }, else: { $concat: ['$recipient', ':', username] } } }] },
              else: { $concat: ['private:', { $cond: { if: { $lt: [username, '$username'] }, then: { $concat: [username, ':', '$username'] }, else: { $concat: ['$username', ':', username] } } }] },
            },
          },
          lastMessage: { $first: '$$ROOT' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
      {
        $project: {
          _id: 0,
          conversationId: '$_id',
          lastMessage: 1,
          totalMessages: '$count',
        },
      },
    ]);

    return conversations.map((c) => {
      const parts = c.conversationId.split(':');
      const otherUser = parts[1] === username ? parts[2] : parts[1];
      return {
        conversationId: c.conversationId,
        displayName: otherUser,
        isGroup: false,
        otherUser,
        lastMessage: c.lastMessage,
        totalMessages: c.totalMessages,
      };
    });
  },

  async markMessageDelivered(messageId) {
    const message = await Message.findOneAndUpdate(
      { _id: messageId, status: { $in: ['sent', 'pending'] } },
      { status: 'delivered', deliveredAt: new Date() },
      { new: true }
    ).lean();
    return message;
  },

  async markConversationSeen({ username, conversationId, groupId, recipient }) {
    let filter;
    if (groupId) {
      filter = { groupId, username: { $ne: username }, status: { $in: ['sent', 'delivered', 'pending'] } };
    } else if (recipient) {
      filter = {
        username: recipient,
        recipient: username,
        status: { $in: ['sent', 'delivered', 'pending'] },
      };
    } else {
      const parts = conversationId.split(':');
      if (parts[0] === 'private') {
        const otherUser = parts[1] === username ? parts[2] : parts[1];
        filter = {
          username: otherUser,
          recipient: username,
          status: { $in: ['sent', 'delivered'] },
        };
      }
    }

    if (!filter) return [];

    const result = await Message.updateMany(filter, { status: 'seen', seenAt: new Date() });
    if (result.modifiedCount > 0) {
      const updatedMessages = await Message.find(filter).lean();
      return updatedMessages;
    }
    return [];
  },

  async getUnreadCounts(username) {
    const privateMessages = await Message.find({
      recipient: username,
      status: { $in: ['sent', 'delivered'] },
      groupId: { $exists: false },
    }).lean();

    const counts = {};
    for (const msg of privateMessages) {
      const convId = `private:${[username, msg.username].sort().join(':')}`;
      counts[convId] = (counts[convId] || 0) + 1;
    }

    const groups = await Group.find({ members: username }).lean();
    for (const group of groups) {
      const unreadCount = await Message.countDocuments({
        groupId: group._id,
        username: { $ne: username },
        status: { $in: ['sent', 'delivered'] },
      });
      if (unreadCount > 0) {
        counts[`group:${group._id}`] = unreadCount;
      }
    }

    return counts;
  },
};

module.exports = messageService;
