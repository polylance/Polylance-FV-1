import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Plus,
  Check,
  Sparkles,
  Tag,
  Code2,
  Blocks,
  FileCode2,
  ShieldAlert,
  Layout,
  Server,
  Smartphone,
  Database,
  Workflow,
  Cloud,
  Cpu,
  ShieldCheck,
  Bot,
  Brain,
  LineChart,
  Network,
  CheckCircle2,
  Layers,
  Palette,
  Gamepad2,
  Radio,
  Glasses,
  Terminal,
  Atom,
  ChevronRight,
  Filter
} from 'lucide-react';
import {
  SKILL_CATEGORIES,
  SkillCategoryName,
  TechSkill,
  searchTechSkills,
  findSkillByIdOrName,
  formatSkillDisplayName
} from '../data/skillsData';

interface SkillSelectorProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
  maxSkills?: number;
  label?: string;
  helperText?: string;
  isEditing?: boolean;
}

export const SkillSelector: React.FC<SkillSelectorProps> = ({
  selectedSkills,
  onChange,
  maxSkills = 50,
  label = 'Technical & Domain Skills',
  helperText = 'Select from 26 specialized technology categories or search to add your exact stack.',
  isEditing = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategoryName | 'All'>('All');
  const [customInput, setCustomInput] = useState('');

  // Filter skills based on current category and query
  const filteredSkills = useMemo(() => {
    return searchTechSkills(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const handleToggleSkill = (skillName: string) => {
    const formatted = formatSkillDisplayName(skillName);
    const exists = selectedSkills.some(
      (s) => s.toLowerCase() === formatted.toLowerCase()
    );

    if (exists) {
      onChange(selectedSkills.filter((s) => s.toLowerCase() !== formatted.toLowerCase()));
    } else {
      if (selectedSkills.length >= maxSkills) return;
      onChange([...selectedSkills, formatted]);
    }
  };

  const handleAddCustomSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customInput.trim();
    if (!clean) return;

    const formatted = formatSkillDisplayName(clean);
    const exists = selectedSkills.some(
      (s) => s.toLowerCase() === formatted.toLowerCase()
    );

    if (!exists && selectedSkills.length < maxSkills) {
      onChange([...selectedSkills, formatted]);
      setCustomInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onChange(
      selectedSkills.filter(
        (s) => s.toLowerCase() !== skillToRemove.toLowerCase()
      )
    );
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Helper icon selector based on category
  const renderCategoryIcon = (
    category: SkillCategoryName | 'All',
    size = 14,
    isSelected = false
  ) => {
    const iconClass = isSelected ? 'text-white shrink-0' : 'text-[#0047AB] shrink-0';

    switch (category) {
      case 'All':
        return <Sparkles size={size} className={iconClass} />;
      case 'Programming Languages':
        return <Code2 size={size} className={iconClass} />;
      case 'Blockchain & Web3':
        return <Blocks size={size} className={iconClass} />;
      case 'Smart Contract Development':
        return <FileCode2 size={size} className={iconClass} />;
      case 'Smart Contract Security':
        return <ShieldAlert size={size} className={iconClass} />;
      case 'Frontend Development':
        return <Layout size={size} className={iconClass} />;
      case 'Backend Development':
        return <Server size={size} className={iconClass} />;
      case 'Mobile Development':
        return <Smartphone size={size} className={iconClass} />;
      case 'Databases':
        return <Database size={size} className={iconClass} />;
      case 'Data Engineering':
        return <Workflow size={size} className={iconClass} />;
      case 'Cloud Computing':
        return <Cloud size={size} className={iconClass} />;
      case 'DevOps & Infrastructure':
        return <Cpu size={size} className={iconClass} />;
      case 'Cybersecurity':
        return <ShieldCheck size={size} className={iconClass} />;
      case 'Artificial Intelligence':
        return <Bot size={size} className={iconClass} />;
      case 'Generative AI & LLMs':
        return <Sparkles size={size} className={iconClass} />;
      case 'Machine Learning':
        return <Brain size={size} className={iconClass} />;
      case 'Data Science':
        return <LineChart size={size} className={iconClass} />;
      case 'APIs & Networking':
        return <Network size={size} className={iconClass} />;
      case 'Testing & QA':
        return <CheckCircle2 size={size} className={iconClass} />;
      case 'System Design & Architecture':
        return <Layers size={size} className={iconClass} />;
      case 'UI/UX & Product Design':
        return <Palette size={size} className={iconClass} />;
      case 'Game Development & Graphics':
        return <Gamepad2 size={size} className={iconClass} />;
      case 'IoT & Embedded Systems':
        return <Radio size={size} className={iconClass} />;
      case 'AR/VR/XR':
        return <Glasses size={size} className={iconClass} />;
      case 'Operating Systems':
        return <Terminal size={size} className={iconClass} />;
      case 'Search & SEO':
        return <Search size={size} className={iconClass} />;
      case 'Emerging Technologies':
        return <Atom size={size} className={iconClass} />;
      default:
        return <Tag size={size} className={iconClass} />;
    }
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Header with Title & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="text-xs font-semibold text-[#0B0B0F] flex items-center gap-1.5">
            <Tag size={14} className="text-[#0047AB]" />
            {label}
            <span className="text-xs font-normal text-[#6B7280]">
              ({selectedSkills.length} selected)
            </span>
          </label>
          {helperText && (
            <p className="text-xs text-[#6B7280] mt-0.5">{helperText}</p>
          )}
        </div>

        {isEditing && selectedSkills.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
          >
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      {/* Selected Skills Chips Tray */}
      <div className="p-3 bg-[#F6F7F9] border border-[#E5E7EB] rounded-xl min-h-[52px] flex flex-wrap items-center gap-1.5">
        {selectedSkills.length === 0 ? (
          <span className="text-xs text-[#6B7280]">
            No skills selected yet. Select from categories below or search to add your stack.
          </span>
        ) : (
          selectedSkills.map((skillName) => {
            const matched = findSkillByIdOrName(skillName);
            return (
              <span
                key={skillName}
                className="inline-flex items-center gap-1.5 bg-white border border-[#D1D5DB] text-[#0B0B0F] px-2.5 py-1 rounded-lg text-xs font-medium hover:border-[#0047AB] transition-colors"
              >
                {matched?.category && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0047AB]" />
                )}
                <span>{formatSkillDisplayName(skillName)}</span>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skillName)}
                    className="text-[#9CA3AF] hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                    title={`Remove ${skillName}`}
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            );
          })
        )}
      </div>

      {/* Interactive Picker Body (Only in Edit Mode) */}
      {isEditing && (
        <div className="border border-[#E5E7EB] bg-white rounded-xl p-3.5 space-y-3">
          {/* Search Bar & Custom Skill Add */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <label className="relative flex-1 w-full flex items-center gap-2.5 px-3 py-2 text-xs bg-[#F6F7F9] border border-[#E5E7EB] rounded-xl focus-within:bg-white focus-within:border-[#0047AB] focus-within:ring-2 focus-within:ring-[#0047AB]/10 transition-all cursor-text">
              <Search size={14} className="shrink-0 text-[#9CA3AF] pointer-events-none" />
              <input
                type="text"
                placeholder="Search across 260+ technologies, frameworks, libraries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-xs text-[#0B0B0F] placeholder:text-[#9CA3AF] outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="shrink-0 text-[#9CA3AF] hover:text-[#0B0B0F] p-0.5 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </label>

            {/* Custom Skill Input & Add Button */}
            <form onSubmit={handleAddCustomSkill} className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Add custom skill..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 text-xs bg-[#F6F7F9] border border-[#E5E7EB] rounded-xl focus:bg-white focus:border-[#0047AB] outline-none text-[#0B0B0F] placeholder:text-[#9CA3AF]"
              />
              <button
                type="submit"
                disabled={!customInput.trim()}
                className="bg-white hover:bg-[#F6F7F9] text-[#0B0B0F] border border-[#D1D5DB] hover:border-[#0B0B0F] disabled:opacity-40 disabled:pointer-events-none px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition-all cursor-pointer"
              >
                <Plus size={13} /> Add
              </button>
            </form>
          </div>

          {/* Category Tabs (Scrollable Horizontal Pill Navigation with No-Scrollbar) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
            {(() => {
              const isSelected = selectedCategory === 'All';
              return (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-[#0047AB] text-white border-[#0047AB] shadow-xs'
                      : 'bg-[#F6F7F9] hover:bg-[#E5E7EB] text-[#374151] hover:text-[#0B0B0F] border-[#E5E7EB]'
                  }`}
                >
                  {renderCategoryIcon('All', 13, isSelected)}
                  <span className={isSelected ? 'text-white' : 'text-[#374151]'}>All Categories</span>
                </button>
              );
            })()}

            {SKILL_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-[#0047AB] text-white border-[#0047AB] shadow-xs'
                      : 'bg-[#F6F7F9] hover:bg-[#E5E7EB] text-[#374151] hover:text-[#0B0B0F] border-[#E5E7EB]'
                  }`}
                >
                  {renderCategoryIcon(cat, 13, isSelected)}
                  <span className={isSelected ? 'text-white' : 'text-[#374151]'}>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Skills Grid / Search Results */}
          <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
            {filteredSkills.length === 0 ? (
              <div className="py-8 text-center space-y-1">
                <p className="text-xs font-semibold text-[#0B0B0F]">No matching skills found in database</p>
                <p className="text-xs text-[#6B7280]">
                  You can type your custom skill above and click "Add".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {filteredSkills.map((skill) => {
                  const isChecked = selectedSkills.some(
                    (s) => s.toLowerCase() === skill.name.toLowerCase()
                  );

                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => handleToggleSkill(skill.name)}
                      className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-2.5 transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#EAF1FB]/60 border-[#0047AB] ring-1 ring-[#0047AB]/20 text-[#0B0B0F]'
                          : 'bg-white hover:bg-[#F6F7F9] border-[#E5E7EB] hover:border-[#D1D5DB] text-[#0B0B0F]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-[#0B0B0F] truncate leading-tight">
                          {skill.name}
                        </div>
                        <div
                          className="text-[11px] text-[#6B7280] truncate mt-0.5"
                          title={`${skill.category}${skill.subcategory ? ` · ${skill.subcategory}` : ''}`}
                        >
                          {skill.subcategory || skill.category}
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all mt-0.5 ${
                          isChecked
                            ? 'bg-[#0047AB] border-[#0047AB] text-white'
                            : 'border-[#D1D5DB] bg-white'
                        }`}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Footer Summary */}
          <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <span>Showing {filteredSkills.length} skills in current view</span>
            <span>Selected: {selectedSkills.length}/{maxSkills}</span>
          </div>
        </div>
      )}
    </div>
  );
};
