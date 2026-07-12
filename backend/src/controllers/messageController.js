const messageService = require('../services/messageService');
const { success, successWithPagination, error } = require('../utils/apiResponse');
const { getIO } = require('../sockets');
const { SOCKET_EVENTS } = require('../utils/constants');

const getMessages = async (req, res, next) => {
  try {
    const { page, limit, recipient, groupId } = req.query;
    const result = await messageService.getMessages({
      page,
      limit,
      recipient,
      groupId,
      username: req.query.username,
    });
    return successWithPagination(
      res,
      result.messages,
      result.pagination,
      'Messages fetched successfully'
    );
  } catch (err) {
    next(err);
  }
};

const createMessage = async (req, res, next) => {
  try {
    const { username, recipient, groupId, content, clientId } = req.body;
    const savedMessage = await messageService.createMessage({
      username,
      recipient,
      groupId,
      content,
      clientId,
    });

    const io = getIO();
    if (io) {
      if (savedMessage.groupId) {
        io.to(`group:${savedMessage.groupId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, savedMessage);
      } else {
        io.to(`user:${savedMessage.recipient}`).emit(SOCKET_EVENTS.MESSAGE_NEW, savedMessage);
        io.to(`user:${savedMessage.username}`).emit(SOCKET_EVENTS.MESSAGE_NEW, savedMessage);
      }
    }

    return success(res, savedMessage, 'Message sent successfully', 201);
  } catch (err) {
    if (err.statusCode === 409 && err.existingMessage) {
      return success(res, err.existingMessage, 'Message already sent', 200);
    }
    next(err);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const { username } = req.query;
    if (!username) {
      return error(res, 'Username is required', 400);
    }
    const conversations = await messageService.getConversations(username);
    return success(res, conversations, 'Conversations fetched successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getMessages, createMessage, getConversations };
