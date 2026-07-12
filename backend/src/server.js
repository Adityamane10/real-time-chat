const http = require('http');
const app = require('./app');
const config = require('./config');
const { connectDB } = require('./config/database');
const { initSocket } = require('./sockets');

const server = http.createServer(app);

const start = async () => {
  try {
    await connectDB();
    initSocket(server);

    server.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

start();
