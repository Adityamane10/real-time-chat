const { Router } = require('express');
const { registerUser, searchUsers } = require('../controllers/userController');

const router = Router();

router.post('/register', registerUser);
router.get('/search', searchUsers);

module.exports = router;
