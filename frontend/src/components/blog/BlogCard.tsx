import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Calendar,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Briefcase,
  Layers,
  Award,
  Shield,
  Tag,
  Lock,
} from 'lucide-react';
import { BlogPostData } from '../../seo/types';

interface BlogCardProps {
  post: BlogPostData;
  className?: string;
}

// Category Icon mapping for neutral fallback tiles (No fake artwork)
function getCategoryIcon(category?: string) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('escrow')) return <Lock size={28} className="text-[#0047AB]" />;
  if (cat.includes('guide')) return <BookOpen size={28} className="text-[#0047AB]" />;
  if (cat.includes('hiring') || cat.includes('client')) return <Briefcase size={28} className="text-[#0047AB]" />;
  if (cat.includes('polygon')) return <Layers size={28} className="text-[#0047AB]" />;
  if (cat.includes('reputation') || cat.includes('sbt')) return <Award size={28} className="text-[#0047AB]" />;
  if (cat.includes('security')) return <Shield size={28} className="text-[#0047AB]" />;
  return <Tag size={28} className="text-[#0047AB]" />;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post, className = '' }) => {
  return (
    <Link
      to={`/blog/${post.slug}`}
      aria-label={post.title}
      className={`group bg-white rounded-3xl border border-[#E2E6EC] hover:border-[#CBD5E1] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all h-full flex flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] focus-visible:ring-offset-2 ${className}`}
    >
      {/* 1. Cover Image / Neutral Tile Header (16:9 fixed aspect ratio on EVERY card) */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#F8FAFC] border-b border-[#E2E6EC] shrink-0">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.coverAlt || post.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#F8FAFC] to-[#EFF6FF]/40">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2E6EC] shadow-2xs flex items-center justify-center group-hover:border-[#BFDBFE] group-hover:scale-105 transition-all">
              {getCategoryIcon(post.category)}
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-2">
              {post.category || 'PolyLance Guide'}
            </span>
          </div>
        )}
      </div>

      {/* 2. Card Body */}
      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
        <div className="space-y-3.5">
          {/* Meta Row: Each item wraps only as a full unit, never inside text */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {post.category ? (
              <span className="font-bold text-[#0047AB] bg-[#E7EEF9] px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap shrink-0">
                {post.category}
              </span>
            ) : (
              <span className="font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap shrink-0">
                Guide
              </span>
            )}
            <div className="flex items-center gap-2 text-[11px] text-[#6B7280] whitespace-nowrap tabular-nums">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Calendar size={11} className="shrink-0 text-slate-400" />
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
                <Clock size={11} className="shrink-0 text-slate-400" />
                <span>{post.readingTimeMinutes} min read</span>
              </span>
            </div>
          </div>

          {/* Title: 3-line clamp, 20px/1.3, balanced wrapping, no 1-line ellipsis cut */}
          <h2 className="text-[20px] font-bold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors leading-[1.3] line-clamp-3 [text-wrap:balance]">
            {post.title}
          </h2>

          {/* Excerpt: 3-line clamp */}
          <p className="text-xs sm:text-sm text-[#4B5563] line-clamp-3 leading-relaxed">
            {post.description || post.summary}
          </p>
        </div>

        {/* 3. Card Footer */}
        <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {post.authorAvatar ? (
              <img
                src={post.authorAvatar}
                alt={post.author}
                className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#E7EEF9] text-[#0047AB] font-bold text-[10px] flex items-center justify-center shrink-0">
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

          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0047AB] whitespace-nowrap shrink-0 group-hover:translate-x-0.5 transition-transform">
            <span>Read guide</span>
            <ArrowRight size={13} className="shrink-0" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
