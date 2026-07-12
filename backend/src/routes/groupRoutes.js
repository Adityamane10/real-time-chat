const { Router } = require('express');
const {
  createGroup,
  getGroups,
  getGroupById,
  addMember,
  removeMember,
} = require('../controllers/groupController');

const router = Router();

router.post('/', createGroup);
router.get('/', getGroups);
router.get('/:id', getGroupById);
router.post('/:id/members', addMember);
router.delete('/:id/members/:username', removeMember);

module.exports = router;
