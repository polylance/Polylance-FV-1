import React, { useState } from 'react';
import { Application, SkillCategory } from '../types';
import { truncateAddress } from '../utils/formatters';
import { CheckCircle2, UserCheck, ArrowUpDown, ExternalLink, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ApplicantTableProps {
  applications: Application[];
  category: SkillCategory;
  onSelect: (applicantAddress: string) => void;
  isClient: boolean;
}

export const ApplicantTable: React.FC<ApplicantTableProps> = ({
  applications,
  category,
  onSelect,
  isClient,
}) => {
  const [sortField, setSortField] = useState<'score' | 'appliedAt'>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'score' | 'appliedAt') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedApplicants = [...applications].sort((a, b) => {
    const mult = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'score') {
      return mult * (a.githubScore - b.githubScore);
    }
    return mult * (a.appliedAt - b.appliedAt);
  });

  if (applications.length === 0) {
    return (
      <div className="glass-panel p-8 text-center border-slate-200 bg-white hard-shadow">
        <Code2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-slate-900">No Applications Submitted Yet</h4>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          When freelancers apply, their verified GitHub skill scores and proposal hashes will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel border-purple-200 overflow-hidden bg-white hard-shadow space-y-0">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 font-heading">
            Applicants ({applications.length})
          </h3>
          <p className="text-xs text-slate-600 font-mono">
            Sorted by relevance to job category: <span className="text-purple-700 font-bold uppercase">{category}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSort('score')}
            className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all cursor-pointer font-mono font-bold ${
              sortField === 'score'
                ? 'bg-purple-100 border-purple-300 text-purple-950 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Sort by Score <ArrowUpDown size={13} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-purple-900 text-white uppercase tracking-wider font-mono text-[11px] font-extrabold">
            <tr>
              <th className="p-4">Applicant Wallet</th>
              <th className="p-4">GitHub Verified Score</th>
              <th className="p-4">Skills</th>
              <th className="p-4">Proposal (IPFS)</th>
              {isClient && <th className="p-4 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedApplicants.map((app) => (
              <tr key={app.applicant} className="hover:bg-purple-50/50 transition-colors">
                <td className="p-4">
                  <Link
                    to={`/profile/${app.applicant}`}
                    className="font-mono text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1.5 font-bold text-sm"
                  >
                    <span>{truncateAddress(app.applicant)}</span>
                    <ExternalLink size={13} className="text-purple-500" />
                  </Link>
                </td>

                <td className="p-4">
                  {app.githubVerified ? (
                    <div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-extrabold text-emerald-700 text-sm">{app.githubScore}</span>
                        <span className="text-slate-400 font-bold">/ 1000</span>
                        <CheckCircle2 size={14} className="text-emerald-600 ml-0.5" />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Primary: <strong className="text-purple-900 capitalize font-bold">{category}</strong>
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Unverified</span>
                  )}
                </td>

                <td className="p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {app.applicantSkills.map((sk) => (
                      <span
                        key={sk}
                        className="bg-purple-100 text-purple-950 px-2.5 py-0.5 rounded border border-purple-200 text-[10px] font-mono font-bold"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="p-4 max-w-xs">
                  <p className="text-slate-800 font-medium text-xs line-clamp-2 leading-relaxed">{app.proposalText}</p>
                  <span className="text-[10px] font-mono text-purple-700 font-bold block mt-1 truncate">
                    IPFS CID: {app.proposalIpfsHash.slice(0, 16)}...
                  </span>
                </td>

                {isClient && (
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onSelect(app.applicant)}
                      className="gradient-btn-emerald px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto shadow-xs cursor-pointer"
                    >
                      <UserCheck size={14} />
                      Select Freelancer
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
