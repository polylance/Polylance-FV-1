import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { listVideos, VideoManifestEntry } from '../media';
import { VideoSlot } from '../components/video/VideoSlot';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { VideoPlaceholder } from '../components/video/VideoPlaceholder';
import { DeviceFrame } from '../components/video/DeviceFrame';
import { WatchButton } from '../components/video/WatchButton';
import { VideoModal, useVideoModal } from '../components/video/VideoModal';
import { Layers, Sliders, Play, Video } from 'lucide-react';
import { PolyLanceSelect, SelectOption } from '../components/PolyLanceSelect';
import { generateCertificateSvg, renderCertificateToPng } from '../utils/certificateGenerator';

const FILTER_TYPE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All Types' },
  { value: 'standard', label: 'Standard' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'component', label: 'Component' },
];

export const MediaLab: React.FC = () => {
  const allVideos = listVideos();
  const [filterType, setFilterType] = useState<string>('all');
  const [simReducedMotion, setSimReducedMotion] = useState(false);
  const [simDataSaver, setSimDataSaver] = useState(false);
  const [simulatedReadyId, setSimulatedReadyId] = useState<string | null>(null);

  const { activeVideoId, isOpen, openVideo, closeVideo, triggerRef } = useVideoModal();

  const filteredVideos = allVideos.filter((v) => {
    if (filterType === 'all') return true;
    return v.type === filterType;
  });

  return (
    <PageContainer className="py-8 space-y-10 text-[#0B0B0F]">
      
      {/* ── HEADER & DEV CONTROLS ── */}
      <section className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-6 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-[6px] bg-[#FEF3C7] text-[#92400E] text-xs font-mono font-medium">
              DEV ONLY ENVIRONMENT
            </div>
            <h1 className="font-sans font-semibold text-2xl text-[#0B0B0F]">
              Media Lab & Video Slot Inspector
            </h1>
            <p className="text-xs text-[#4B5563]">
              Verify zero layout shift, accessibility, coming-soon states, and simulation toggles.
            </p>
          </div>

          <div className="text-xs font-mono text-[#6B7280]">
            Total Manifest Entries: {allVideos.length}
          </div>
        </div>

        {/* Simulation Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <label className="flex items-center gap-2 p-2.5 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] cursor-pointer hover:bg-[#E5E7EB]/50 transition-colors">
            <input
              type="checkbox"
              checked={simReducedMotion}
              onChange={(e) => setSimReducedMotion(e.target.checked)}
              className="accent-[#0047AB]"
            />
            <span className="font-medium text-[#0B0B0F]">Simulate Reduced Motion</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] cursor-pointer hover:bg-[#E5E7EB]/50 transition-colors">
            <input
              type="checkbox"
              checked={simDataSaver}
              onChange={(e) => setSimDataSaver(e.target.checked)}
              className="accent-[#0047AB]"
            />
            <span className="font-medium text-[#0B0B0F]">Simulate Data Saver</span>
          </label>

          <div className="flex items-center gap-2 p-2 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px]">
            <span className="text-xs text-[#4B5563] font-medium">Type Filter:</span>
            <PolyLanceSelect
              value={filterType}
              onChange={setFilterType}
              options={FILTER_TYPE_OPTIONS}
              size="sm"
              className="w-36"
            />
          </div>
        </div>
      </section>

      {/* ── HERO DEVICE FRAME PREVIEW ── */}
      <section className="space-y-3 text-left">
        <h2 className="font-sans font-semibold text-lg text-[#0B0B0F] flex items-center gap-2">
          <Video size={16} className="text-[#0047AB]" />
          <span>DeviceFrame + Hero Ambient Slot Preview</span>
        </h2>
        <div className="max-w-2xl mx-auto">
          <DeviceFrame>
            <VideoSlot id="hero-loop" />
          </DeviceFrame>
        </div>
      </section>

      {/* ── WATCHBUTTON SAMPLES ── */}
      <section className="space-y-3 text-left bg-white border border-[#E5E7EB] rounded-[12px] p-5">
        <h2 className="font-sans font-semibold text-sm text-[#0B0B0F]">
          WatchButton Dev Preview (shows dev chip when coming-soon)
        </h2>
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <WatchButton id="intro-30s" onOpen={openVideo} />
          <WatchButton id="task-connect-wallet" onOpen={openVideo} />
          <WatchButton id="first-payment-proof" onOpen={openVideo} />
          <WatchButton id="get-paid-cash-out" onOpen={openVideo} />
        </div>
      </section>

      {/* ── ALL MANIFEST ENTRIES GRID ── */}
      <section className="space-y-4 text-left">
        <h2 className="font-sans font-semibold text-lg text-[#0B0B0F]">
          All Manifest Entries ({filteredVideos.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((entry) => {
            const isSimReady = simulatedReadyId === entry.id;
            const currentEntry: VideoManifestEntry = isSimReady
              ? {
                  ...entry,
                  status: 'ready',
                  sources: {
                    webm: '/media/hero/hero-loop.webm',
                    mp4: '/media/hero/hero-loop.mp4'
                  }
                }
              : entry;

            return (
              <div
                key={entry.id}
                className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                {/* Meta details */}
                <div className="flex items-center justify-between text-xs border-b border-[#E5E7EB] pb-2">
                  <span className="font-mono font-semibold text-[#0B0B0F] truncate max-w-[150px]">
                    {entry.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-[#F6F7F9] border border-[#E5E7EB] text-[10px] font-mono">
                      {entry.aspect}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#E7EEF9] text-[#0047AB] text-[10px] font-semibold">
                      {entry.type}
                    </span>
                  </div>
                </div>

                {/* The Slot Preview */}
                <div className="w-full">
                  <VideoSlot id={entry.id} onPlaceholderClick={() => openVideo(entry.id)} />
                </div>

                {/* Dev Actions */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setSimulatedReadyId(isSimReady ? null : entry.id)}
                    className="text-[11px] font-medium text-[#0047AB] hover:underline"
                  >
                    {isSimReady ? 'Revert to Coming Soon' : 'Simulate Ready State'}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => openVideo(entry.id, e)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4B5563] hover:text-[#0B0B0F]"
                  >
                    <Play size={11} />
                    <span>Open in Modal</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SOULBOUND CERTIFICATE ARTWORK STUDIO (STEP 2 INSPECTION) ── */}
      <section className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 sm:p-8 space-y-6 text-left shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-[#EFF6FF] text-[#0047AB] text-xs font-mono font-bold">
              ERC-5192 SOULBOUND STUDIO
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0B0B0F] mt-1">
              PolyLance Verified Work Certificate Artwork
            </h2>
            <p className="text-xs text-[#4B5563]">
              1000x1000 square master SVG & PNG outputs. Background #FAFAF8, thin double border, concentric security guilloche lines, PolyLance vector seal, and official Polygon logo.
            </p>
          </div>
          <div className="text-xs font-mono text-[#6B7280]">
            Target budget: &lt;800 KB per PNG
          </div>
        </div>

        {/* Dual Variant Inspection Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Variant 1: Proof of Work (Freelancer) */}
          <div className="space-y-4 p-5 rounded-[12px] bg-[#FAFAF8] border border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#0047AB] uppercase tracking-wider block">
                  Variant 1: Proof of Work
                </span>
                <span className="text-xs text-[#4B5563]">Awarded to Freelancer (Cobalt Accents #0047AB)</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-white border border-[#E5E7EB] font-mono font-semibold">
                PL-SBT #7108
              </span>
            </div>

            <div className="w-full max-w-[420px] mx-auto aspect-square rounded-[12px] border border-[#E5E7EB] overflow-hidden bg-[#FAFAF8] shadow-sm">
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{
                  __html: generateCertificateSvg({
                    tokenId: 7108,
                    variant: 'work',
                    jobTitle: 'Cross-Chain Smart Contract Vault Audit',
                    recipientAddress: '0x4386767675D3b08e2fE7bE309c647b7Fa5D1E81D',
                    recipientName: 'Alex Rivera',
                    clientAddress: '0x71C840A96B7b72F8B6d42E5c6A7Ff6E6E6cD0092',
                    clientName: 'Nexus Labs',
                    amount: 2500,
                    tokenSymbol: 'USDC',
                    completedAt: Date.now() - 86400 * 2000,
                  }),
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={async () => {
                  const svg = generateCertificateSvg({
                    tokenId: 7108,
                    variant: 'work',
                    jobTitle: 'Cross-Chain Smart Contract Vault Audit',
                    recipientAddress: '0x4386767675D3b08e2fE7bE309c647b7Fa5D1E81D',
                    amount: 2500,
                    completedAt: Date.now(),
                  });
                  const blob = await renderCertificateToPng(svg);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'PolyLance-ProofOfWork-Sample-7108.png';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#0047AB] text-white hover:bg-[#003882] font-semibold transition-colors cursor-pointer"
              >
                Download Work PNG
              </button>
              <Link
                to="/certificate/7108"
                className="text-[#0047AB] hover:underline font-semibold"
              >
                View Public Page &rarr;
              </Link>
            </div>
          </div>

          {/* Variant 2: Patronage (Client) */}
          <div className="space-y-4 p-5 rounded-[12px] bg-[#FAFAF8] border border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#0B0B0F] uppercase tracking-wider block">
                  Variant 2: Patronage
                </span>
                <span className="text-xs text-[#4B5563]">Awarded to Client (Near-Black Accents #0B0B0F)</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-white border border-[#E5E7EB] font-mono font-semibold">
                PL-SBT #7109
              </span>
            </div>

            <div className="w-full max-w-[420px] mx-auto aspect-square rounded-[12px] border border-[#E5E7EB] overflow-hidden bg-[#FAFAF8] shadow-sm">
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{
                  __html: generateCertificateSvg({
                    tokenId: 7109,
                    variant: 'patronage',
                    jobTitle: 'Decentralized Identity (DID) EIP-6963 Integration',
                    recipientAddress: '0x71C840A96B7b72F8B6d42E5c6A7Ff6E6E6cD0092',
                    recipientName: 'Nexus Labs',
                    clientAddress: '0x4386767675D3b08e2fE7bE309c647b7Fa5D1E81D',
                    clientName: 'Alex Rivera',
                    amount: 1800,
                    tokenSymbol: 'USDC',
                    completedAt: Date.now() - 86400 * 5000,
                  }),
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={async () => {
                  const svg = generateCertificateSvg({
                    tokenId: 7109,
                    variant: 'patronage',
                    jobTitle: 'Decentralized Identity (DID) EIP-6963 Integration',
                    recipientAddress: '0x71C840A96B7b72F8B6d42E5c6A7Ff6E6E6cD0092',
                    amount: 1800,
                    completedAt: Date.now(),
                  });
                  const blob = await renderCertificateToPng(svg);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'PolyLance-Patronage-Sample-7109.png';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#0B0B0F] text-white hover:bg-black font-semibold transition-colors cursor-pointer"
              >
                Download Patronage PNG
              </button>
              <Link
                to="/certificate/7109"
                className="text-[#0B0B0F] hover:underline font-semibold"
              >
                View Public Page &rarr;
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Global Video Modal */}
      <VideoModal
        id={activeVideoId}
        isOpen={isOpen}
        onClose={closeVideo}
        triggerRef={triggerRef}
      />
    </PageContainer>
  );
};

export default MediaLab;
