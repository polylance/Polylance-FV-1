import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Clock, Calendar, ArrowRight, Play, Pause } from 'lucide-react';
import { BlogPostData } from '../../seo/types';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface BlogFeaturedCardProps {
  post: BlogPostData;
  className?: string;
}

export const BlogFeaturedCard: React.FC<BlogFeaturedCardProps> = ({ post, className = '' }) => {
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [videoFailed, setVideoFailed] = useState<boolean>(false);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);

  // Determine media source
  const videoSrc = post.coverVideo || (post.slug === 'what-is-crypto-escrow-and-how-does-it-work' ? '/escrow-flow.mp4' : undefined);
  const posterSrc = post.coverImage || '/escrow-flow-poster.jpg';
  const hasVideo = Boolean(videoSrc) && !videoFailed && !prefersReducedMotion;

  // IntersectionObserver: Only play when visible, pause when offscreen or tab hidden
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !hasVideo) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasVideo]);

  // Synchronize playback with intersection and visibility state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        video.pause();
        setIsPlaying(false);
      } else if (isIntersecting && !prefersReducedMotion) {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (isIntersecting && !document.hidden && !prefersReducedMotion) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isIntersecting, hasVideo, prefersReducedMotion]);

  // Manual Play/Pause toggle (WCAG 2.2.2 requirement for moving content > 5s)
  const handleTogglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  return (
    <Link
      to={`/blog/${post.slug}`}
      aria-label={`Featured Guide: ${post.title}`}
      className={`group bg-white rounded-3xl border border-[#E2E6EC] hover:border-[#CBD5E1] shadow-2xs hover:shadow-md transition-all block overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] focus-visible:ring-offset-2 ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
        {/* Media Pane (Fixed 16:9 ratio, centered, zero left clipping) */}
        <div
          ref={containerRef}
          className="md:col-span-5 relative bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden flex items-center justify-center border-b md:border-b-0 md:border-r border-[#E2E6EC] min-h-[240px] md:min-h-full"
        >
          {hasVideo ? (
            <div className="relative w-full h-full aspect-[16/9] md:aspect-auto flex items-center justify-center p-2">
              <video
                ref={videoRef}
                autoPlay={!prefersReducedMotion}
                muted
                loop
                playsInline
                preload="metadata"
                poster={posterSrc}
                onError={() => setVideoFailed(true)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-contain object-center select-none"
              >
                <source src={videoSrc} type="video/mp4" />
                <img
                  src={posterSrc}
                  alt={post.coverAlt || post.title}
                  className="w-full h-full object-contain object-center"
                />
              </video>

              {/* Accessible WCAG Pause/Play Button */}
              <button
                type="button"
                onClick={handleTogglePlay}
                aria-label={isPlaying ? 'Pause featured animation' : 'Play featured animation'}
                className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-[#0047AB] shadow-sm border border-slate-200 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="translate-x-0.5" />}
              </button>
            </div>
          ) : (
            <div className="relative w-full h-full aspect-[16/9] md:aspect-auto flex items-center justify-center p-2">
              <img
                src={posterSrc}
                alt={post.coverAlt || post.title}
                loading="lazy"
                className="w-full h-full object-contain object-center select-none"
              />
            </div>
          )}

          {/* Featured Badge */}
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[#0047AB] text-xs font-bold shadow-xs border border-slate-200/60 pointer-events-none">
            <Sparkles size={13} />
            <span>FEATURED GUIDE</span>
          </div>
        </div>

        {/* Content Pane */}
        <div className="md:col-span-7 p-7 sm:p-9 flex flex-col justify-between">
          <div className="space-y-3.5">
            {/* Meta Row: Wrap items only as whole units, never inside date/time */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              {post.category && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E7EEF9] text-[#0047AB] whitespace-nowrap shrink-0">
                  {post.category}
                </span>
              )}
              <div className="flex items-center gap-2 text-slate-500 whitespace-nowrap tabular-nums">
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Calendar size={12} className="shrink-0 text-slate-400" />
                  <span>
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Clock size={12} className="shrink-0 text-slate-400" />
                  <span>{post.readingTimeMinutes} min read</span>
                </span>
              </div>
            </div>

            {/* Title: 3-line clamp, balanced wrapping, no 1-line ellipsis cut */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors leading-[1.25] line-clamp-3 [text-wrap:balance]">
              {post.title}
            </h2>

            {/* Excerpt: 3-line clamp */}
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed line-clamp-3">
              {post.description || post.summary}
            </p>
          </div>

          {/* Footer: Author & Read Guide on ONE line */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {post.authorAvatar ? (
                <img
                  src={post.authorAvatar}
                  alt={post.author}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#E7EEF9] text-[#0047AB] font-bold text-xs flex items-center justify-center shrink-0">
                  {post.author.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span
                className="text-xs font-semibold text-slate-700 truncate min-w-0"
                title={post.author}
              >
                {post.author}
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0047AB] whitespace-nowrap shrink-0 group-hover:translate-x-1 transition-transform">
              <span>Read complete guide</span>
              <ArrowRight size={14} className="shrink-0" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BlogFeaturedCard;
