import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Eye, Edit2 } from "lucide-react";
import { createBlogPost, updateBlogPost, getBlogPostById } from "../api/client";
import useStore from "../store/useStore";

const CATEGORIES = [
  "General",
  "Hardware",
  "Compute",
  "AI",
  "Announcements",
  "Guides"
];

const BlogFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);

  const isEditMode = !!id;

  // Form Fields State
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("General");
  const [tagsInput, setTagsInput] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  // Authentication & Authorization check
  useEffect(() => {
    if (!user) {
      navigate("/signin", { replace: true });
      return;
    }

    if (isEditMode) {
      const fetchPostDetails = async () => {
        try {
          const { data } = await getBlogPostById(id!);
          if (data.success) {
            const post = data.data;
            // Check authorization: author or admin only
            if (post.author._id !== user._id && user.role !== "admin") {
              navigate("/blog", { replace: true });
              return;
            }

            setTitle(post.title);
            setSummary(post.summary);
            setContent(post.content);
            setCoverImage(post.cover_image || "");
            setCategory(post.category);
            setTagsInput(post.tags.join(", "));
          } else {
            setError("Post not found");
          }
        } catch (err: any) {
          console.error(err);
          setError("Failed to fetch post details for editing");
        } finally {
          setFetchLoading(false);
        }
      };

      fetchPostDetails();
    }
  }, [id, user, isEditMode, navigate]);

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !summary.trim() || !content.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    // Parse tags: split by comma, trim, filter out empty values
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    setLoading(true);

    const postData = {
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      cover_image: coverImage.trim(),
      category,
      tags,
    };

    try {
      if (isEditMode) {
        const { data } = await updateBlogPost(id!, postData);
        if (data.success) {
          navigate(`/blog/${data.data.slug}`);
        } else {
          setError("Failed to update post.");
        }
      } else {
        const { data } = await createBlogPost(postData);
        if (data.success) {
          navigate(`/blog/${data.data.slug}`);
        } else {
          setError("Failed to create post.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "An error occurred while saving the post.");
    } finally {
      setLoading(false);
    }
  };

  // Render content preview formatted as paragraphs
  const renderPreviewContent = (text: string) => {
    if (!text.trim()) return <p className="text-text-muted italic text-sm">No content written yet...</p>;
    return text.split("\n\n").map((para, i) => (
      <p key={i} className="mb-4 leading-relaxed text-text-primary/90 text-base font-light whitespace-pre-line">
        {para}
      </p>
    ));
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-24 gap-4 bg-bg-primary">
        <svg className="animate-spin h-10 w-10 text-accent-indigo" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-text-muted text-sm">Loading post details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Back navigation */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-8 group cursor-pointer"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Articles
        </Link>

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight mb-8">
          {isEditMode ? "Edit your article" : "Write a new article"}
        </h1>

        {/* Write & Preview Tabs */}
        <div className="flex border-b border-border-default/50 mb-8 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={`pb-3 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "write"
                ? "border-accent-indigo text-accent-indigo"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            <Edit2 size={16} />
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`pb-3 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "preview"
                ? "border-accent-indigo text-accent-indigo"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            <Eye size={16} />
            Preview
          </button>
        </div>

        {activeTab === "write" ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted block">
                Article Title <span className="text-accent-rose">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title..."
                required
                className="w-full bg-bg-tertiary/40 border border-border-default/60 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-indigo transition-colors"
              />
            </div>

            {/* Grid for Category and Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted block">
                  Category <span className="text-accent-rose">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-bg-tertiary/40 border border-border-default/60 rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-indigo transition-colors cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-bg-card text-text-primary">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted block">
                  Tags <span className="text-text-muted/60">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. node, setup, tutorial"
                  className="w-full bg-bg-tertiary/40 border border-border-default/60 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-indigo transition-colors"
                />
              </div>

            </div>

            {/* Cover Image URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted block">
                Cover Image URL
              </label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-bg-tertiary/40 border border-border-default/60 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-indigo transition-colors"
              />
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted block">
                Brief Summary <span className="text-accent-rose">*</span>
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Write a short, engaging description for the article card (max 300 chars)..."
                rows={3}
                maxLength={300}
                required
                className="w-full bg-bg-tertiary/40 border border-border-default/60 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-indigo transition-colors resize-none"
              />
            </div>

            {/* Content Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted block">
                Article Content <span className="text-accent-rose">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article body here. Support paragraphs by leaving empty lines..."
                rows={12}
                required
                className="w-full bg-bg-tertiary/40 border border-border-default/60 rounded-xl px-4 py-3 text-sm font-mono text-text-primary focus:outline-none focus:border-accent-indigo transition-colors"
              />
            </div>

            {error && <p className="text-xs text-accent-rose">{error}</p>}

            {/* Submit Bar */}
            <div className="pt-4 border-t border-border-default/45 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(isEditMode ? `/blog` : "/blog")}
                className="px-4 py-2 border border-border-default/65 text-text-muted hover:text-text-primary rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-accent-indigo hover:bg-accent-violet text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md shadow-accent-indigo/10 disabled:opacity-50"
              >
                <Save size={14} />
                {loading ? "Publishing..." : isEditMode ? "Save Changes" : "Publish Article"}
              </button>
            </div>

          </form>
        ) : (
          /* PREVIEW LAYOUT */
          <div className="space-y-6">
            {/* Banner Preview */}
            <div className="bg-bg-secondary/40 border border-border-default/40 rounded-xl p-4 text-[11px] text-text-muted italic text-center mb-6">
              Preview Mode (Note: This is how your post will look when published)
            </div>

            <div className="flex flex-wrap gap-2 items-center mb-4">
              <span className="bg-accent-indigo/15 border border-accent-indigo/25 text-accent-indigo text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                {category}
              </span>
              {tagsInput.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0).map((tag) => (
                <span key={tag} className="text-[10px] text-text-muted bg-bg-tertiary/60 border border-border-default/50 px-2 py-0.5 rounded">
                  #{tag.toLowerCase()}
                </span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight leading-tight mb-4">
              {title || "Untitled Article"}
            </h1>

            {coverImage && (
              <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden bg-bg-tertiary border border-border-default/60 mb-6">
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {summary && (
              <div className="border-l-4 border-accent-indigo pl-4 py-1 mb-6">
                <p className="text-text-muted text-sm italic">
                  {summary}
                </p>
              </div>
            )}

            <div className="prose prose-invert max-w-none pt-4 border-t border-border-default/50">
              {renderPreviewContent(content)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BlogFormPage;
