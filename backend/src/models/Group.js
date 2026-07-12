const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    creator: {
      type: String,
      required: [true, 'Creator is required'],
      trim: true,
    },
    members: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length >= 1;
        },
        message: 'Group must have at least one member',
      },
    },
  },
  {
    timestamps: true,
  }
);

groupSchema.index({ members: 1 });
groupSchema.index({ creator: 1 });

module.exports = mongoose.model('Group', groupSchema);
