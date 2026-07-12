const { Router } = require('express');
const healthRoutes = require('./healthRoutes');
const messageRoutes = require('./messageRoutes');
const groupRoutes = require('./groupRoutes');
const userRoutes = require('./userRoutes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/messages', messageRoutes);
router.use('/groups', groupRoutes);
router.use('/users', userRoutes);

module.exports = router;
