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
  const renderCategoryIcon = (category: SkillCategoryName | 'All', size = 14) => {
    switch (category) {
      case 'All':
        return <Sparkles size={size} className="text-[#0047AB]" />;
      case 'Programming Languages':
        return <Code2 size={size} className="text-[#0047AB]" />;
      case 'Blockchain & Web3':
        return <Blocks size={size} className="text-[#0047AB]" />;
      case 'Smart Contract Development':
        return <FileCode2 size={size} className="text-[#334155]" />;
      case 'Smart Contract Security':
        return <ShieldAlert size={size} className="text-[#C0392B]" />;
      case 'Frontend Development':
        return <Layout size={size} className="text-[#0047AB]" />;
      case 'Backend Development':
        return <Server size={size} className="text-[#334155]" />;
      case 'Mobile Development':
        return <Smartphone size={size} className="text-[#0047AB]" />;
      case 'Databases':
        return <Database size={size} className="text-[#334155]" />;
      case 'Data Engineering':
        return <Workflow size={size} className="text-[#334155]" />;
      case 'Cloud Computing':
        return <Cloud size={size} className="text-[#0047AB]" />;
      case 'DevOps & Infrastructure':
        return <Cpu size={size} className="text-[#334155]" />;
      case 'Cybersecurity':
        return <ShieldCheck size={size} className="text-[#1E8449]" />;
      case 'Artificial Intelligence':
        return <Bot size={size} className="text-[#334155]" />;
      case 'Generative AI & LLMs':
        return <Sparkles size={size} className="text-[#0047AB]" />;
      case 'Machine Learning':
        return <Brain size={size} className="text-[#334155]" />;
      case 'Data Science':
        return <LineChart size={size} className="text-[#1E8449]" />;
      case 'APIs & Networking':
        return <Network size={size} className="text-[#0047AB]" />;
      case 'Testing & QA':
        return <CheckCircle2 size={size} className="text-[#1E8449]" />;
      case 'System Design & Architecture':
        return <Layers size={size} className="text-[#334155]" />;
      case 'UI/UX & Product Design':
        return <Palette size={size} className="text-[#E8A317]" />;
      case 'Game Development & Graphics':
        return <Gamepad2 size={size} className="text-[#334155]" />;
      case 'IoT & Embedded Systems':
        return <Radio size={size} className="text-[#334155]" />;
      case 'AR/VR/XR':
        return <Glasses size={size} className="text-[#334155]" />;
      case 'Operating Systems':
        return <Terminal size={size} className="text-[#334155]" />;
      case 'Search & SEO':
        return <Search size={size} className="text-blue-600" />;
      case 'Emerging Technologies':
        return <Atom size={size} className="text-cyan-500" />;
      default:
        return <Tag size={size} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Header with Title & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider font-heading flex items-center gap-1.5">
            <Tag size={13} className="text-[#0047AB]" />
            {label}
            <span className="text-[10px] font-mono font-normal text-slate-500 normal-case">
              ({selectedSkills.length} selected)
            </span>
          </label>
          {helperText && (
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">{helperText}</p>
          )}
        </div>

        {isEditing && selectedSkills.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-mono font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1"
          >
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      {/* Selected Skills Chips Tray */}
      <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl min-h-[52px] flex flex-wrap items-center gap-1.5 shadow-2xs">
        {selectedSkills.length === 0 ? (
          <span className="text-xs text-slate-400 font-mono italic">
            No skills selected yet. Click categories below or search to add skills.
          </span>
        ) : (
          selectedSkills.map((skillName) => {
            const matched = findSkillByIdOrName(skillName);
            return (
              <span
                key={skillName}
                className="inline-flex items-center gap-1.5 bg-white border border-slate-300 text-slate-900 px-2.5 py-1 rounded-xl text-xs font-bold font-mono shadow-2xs group hover:border-[#0047AB] transition-all"
              >
                {matched?.category && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0047AB]" />
                )}
                <span>{formatSkillDisplayName(skillName)}</span>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skillName)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
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
        <div className="border border-slate-200 bg-white rounded-2xl p-3.5 space-y-3 shadow-sm">
          {/* Search Bar & Custom Skill Add */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <label className="relative flex-1 w-full flex items-center gap-2.5 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-[#0047AB] focus-within:ring-2 focus-within:ring-blue-100 transition-all cursor-text">
              <Search size={14} className="shrink-0 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search across 260+ technologies, frameworks, libraries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="shrink-0 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
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
                className="w-full sm:w-44 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0047AB] outline-none text-slate-900 placeholder:text-slate-400 font-medium"
              />
              <button
                type="submit"
                disabled={!customInput.trim()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 disabled:opacity-40 disabled:pointer-events-none px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-2xs"
              >
                <Plus size={13} /> Add
              </button>
            </form>
          </div>

          {/* Category Tabs (Scrollable Horizontal Pill Navigation) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-heading whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                selectedCategory === 'All'
                  ? 'bg-[#0B0B0C] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
              }`}
            >
              {renderCategoryIcon('All', 12)}
              <span>All Categories</span>
            </button>

            {SKILL_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-heading whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#0B0B0C] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
                  }`}
                >
                  {renderCategoryIcon(cat, 12)}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Skills Grid / Search Results */}
          <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
            {filteredSkills.length === 0 ? (
              <div className="py-8 text-center space-y-1">
                <p className="text-xs font-bold text-slate-700">No matching skills found in database</p>
                <p className="text-[11px] text-slate-400 font-mono">
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
                      className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-blue-50/70 border-[#0047AB] ring-1 ring-blue-200 text-slate-900 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs truncate leading-tight">
                            {skill.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider truncate">
                            {skill.category}
                          </span>
                          {skill.subcategory && (
                            <>
                              <span className="text-slate-300 text-[8px]">•</span>
                              <span className="text-[9px] font-mono text-slate-700 bg-slate-100 px-1 rounded truncate">
                                {skill.subcategory}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-all mt-0.5 ${
                          isChecked
                            ? 'bg-[#0047AB] border-[#0047AB] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check size={11} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Footer Summary */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Showing {filteredSkills.length} skills in current view</span>
            <span>Max limit: {selectedSkills.length}/{maxSkills}</span>
          </div>
        </div>
      )}
    </div>
  );
};
