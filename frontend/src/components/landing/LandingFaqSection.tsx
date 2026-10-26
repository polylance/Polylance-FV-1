import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowRight, HelpCircle } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { FAQ_DATA } from '../../seo/faq.data';
import { Button } from '../common/Button';

export const LandingFaqSection: React.FC = () => {
  // Pull FAQs flagged for landing page ('/')
  const landingFaqs = FAQ_DATA.filter((item) => item.pageIds.includes('/')).slice(0, 6);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="w-full bg-white border-b border-[#E5E7EB] py-16 sm:py-20 lg:py-24">
      <PageContainer noVerticalPadding>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 text-left items-start">
          
          {/* Left Column: Sticky Title, Description & CTA */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="space-y-3">
              <div className="text-eyebrow text-[#0047AB]">Frequently Asked Questions</div>
              <h2 className="text-landing-h2 text-[#0B0B0F]">
                Everything you need to know about PolyLance.
              </h2>
              <p className="text-lead text-[#4B5563]">
                Clear answers on smart contract escrow, protocol fees, dispute resolution, and supported tokens on Polygon.
              </p>
            </div>

            <div className="pt-2">
              <Button
                as="Link"
                to="/faq"
                variant="secondary"
                size="md"
                trailingIcon={<ArrowRight size={15} />}
              >
                Explore all answers in FAQ
              </Button>
            </div>
          </div>

          {/* Right Column: Accordion */}
          <div className="lg:col-span-7 space-y-3.5">
            {landingFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;

              return (
                <div
                  key={faq.id}
                  className="bg-[#F6F7F9] border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-2xs transition-colors hover:border-[#0047AB]/40"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-[#0B0B0F] hover:text-[#0047AB] transition-colors cursor-pointer select-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`text-[#6B7280] transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-[#0047AB]' : ''
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 text-xs sm:text-sm text-[#4B5563] leading-relaxed border-t border-[#F3F4F6] pt-3.5">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </PageContainer>
    </section>
  );
};
