import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  ShieldCheck,
  LifeBuoy,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Send,
  HelpCircle,
  FileText,
  Clock,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  Wallet
} from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { useWeb3 } from '../context/Web3Context';

interface ContactChannel {
  id: string;
  title: string;
  email: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  sla: string;
  suggestedSubject: string;
  checklist: string[];
}

const CHANNELS: ContactChannel[] = [
  {
    id: 'security',
    title: 'Security & Vulnerability Reports',
    email: 'security@polylance.codes',
    badge: 'Priority Response',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: ShieldAlert,
    description: 'For reporting smart contract bugs, critical vulnerabilities, or responsible protocol disclosures.',
    sla: '< 12 Hours SLA',
    suggestedSubject: '[Security Disclosure] Bug Report on PolyLance Protocol',
    checklist: [
      'Affected smart contract function or UI component',
      'Severity assessment (Critical, High, Medium, Low)',
      'Step-by-step reproduction instructions or PoC',
      'Polygon wallet address for bounty acknowledgment'
    ]
  },
  {
    id: 'support',
    title: 'Escrow & Platform Support',
    email: 'support@polylance.codes',
    badge: 'Platform Assistance',
    badgeColor: 'bg-blue-50 text-[#0047AB] border-blue-200',
    icon: LifeBuoy,
    description: 'For milestone payment inquiries, escrow deposit/release guidance, dispute review, or account questions.',
    sla: '< 24 Hours SLA',
    suggestedSubject: '[Support Request] Escrow / Account Assistance',
    checklist: [
      'Your connected Polygon wallet address',
      'Associated Job ID or Job Title (if applicable)',
      'Transaction hash from Polygonscan (if deposit/release issue)',
      'Detailed description of the issue or error encountered'
    ]
  },
  {
    id: 'partnerships',
    title: 'Partnerships & DAO Governance',
    email: 'team@polylance.codes',
    badge: 'Ecosystem & Media',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Sparkles,
    description: 'For developer tooling integrations, Polygon ecosystem collaborations, agency hiring, or press inquiries.',
    sla: '1–2 Business Days',
    suggestedSubject: '[Partnership Inquiry] Collaboration with PolyLance',
    checklist: [
      'Company, protocol, or DAO organization name',
      'Overview of proposed integration or partnership',
      'Relevant links (GitHub, website, documentation)',
      'Preferred communication channel or meeting timeline'
    ]
  }
];

