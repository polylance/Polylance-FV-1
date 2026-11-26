import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  ShieldCheck,
  Code,
  Cpu,
  Palette,
  Video,
  Radio,
  TrendingUp,
  PenTool,
  BarChart3,
  Headphones,
  CheckCircle2,
} from 'lucide-react';
import { getCategories } from '../utils/taxonomy';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { ScrollReveal, ScrollRevealGroup, SpotlightCard } from '../components/common/MotionPrimitives';
import { PageContainer } from '../components/layout/PageContainer';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  cat_dev_it: Code,
  cat_ai_auto: Cpu,
  cat_web3_block: ShieldCheck,
  cat_design_creat: Palette,
  cat_video_audio: Video,
  cat_creators_collab: Radio,
  cat_marketing: TrendingUp,
  cat_writing_content: PenTool,
  cat_data_analytics: BarChart3,
  cat_admin_support: Headphones,
};

export const CategoriesIndexPage: React.FC = () => {
  const categories = getCategories();
  const { jobs } = usePolyLanceData();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0A0D14] pb-24">
      {/* Top Banner */}
      <div className="bg-white border-b border-[#E2E8F0] pt-10 pb-12">
        <PageContainer noVerticalPadding>
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#0A52B8] border border-[#BFDBFE]">
                <ShieldCheck size={14} />
                <span>Escrow-Protected Labor Marketplace</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0A0D14]">
                Browse by Discipline
              </h1>

              <p className="text-base sm:text-lg text-[#475569] max-w-2xl mx-auto leading-relaxed">
                Find vetted specialists and transparent milestone-based contracts across 10 specialized categories on Polygon.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-1 text-xs font-medium text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-[#0A52B8]" />
                  Non-custodial milestone escrow
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-[#2563EB]" />
                  5% Total protocol fee (2.5% each side)
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-[#0A52B8]" />
                  Zero email or phone storage
                </span>
              </div>
            </div>
          </ScrollReveal>
        </PageContainer>
      </div>

      {/* Compact Animated Spotlight Grid */}
      <PageContainer noVerticalPadding className="pt-10">
        <ScrollRevealGroup
          staggerSec={0.05}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] || Briefcase;

            const matchingJobsCount = (jobs || []).filter(
              (j) =>
                j.category?.toLowerCase() === cat.slug ||
                j.category?.toLowerCase() === cat.name.toLowerCase()
            ).length;

            const previewSubs = cat.subcategories.slice(0, 3);
            const remainingCount = Math.max(0, cat.subcategories.length - previewSubs.length);

            return (
              <SpotlightCard
                key={cat.id}
                spotlightColor="rgba(37, 99, 235, 0.12)"
                className="p-5 h-full flex flex-col justify-between"
              >
                <div className="flex flex-col h-full justify-between gap-4">
                  <div>
                    {/* Category Top Bar */}
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#EFF6FF] border border-[#BFDBFE] text-[#0A52B8] group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-200">
                        <Icon size={20} />
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-[#64748B] bg-[#F8FAFC] px-2.5 py-0.5 rounded-full border border-[#E2E8F0] whitespace-nowrap">
                        {matchingJobsCount} open {matchingJobsCount === 1 ? 'job' : 'jobs'}
                      </span>
                    </div>

                    {/* Title & Concise 2-Line Description */}
                    <h2
                      className="text-[17px] font-semibold text-[#0F172A] group-hover:text-[#0A52B8] transition-colors leading-snug"
                      style={{ fontSize: '1.0625rem', lineHeight: 1.35, letterSpacing: '-0.01em' }}
                    >
                      <Link
                        to={`/categories/${cat.slug}`}
                        className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A52B8] rounded-[4px]"
                      >
                        {cat.name}
                      </Link>
                    </h2>
                    <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed line-clamp-2">
                      {cat.description}
                    </p>

                    {/* Compact Cap: Max 3 sub-specialty pills + "+X more" */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex flex-wrap gap-1.5">
                        {previewSubs.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/categories/${cat.slug}?sub=${sub.slug}`}
                            className="text-[11px] font-medium text-[#475569] bg-[#F8FAFC] hover:bg-[#EFF6FF] hover:text-[#0A52B8] px-2 py-0.5 rounded-[6px] border border-[#E2E8F0] hover:border-[#BFDBFE] transition-colors truncate max-w-[155px]"
                          >
                            {sub.name}
                          </Link>
                        ))}
                        {remainingCount > 0 && (
                          <Link
                            to={`/categories/${cat.slug}`}
                            className="text-[11px] font-semibold text-[#0A52B8] bg-[#EFF6FF] px-2 py-0.5 rounded-[6px] border border-[#BFDBFE] whitespace-nowrap"
                          >
                            +{remainingCount} more
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Compact Footer Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/categories/${cat.slug}`}
                      className="text-xs font-semibold text-[#0A52B8] group-hover:text-[#2563EB] inline-flex items-center gap-1"
                    >
                      <span>Explore</span>
                      <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to={`/jobs/post?category=${cat.slug}`}
                      className="text-xs font-medium text-[#64748B] hover:text-[#0A0D14] whitespace-nowrap"
                    >
                      Post job
                    </Link>
                  </div>
                </div>
              </SpotlightCard>
            );
          })}
        </ScrollRevealGroup>
      </PageContainer>
    </div>
  );
};
