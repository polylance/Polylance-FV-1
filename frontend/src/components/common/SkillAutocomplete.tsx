import React, { useState, useRef, useEffect, useMemo, KeyboardEvent } from 'react';
import { X, Plus, Sparkles, Check, ChevronDown } from 'lucide-react';
import {
  getSmartSkillSuggestions,
  getGhostCompletionText,
  RankedSkillMatch,
} from '../../utils/skillRanking';
import { formatSkillDisplayName } from '../../data/skillsData';

export interface SkillAutocompleteProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  selectedCategory?: string;
  maxSkills?: number;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const SkillAutocomplete: React.FC<SkillAutocompleteProps> = ({
  skills,
  onChange,
  selectedCategory,
  maxSkills = 10,
  placeholder = 'e.g. Solidity, React, TypeScript...',
  label = 'Required skills',
  helperText = 'Press Enter or comma to add a skill',
  error,
  className = '',
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [flipAbove, setFlipAbove] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Detect mobile viewport (< 640px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter & rank suggestions
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return getSmartSkillSuggestions(query, skills, selectedCategory, 8);
  }, [query, skills, selectedCategory]);

  // Check if query is an exact match for an existing suggestion or selected skill
  const hasExactMatch = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return true;
    return (
      suggestions.some((s) => s.skill.name.toLowerCase() === clean) ||
      skills.some((s) => s.toLowerCase() === clean)
    );
  }, [query, suggestions, skills]);

  const showCustomOption = query.trim().length > 0 && !hasExactMatch && skills.length < maxSkills;
  const totalOptionsCount = suggestions.length + (showCustomOption ? 1 : 0);

  // Ghost text for inline autocomplete
  const ghostText = useMemo(() => {
    if (isMobile || !query.trim() || suggestions.length === 0) return null;
    return getGhostCompletionText(query, suggestions[0]);
  }, [query, suggestions, isMobile]);

  // Check dropdown positioning (flip above if space is tight below)
  const updateDropdownPlacement = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setFlipAbove(spaceBelow < 250 && spaceAbove > spaceBelow);
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPlacement();
      window.addEventListener('scroll', updateDropdownPlacement, true);
      window.addEventListener('resize', updateDropdownPlacement);
      return () => {
        window.removeEventListener('scroll', updateDropdownPlacement, true);
        window.removeEventListener('resize', updateDropdownPlacement);
      };
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Ensure active option is scrolled into view
  useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.children[activeIndex] as HTMLElement | undefined;
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const addSkill = (rawSkillName: string) => {
    const canonicalName = formatSkillDisplayName(rawSkillName.trim());
    if (!canonicalName) return;

    const exists = skills.some((s) => s.toLowerCase() === canonicalName.toLowerCase());
    if (!exists && skills.length < maxSkills) {
      onChange([...skills, canonicalName]);
    }
    setQuery('');
    setActiveIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(skills.filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase()));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);
    if (val.trim().length >= 1) {
      setIsOpen(true);
      updateDropdownPlacement();
    } else {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // 1. ArrowDown: Navigate down in suggestions
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && query.trim()) {
        setIsOpen(true);
        setActiveIndex(0);
        return;
      }
      if (totalOptionsCount > 0) {
        setActiveIndex((prev) => (prev + 1) % totalOptionsCount);
      }
      return;
    }

    // 2. ArrowUp: Navigate up in suggestions
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (totalOptionsCount > 0) {
        setActiveIndex((prev) => (prev <= 0 ? totalOptionsCount - 1 : prev - 1));
      }
      return;
    }

    // 3. Tab or ArrowRight: Accept inline ghost text
    if (
      (e.key === 'Tab' || e.key === 'ArrowRight') &&
      ghostText &&
      suggestions.length > 0
    ) {
      // For ArrowRight, only trigger if caret is at the end of input
      if (
        e.key === 'ArrowRight' &&
        inputRef.current &&
        inputRef.current.selectionStart !== query.length
      ) {
        return;
      }
      e.preventDefault();
      addSkill(suggestions[0].skill.name);
      return;
    }

    // 4. Enter or comma: Commit skill
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();

      // If a specific suggestion row is active
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        addSkill(suggestions[activeIndex].skill.name);
        return;
      }

      // If active on the custom option row
      if (showCustomOption && activeIndex === suggestions.length) {
        addSkill(query);
        return;
      }

      // If top suggestion has exact/prefix match and no active selection
      if (suggestions.length > 0 && (ghostText || suggestions[0].score >= 800)) {
        addSkill(suggestions[0].skill.name);
        return;
      }

      // Otherwise add typed custom skill
      if (query.trim()) {
        addSkill(query);
      }
      return;
    }

    // 5. Escape: Close suggestions without clearing text
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    // 6. Backspace on empty input: Remove previous chip
    if (e.key === 'Backspace' && query === '' && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    }
  };

  const activeOptionId =
    activeIndex >= 0
      ? activeIndex < suggestions.length
        ? `skill-opt-${suggestions[activeIndex].skill.id}`
        : 'skill-opt-custom'
      : undefined;

  return (
    <div className={`w-full relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs md:text-sm font-medium text-[#4B5563] mb-1.5">
          {label}
        </label>
      )}

      {/* Outer Chip + Input Container (Single Focus Ring, No Double Border) */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={`w-full min-h-[42px] bg-white border rounded-[8px] p-2 flex flex-wrap gap-2 items-center cursor-text transition-colors focus-within:ring-2 focus-within:ring-[#0047AB] focus-within:border-[#0047AB] ${
          error ? 'border-[#EF4444]' : 'border-[#E5E7EB]'
        } ${disabled ? 'opacity-60 pointer-events-none bg-[#F9FAFB]' : ''}`}
      >
        {/* Render Selected Skill Chips */}
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1.5 bg-[#EFF6FF] text-[#0047AB] text-xs font-semibold px-2.5 py-1 rounded-[8px] border border-[#BFDBFE] select-none"
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeSkill(skill);
              }}
              className="text-[#0047AB] hover:text-[#002C6C] p-0.5 rounded focus:outline-none cursor-pointer"
              aria-label={`Remove ${skill}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Input Wrapper with Inline Pixel-Perfect Ghost Text Completion */}
        {skills.length < maxSkills && (
          <div className="relative inline-flex items-center flex-1 min-w-[140px] text-sm leading-normal">
            {/* Ghost text background mirror */}
            {ghostText && (
              <div
                aria-hidden="true"
                className="absolute inset-0 flex items-center pointer-events-none whitespace-pre select-none font-normal text-sm text-[#9CA3AF] tracking-normal"
              >
                <span className="opacity-0">{query}</span>
                <span>{ghostText}</span>
              </div>
            )}

            {/* Inner text input with all borders/outlines completely cleared */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              disabled={disabled}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (query.trim().length >= 1) {
                  setIsOpen(true);
                  updateDropdownPlacement();
                }
              }}
              placeholder={skills.length === 0 ? placeholder : ''}
              role="combobox"
              aria-expanded={isOpen}
              aria-autocomplete="both"
              aria-controls="skill-autocomplete-listbox"
              aria-activedescendant={activeOptionId}
              aria-label={label || 'Required skills input'}
              className="w-full bg-transparent text-sm text-[#0B0B0F] placeholder-[#9CA3AF] border-0 outline-none ring-0 shadow-none p-0 m-0 focus:outline-none focus:ring-0 focus:border-transparent font-normal tracking-normal relative z-10"
              style={{
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
              }}
            />
          </div>
        )}
      </div>

      {/* Screen reader notification */}
      <span className="sr-only" aria-live="polite">
        {isOpen
          ? `${totalOptionsCount} skill ${totalOptionsCount === 1 ? 'suggestion' : 'suggestions'} available`
          : ''}
      </span>

      {/* Helper text or validation error */}
      {error ? (
        <p className="mt-1 text-xs text-[#DC2626] font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-[#6B7280]">{helperText}</p>
      ) : null}

      {/* Floating Suggestions Overlay Panel (Zero Layout Shift) */}
      {isOpen && totalOptionsCount > 0 && (
        <div
          data-lenis-prevent="true"
          className={`absolute left-0 right-0 z-50 bg-white border border-[#E5E7EB] rounded-[12px] shadow-[0_8px_24px_rgba(11,11,15,0.12)] p-1.5 animate-in fade-in-0 duration-100 ${
            flipAbove ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
          style={{ willChange: 'opacity, transform' }}
        >
          <ul
            ref={listboxRef}
            id="skill-autocomplete-listbox"
            role="listbox"
            aria-label="Skill suggestions"
            className="max-h-[260px] overflow-y-auto overscroll-contain divide-y divide-transparent space-y-0.5 pr-0.5"
          >
            {/* List of matched canonical skills */}
            {suggestions.map((item, index) => {
              const isSelected = activeIndex === index;
              const skillName = item.skill.name;
              const [start, end] = item.highlightIndices;

              return (
                <li
                  key={item.skill.id}
                  id={`skill-opt-${item.skill.id}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevents input blur before click registers
                    addSkill(skillName);
                  }}
                  className={`min-h-[40px] px-3 py-2 flex items-center justify-between rounded-[8px] cursor-pointer text-xs transition-colors select-none ${
                    isSelected
                      ? 'bg-[#EFF6FF] text-[#0047AB]'
                      : 'text-[#0B0B0F] hover:bg-[#F6F7F9]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">
                      {start >= 0 && end > start ? (
                        <>
                          {skillName.slice(0, start)}
                          <strong className="font-bold text-[#0047AB] underline decoration-1 underline-offset-2">
                            {skillName.slice(start, end)}
                          </strong>
                          {skillName.slice(end)}
                        </>
                      ) : (
                        <span>{skillName}</span>
                      )}
                    </span>
                    {item.matchedAlias && (
                      <span className="text-[10px] text-[#9CA3AF] font-normal italic">
                        (matches &ldquo;{item.matchedAlias}&rdquo;)
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-[4px] shrink-0 font-medium ${
                      isSelected
                        ? 'bg-[#DBEAFE] text-[#0047AB]'
                        : 'bg-[#F6F7F9] text-[#6B7280]'
                    }`}
                  >
                    {item.categoryTag}
                  </span>
                </li>
              );
            })}

            {/* Custom Skill Option Row */}
            {showCustomOption && (
              <li
                id="skill-opt-custom"
                role="option"
                aria-selected={activeIndex === suggestions.length}
                onMouseEnter={() => setActiveIndex(suggestions.length)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addSkill(query);
                }}
                className={`min-h-[40px] px-3 py-2 flex items-center gap-2 rounded-[8px] cursor-pointer text-xs font-medium transition-colors select-none ${
                  activeIndex === suggestions.length
                    ? 'bg-[#EFF6FF] text-[#0047AB]'
                    : 'text-[#4B5563] hover:bg-[#F6F7F9]'
                }`}
              >
                <Plus size={14} className="text-[#0047AB] shrink-0" />
                <span className="truncate">
                  Add <strong className="text-[#0B0B0F]">&ldquo;{query.trim()}&rdquo;</strong> as a custom skill
                </span>
              </li>
            )}
          </ul>

          {/* Keyboard hint footer */}
          <div className="px-3 pt-2 pb-1 border-t border-[#E5E7EB] mt-1 flex items-center justify-between text-[11px] text-[#9CA3AF]">
            <span>↑↓ to navigate</span>
            <span>Tab / Enter to select</span>
            <span>Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillAutocomplete;
