const { Router } = require('express');
const { getMessages, createMessage, getConversations } = require('../controllers/messageController');
const { validateMessageInput } = require('../middleware/validate');
const rateLimit = require('express-rate-limit');

const router = Router();

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many messages sent. Please slow down.',
  },
});

router.get('/conversations', getConversations);
router.get('/', getMessages);
router.post('/', messageLimiter, validateMessageInput, createMessage);

module.exports = router;
