import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { getFaqsForPage, getAllFaqs, FaqItem } from '../../seo';

export interface FaqSectionProps {
  pageId?: string;
  category?: string;
  title?: string;
  subtitle?: string;
  limit?: number;
  initialOpenIndex?: number | null;
  className?: string;
  showSupportLink?: boolean;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  pageId,
  category,
  title = 'Frequently Asked Questions',
  subtitle = 'Everything you need to know about Polygon smart contract escrow and freelance payments.',
  limit,
  initialOpenIndex = 0,
  className = '',
  showSupportLink = true,
}) => {
  let faqs: FaqItem[] = pageId ? getFaqsForPage(pageId) : getAllFaqs();

  if (category) {
    faqs = faqs.filter((f) => f.category === category);
  }

  if (limit && limit > 0) {
    faqs = faqs.slice(0, limit);
  }

  // Manage open states as an object without render-phase mutations
  const [openStates, setOpenStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (initialOpenIndex !== null && faqs[initialOpenIndex]) {
      initial[faqs[initialOpenIndex].id] = true;
    }
    return initial;
  });

  const toggleItem = (id: string) => {
    setOpenStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (faqs.length === 0) return null;

  return (
    <section aria-labelledby="faq-section-heading" className={`w-full py-12 md:py-16 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EEF9] text-[#0047AB] text-xs font-semibold mb-3">
            <HelpCircle size={14} />
            <span>Got Questions?</span>
          </div>
          <h2 id="faq-section-heading" className="text-2xl sm:text-3xl font-extrabold text-[#0B0B0C] tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm sm:text-base text-[#4B5563] max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5" role="region" aria-label="Frequently Asked Questions Accordion">
          {faqs.map((faq, index) => {
            const isOpen = Boolean(openStates[faq.id]);
            const contentId = `faq-content-${faq.id}`;
            const buttonId = `faq-btn-${faq.id}`;

            return (
              <div
                key={faq.id}
                id={faq.id}
                className="border border-[#E2E6EC] rounded-2xl bg-white shadow-2xs hover:border-[#CBD5E1] transition-all overflow-hidden"
              >
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    onClick={() => toggleItem(faq.id)}
                    className="w-full text-left px-5 sm:px-6 py-4 sm:py-4.5 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-[#0B0B0C] hover:text-[#0047AB] transition-colors cursor-pointer select-none"
                  >
                    <span>{faq.question}</span>
                    <span
                      className={`shrink-0 p-1 rounded-lg bg-slate-50 text-slate-500 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#0047AB] bg-[#E7EEF9]' : ''
                      }`}
                      aria-hidden="true"
                    >
                      <ChevronDown size={18} />
                    </span>
                  </button>
                </h3>

                {/* Answer body remains in the DOM for search engines; hidden via CSS height / hidden class */}
                <div
                  id={contentId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`transition-all duration-200 ease-in-out px-5 sm:px-6 ${
                    isOpen
                      ? 'max-h-96 pb-5 pt-1 opacity-100'
                      : 'max-h-0 py-0 opacity-0 overflow-hidden pointer-events-none'
                  }`}
                >
                  <div className="text-sm text-[#4B5563] leading-relaxed border-t border-slate-100 pt-3">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Still have questions */}
        {showSupportLink && (
          <div className="mt-10 text-center text-sm text-[#4B5563]">
            Still have questions?{' '}
            <Link
              to="/contact"
              className="text-[#0047AB] font-semibold hover:underline cursor-pointer"
            >
              Contact our support team
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
