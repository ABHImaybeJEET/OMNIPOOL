import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, Heart, MessageSquare, Share2, Edit3, Trash2, Send, Calendar } from "lucide-react";
import { getBlogPostBySlug, toggleLikeBlogPost, addBlogPostComment, deleteBlogPostComment, deleteBlogPost } from "../api/client";
import useStore from "../store/useStore";

interface Author {
  _id: string;
  name: string;
  avatar_url?: string;
}

interface Comment {
  _id: string;
  author: Author;
  text: string;
  createdAt: string;
}

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  author: Author;
  cover_image?: string;
  category: string;
  tags: string[];
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track page scroll for progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Like and Comments states
  const [isLiking, setIsLiking] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      setLoading(true);
      setError("");
      try {
        const { data } = await getBlogPostBySlug(slug);
        if (data.success) {
          setPost(data.data);
        } else {
          setError("Post not found");
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to load the blog post. It might have been deleted.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-24 gap-4 bg-bg-primary">
        <svg className="animate-spin h-10 w-10 text-accent-indigo" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-text-muted text-sm">Loading article...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-bg-primary pt-32 pb-16 px-4">
        <div className="max-w-md mx-auto glass-card text-center p-8">
          <p className="text-accent-rose text-base mb-6">{error || "Post not found"}</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-accent-indigo hover:underline font-semibold cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Blog List
          </Link>
        </div>
      </div>
    );
  }

  const isLiked = user ? post.likes.includes(user._id) : false;
  const isAuthor = user ? post.author._id === user._id : false;
  const isAdmin = user ? user.role === "admin" : false;

  // Calculate reading time
  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  // Toggle Like
  const handleLike = async () => {
    if (!user) {
      navigate("/signin");
      return;
    }
    if (isLiking) return;
    setIsLiking(true);
    try {
      const { data } = await toggleLikeBlogPost(post._id);
      if (data.success) {
        setPost((prev) => prev ? { ...prev, likes: data.likes } : null);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    } finally {
      setIsLiking(false);
    }
  };

  // Post Comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/signin");
      return;
    }
    if (!commentText.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const { data } = await addBlogPostComment(post._id, commentText.trim());
      if (data.success) {
        setPost((prev) => prev ? { ...prev, comments: data.data } : null);
        setCommentText("");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete Comment
  const handleCommentDelete = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const { data } = await deleteBlogPostComment(post._id, commentId);
      if (data.success) {
        setPost((prev) => prev ? { ...prev, comments: data.data } : null);
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  // Delete Post
  const handlePostDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) return;
    try {
      const { data } = await deleteBlogPost(post._id);
      if (data.success) {
        navigate("/blog");
      }
    } catch (err) {
      console.error("Error deleting blog post:", err);
    }
  };

  // Share link copy
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Basic inline bold parsing: **text** -> <strong>text</strong>
  const parseInlineStyles = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    if (parts.length === 1) return text;
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <strong key={index} className="font-semibold text-text-primary">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  // Render article content safely with headings, lists, bold text and rules
  const renderContent = (text: string) => {
    return text.split("\n\n").map((block, i) => {
      const trimmed = block.trim();

      // Horizontal Rule
      if (trimmed === "---" || trimmed === "***") {
        return <hr key={i} className="my-8 border-border-default/50" />;
      }

      // Headings
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={i} className="text-3xl font-extrabold text-text-primary mt-8 mb-4">
            {parseInlineStyles(trimmed.replace("# ", ""))}
          </h1>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={i} className="text-2xl font-bold text-text-primary mt-6 mb-3">
            {parseInlineStyles(trimmed.replace("## ", ""))}
          </h2>
        );
      }
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={i} className="text-xl font-bold text-text-primary mt-5 mb-2.5">
            {parseInlineStyles(trimmed.replace("### ", ""))}
          </h3>
        );
      }

      // Unordered Lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
        const items = trimmed.split("\n").map((item) => item.replace(/^[-*•]\s+/, ""));
        return (
          <ul key={i} className="list-disc list-inside space-y-1.5 mb-5 pl-4 text-text-primary/85">
            {items.map((item, idx) => (
              <li key={idx} className="text-base font-light">
                {parseInlineStyles(item)}
              </li>
            ))}
          </ul>
        );
      }

      // Default Paragraph
      return (
        <p key={i} className="mb-5 leading-relaxed text-text-primary/90 text-base md:text-lg font-light whitespace-pre-line">
          {parseInlineStyles(trimmed)}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Reading Progress Indicator */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-border-default/15 z-50">
        <div 
          className="h-full bg-gradient-to-r from-accent-indigo to-accent-violet transition-all duration-75" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      <div className="max-w-3xl mx-auto">
        
        {/* Back Link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-8 group cursor-pointer"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Articles
        </Link>

        {/* Category & Tags */}
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <span className="bg-accent-indigo/15 border border-accent-indigo/25 text-accent-indigo text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md">
            {post.category}
          </span>
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs text-text-muted bg-bg-tertiary/60 border border-border-default/50 px-2 py-0.5 rounded-md">
              #{tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight leading-tight mb-6">
          {post.title}
        </h1>

        {/* Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border-default/50 py-4 mb-8">
          <div className="flex items-center gap-3">
            {post.author.avatar_url ? (
              <img
                src={post.author.avatar_url}
                alt={post.author.name}
                className="w-10 h-10 rounded-full border border-border-default"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent-indigo/15 text-accent-indigo font-bold flex items-center justify-center">
                {post.author.name[0]}
              </div>
            )}
            <div>
              <div className="text-sm font-semibold text-text-primary">{post.author.name}</div>
              <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                <span className="flex items-center gap-0.5"><Calendar size={12} />{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5"><Clock size={12} />{getReadingTime(post.content)} min read</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit/Delete permissions */}
            {(isAuthor || isAdmin) && (
              <>
                <Link
                  to={`/blog/edit/${post._id}`}
                  className="p-2 text-text-muted hover:text-accent-indigo hover:bg-bg-tertiary rounded-xl transition-all cursor-pointer"
                  title="Edit post"
                >
                  <Edit3 size={18} />
                </Link>
                <button
                  onClick={handlePostDelete}
                  className="p-2 text-text-muted hover:text-accent-rose hover:bg-bg-tertiary rounded-xl transition-all cursor-pointer"
                  title="Delete post"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}

            {/* Share */}
            <button
              onClick={handleShare}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                copiedLink 
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
              }`}
              title="Copy post link"
            >
              <Share2 size={18} />
              {copiedLink && <span>Copied!</span>}
            </button>
          </div>
        </div>

        {/* Cover Image */}
        {post.cover_image && (
          <div className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden bg-bg-tertiary border border-border-default/60 mb-8">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Summary Block */}
        <div className="border-l-4 border-accent-indigo pl-4 py-1.5 mb-8">
          <p className="text-text-muted text-base italic leading-relaxed">
            {post.summary}
          </p>
        </div>

        {/* Article Content */}
        <article className="prose prose-invert max-w-none mb-12 border-b border-border-default/50 pb-12">
          {renderContent(post.content)}
        </article>

        {/* Likes / Sharing Footer */}
        <div className="flex justify-between items-center bg-bg-secondary/40 border border-border-default/50 rounded-2xl px-6 py-4 mb-12">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isLiked 
                ? "bg-accent-rose/10 border border-accent-rose/25 text-accent-rose hover:bg-accent-rose/20"
                : "bg-bg-tertiary border border-border-default/60 text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
            }`}
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} className={isLiking ? "scale-95 opacity-50" : ""} />
            <span>{isLiked ? "Liked" : "Like"} ({post.likes.length})</span>
          </button>

          <span className="text-xs text-text-muted flex items-center gap-1.5">
            <MessageSquare size={14} /> {post.comments.length} comments
          </span>
        </div>

        {/* Comments Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-text-primary">Discussion</h3>

          {/* New Comment Form */}
          {user ? (
            <form onSubmit={handleCommentSubmit} className="flex gap-3 items-start">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-border-default mt-1"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent-indigo/15 text-accent-indigo font-bold flex items-center justify-center text-xs mt-1">
                  {user.name[0]}
                </div>
              )}
              <div className="flex-grow space-y-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts on this post..."
                  rows={3}
                  required
                  className="w-full bg-bg-tertiary/40 border border-border-default/60 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-indigo transition-colors"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-indigo hover:bg-accent-violet text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send size={12} />
                  Comment
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-bg-tertiary/40 border border-border-default/50 rounded-xl p-4 text-center text-xs">
              <span className="text-text-muted">You must be </span>
              <Link to="/signin" className="text-accent-indigo hover:underline font-semibold">signed in</Link>
              <span className="text-text-muted"> to participate in comments.</span>
            </div>
          )}

          {/* Comment List */}
          <div className="space-y-4 pt-4">
            {post.comments.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-6">No comments yet. Be the first to start the discussion!</p>
            ) : (
              post.comments.map((comment) => {
                const isCommentOwner = user ? comment.author._id === user._id : false;
                const canDelete = isCommentOwner || isAuthor || isAdmin;

                return (
                  <div key={comment._id} className="bg-bg-secondary/20 border border-border-default/40 rounded-2xl p-4 flex gap-3 items-start group">
                    {comment.author.avatar_url ? (
                      <img
                        src={comment.author.avatar_url}
                        alt={comment.author.name}
                        className="w-8 h-8 rounded-full border border-border-default"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent-indigo/15 text-accent-indigo font-bold flex items-center justify-center text-xs">
                        {comment.author.name[0]}
                      </div>
                    )}
                    <div className="flex-grow">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-text-primary">{comment.author.name}</span>
                          <span className="text-[10px] text-text-muted">
                            {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {canDelete && (
                          <button
                            onClick={() => handleCommentDelete(comment._id)}
                            className="text-text-muted hover:text-accent-rose p-1 rounded transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                            title="Delete comment"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <p className="text-text-primary/95 text-xs mt-2 leading-relaxed whitespace-pre-wrap">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BlogPostPage;
