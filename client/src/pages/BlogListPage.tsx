import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, BookOpen, Clock, Heart, MessageSquare, Plus, Tag } from "lucide-react";
import { getBlogPosts } from "../api/client";
import useStore from "../store/useStore";

interface Author {
  _id: string;
  name: string;
  avatar_url?: string;
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
  comments: any[];
  createdAt: string;
}

const CATEGORIES = [
  "All",
  "General",
  "Hardware",
  "Compute",
  "AI",
  "Announcements",
  "Guides"
];

const BlogListPage: React.FC = () => {
  const user = useStore((state) => state.user);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError("");
      try {
        const params: Record<string, string> = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedCategory !== "All") params.category = selectedCategory;
        if (selectedTag) params.tag = selectedTag;

        const { data } = await getBlogPosts(params);
        if (data.success) {
          setPosts(data.data);
        } else {
          setError("Failed to fetch blog posts");
        }
      } catch (err: any) {
        console.error(err);
        setError("Error loading blogs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [debouncedSearch, selectedCategory, selectedTag]);

  // Calculate reading time
  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  // Get all unique tags from loaded posts to show in a sidebar/tag cloud
  const allTags = Array.from(
    new Set(posts.flatMap((post) => post.tags || []))
  ).slice(0, 15);

  const featuredPost = posts[0];
  const gridPosts = posts.slice(1);

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-border-default/45 pb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-text-primary tracking-tight bg-gradient-to-r from-accent-indigo via-accent-violet to-accent-rose bg-clip-text text-transparent mb-3">
              OmniPool Community Blog
            </h1>
            <p className="text-text-muted text-base max-w-xl">
              Insights, guides, and hardware pooling milestones written by and for the OmniPool community.
            </p>
          </div>
          {user && (
            <Link
              to="/blog/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-indigo hover:bg-accent-violet text-white text-sm font-medium transition-all shadow-lg shadow-accent-indigo/10 hover:shadow-accent-indigo/25 hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus size={18} />
              Write a Post
            </Link>
          )}
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12 items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full lg:w-auto no-scrollbar scroll-smooth">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setSelectedTag(null); // Reset tag filter when changing category
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === category && !selectedTag
                    ? "bg-accent-indigo/15 border border-accent-indigo/30 text-accent-indigo"
                    : "bg-bg-tertiary/40 border border-border-default/50 text-text-muted hover:text-text-primary hover:bg-bg-tertiary/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <span className="absolute inset-y-0 left-3 flex items-center text-text-muted">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-tertiary/40 border border-border-default/60 rounded-xl pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-indigo transition-colors"
            />
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-4">
            <svg className="animate-spin h-10 w-10 text-accent-indigo" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-text-muted text-sm">Loading articles...</p>
          </div>
        ) : error ? (
          <div className="glass-card text-center p-12 max-w-lg mx-auto">
            <p className="text-accent-rose text-base mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent-indigo text-white rounded-xl text-sm font-semibold hover:bg-accent-violet transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-card text-center p-16 max-w-lg mx-auto">
            <BookOpen size={48} className="mx-auto text-text-muted mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-text-primary mb-2">No articles found</h3>
            <p className="text-text-muted text-sm mb-6">
              We couldn't find any blog posts matching your criteria. Try adjusting your search query or filters.
            </p>
            {user && (
              <Link
                to="/blog/create"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-indigo text-white rounded-xl text-sm font-semibold hover:bg-accent-violet transition-colors cursor-pointer"
              >
                <Plus size={16} />
                Write the first post!
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Blog Grid & Featured Post */}
            <div className="lg:col-span-9 space-y-12">
              
              {/* Featured Post (Only visible if not searching or filtering by tag) */}
              {!searchQuery && !selectedTag && selectedCategory === "All" && featuredPost && (
                <div className="glass-card overflow-hidden group hover:-translate-y-1 hover:border-accent-indigo/35 hover:shadow-glow-sm hover:shadow-accent-indigo/5 transition-all duration-300">
                  <Link to={`/blog/${featuredPost.slug}`} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Cover Image */}
                    <div className="md:col-span-7 h-64 md:h-96 relative bg-bg-tertiary overflow-hidden">
                      {featuredPost.cover_image ? (
                        <img
                          src={featuredPost.cover_image}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent-indigo/20 via-accent-violet/10 to-accent-rose/10 flex items-center justify-center">
                          <BookOpen size={48} className="text-accent-indigo/35" />
                        </div>
                      )}
                      <span className="absolute top-4 left-4 bg-accent-indigo text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md">
                        {featuredPost.category}
                      </span>
                    </div>

                    {/* Meta & Info */}
                    <div className="md:col-span-5 p-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <span>{new Date(featuredPost.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Clock size={12} />{getReadingTime(featuredPost.content)}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary group-hover:text-accent-indigo transition-colors line-clamp-3 leading-tight">
                          {featuredPost.title}
                        </h2>
                        <p className="text-text-muted text-sm line-clamp-4 leading-relaxed">
                          {featuredPost.summary}
                        </p>
                      </div>

                      <div className="pt-6 border-t border-border-default/45 flex items-center justify-between mt-6">
                        <div className="flex items-center gap-2.5">
                          {featuredPost.author.avatar_url ? (
                            <img
                              src={featuredPost.author.avatar_url}
                              alt={featuredPost.author.name}
                              className="w-8 h-8 rounded-full border border-border-default"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-accent-indigo/15 text-accent-indigo font-bold flex items-center justify-center text-xs">
                              {featuredPost.author.name[0]}
                            </div>
                          )}
                          <span className="text-xs font-semibold text-text-primary">{featuredPost.author.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-text-muted text-xs">
                          <span className="flex items-center gap-1"><Heart size={14} /> {featuredPost.likes?.length || 0}</span>
                          <span className="flex items-center gap-1"><MessageSquare size={14} /> {featuredPost.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Grid of Other Posts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(searchQuery || selectedTag || selectedCategory !== "All" ? posts : gridPosts).map((post) => (
                  <div key={post._id} className="glass-card overflow-hidden flex flex-col h-full group hover:-translate-y-1.5 hover:border-accent-indigo/35 hover:shadow-glow-sm hover:shadow-accent-indigo/5 transition-all duration-300">
                    <Link to={`/blog/${post.slug}`} className="flex flex-col h-full">
                      {/* Image */}
                      <div className="h-48 relative bg-bg-tertiary overflow-hidden">
                        {post.cover_image ? (
                          <img
                            src={post.cover_image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-accent-indigo/15 via-accent-violet/10 to-accent-rose/10 flex items-center justify-center">
                            <BookOpen size={36} className="text-accent-indigo/35" />
                          </div>
                        )}
                        <span className="absolute top-3 left-3 bg-bg-card/85 backdrop-blur-md border border-border-default/60 text-text-primary text-[10px] font-semibold px-2 py-0.5 rounded">
                          {post.category}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col justify-between flex-grow">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[11px] text-text-muted">
                            <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Clock size={11} />{getReadingTime(post.content)}</span>
                          </div>
                          <h3 className="text-lg font-bold text-text-primary group-hover:text-accent-indigo transition-colors line-clamp-2 leading-snug">
                            {post.title}
                          </h3>
                          <p className="text-text-muted text-xs line-clamp-3 leading-relaxed">
                            {post.summary}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-border-default/45 flex items-center justify-between mt-6">
                          <div className="flex items-center gap-2">
                            {post.author.avatar_url ? (
                              <img
                                src={post.author.avatar_url}
                                alt={post.author.name}
                                className="w-6 h-6 rounded-full border border-border-default"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-accent-indigo/15 text-accent-indigo font-bold flex items-center justify-center text-[10px]">
                                {post.author.name[0]}
                              </div>
                            )}
                            <span className="text-[11px] font-semibold text-text-primary">{post.author.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-text-muted text-xs">
                            <span className="flex items-center gap-1"><Heart size={12} /> {post.likes?.length || 0}</span>
                            <span className="flex items-center gap-1"><MessageSquare size={12} /> {post.comments?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

            </div>

            {/* Sidebar (Tag cloud & Filters) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Tags Card */}
              {allTags.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Tag size={16} className="text-accent-indigo" />
                    Popular Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                          selectedTag === tag
                            ? "bg-accent-indigo text-white"
                            : "bg-bg-tertiary/40 border border-border-default/50 text-text-muted hover:text-text-primary"
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                  {selectedTag && (
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="text-xs text-accent-rose hover:underline mt-4 block text-center w-full font-medium cursor-pointer"
                    >
                      Clear tag filter
                    </button>
                  )}
                </div>
              )}

              {/* Dev/Community notice */}
              <div className="glass-card p-5 bg-gradient-to-br from-accent-indigo/5 to-accent-rose/5 border border-accent-indigo/10">
                <h3 className="text-sm font-bold text-text-primary mb-2">Join the discussion!</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Have you pooled your GPU? Configured a node? Shared your AI Copilot recommendations? Publish your insights here and build community reputation points!
                </p>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default BlogListPage;
