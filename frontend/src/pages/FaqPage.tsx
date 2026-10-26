import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, HelpCircle, ChevronRight } from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { FaqSection } from '../components/faq/FaqSection';
import { getAllFaqs, FaqCategory } from '../seo';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Questions' },
  { id: 'general', label: 'General' },
  { id: 'escrow', label: 'Escrow & Milestones' },
  { id: 'fees', label: 'Fees & Gas' },
  { id: 'wallet', label: 'Wallet & Login' },
  { id: 'freelancers', label: 'For Freelancers' },
  { id: 'clients', label: 'For Clients' },
  { id: 'disputes', label: 'Disputes & Judges' },
  { id: 'security', label: 'Security' },
  { id: 'certificates', label: 'Work Certificates' },
];

export const FaqPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const allFaqs = useMemo(() => getAllFaqs(), []);

  const filteredFaqs = useMemo(() => {
    return allFaqs.filter((faq) => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [allFaqs, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B0B0C] flex flex-col">
      <Seo routeKey="/faq" />

      {/* Hero Header */}
      <header className="w-full bg-white border-b border-[#E2E6EC] py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EEF9] text-[#0047AB] text-xs font-bold tracking-wide">
            <HelpCircle size={14} />
            <span>KNOWLEDGE BASE & SUPPORT</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B0B0C] tracking-tight">
            Frequently Asked Questions
          </h1>

          <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about Polygon smart contract escrow, platform fees, wallet authentication, and dispute arbitration.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, token, fee, or policy..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-[#CBD5E1] rounded-2xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:border-transparent shadow-xs transition-all"
            />
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <nav className="w-full bg-white border-b border-[#E2E6EC] sticky top-0 z-10 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 overflow-x-auto custom-scrollbar flex items-center gap-2 py-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#0047AB] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main FAQ Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        {filteredFaqs.length > 0 ? (
          <FaqSection
            category={activeCategory === 'all' ? undefined : activeCategory}
            title=""
            subtitle=""
            className="py-0"
            showSupportLink={false}
          />
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E2E6EC] p-8">
            <HelpCircle className="mx-auto text-slate-400 mb-3" size={32} />
            <h2 className="text-base font-bold text-[#0B0B0C]">No matching answers found</h2>
            <p className="text-sm text-slate-500 mt-1">
              Try searching with different terms or select &quot;All Questions&quot; above.
            </p>
          </div>
        )}

        {/* Still Need Help Card */}
        <section className="mt-14 p-6 sm:p-8 bg-white rounded-3xl border border-[#E2E6EC] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h2 className="text-lg font-bold text-[#0B0B0C]">Still have questions or need arbitration?</h2>
            <p className="text-sm text-[#4B5563] mt-1">
              Our decentralized community and developer support are ready to assist.
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0047AB] hover:bg-[#003A8C] text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <span>Contact Support</span>
            <ChevronRight size={14} />
          </Link>
        </section>
      </main>
    </div>
  );
};

export default FaqPage;
