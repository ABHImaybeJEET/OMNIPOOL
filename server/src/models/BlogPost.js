const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: 1000,
  },
}, {
  timestamps: true,
});

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    maxlength: 200,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  summary: {
    type: String,
    required: [true, 'Summary is required'],
    trim: true,
    maxlength: 500,
  },
  content: {
    type: String,
    required: [true, 'Blog content is required'],
    trim: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cover_image: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: 'General',
    trim: true,
  },
  tags: [
    {
      type: String,
      trim: true,
    }
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: [],
    }
  ],
  comments: [commentSchema],
}, {
  timestamps: true,
});

// Text index for search
blogPostSchema.index({ title: 'text', content: 'text', summary: 'text', tags: 'text' });

module.exports = mongoose.model('BlogPost', blogPostSchema);
