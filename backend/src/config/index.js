const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = ['MONGODB_URI', 'CLIENT_URL', 'SOCKET_CORS_ORIGIN'];

const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. Check your .env file.`
  );
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  clientUrl: process.env.CLIENT_URL,
  socketCorsOrigin: process.env.SOCKET_CORS_ORIGIN,
  messageMaxLength: parseInt(process.env.MESSAGE_MAX_LENGTH, 10) || 1000,
  usernameMaxLength: parseInt(process.env.USERNAME_MAX_LENGTH, 10) || 50,
};

module.exports = config;
