import React from 'react';
import { PageContainer } from '../layout/PageContainer';
import { TEAM_MEMBERS } from '../../config/team.config';

export const TeamSection: React.FC = () => {
  if (!TEAM_MEMBERS || TEAM_MEMBERS.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-white border-b border-[#E5E7EB] py-16 sm:py-20">
      <PageContainer noVerticalPadding>
        <div className="space-y-10 text-left">
          <div className="space-y-2">
            <div className="text-eyebrow text-[#0047AB]">Core Team</div>
            <h2 className="text-landing-h2 text-[#0B0B0F]">
              Built by engineers for engineers.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.name}
                className="bg-[#F6F7F9] border border-[#E5E7EB] rounded-[12px] p-6 space-y-3"
              >
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-14 h-14 rounded-full object-cover border border-[#E5E7EB]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#EAF1FB] text-[#0047AB] font-bold text-lg flex items-center justify-center">
                    {member.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="text-base font-bold text-[#0B0B0F]">{member.name}</div>
                  <div className="text-xs text-[#0047AB] font-medium">{member.role}</div>
                </div>
                {member.bio && (
                  <p className="text-xs text-[#4B5563] leading-relaxed">{member.bio}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </section>
  );
};
