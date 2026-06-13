const BlogPost = require('../models/BlogPost');

// Helper to slugify string
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

// Helper to generate a unique slug
const generateUniqueSlug = async (title) => {
  let baseSlug = slugify(title);
  if (!baseSlug) baseSlug = 'post';
  let slug = baseSlug;
  let counter = 1;
  while (await BlogPost.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};

/**
 * GET /api/blogs
 * Get all blog posts with search/filtering
 */
const getBlogPosts = async (req, res, next) => {
  try {
    const { search, category, tag } = req.query;
    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }

    if (category) {
      filter.category = { $regex: new RegExp('^' + category + '$', 'i') };
    }

    if (tag) {
      filter.tags = tag;
    }

    const posts = await BlogPost.find(filter)
      .populate('author', 'name email avatar_url')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: posts.length, data: posts });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/blogs/:slug
 * Get single blog post by slug
 */
const getBlogPostBySlug = async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug })
      .populate('author', 'name email avatar_url')
      .populate('comments.author', 'name email avatar_url');

    if (!post) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/blogs/id/:id
 * Get single blog post by ID
 */
const getBlogPostById = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id)
      .populate('author', 'name email avatar_url');

    if (!post) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/blogs
 * Create new blog post (auth required)
 */
const createBlogPost = async (req, res, next) => {
  try {
    const { title, summary, content, cover_image, category, tags } = req.body;

    if (!title || !summary || !content) {
      return res.status(400).json({ success: false, error: 'Title, summary, and content are required' });
    }

    const slug = await generateUniqueSlug(title);

    const post = await BlogPost.create({
      title,
      slug,
      summary,
      content,
      cover_image: cover_image || '',
      category: category || 'General',
      tags: tags || [],
      author: req.userId,
    });

    const populated = await BlogPost.findById(post._id).populate('author', 'name email avatar_url');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/blogs/:id
 * Update blog post (auth required, owner or admin only)
 */
const updateBlogPost = async (req, res, next) => {
  try {
    const { title, summary, content, cover_image, category, tags } = req.body;
    let post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    // Verify ownership or admin
    if (post.author.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this post' });
    }

    const updates = {
      summary: summary || post.summary,
      content: content || post.content,
      cover_image: cover_image !== undefined ? cover_image : post.cover_image,
      category: category || post.category,
      tags: tags || post.tags,
    };

    // If title changed, regenerate slug
    if (title && title !== post.title) {
      updates.title = title;
      updates.slug = await generateUniqueSlug(title);
    }

    post = await BlogPost.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('author', 'name email avatar_url')
      .populate('comments.author', 'name email avatar_url');

    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/blogs/:id
 * Delete blog post (auth required, owner or admin only)
 */
const deleteBlogPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    // Verify ownership or admin
    if (post.author.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this post' });
    }

    await post.deleteOne();

    res.json({ success: true, message: 'Blog post removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/blogs/:id/like
 * Toggle like/unlike on blog post (auth required)
 */
const toggleLike = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    const isLiked = post.likes.includes(req.userId);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter((userId) => userId.toString() !== req.userId.toString());
    } else {
      // Like
      post.likes.push(req.userId);
    }

    await post.save();

    res.json({ success: true, likes: post.likes });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/blogs/:id/comments
 * Add comment to blog post (auth required)
 */
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'Comment text is required' });
    }

    let post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    post.comments.push({
      author: req.userId,
      text,
    });

    await post.save();

    // Re-query to populate newly added comment author details
    post = await BlogPost.findById(req.params.id)
      .populate('author', 'name email avatar_url')
      .populate('comments.author', 'name email avatar_url');

    res.status(201).json({ success: true, data: post.comments });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/blogs/:id/comments/:commentId
 * Delete comment from blog post (auth required)
 */
const deleteComment = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // Auth check: comment author, post author, or admin
    const isCommentAuthor = comment.author.toString() === req.userId.toString();
    const isPostAuthor = post.author.toString() === req.userId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this comment' });
    }

    comment.deleteOne();
    await post.save();

    res.json({ success: true, data: post.comments });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBlogPosts,
  getBlogPostBySlug,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  toggleLike,
  addComment,
  deleteComment,
};
