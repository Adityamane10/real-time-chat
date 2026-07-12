const { getDBStatus } = require('../config/database');
const { success, error } = require('../utils/apiResponse');

const healthCheck = (req, res) => {
  try {
    const dbStatus = getDBStatus();
    return success(res, {
      server: 'running',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return error(res, 'Health check failed', 500);
  }
};

module.exports = { healthCheck };
