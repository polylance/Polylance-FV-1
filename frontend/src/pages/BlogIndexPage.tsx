import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Search, X, Sparkles, Filter } from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { getAllBlogPosts } from '../seo';
import { BlogPostData } from '../seo/types';
import { BlogCard } from '../components/blog/BlogCard';
import { BlogFeaturedCard } from '../components/blog/BlogFeaturedCard';
import { BlogListingSidebar } from '../components/blog/BlogListingSidebar';
import { getBackendSyncUrl } from '../utils/backendUrl';

const PAGE_SIZE = 9;

export const BlogIndexPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'All';
  const queryParam = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [posts, setPosts] = useState<BlogPostData[]>(() => getAllBlogPosts());
  const [isLoading, setIsLoading] = useState(false);

  // Sync state with search params if changed externally
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'All');
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Real-time synchronization with Blog Studio publishing API
  useEffect(() => {
    const backendUrl = getBackendSyncUrl();
    const interval = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`${backendUrl}/api/blog/posts`, {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.posts) && data.posts.length > 0) {
            // Merge with local posts data to retain full markdown/faqs while getting fresh metadata
            setPosts((prev) => {
              const postMap = new Map(prev.map((p) => [p.slug, p]));
              data.posts.forEach((fresh: any) => {
                const existing = postMap.get(fresh.slug);
                if (existing) {
                  postMap.set(fresh.slug, { ...existing, ...fresh });
                } else {
                  postMap.set(fresh.slug, fresh);
                }
              });
              return Array.from(postMap.values());
            });
          }
        }
      } catch {
        /* silent polling fallback */
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Update query params when user selects a category
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setVisibleCount(PAGE_SIZE);
    const newParams = new URLSearchParams(searchParams);
    if (category === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Update query params when user searches
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setVisibleCount(PAGE_SIZE);
    const newParams = new URLSearchParams(searchParams);
    if (!value.trim()) {
      newParams.delete('q');
    } else {
      newParams.set('q', value.trim());
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setVisibleCount(PAGE_SIZE);
    setSearchParams({}, { replace: true });
  };

  // Extract real categories with exact post counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = { All: posts.length };
    posts.forEach((p) => {
      const cat = p.category || 'Guides';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const list = Object.entries(counts).map(([name, count]) => ({ name, count }));
    // Sort so "All" is first, then alphabetical
    return [
      list.find((c) => c.name === 'All')!,
      ...list.filter((c) => c.name !== 'All').sort((a, b) => a.name.localeCompare(b.name)),
    ];
  }, [posts]);

  // Extract all unique tags for sidebar
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      p.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [posts]);

  // Filter posts by category and search query
  const filteredPosts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const cat = selectedCategory.toLowerCase();

    return posts.filter((p) => {
      const matchesCategory =
        cat === 'all' ||
        (p.category && p.category.toLowerCase() === cat) ||
        (!p.category && cat === 'guides');

      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.summary?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [posts, selectedCategory, searchQuery]);

  // Featured post: newest published post when no filter/search is active
  const isDefaultView = selectedCategory === 'All' && !searchQuery.trim();
  const featuredPost = isDefaultView && filteredPosts.length > 0 ? filteredPosts[0] : null;
  const gridPosts = featuredPost ? filteredPosts.slice(1) : filteredPosts;
  const paginatedPosts = gridPosts.slice(0, visibleCount);
  const hasMore = paginatedPosts.length < gridPosts.length;

  // Latest 5 posts for sidebar
  const latestFivePosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 5);
  }, [posts]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B0B0F] flex flex-col">
      <Seo routeKey="/blog" />

      {/* Header & Search Hero */}
      <header className="w-full bg-white border-b border-[#E2E6EC] py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EEF9] text-[#0047AB] text-xs font-bold tracking-wide">
            <BookOpen size={14} />
            <span>KNOWLEDGE & GUIDES</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B0B0F] tracking-tight">
            Web3 Freelancing & Escrow Blog
          </h1>
          <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
            In-depth guides and security tutorials on crypto escrow, getting paid in USDC, and decentralized work.
          </p>

          {/* Search Box */}
          <div className="max-w-md mx-auto mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search guides and tutorials..."
              className="w-full pl-11 pr-10 py-3 bg-white border border-[#CBD5E1] rounded-2xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:border-transparent shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                aria-label="Clear search query"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1540px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Horizontal Category Filter Row */}
        <nav aria-label="Blog categories" className="w-full overflow-x-auto pb-2 -mb-2 no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {categoriesWithCounts.map((cat) => {
              const isActive = selectedCategory.toLowerCase() === cat.name.toLowerCase();
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleCategorySelect(cat.name)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] ${
                    isActive
                      ? 'bg-[#0047AB] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-[#E2E6EC]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-xs px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Layout: Content Grid + Sticky Sidebar on >=1280px */}
        <div className="flex flex-col xl:flex-row gap-10 items-start">
          {/* Main Content Column */}
          <div className="flex-1 min-w-0 w-full space-y-8">
            {/* Featured Post (Visible when on 'All' and no search query) */}
            {featuredPost && (
              <section aria-label="Featured Article">
                <BlogFeaturedCard post={featuredPost} />
              </section>
            )}

            {/* Articles Grid or Empty State */}
            {filteredPosts.length === 0 ? (
              /* Designed Empty State */
              <div className="p-12 sm:p-16 bg-white rounded-3xl border border-[#E2E6EC] text-center space-y-4 shadow-2xs">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                  <Filter size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#0B0B0F]">No guides found</h3>
                  <p className="text-sm text-[#4B5563] max-w-sm mx-auto leading-relaxed">
                    We could not find any guides matching your search or category filter. Try refining your keywords.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-[#0047AB] hover:bg-[#0A3D8F] text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
                  >
                    <span>Clear all filters</span>
                  </button>
                </div>
              </div>
            ) : (
              /* CSS Grid with repeat(auto-fill, minmax(min(100%, 320px), 1fr)) - Cards never narrower than 320px */
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-6 sm:gap-7 items-stretch">
                {paginatedPosts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            )}

            {/* Pagination / Load More with Count ("Showing X of Y") */}
            {gridPosts.length > 0 && (
              <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Showing {Math.min(visibleCount, gridPosts.length) + (featuredPost ? 1 : 0)} of{' '}
                  {filteredPosts.length} guides
                </p>

                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="py-2.5 px-6 bg-white hover:bg-slate-50 text-[#0047AB] border border-[#CBD5E1] hover:border-[#0047AB] font-bold text-xs sm:text-sm rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
                  >
                    Load more guides
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar on >=1280px (Width ~320px) */}
          <div className="hidden xl:block w-[320px] shrink-0">
            <BlogListingSidebar
              categories={categoriesWithCounts}
              tags={allUniqueTags}
              latestPosts={latestFivePosts}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlogIndexPage;
