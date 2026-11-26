import React, { useState, KeyboardEvent } from 'react';
import { X, ChevronDown } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs md:text-sm font-medium text-[#4B5563] mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-[8px]">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#4B5563]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-white border rounded-[8px] px-3.5 py-2.5 text-sm text-[#0B0B0F] placeholder-[#9CA3AF] transition-colors min-h-[40px] focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:border-[#0047AB] ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error ? 'border-[#EF4444]' : 'border-[#E5E7EB]'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#4B5563]">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-[#DC2626] font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[#4B5563]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, maxLength, className = '', id, value, onChange, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const [internalLength, setInternalLength] = useState(
      typeof value === 'string' ? value.length : 0
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInternalLength(e.target.value.length);
      if (onChange) onChange(e);
    };

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <label
              htmlFor={inputId}
              className="block text-xs md:text-sm font-medium text-[#4B5563]"
            >
              {label}
            </label>
          )}
          {maxLength && (
            <span className="text-xs text-[#6B7280]">
              {typeof value === 'string' ? value.length : internalLength}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          id={inputId}
          ref={ref}
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          className={`w-full bg-white border rounded-[8px] p-3 text-sm text-[#0B0B0F] placeholder-[#9CA3AF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:border-[#0047AB] ${
            error ? 'border-[#EF4444]' : 'border-[#E5E7EB]'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-xs text-[#DC2626] font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[#4B5563]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs md:text-sm font-medium text-[#4B5563] mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative w-full">
          <select
            id={selectId}
            ref={ref}
            className={`w-full appearance-none bg-white border rounded-[8px] pl-3.5 pr-10 py-2.5 text-sm text-[#0B0B0F] transition-all min-h-[40px] focus:outline-none focus:ring-2 focus:ring-[#EFF6FF] focus:border-[#0047AB] hover:border-[#9CA3AF] cursor-pointer ${
              error ? 'border-[#EF4444]' : 'border-[#E5E7EB]'
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white text-[#0B0B0F] py-2">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7280]">
            <ChevronDown size={15} />
          </div>
        </div>
        {error ? (
          <p className="mt-1 text-xs text-[#DC2626] font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[#4B5563]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = 'Select';

export interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  maxTags?: number;
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  tags,
  onChange,
  placeholder = 'Type and press Enter...',
  error,
  helperText,
  maxTags = 30,
}) => {
  const [inputVal, setInputVal] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commitTags = (raw: string) => {
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;

    const next = [...tags];
    for (const part of parts) {
      if (next.length >= maxTags) break;
      const alreadyExists = next.some((t) => t.toLowerCase() === part.toLowerCase());
      if (!alreadyExists) {
        next.push(part);
      }
    }
    if (next.length !== tags.length) {
      onChange(next);
    }
    setInputVal('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(',')) {
      const segments = val.split(',');
      const trailing = segments.pop() ?? '';
      const completed = segments.join(',');
      if (completed.trim()) {
        commitTags(completed);
      }
      setInputVal(trailing);
      return;
    }
    setInputVal(val);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitTags(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const atLimit = tags.length >= maxTags;

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs md:text-sm font-medium text-[#4B5563]">
            {label}
          </label>
          <span className="text-[11px] font-medium text-[#6B7280] tabular-nums">
            {tags.length}/{maxTags}
          </span>
        </div>
      )}
      <div
        onClick={() => inputRef.current?.focus()}
        className={`w-full min-h-[42px] bg-white border rounded-[8px] p-2 flex flex-wrap gap-2 items-center cursor-text focus-within:ring-2 focus-within:ring-[#0047AB] focus-within:border-[#0047AB] ${
          error ? 'border-[#EF4444]' : 'border-[#E5E7EB]'
        }`}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 bg-[#EFF6FF] text-[#0047AB] text-xs font-medium px-2.5 py-1 rounded-[8px] border border-[#BFDBFE]"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="hover:text-[#00388A] focus:outline-none cursor-pointer"
              aria-label={`Remove ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {!atLimit && (
          <div className="flex-1 min-w-[140px] flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (inputVal.trim()) commitTags(inputVal);
              }}
              placeholder={tags.length === 0 ? placeholder : 'Add another skill...'}
              aria-label={label || placeholder || "Add skill tag"}
              className="flex-1 min-w-[100px] bg-transparent text-sm text-[#0B0B0F] placeholder-[#9CA3AF] border-0 outline-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-transparent py-1 px-1"
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
            />
            {inputVal.trim() && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  commitTags(inputVal);
                }}
                className="px-2 py-0.5 rounded-[6px] bg-[#0047AB] hover:bg-[#00388A] text-white text-[11px] font-semibold shrink-0 cursor-pointer"
              >
                + Add
              </button>
            )}
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-[#DC2626] font-medium">{error}</p>
      ) : atLimit ? (
        <p className="mt-1 text-xs text-[#6B7280]">
          Maximum {maxTags} skills reached. Remove one to add another.
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-[#4B5563]">{helperText}</p>
      ) : (
        <p className="mt-1 text-xs text-[#6B7280]">Press Enter or comma to add a skill</p>
      )}
    </div>
  );
};

export { SkillAutocomplete } from './SkillAutocomplete';
export type { SkillAutocompleteProps } from './SkillAutocomplete';
