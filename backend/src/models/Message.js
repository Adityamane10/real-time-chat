const mongoose = require('mongoose');
const config = require('../config');

const messageSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      maxlength: [
        config.usernameMaxLength,
        `Username cannot exceed ${config.usernameMaxLength} characters`,
      ],
    },
    recipient: {
      type: String,
      trim: true,
      maxlength: config.usernameMaxLength,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [
        config.messageMaxLength,
        `Message cannot exceed ${config.messageMaxLength} characters`,
      ],
      validate: {
        validator: function (v) {
          return v && v.trim().length > 0;
        },
        message: 'Message content cannot be empty',
      },
    },
    clientId: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'seen', 'failed'],
      default: 'pending',
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });
messageSchema.index({ username: 1, recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
