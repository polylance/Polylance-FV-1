import React, { useEffect, useState } from 'react';
import { PageContainer } from '../layout/PageContainer';
import { getBackendSyncUrl } from '../../utils/backendUrl';
import { sharedPoller } from '../../utils/sharedPoller';

export interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

export const TestimonialsSection: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTestimonials() {
      try {
        const baseUrl = getBackendSyncUrl();
        const data = await sharedPoller.fetchDeduplicated<Testimonial[]>(
          `${baseUrl}/api/public/testimonials`,
          { headers: { Accept: 'application/json' } },
          { cacheTtlMs: 60000 }
        );

        if (isMounted && Array.isArray(data)) {
          setTestimonials(data);
        }
      } catch {
        // Fail gracefully
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTestimonials();

    return () => {
      isMounted = false;
    };
  }, []);

  // Non-negotiable Honesty Rule: ONLY render if >= 3 approved testimonials exist.
  if (loading || testimonials.length < 3) {
    return null;
  }

  return (
    <section className="w-full bg-[#F6F7F9] border-b border-[#E5E7EB] py-16 sm:py-20">
      <PageContainer noVerticalPadding>
        <div className="space-y-10 text-left">
          <div className="space-y-2">
            <div className="text-eyebrow text-[#0047AB]">Verified Feedback</div>
            <h2 className="text-landing-h2 text-[#0B0B0F]">
              What clients and freelancers say.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-2xs space-y-4 flex flex-col justify-between"
              >
                <p className="text-sm text-[#374151] italic leading-relaxed">
                  "{t.quote}"
                </p>

                <div className="pt-3 border-t border-[#F3F4F6] flex items-center gap-3">
                  {t.avatarUrl ? (
                    <img
                      src={t.avatarUrl}
                      alt={t.authorName}
                      className="w-9 h-9 rounded-full object-cover border border-[#E5E7EB]"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#EAF1FB] text-[#0047AB] font-bold text-xs flex items-center justify-center">
                      {t.authorName.charAt(0)}
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-bold text-[#0B0B0F]">{t.authorName}</div>
                    <div className="text-[11px] text-[#6B7280]">{t.authorRole}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </section>
  );
};
