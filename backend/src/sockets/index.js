const { Server } = require('socket.io');
const config = require('../config');
const { handleConnection } = require('./handler');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.socketCorsOrigin,
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.use((socket, next) => {
    const username = socket.handshake.auth?.username;
    if (!username || typeof username !== 'string' || !username.trim()) {
      return next(new Error('Authentication required: username must be provided'));
    }
    socket.data.username = username.trim().slice(0, 50);
    next();
  });

  io.on('connection', (socket) => {
    handleConnection(io, socket);
  });

  console.log('Socket.io initialized');
  return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };
