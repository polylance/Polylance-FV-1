import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { truncateAddress } from '../utils/formatters';
import { Gavel, Vote, Plus, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { CompactEmptyState } from '../components/common/CompactEmptyState';
import { Button } from '../components/common/Button';
import { Modal } from '../components/overlay';

export const Dao: React.FC = () => {
  const { address, isConnected, connectWallet } = useWeb3();
  const { daoProposals, castVote, proposeJudgeCandidate } = usePolyLanceData();

  const [candidateAddr, setCandidateAddr] = useState('');
  const [rationale, setRationale] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateAddr || !rationale) return;
    proposeJudgeCandidate(candidateAddr, rationale, address);
    setCandidateAddr('');
    setRationale('');
    setIsModalOpen(false);
  };

  return (
    <PageContainer className="space-y-6 py-6 text-[#0B0B0F]">
      {/* Plain Page Header */}
      <PageHeader
        title="Judge Governance DAO"
        subtitle="Weighted voting power based on verified work certificates."
        actions={
          isConnected ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#0047AB] hover:bg-[#003A8C] text-white px-4 py-2 rounded-[8px] font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Propose arbitrator candidate</span>
            </button>
          ) : (
            <button 
              onClick={connectWallet} 
              className="bg-[#0047AB] hover:bg-[#003A8C] text-white px-4 py-2 rounded-[8px] font-medium text-xs transition-colors cursor-pointer"
            >
              Connect wallet to vote
            </button>
          )
        }
      />

      {/* Governance Note: Clean 1-Line Info Banner */}
      <div className="p-3 border border-[#BFDBFE] bg-[#EFF6FF] rounded-[8px] text-xs text-[#1E40AF] flex items-center gap-2.5">
        <AlertCircle size={15} className="text-[#0047AB] shrink-0" />
        <p className="leading-snug max-w-[720px]">
          <strong>Governance rule:</strong> Arbitrator elections require a minimum quorum of 50,000 verified work certificate votes. Platform admins fulfill duties if quorum is not reached.
        </p>
      </div>

      {/* Active Proposals Grid */}
      <div className="space-y-4">
        <h2 className="text-[16px] font-semibold text-[#0B0B0F] flex items-center gap-2">
          <Gavel size={16} className="text-[#0047AB]" /> Active judge election proposals
        </h2>

        <div className="space-y-4">
          {daoProposals.length === 0 ? (
            <div className="py-4">
              <CompactEmptyState
                title="No active judge election proposals"
                description="There are currently no active arbitrator nomination proposals."
                action={
                  isConnected ? {
                    label: "Propose arbitrator candidate",
                    onClick: () => setIsModalOpen(true),
                  } : undefined
                }
              />
            </div>
          ) : (
            daoProposals.map((prop) => {
              const totalVotes = prop.votesFor + prop.votesAgainst;
              const forPercent = totalVotes > 0 ? Math.round((prop.votesFor / totalVotes) * 100) : 50;

              return (
                <div key={prop.id} className="p-6 border border-[#E5E7EB] bg-white rounded-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-3">
                    <div>
                      <h3 className="text-[16px] font-semibold text-[#0B0B0F]">
                        Nominate {truncateAddress(prop.candidate)} as arbitrator
                      </h3>
                      <p className="text-[12px] text-[#4B5563] font-mono mt-0.5">Proposed by: {truncateAddress(prop.proposer)}</p>
                    </div>

                    <span className="bg-[#F6F7F9] border border-[#E5E7EB] px-3 py-1 rounded-full text-[12px] text-[#0B0B0F] font-medium">
                      Status: {prop.status}
                    </span>
                  </div>

                  <p className="text-[13px] text-[#4B5563] bg-[#F6F7F9] p-3.5 rounded-lg border border-[#E5E7EB] leading-relaxed">
                    {prop.rationale}
                  </p>

                  {/* Vote Bar */}
                  <div className="space-y-1.5 text-[12px]">
                    <div className="flex justify-between font-medium">
                      <span className="text-emerald-700">For: {prop.votesFor} votes</span>
                      <span className="text-rose-700">Against: {prop.votesAgainst} votes</span>
                    </div>
                    <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-600 h-full" style={{ width: `${forPercent}%` }} />
                      <div className="bg-rose-600 h-full flex-1" />
                    </div>
                  </div>

                  {prop.status === 'Active' && isConnected && (
                    <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                      {prop.userVoted ? (
                        <span className="text-[12px] text-[#0B0B0F] font-medium bg-[#F6F7F9] px-3 py-1.5 rounded-lg border border-[#E5E7EB] flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-[#0047AB]" />
                          Your vote recorded: {prop.userVoted === 'FOR' ? 'For' : 'Against'}
                        </span>
                      ) : (
                        <div className="flex gap-2.5 ml-auto">
                          <button
                            onClick={() => castVote(prop.id, false, address)}
                            className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
                          >
                            Vote against
                          </button>
                          <button
                            onClick={() => castVote(prop.id, true, address)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
                          >
                            Vote for
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Propose Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
        title="Nominate judge candidate"
        subtitle="Submit a candidate address and credentials for DAO community voting."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!candidateAddr.trim() || !rationale.trim()}
              onClick={(e) => handleCreateProposal(e as any)}
            >
              Submit candidate proposal
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateProposal} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Candidate address *
            </label>
            <input
              type="text"
              required
              placeholder="0x..."
              value={candidateAddr}
              onChange={(e) => setCandidateAddr(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nomination rationale and credentials *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Detail candidate's smart contract audit credentials and community trust..."
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] outline-none resize-none leading-relaxed"
            />
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
