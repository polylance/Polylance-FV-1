import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  flag?: string;
  badge?: string;
}

interface PolyLanceSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  label?: string;
  variant?: 'neomorphic' | 'glass' | 'standard';
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
}

export function PolyLanceSelect<T = string>({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  label,
  variant = 'neomorphic',
  searchable = false,
  searchPlaceholder = 'Search options...',
  className = '',
  menuClassName = '',
  disabled = false,
}: PolyLanceSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen, searchable]);

  const filteredOptions = searchable && searchTerm.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (typeof opt.value === 'string' && opt.value.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : options;

  // Variants styling
  const triggerVariantClasses = {
    neomorphic:
      'bg-[#EEF2F6] shadow-[inset_2px_2px_5px_#cad4e2,inset_-2px_-2px_5px_#ffffff] border border-slate-200/70 text-slate-800 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-300/40',
    glass:
      'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-indigo-400 shadow-xs',
    standard:
      'bg-white border border-slate-200 text-slate-800 hover:border-slate-300 shadow-xs',
  };

  const menuVariantClasses = {
    neomorphic:
      'bg-[#EEF2F6] shadow-[8px_8px_24px_#cad4e2,-8px_-8px_24px_#ffffff] border border-white/90',
    glass:
      'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl',
    standard:
      'bg-white border border-slate-200 shadow-xl',
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 font-heading mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2.5 px-4 py-3 rounded-2xl text-xs font-medium transition-all duration-200 outline-none cursor-pointer select-none ${
          triggerVariantClasses[variant]
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
          isOpen ? 'ring-2 ring-indigo-400/50' : ''
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption?.flag && (
            <span className="text-base leading-none select-none shrink-0" role="img" aria-label="flag">
              {selectedOption.flag}
            </span>
          )}
          {selectedOption?.icon && (
            <span className="shrink-0 text-indigo-600">{selectedOption.icon}</span>
          )}
          <span className="truncate font-medium text-slate-800">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.sublabel && (
            <span className="text-[11px] text-slate-400 font-mono truncate">
              {selectedOption.sublabel}
            </span>
          )}
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-slate-500"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      {/* Dropdown Options Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            role="listbox"
            className={`absolute left-0 right-0 z-50 rounded-2xl overflow-hidden p-2 max-h-72 flex flex-col ${
              menuVariantClasses[variant]
            } ${menuClassName}`}
          >
            {/* Search Input if enabled */}
            {searchable && (
              <div className="px-2 pb-2 mb-1 border-b border-slate-200/50 flex items-center gap-2">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none font-medium"
                />
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto space-y-1 pr-1 custom-scrollbar max-h-60">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400 font-medium">
                  No matching options
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? variant === 'neomorphic'
                            ? 'bg-[#E5ECF4] shadow-[inset_2px_2px_4px_#cad4e2,inset_-2px_-2px_4px_#ffffff] text-indigo-900 font-bold'
                            : 'bg-indigo-50 text-indigo-700 font-bold dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'text-slate-700 hover:bg-slate-200/50 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {opt.flag && (
                          <span className="text-base leading-none select-none shrink-0" role="img" aria-label="flag">
                            {opt.flag}
                          </span>
                        )}
                        {opt.icon && (
                          <span className="shrink-0">{opt.icon}</span>
                        )}
                        <span className="truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className={`text-[10.5px] font-mono truncate ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {opt.sublabel}
                          </span>
                        )}
                      </div>

                      {opt.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-indigo-100 text-indigo-700">
                          {opt.badge}
                        </span>
                      )}

                      {isSelected && (
                        <Check size={14} className="text-indigo-600 shrink-0 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
