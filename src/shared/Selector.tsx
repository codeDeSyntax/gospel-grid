import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder,
  className,
}: {
  options: { value: string; text: string; swatch?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Find the selected option
  const selectedOption = options.find((option) => option.value === value);
  const selectedOptionText = selectedOption?.text || placeholder;

  return (
    <div ref={selectRef} className={`relative w-full ${className ?? ""}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-white/[0.04] border border-white/[0.07] rounded-lg pl-3.5 pr-3 py-2.5 text-[13px] text-white/90 hover:bg-white/[0.06] hover:border-white/[0.12] focus:border-theme-primary-400/50 focus:ring-1 focus:ring-theme-primary-400/20 focus:outline-none transition-all duration-150 cursor-pointer"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.swatch && (
            <span
              className="w-3 h-3 rounded-full ring-1 ring-white/10 shrink-0"
              style={{ backgroundColor: selectedOption.swatch }}
            />
          )}
          <span className="truncate">{selectedOptionText}</span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          } text-white/30`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-theme-accent-dark border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 overflow-hidden">
          <div className="max-h-80 p-2 overflow-y-auto no-scrollbar py-1">
            {options.map((option) => {
              const isActive = option.value === value;
              return (
                <div
                  key={option.value}
                
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full rounded-2xl flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] transition-colors duration-100 cursor-pointer ${
                    isActive
                      ? "bg-theme-primary-500/10 text-theme-primary-300"
                      : "text-white/70 hover:bg-white/[0.05] hover:text-white/90"
                  }`}
                >
                  {option.swatch && (
                    <span
                      className="w-3 h-3 rounded-full ring-1 ring-white/10 shrink-0 border-1 border-solid"
                      style={{ borderColor: option.swatch }}
                    />
                  )}
                  <span className="flex-1 text-left truncate">{option.text}</span>
                  {isActive && (
                    <Check size={14} className="text-theme-primary-400 ml-2 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