export const ContactPage: React.FC = () => {
  const { address, isConnected } = useWeb3();
  const [selectedChannelId, setSelectedChannelId] = useState<string>('security');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);

  // Optional customizer fields for prefilling message
  const [customWallet, setCustomWallet] = useState<string>(address || '');
  const [referenceId, setReferenceId] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');

  const currentChannel = CHANNELS.find((c) => c.id === selectedChannelId) || CHANNELS[0];

  const handleCopy = (text: string, type: 'email' | 'template') => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      if (type === 'email') {
        setCopiedEmail(text);
        setTimeout(() => setCopiedEmail(null), 2500);
      } else {
        setCopiedTemplate(true);
        setTimeout(() => setCopiedTemplate(false), 2500);
      }
    }
  };

  // Build formatted email body template
  const generateEmailBody = (): string => {
    const lines = [
      `Hello PolyLance Team,`,
      ``,
      `I am reaching out regarding: ${currentChannel.title}`,
      ``,
      `--- INQUIRY DETAILS ---`,
      `User Wallet: ${customWallet || (isConnected ? address : 'Not connected')}`,
      referenceId ? `Reference (Job ID / Tx Hash / Issue): ${referenceId}` : `Reference: [Enter Job ID or Transaction Hash if relevant]`,
      ``,
      `--- DESCRIPTION ---`,
      userNotes || `[Please describe your inquiry, question, or findings here in detail]`,
      ``,
      `--- CHECKLIST COMPLETED ---`,
      ...currentChannel.checklist.map((item) => `[x] ${item}`),
      ``,
      `Thank you,`,
      `Sent via PolyLance Contact Hub (polylance.codes)`
    ];
    return lines.join('\n');
  };

  const emailBody = generateEmailBody();
  const encodedSubject = encodeURIComponent(currentChannel.suggestedSubject);
  const encodedBody = encodeURIComponent(emailBody);

  // Dynamic Mail Links
  const mailtoUrl = `mailto:${currentChannel.email}?subject=${encodedSubject}&body=${encodedBody}`;
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(currentChannel.email)}&su=${encodedSubject}&body=${encodedBody}`;
  const outlookComposeUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(currentChannel.email)}&subject=${encodedSubject}&body=${encodedBody}`;

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#0B0B0F] font-sans pb-20">
      <Seo routeKey="/contact" />

      {/* Hero Header */}
      <section className="relative pt-12 pb-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E7EEF9] border border-[#BFDBFE] text-[#0047AB] text-xs font-semibold mb-5 shadow-xs">
          <Mail size={13} className="text-[#0047AB]" />
          <span>Official PolyLance Communication Channels</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B0B0F] tracking-tight">
          Contact our team
        </h1>

        <p className="mt-3.5 text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
          Need help with non-custodial escrows, want to report a security disclosure, or have questions about our decentralized protocol? We are here to assist.
        </p>

        {/* Channel Selection Tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl max-w-xl mx-auto backdrop-blur-xs">
          {CHANNELS.map((ch) => {
            const isSelected = ch.id === selectedChannelId;
            const IconComponent = ch.icon;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChannelId(ch.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-[#0047AB] shadow-xs'
                    : 'text-slate-600 hover:text-[#0B0B0F] hover:bg-white/50'
                }`}
              >
                <IconComponent size={15} />
                <span>{ch.id === 'security' ? 'Security' : ch.id === 'support' ? 'Support' : 'Partnership'}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Grid Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Direct Channels Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CHANNELS.map((channel) => {
            const isCurrent = channel.id === selectedChannelId;
            const Icon = channel.icon;
            const isCopied = copiedEmail === channel.email;

            return (
              <div
                key={channel.id}
                onClick={() => setSelectedChannelId(channel.id)}
                className={`relative rounded-2xl p-6 bg-white border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isCurrent
                    ? 'border-[#0047AB] ring-2 ring-[#0047AB]/10 shadow-md'
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#0047AB]">
                      <Icon size={20} />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${channel.badgeColor}`}>
                      {channel.badge}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-[#0B0B0F]">
                    {channel.title}
                  </h2>
                  <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
                    {channel.description}
                  </p>

                  <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#0047AB] truncate">
                      {channel.email}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(channel.email, 'email');
                      }}
                      className="p-1 rounded-md text-slate-500 hover:text-[#0047AB] hover:bg-white transition-colors"
                      title="Copy email address"
                      aria-label={`Copy ${channel.email}`}
                    >
                      {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock size={12} className="text-slate-400" />
                    {channel.sla}
                  </span>
                  <span className="text-[#0047AB] font-semibold text-xs flex items-center gap-0.5">
                    Select Channel <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Selected Channel Interactive Action Box */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentChannel.badgeColor}`}>
                  Active Channel
                </span>
                <span className="text-xs text-[#6B7280]">Response target: {currentChannel.sla}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0B0B0F] mt-1.5">
                {currentChannel.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#4B5563] mt-0.5">
                Direct recipient: <span className="font-mono font-semibold text-[#0047AB]">{currentChannel.email}</span>
              </p>
            </div>

            {/* Quick Action Email Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <a
                href={gmailComposeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0047AB] hover:bg-[#003A8C] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs"
              >
                <Send size={14} />
                <span>Open in Gmail</span>
                <ExternalLink size={12} className="opacity-70" />
              </a>

              <a
                href={mailtoUrl}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs"
              >
                <Mail size={14} />
                <span>Open Mail App</span>
              </a>

              <a
                href={outlookComposeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                title="Compose using Outlook Web"
              >
                <span>Outlook Web</span>
                <ExternalLink size={12} className="opacity-70" />
              </a>
            </div>
          </div>

          {/* Details & Information Required Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
            {/* Left: What to Include */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#0047AB]" />
                <h3 className="font-bold text-sm text-[#0B0B0F] uppercase tracking-wider">
                  What to include in your message
                </h3>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                To help our engineers and support coordinators resolve your request quickly, please include these details:
              </p>

              <ul className="space-y-2.5">
                {currentChannel.checklist.map((item, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-xs text-[#374151]">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} />
                    </div>
                    <span className="leading-tight pt-0.5">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 p-3.5 rounded-2xl bg-[#E7EEF9]/60 border border-[#BFDBFE] text-xs text-[#0047AB] flex items-start gap-2.5">
                <ShieldCheck size={16} className="shrink-0 mt-0.5 text-[#0047AB]" />
                <div className="leading-relaxed">
                  <span className="font-semibold">Privacy Guaranteed:</span> PolyLance does not request private keys, seed phrases, or passwords. Never share your secret keys with anyone.
                </div>
              </div>
            </div>

            {/* Right: Message Customizer & Preview */}
            <div className="lg:col-span-7 space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#0B0B0F]">
                  Message Template Preview
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopy(emailBody, 'template')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-[#0047AB] hover:border-blue-300 transition-colors cursor-pointer"
                >
                  {copiedTemplate ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedTemplate ? 'Copied Draft!' : 'Copy Draft'}</span>
                </button>
              </div>

              {/* Optional Quick Input Helpers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                    Your Wallet Address (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="0x..."
                      value={customWallet}
                      onChange={(e) => setCustomWallet(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-[#0B0B0F] focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
                    />
                    {isConnected && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        Connected
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                    Job ID / Tx Hash (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. #job-12 or 0xab3..."
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#0B0B0F] focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                  Brief Summary / Message Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter a brief summary of what you are contacting us about..."
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#0B0B0F] focus:outline-none focus:ring-2 focus:ring-[#0047AB] resize-none"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 whitespace-pre-wrap max-h-36 overflow-y-auto select-all">
                {emailBody}
              </div>

              {/* Bottom Launch Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-[#6B7280]">
                  Clicking will open your email with this recipient &amp; text loaded.
                </span>

                <a
                  href={gmailComposeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-[#0047AB] hover:bg-[#003A8C] text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Send size={13} />
                  <span>Send via Gmail Now</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Self-Service Links */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/faq"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0047AB] flex items-center justify-center">
                <HelpCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors">
                  Frequently Asked Questions
                </h4>
                <p className="text-xs text-[#6B7280]">
                  Find instant answers about fees, escrow, and SBT certificates.
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/security"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0B0B0F] group-hover:text-emerald-700 transition-colors">
                  Security Architecture &amp; Audits
                </h4>
                <p className="text-xs text-[#6B7280]">
                  Learn how non-custodial smart contracts protect your funds.
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </section>
      </main>
    </div>
  );
};

export default ContactPage;
