const mongoose = require('mongoose');

const bomItemSchema = new mongoose.Schema({
  hardware_name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  notes: { type: String, default: '' },
}, { _id: false });

const aiConversationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 300,
    default: 'New Project Idea',
  },
  prompt: {
    type: String,
    required: [true, 'Prompt is required'],
    trim: true,
    maxlength: 5000,
  },
  aiResult: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    extrapolated_BOM: { type: [bomItemSchema], default: [] },
    required_skills: { type: [String], default: [] },
  },
  projectAdvice: {
    strategy: { type: String, default: '' },
    difficulty: { type: String, default: 'Unknown' },
    feasibility_score: { type: Number, default: 0 },
    next_steps: { type: [String], default: [] },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AiConversation', aiConversationSchema);
