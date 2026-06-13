const express = require('express');
const router = express.Router();
const {
  getBlogPosts,
  getBlogPostBySlug,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  toggleLike,
  addComment,
  deleteComment,
} = require('../controllers/blog.controller');
const auth = require('../middleware/auth');

// Public post lists and creation (protected)
router.route('/')
  .get(getBlogPosts)
  .post(auth, createBlogPost);

// Single post retrieval by slug or ID
router.get('/post/:slug', getBlogPostBySlug);
router.get('/id/:id', getBlogPostById);

// Update/Delete endpoints
router.route('/:id')
  .put(auth, updateBlogPost)
  .delete(auth, deleteBlogPost);

// Likes and Comments
router.post('/:id/like', auth, toggleLike);
router.post('/:id/comments', auth, addComment);
router.delete('/:id/comments/:commentId', auth, deleteComment);

module.exports = router;
