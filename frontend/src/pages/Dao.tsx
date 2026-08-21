import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { truncateAddress } from '../utils/formatters';
import { Gavel, Vote, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '../components/UIStates';

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
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      {/* Top Banner matching dao_judge_governance/code.html */}
      <div className="glass-panel p-6 sm:p-8 border-purple-200 bg-white hard-shadow flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              <Vote className="text-purple-700" /> Judge Governance DAO
            </h1>
            <span className="bg-purple-100 text-purple-900 border border-purple-200 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
              JudgeDAO.sol (Governor)
            </span>
          </div>
          <p className="text-xs text-slate-600 font-mono">
            ReputationSBT (ERC-721 Votes Token) Weighted Voting Power
          </p>
        </div>

        <div>
          {isConnected ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="gradient-btn-primary px-6 py-3 rounded-xl font-headline font-bold text-xs flex items-center gap-2"
            >
              <Plus size={16} /> Propose Arbitrator Candidate
            </button>
          ) : (
            <button onClick={connectWallet} className="gradient-btn-primary px-6 py-3 rounded-xl font-headline font-bold text-xs">
              Connect Wallet to Vote
            </button>
          )}
        </div>
      </div>

      {/* Honest Governance Note Banner */}
      <div className="glass-panel p-4 border-amber-300 bg-amber-50 text-amber-900 text-xs font-mono flex items-center gap-3">
        <AlertCircle size={20} className="text-amber-700 shrink-0" />
        <p>
          <strong>Honest Decentralization Note:</strong> Currently, arbitrator elections require a minimum of 50,000 ReputationSBT votes. Platform admins step in to fulfill arbitrator duties if DAO quorum is not reached.
        </p>
      </div>

      {/* Active Proposals Grid matching reference HTML */}
      <div className="space-y-6">
        <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
          <Gavel size={18} className="text-purple-700" /> Active Judge Election Proposals
        </h3>

        <div className="space-y-4">
          {daoProposals.length === 0 ? (
            <div className="py-2">
              <EmptyState
                title="No Active Judge Election Proposals"
                description="There are currently no active arbitrator nomination proposals. Nominate a candidate to initiate decentralized dispute resolution voting."
                actionText={isConnected ? "Propose Arbitrator Candidate" : "Connect Wallet to Vote"}
                onAction={isConnected ? () => setIsModalOpen(true) : connectWallet}
              />
            </div>
          ) : (
            daoProposals.map((prop) => {
              const totalVotes = prop.votesFor + prop.votesAgainst;
              const forPercent = totalVotes > 0 ? Math.round((prop.votesFor / totalVotes) * 100) : 50;

            return (
              <div key={prop.id} className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-headline text-base font-bold text-slate-900">
                      Nominate {truncateAddress(prop.candidate)} as Arbitrator
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">Proposed by: {truncateAddress(prop.proposer)}</p>
                  </div>

                  <span className="bg-purple-50 border border-purple-200 px-3 py-1 rounded-full text-xs font-mono text-purple-900 font-bold">
                    Status: {prop.status}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {prop.rationale}
                </p>

                {/* Vote Bar */}
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-bold">For: {prop.votesFor} SBT</span>
                    <span className="text-rose-700 font-bold">Against: {prop.votesAgainst} SBT</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200 flex">
                    <div className="bg-emerald-600 h-full" style={{ width: `${forPercent}%` }} />
                    <div className="bg-rose-500 h-full flex-1" />
                  </div>
                </div>

                {prop.status === 'Active' && isConnected && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                    {prop.userVoted ? (
                      <span className="text-xs font-mono text-purple-950 font-black bg-purple-50 px-3.5 py-2 rounded-xl border border-purple-200 flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 size={14} className="text-purple-700" />
                        Your One-Time Vote Recorded: {prop.userVoted === 'FOR' ? 'For 👍' : 'Against 👎'}
                      </span>
                    ) : (
                      <div className="flex gap-3 ml-auto">
                        <button
                          onClick={() => castVote(prop.id, false, address)}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Vote Against
                        </button>
                        <button
                          onClick={() => castVote(prop.id, true, address)}
                          className="gradient-btn-emerald px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Vote For
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="glass-panel max-w-lg w-full p-6 space-y-4 border-purple-200 bg-white shadow-xl">
            <h3 className="font-headline text-lg font-bold text-slate-900">Nominate Judge Candidate</h3>
            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Candidate Ethereum Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={candidateAddr}
                  onChange={(e) => setCandidateAddr(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nomination Rationale & Track Record *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail candidate's smart contract audit credentials and community trust..."
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button type="submit" className="gradient-btn-primary px-5 py-2 rounded-xl text-xs font-bold">
                  Submit Candidate Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
