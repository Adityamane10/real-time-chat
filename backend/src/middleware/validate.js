const validator = require('validator');
const config = require('../config');

const sanitize = (value) => {
  if (typeof value !== 'string') return '';
  return validator.stripLow(value.trim());
};

const validateMessageInput = (req, res, next) => {
  const { username, recipient, groupId, content } = req.body;

  const sanitizedUsername = sanitize(username).slice(0, config.usernameMaxLength);
  const sanitizedContent = sanitize(content).slice(0, config.messageMaxLength);

  const errors = [];

  if (!sanitizedUsername) {
    errors.push('Username is required');
  }

  if (!sanitizedContent) {
    errors.push('Message content cannot be empty');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  req.body.username = sanitizedUsername;
  req.body.content = sanitizedContent;

  if (recipient && !groupId) {
    req.body.recipient = sanitize(recipient).slice(0, config.usernameMaxLength);
  }

  next();
};

module.exports = { validateMessageInput };
