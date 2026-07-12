const User = require('../models/User');
const { success } = require('../utils/apiResponse');

const registerUser = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    await User.findOneAndUpdate(
      { username: username.trim() },
      { $set: { username: username.trim() } },
      { upsert: true }
    );
    return success(res, null, 'User registered successfully');
  } catch (err) {
    next(err);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    let filter = {};
    if (q && q.trim()) {
      filter.username = { $regex: `^${q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, $options: 'i' };
    }
    const users = await User.find(filter).limit(50).sort({ username: 1 }).lean();
    return success(res, users.map((u) => u.username), 'Users fetched successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { registerUser, searchUsers };
