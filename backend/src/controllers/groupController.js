const Group = require('../models/Group');
const Message = require('../models/Message');
const { success, error } = require('../utils/apiResponse');
const { getIO } = require('../sockets');
const { SOCKET_EVENTS } = require('../utils/constants');

const createGroup = async (req, res, next) => {
  try {
    const { name, creator, members } = req.body;

    if (!name || !name.trim()) {
      return error(res, 'Group name is required', 400);
    }
    if (!creator || !creator.trim()) {
      return error(res, 'Creator username is required', 400);
    }
    if (!members || !Array.isArray(members) || members.length === 0) {
      return error(res, 'At least one member is required', 400);
    }

    const allMembers = [...new Set([creator.trim(), ...members.map((m) => m.trim())])];

    const group = await Group.create({
      name: name.trim(),
      creator: creator.trim(),
      members: allMembers,
    });

    const io = getIO();
    if (io) {
      for (const [sid, sock] of io.sockets.sockets) {
        if (allMembers.includes(sock.data.username)) {
          sock.join(`group:${group._id}`);
        }
      }
      const groupData = group.toObject();
      io.emit(SOCKET_EVENTS.GROUP_CREATED, groupData);
    }

    return success(res, group, 'Group created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getGroups = async (req, res, next) => {
  try {
    const { username } = req.query;
    if (!username) {
      return error(res, 'Username is required', 400);
    }

    const groups = await Group.find({ members: username })
      .sort({ updatedAt: -1 })
      .lean();

    const groupsWithUnread = await Promise.all(
      groups.map(async (group) => {
        const lastMessage = await Message.findOne({ groupId: group._id })
          .sort({ createdAt: -1 })
          .lean();
        return { ...group, lastMessage: lastMessage || null };
      })
    );

    return success(res, groupsWithUnread, 'Groups fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id).lean();
    if (!group) {
      return error(res, 'Group not found', 404);
    }
    return success(res, group, 'Group fetched successfully');
  } catch (err) {
    next(err);
  }
};

const addMember = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return error(res, 'Username is required', 400);
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return error(res, 'Group not found', 404);
    }

    const cleanUsername = username.trim();
    if (group.members.includes(cleanUsername)) {
      return error(res, 'User is already a member', 400);
    }

    group.members.push(cleanUsername);
    await group.save();

    const io = getIO();
    if (io) {
      for (const [sid, sock] of io.sockets.sockets) {
        if (sock.data.username === cleanUsername) {
          sock.join(`group:${group._id}`);
        }
      }
      io.emit(SOCKET_EVENTS.GROUP_MEMBER_ADDED, {
        groupId: group._id,
        groupName: group.name,
        username: cleanUsername,
        members: group.members,
      });
    }

    return success(res, group, 'Member added successfully');
  } catch (err) {
    next(err);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return error(res, 'Group not found', 404);
    }

    const { username } = req.params;
    if (!username) {
      return error(res, 'Username is required', 400);
    }

    if (group.creator === username) {
      return error(res, 'Cannot remove the group creator', 400);
    }

    group.members = group.members.filter((m) => m !== username);
    await group.save();

    return success(res, group, 'Member removed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { createGroup, getGroups, getGroupById, addMember, removeMember };
