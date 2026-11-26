import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  User,
  Briefcase,
  Eye,
  Plus,
  Trash2
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { getCategories, getCategoryBySlug, searchSkills } from '../utils/taxonomy';
import { truncateAddress } from '../utils/formatters';

const STORAGE_KEY = 'polylance_onboarding_welcome_v1';

export const OnboardingWelcomePage: React.FC = () => {
  const { address } = useWeb3();
  const { updateProfile } = usePolyLanceData();
  const navigate = useNavigate();

  const categories = getCategories();

  // Load initial state from sessionStorage
  const [step, setStep] = useState<number>(0);
  const [role, setRole] = useState<'freelancer' | 'client'>('freelancer');
  const [primaryCategorySlug, setPrimaryCategorySlug] = useState<string>('development-it');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>('');

  // Universal profile fields
  const [displayName, setDisplayName] = useState<string>('');
  const [headline, setHeadline] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<string>('50');
  const [preferredToken, setPreferredToken] = useState<'USDC' | 'POL'>('USDC');
  const [availability, setAvailability] = useState<'full_time' | 'part_time' | 'not_available'>('full_time');

  // Category-specific fields
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [portfolioUrl, setPortfolioUrl] = useState<string>('');
  const [showreelUrl, setShowreelUrl] = useState<string>('');
  const [caseStudyUrl, setCaseStudyUrl] = useState<string>('');
  const [sampleProjectUrl, setSampleProjectUrl] = useState<string>('');

  // Category 6: Creator Fields
  const [creatorPlatform, setCreatorPlatform] = useState<'youtube' | 'instagram' | 'tiktok' | 'podcast'>('youtube');
  const [creatorHandle, setCreatorHandle] = useState<string>('');
  const [creatorAudience, setCreatorAudience] = useState<string>('');
  const [creatorNiche, setCreatorNiche] = useState<string>('Web3 & Tech');
  const [rateCardItems, setRateCardItems] = useState<Array<{ deliverable: string; priceUsdc: number }>>([
    { deliverable: 'Dedicated Sponsored Video / Feature', priceUsdc: 500 },
    { deliverable: '60-Second Mid-Roll Segment', priceUsdc: 250 }
  ]);

  // Restore saved session on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role) setRole(parsed.role);
        if (parsed.primaryCategorySlug) setPrimaryCategorySlug(parsed.primaryCategorySlug);
        if (parsed.selectedSubcategories) setSelectedSubcategories(parsed.selectedSubcategories);
        if (parsed.selectedSkills) setSelectedSkills(parsed.selectedSkills);
        if (parsed.displayName) setDisplayName(parsed.displayName);
        if (parsed.headline) setHeadline(parsed.headline);
        if (parsed.bio) setBio(parsed.bio);
        if (parsed.hourlyRate) setHourlyRate(parsed.hourlyRate);
        if (parsed.preferredToken) setPreferredToken(parsed.preferredToken);
        if (parsed.availability) setAvailability(parsed.availability);
        if (parsed.githubUsername) setGithubUsername(parsed.githubUsername);
        if (parsed.portfolioUrl) setPortfolioUrl(parsed.portfolioUrl);
        if (parsed.showreelUrl) setShowreelUrl(parsed.showreelUrl);
        if (parsed.creatorPlatform) setCreatorPlatform(parsed.creatorPlatform);
        if (parsed.creatorHandle) setCreatorHandle(parsed.creatorHandle);
        if (parsed.creatorAudience) setCreatorAudience(parsed.creatorAudience);
        if (parsed.creatorNiche) setCreatorNiche(parsed.creatorNiche);
        if (parsed.rateCardItems) setRateCardItems(parsed.rateCardItems);
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  // Save progress on change
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          role,
          primaryCategorySlug,
          selectedSubcategories,
          selectedSkills,
          displayName,
          headline,
          bio,
          hourlyRate,
          preferredToken,
          availability,
          githubUsername,
          portfolioUrl,
          showreelUrl,
          creatorPlatform,
          creatorHandle,
          creatorAudience,
          creatorNiche,
          rateCardItems
        })
      );
    } catch (e) {
      // Ignore
    }
  }, [
    role,
    primaryCategorySlug,
    selectedSubcategories,
    selectedSkills,
    displayName,
    headline,
    bio,
    hourlyRate,
    preferredToken,
    availability,
    githubUsername,
    portfolioUrl,
    showreelUrl,
    creatorPlatform,
    creatorHandle,
    creatorAudience,
    creatorNiche,
    rateCardItems
  ]);

  const activeCategory = useMemo(() => getCategoryBySlug(primaryCategorySlug) || categories[0], [primaryCategorySlug, categories]);

  const skillSuggestions = useMemo(() => {
    if (!skillSearchQuery) return [];
    return searchSkills(skillSearchQuery, primaryCategorySlug).filter((s) => !selectedSkills.includes(s));
  }, [skillSearchQuery, primaryCategorySlug, selectedSkills]);

  const handleToggleSubcategory = (subSlug: string) => {
    if (selectedSubcategories.includes(subSlug)) {
      setSelectedSubcategories(selectedSubcategories.filter((s) => s !== subSlug));
    } else {
      setSelectedSubcategories([...selectedSubcategories, subSlug]);
    }
  };

  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
    setSkillSearchQuery('');
  };

  const handleAddRateCardItem = () => {
    setRateCardItems([...rateCardItems, { deliverable: 'New Custom Deliverable', priceUsdc: 100 }]);
  };

  const handleRemoveRateCardItem = (index: number) => {
    setRateCardItems(rateCardItems.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = async () => {
    if (!address) return;

    const profileData = {
      displayName: displayName || (address ? truncateAddress(address) : 'Decentralized Specialist'),
      headline: headline || `${activeCategory.name} Specialist`,
      bio: bio || 'Verified decentralized specialist on Polygon.',
      role,
      primaryCategory: primaryCategorySlug,
      subcategories: selectedSubcategories,
      skills: selectedSkills,
      hourlyRate: Number(hourlyRate) || 0,
      preferredToken,
      availability,
      githubUsername: githubUsername.trim() || undefined,
      portfolioUrl: portfolioUrl.trim() || undefined,
      showreelUrl: showreelUrl.trim() || undefined,
      creatorProfile:
        primaryCategorySlug === 'creators-brand-collabs'
          ? {
              platform: creatorPlatform,
              handle: creatorHandle.trim(),
              audienceCount: Number(creatorAudience) || 0,
              niche: creatorNiche,
              rateCard: rateCardItems,
              verified: false
            }
          : undefined,
      updatedAt: new Date().toISOString()
    };

    if (updateProfile) {
      await updateProfile(profileData, address);
    }

    sessionStorage.removeItem(STORAGE_KEY);
    navigate(role === 'client' ? '/jobs/post' : `/categories/${primaryCategorySlug}`);
  };

  const getCategoryPaletteClasses = (index: number) => {
    const mod = index % 4;
    switch (mod) {
      case 0:
        return {
          border: 'border-[#FFC21A]',
          bg: 'bg-[#FFC21A]/10',
          badge: 'bg-[#FFC21A] text-black',
          highlight: '#FFC21A'
        };
      case 1:
        return {
          border: 'border-[#FF6A1F]',
          bg: 'bg-[#FF6A1F]/10',
          badge: 'bg-[#FF6A1F] text-white',
          highlight: '#FF6A1F'
        };
      case 2:
        return {
          border: 'border-[#0047AB]',
          bg: 'bg-[#0047AB]/10',
          badge: 'bg-[#0047AB] text-white',
          highlight: '#0047AB'
        };
      case 3:
      default:
        return {
          border: 'border-[#B1122B]',
          bg: 'bg-[#B1122B]/10',
          badge: 'bg-[#B1122B] text-white',
          highlight: '#B1122B'
        };
    }
  };

  const stepsList = [
    { title: 'Role', label: 'Primary Role' },
    { title: 'Domain', label: 'Discipline' },
    { title: 'Skills', label: 'Specialties' },
    { title: 'Profile', label: 'Core Identity' },
    { title: 'Proof', label: 'Proof of Craft' },
    { title: 'Launch', label: 'Review & Live' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white flex flex-col justify-between selection:bg-[#FFC21A] selection:text-black font-sans">
      {/* Onboarding Header */}
      <header className="border-b-2 border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#FFC21A] text-black font-extrabold flex items-center justify-center text-sm border-2 border-white">
              P
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-[#FFC21A] transition-colors">
              PolyLance
            </span>
          </Link>
          <span className="text-xs font-mono uppercase bg-[#B1122B] text-white px-2 py-0.5 border border-white/20 font-bold">
            WELCOME ONBOARDING
          </span>
        </div>

        {/* Step Indicator */}
        <div className="hidden sm:flex items-center gap-1 font-mono text-xs">
          {stepsList.map((s, idx) => (
            <div key={idx} className="flex items-center">
              <span
                className={`px-2.5 py-1 font-bold border-2 transition-colors ${
                  step === idx
                    ? 'bg-[#B1122B] text-white border-white'
                    : step > idx
                    ? 'bg-white text-black border-white'
                    : 'bg-black text-white/50 border-white/20'
                }`}
              >
                0{idx} {s.title}
              </span>
              {idx < stepsList.length - 1 && <span className="text-white/30 px-1">/</span>}
            </div>
          ))}
        </div>

        {/* Wallet Address indicator */}
        <div className="font-mono text-xs text-white/70 bg-white/5 border-2 border-white/20 px-3 py-1">
          {address ? truncateAddress(address) : 'Wallet Not Connected'}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Active Step Form */}
        <div className="lg:col-span-7 bg-[#141417] border-2 border-white p-6 sm:p-8 space-y-6">
          {/* Step 0: Choose Role */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <span className="font-mono text-xs text-[#FFC21A] uppercase tracking-wider block font-bold">
                  STEP 00 &bull; CHOOSE YOUR INTENT
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  How will you use <span className="bg-[#B1122B] text-white px-1.5">PolyLance</span>?
                </h2>
                <p className="text-sm text-white/70 mt-2">
                  Select your primary mode. You can switch roles at any time with the same wallet.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setRole('freelancer')}
                  className={`p-6 border-2 text-left cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A] transition-[transform,background-color,border-color] duration-150 ${
                    role === 'freelancer'
                      ? 'border-[#FFC21A] bg-[#FFC21A]/10 text-white'
                      : 'border-white/20 bg-black/40 text-white/70 hover:border-white/60'
                  }`}
                >
                  <div className="w-10 h-10 border-2 border-current flex items-center justify-center mb-4">
                    <User size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Work as Specialist</h3>
                  <p className="text-xs text-white/60 mt-1">
                    Offer your craft, receive non-custodial escrow deposits, and build verifiable on-chain SBT reputation.
                  </p>
                  <div className="mt-4 font-mono text-[11px] font-bold text-[#FFC21A] flex items-center gap-1">
                    <span>2.5% settlement fee</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`p-6 border-2 text-left cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] transition-[transform,background-color,border-color] duration-150 ${
                    role === 'client'
                      ? 'border-[#0047AB] bg-[#0047AB]/20 text-white'
                      : 'border-white/20 bg-black/40 text-white/70 hover:border-white/60'
                  }`}
                >
                  <div className="w-10 h-10 border-2 border-current flex items-center justify-center mb-4">
                    <Briefcase size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Hire Talent</h3>
                  <p className="text-xs text-white/60 mt-1">
                    Post contracts, lock funds in sovereign smart contract escrows, and inspect deliverables with 7-day review protection.
                  </p>
                  <div className="mt-4 font-mono text-[11px] font-bold text-[#0047AB] flex items-center gap-1">
                    <span>2.5% deposit fee</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Select Primary Discipline */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="font-mono text-xs text-[#FFC21A] uppercase tracking-wider block font-bold">
                  STEP 01 &bull; PRIMARY DOMAIN
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  Pick your primary <span className="bg-[#B1122B] text-white px-1.5">discipline</span>
                </h2>
                <p className="text-sm text-white/70 mt-2">
                  Choose the category that best represents your core specialization on Polygon.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {categories.map((cat, idx) => {
                  const isSelected = primaryCategorySlug === cat.slug;
                  const palette = getCategoryPaletteClasses(idx);

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setPrimaryCategorySlug(cat.slug);
                        setSelectedSubcategories([]);
                      }}
                      className={`p-4 border-2 text-left cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A] transition-[transform,background-color,border-color] duration-150 flex flex-col justify-between ${
                        isSelected
                          ? `${palette.border} bg-white text-black font-bold`
                          : 'border-white/20 bg-black/50 text-white hover:border-white/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] uppercase opacity-70">
                          CAT_0{idx + 1}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[10px]">
                            <Check size={11} />
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <h4 className="text-sm font-bold">{cat.name}</h4>
                        <p className="text-[11px] opacity-70 line-clamp-1 mt-0.5">
                          {cat.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Choose Subcategories & Skills */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="font-mono text-xs text-[#FFC21A] uppercase tracking-wider block font-bold">
                  STEP 02 &bull; SUB-SPECIALTIES & SKILLS
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  Tag your skills in <span className="bg-[#B1122B] text-white px-1.5">{activeCategory.name}</span>
                </h2>
                <p className="text-sm text-white/70 mt-2">
                  Select your sub-disciplines and primary technical or creative proficiencies.
                </p>
              </div>

              {/* Subcategories */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-white/80 block mb-2 font-bold">
                  Select Focus Areas (At least 1)
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeCategory.subcategories.map((sub) => {
                    const isSelected = selectedSubcategories.includes(sub.slug);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleToggleSubcategory(sub.slug)}
                        className={`px-3 py-1.5 text-xs font-semibold border-2 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A] transition-[transform,background-color,border-color] duration-100 ${
                          isSelected
                            ? 'bg-[#FFC21A] text-black border-white'
                            : 'bg-black text-white border-white/20 hover:border-white'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skills Picker & Autocomplete */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-white/80 block mb-2 font-bold">
                  Skill Tags ({selectedSkills.length} selected)
                </label>
                <input
                  type="text"
                  placeholder="Type to search skills (e.g. React, Solidity, Figma)..."
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  className="w-full bg-black border-2 border-white/30 text-white px-3 py-2 text-sm focus:border-[#FFC21A] focus:outline-none placeholder:text-white/30 font-mono"
                />

                {/* Suggestions dropdown */}
                {skillSuggestions.length > 0 && (
                  <div className="mt-2 bg-black border-2 border-white p-2 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {skillSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleToggleSkill(s)}
                        className="px-2.5 py-1 text-xs bg-white/10 hover:bg-[#FFC21A] hover:text-black text-white font-mono cursor-pointer border border-white/20"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Active selected tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selectedSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-black font-bold text-xs border border-white"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleSkill(s)}
                        className="text-black hover:text-[#B1122B] cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {selectedSkills.length === 0 && (
                    <span className="text-xs text-white/40 italic">
                      Pick skills above or click suggested tags from your chosen sub-specialties.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Universal Profile Info */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <span className="font-mono text-xs text-[#FFC21A] uppercase tracking-wider block font-bold">
                  STEP 03 &bull; UNIVERSAL IDENTITY
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  Public Profile & <span className="bg-[#B1122B] text-white px-1.5">Rates</span>
                </h2>
                <p className="text-xs text-[#FFC21A] mt-1 font-mono">
                  &bull; Zero personal data: No email, phone number, or passwords required.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-white/90 mb-1">
                    Display Name or Pseudonym *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Satoshi_Dev or Apex Studio"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-black border-2 border-white/30 text-white px-3 py-2 text-sm focus:border-[#FFC21A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-white/90 mb-1">
                    Headline Hook *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Smart Contract Auditor & Formal Verification Specialist"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full bg-black border-2 border-white/30 text-white px-3 py-2 text-sm focus:border-[#FFC21A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-white/90 mb-1">
                    Bio & Value Proposition *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe your domain experience, verified deliveries, and working style..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-black border-2 border-white/30 text-white px-3 py-2 text-sm focus:border-[#FFC21A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase font-bold text-white/90 mb-1">
                      Hourly Rate ({preferredToken})
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="w-full bg-black border-2 border-white/30 text-white px-3 py-2 text-sm focus:border-[#FFC21A] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase font-bold text-white/90 mb-1">
                      Settlement Token
                    </label>
                    <div className="flex gap-2">
                      {(['USDC', 'POL'] as const).map((tok) => (
                        <button
                          key={tok}
                          type="button"
                          onClick={() => setPreferredToken(tok)}
                          className={`flex-1 py-2 text-xs font-mono font-bold border-2 transition-all cursor-pointer ${
                            preferredToken === tok
                              ? 'bg-[#FFC21A] text-black border-white'
                              : 'bg-black text-white border-white/20 hover:border-white'
                          }`}
                        >
                          {tok}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-white/90 mb-1">
                    Availability
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'full_time', label: 'Full-Time' },
                      { id: 'part_time', label: 'Part-Time' },
                      { id: 'not_available', label: 'Booked' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAvailability(opt.id as any)}
                        className={`py-2 text-xs font-semibold border-2 transition-all cursor-pointer ${
                          availability === opt.id
                            ? 'bg-white text-black border-white'
                            : 'bg-black text-white/70 border-white/20 hover:border-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Category-Specific Specialized Module */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <span className="font-mono text-xs text-[#FFC21A] uppercase tracking-wider block font-bold">
                  STEP 04 &bull; SPECIALIZED MODULE
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  Proof of <span className="bg-[#B1122B] text-white px-1.5">{activeCategory.name}</span>
                </h2>
                <p className="text-sm text-white/70 mt-2">
                  Specialized fields designed specifically for your craft.
                </p>
              </div>

              {/* Developer / AI module */}
              {(primaryCategorySlug === 'development-it' || primaryCategorySlug === 'ai-automation') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase font-bold text-white/90 mb-1">
                      GitHub Username
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. torvalds"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      className="w-full bg-black border-2 border-white/30 text-white px-3 py-2 text-sm focus:border-[#FFC21A] focus:outline-none font-mono"
                    />
                    <span className="text-[10px] text-white/50 block mt-1">
                      Public repository commits and PR history will be linked for client inspection.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase font-bold text-white/90 mb-1">
                      Live Project or Endpoint URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://your-dapp-or-api.com"
                      value={sampleProjectUrl}
                      onChange={(e) => setSampleProjectUrl(e.target.value)}
                      className="w-full bg-black border-2 border-white/30 text-white px-3 py-2 text-sm focus:border-[#FFC21A] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Design Module */}
              {primaryCategorySlug === 'design-creative' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase font-bold text-white/90 mb-1">
                      Portfolio URL (Figma / Behance / Dribbble / Custom)
                    </label>
                    <input
                      type="url"
                      placeholder="https://figma.com/@yourportfolio"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full bg-black border-2 border-white/30 text-white px-3 py-2 text-sm focus:border-[#FFC21A] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Video / Audio Module */}
              {primaryCategorySlug === 'video-audio-animation' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase font-bold text-white/90 mb-1">
                      Showreel URL (YouTube / Vimeo / Loom)
                    </label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={showreelUrl}
                      onChange={(e) => setShowreelUrl(e.target.value)}
                      className="w-full bg-black border-2 border-white/30 text-white px-3 py-2 text-sm focus:border-[#FFC21A] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {/* CATEGORY 6: Creators & Brand Collabs Module */}
              {primaryCategorySlug === 'creators-brand-collabs' && (
                <div className="space-y-5">
                  <div className="p-3 bg-[#FF6A1F]/10 border-2 border-[#FF6A1F] text-xs space-y-1">
                    <strong className="text-[#FF6A1F] block">Creator Transparency Standard:</strong>
                    <span>
                      All audience numbers and deliverables are marked &ldquo;Self-reported, not verified&rdquo;
                      until backed by completed on-chain escrow milestones.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase font-bold text-white/90 mb-1">
                        Primary Platform
                      </label>
                      <select
                        value={creatorPlatform}
                        onChange={(e) => setCreatorPlatform(e.target.value as any)}
                        className="w-full bg-black border-2 border-white/30 text-white px-3 py-2 text-sm focus:border-[#FFC21A] focus:outline-none"
                      >
                        <option value="youtube">YouTube</option>
                        <option value="instagram">Instagram / Reels</option>
                        <option value="tiktok">TikTok / Shorts</option>
                        <option value="podcast">Podcast</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase font-bold text-white/90 mb-1">
                        Channel / Handle
                      </label>
                      <input
                        type="text"
                        placeholder="@yourchannel"
                        value={creatorHandle}
                        onChange={(e) => setCreatorHandle(e.target.value)}
                        className="w-full bg-black border-2 border-white/30 text-white px-3 py-2 text-sm focus:border-[#FFC21A] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase font-bold text-white/90 mb-1">
                        Audience Count (Subscribers / Followers)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={creatorAudience}
                        onChange={(e) => setCreatorAudience(e.target.value)}
                        className="w-full bg-black border-2 border-white/30 text-white px-3 py-2 text-sm focus:border-[#FFC21A] focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase font-bold text-white/90 mb-1">
                        Content Niche
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Polygon & DeFi Education"
                        value={creatorNiche}
                        onChange={(e) => setCreatorNiche(e.target.value)}
                        className="w-full bg-black border-2 border-white/30 text-white px-3 py-2 text-sm focus:border-[#FFC21A] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Rate Card Deliverables */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-mono uppercase font-bold text-white/90">
                        Rate Card Packages (Escrow-Ready)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddRateCardItem}
                        className="text-xs text-[#FFC21A] hover:underline font-mono flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Add Deliverable</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {rateCardItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-black border border-white/20 p-2">
                          <input
                            type="text"
                            value={item.deliverable}
                            onChange={(e) => {
                              const updated = [...rateCardItems];
                              updated[idx].deliverable = e.target.value;
                              setRateCardItems(updated);
                            }}
                            className="flex-1 bg-transparent text-xs text-white px-2 py-1 focus:outline-none font-medium"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={item.priceUsdc}
                              onChange={(e) => {
                                const updated = [...rateCardItems];
                                updated[idx].priceUsdc = Number(e.target.value) || 0;
                                setRateCardItems(updated);
                              }}
                              className="w-20 bg-white/10 text-xs text-right text-white px-2 py-1 focus:outline-none font-mono"
                            />
                            <span className="text-[10px] font-mono text-white/60">USDC</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRateCardItem(idx)}
                            className="text-white/40 hover:text-[#B1122B] px-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Other categories fallback */}
              {!['development-it', 'ai-automation', 'design-creative', 'video-audio-animation', 'creators-brand-collabs'].includes(primaryCategorySlug) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase font-bold text-white/90 mb-1">
                      Case Study or Portfolio Link
                    </label>
                    <input
                      type="url"
                      placeholder="https://yourportfolio.com"
                      value={caseStudyUrl}
                      onChange={(e) => setCaseStudyUrl(e.target.value)}
                      className="w-full bg-black border-2 border-white/30 text-white px-3 py-2 text-sm focus:border-[#FFC21A] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review & Ready to Launch */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <span className="font-mono text-xs text-[#FFC21A] uppercase tracking-wider block font-bold">
                  STEP 05 &bull; DECENTRALIZED LAUNCH
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  Ready to activate on <span className="bg-[#B1122B] text-white px-1.5">Polygon</span>
                </h2>
                <p className="text-sm text-white/70 mt-2">
                  Review your parameters. Your profile will be registered and indexed across category hubs.
                </p>
              </div>

              <div className="border-2 border-white/20 p-4 bg-black/60 space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-white/50">ROLE:</span>
                  <span className="font-bold uppercase text-[#FFC21A]">{role}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-white/50">PRIMARY DOMAIN:</span>
                  <span className="font-bold">{activeCategory.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-white/50">RATE / SETTLEMENT:</span>
                  <span className="font-bold">{hourlyRate} {preferredToken}/hr</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-white/50">CONNECTED WALLET:</span>
                  <span className="font-bold">{address ? truncateAddress(address) : 'None'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-white/50">ON-CHAIN AUDIT:</span>
                  <span className="text-[#FFC21A]">Not yet independently audited &bull; In Public Beta</span>
                </div>
              </div>
            </div>
          )}

          {/* Nav Controls */}
          <div className="pt-6 border-t-2 border-white/10 flex items-center justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 border-2 border-white text-white font-mono text-xs font-bold hover:bg-white/10 flex items-center gap-1.5 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-[transform,background-color] duration-100"
              >
                <ArrowLeft size={13} />
                <span>PREVIOUS</span>
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 bg-[#FFC21A] text-black font-mono text-xs font-extrabold hover:bg-[#e5ad14] flex items-center gap-1.5 cursor-pointer border-2 border-white shadow-[2px_2px_0px_#FFFFFF] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-[transform,background-color] duration-100"
              >
                <span>CONTINUE</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 bg-[#FFC21A] text-black font-mono text-xs font-extrabold hover:bg-[#e5ad14] flex items-center gap-1.5 cursor-pointer border-2 border-white shadow-[2px_2px_0px_#FFFFFF] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-[transform,background-color] duration-100"
              >
                <span>ACTIVATE PROFILE</span>
                <Check size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Updating Preview Panel (Desktop) */}
        <div className="lg:col-span-5 hidden lg:block sticky top-24">
          <div className="border-2 border-white bg-[#141417] p-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-white/10 mb-4">
              <span className="font-mono text-xs text-[#FFC21A] font-bold flex items-center gap-1.5">
                <Eye size={13} />
                <span>LIVE MARKETPLACE PREVIEW</span>
              </span>
              <span className="text-[10px] font-mono text-white/50">Polygon 137</span>
            </div>

            {/* Live Card */}
            <div className="bg-white text-black p-5 border-2 border-black space-y-4 shadow-[4px_4px_0px_#FFC21A]">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 bg-black text-white font-mono font-extrabold flex items-center justify-center text-sm border-2 border-black">
                  {displayName ? displayName.slice(0, 2).toUpperCase() : 'SP'}
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold bg-[#FFC21A] text-black px-2 py-0.5 border border-black inline-block">
                    {hourlyRate} {preferredToken}/hr
                  </span>
                  <span className="block text-[10px] text-black/60 font-mono mt-0.5 capitalize">
                    {availability.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-base leading-tight">
                  {displayName || 'Specialist Name'}
                </h3>
                <p className="text-xs font-semibold text-[#0047AB] mt-0.5">
                  {headline || `${activeCategory.name} Expert`}
                </p>
                <p className="text-xs text-black/70 mt-2 line-clamp-3">
                  {bio || 'Your public introduction and value proposition will render here.'}
                </p>
              </div>

              {/* Skills */}
              <div className="pt-2 border-t border-black/10">
                <span className="text-[10px] font-mono uppercase font-bold text-black/50 block mb-1">
                  Verified Disciplines
                </span>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5">
                    {activeCategory.name}
                  </span>
                  {selectedSkills.slice(0, 3).map((s, idx) => (
                    <span key={idx} className="text-[10px] font-medium bg-black/10 text-black px-2 py-0.5 border border-black/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Category 6 preview */}
              {primaryCategorySlug === 'creators-brand-collabs' && (
                <div className="pt-2 border-t border-black/10 text-[11px] font-mono">
                  <span className="text-[#B1122B] font-bold block mb-1">
                    Creator Profile (Self-reported)
                  </span>
                  <div className="bg-[#F6F7F9] p-2 border border-black/20 space-y-1">
                    <div>Platform: <strong className="capitalize">{creatorPlatform}</strong></div>
                    <div>Handle: <strong>{creatorHandle || '@channel'}</strong></div>
                    <div>Audience: <strong>{creatorAudience ? Number(creatorAudience).toLocaleString() : '0'}</strong></div>
                    <div>Packages: <strong>{rateCardItems.length} Escrow Offers</strong></div>
                  </div>
                </div>
              )}

              {/* Escrow guarantee note */}
              <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[10px] font-mono text-black/60">
                <span>Escrow Protected: YES</span>
                <span>Fee: 2.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
