const mongoose = require('mongoose');

const hardwareRequestSchema = new mongoose.Schema({
  hardware_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HardwareItem',
    required: false,
  },
  requester_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required'],
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required'],
  },
  quantity_requested: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1,
  },
  message: {
    type: String,
    default: '',
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending',
  },
  requester_completed: {
    type: Boolean,
    default: false,
  },
  owner_completed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('HardwareRequest', hardwareRequestSchema);
