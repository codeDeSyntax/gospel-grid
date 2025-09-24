import React from "react";

interface CustomSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  marks?: number[];
  disabled?: boolean;
}

// Uses theme colors and a modern, accessible design
export const CustomSlider: React.FC<CustomSliderProps> = ({
  min,
  max,
  step = 0.1,
  value,
  onChange,
  label,
  unit,
  marks,
  disabled = false,
}) => {
  // Generate marks if not provided
  const markList =
    marks || Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="w-full flex flex-col gap-1">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-white uppercase tracking-wide">
            {label}
          </span>
          <span className="text-xs text-theme-primary-300 bg-theme-primary-400/10 px-2 py-1 rounded">
            {value.toFixed(1)}
            {unit}
          </span>
        </div>
      )}
      <div className="relative w-full flex items-center bg-gradient-to-r from-stone-900/80 to-stone-800/80 rounded-2xl py-3 px-4 border border-theme-primary-400/20 shadow-inner">
        {/* Left arrow */}
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-700/60 border border-stone-600/40 text-theme-primary-400 hover:bg-theme-primary-400/20 transition disabled:opacity-40"
          onClick={() => !disabled && onChange(Math.max(min, value - step))}
          disabled={disabled || value <= min}
          tabIndex={-1}
        >
          <span className="text-lg">&#8592;</span>
        </button>
        {/* Track and thumb */}
        <div className="relative flex-1 mx-4">
          {/* Track */}
          <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 rounded bg-stone-700/60" />
          {/* Active track */}
          <div
            className="absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded bg-theme-primary-400"
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
          />
          {/* Marks */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between">
            {markList.map((mark, i) => (
              <div
                key={mark}
                className={`w-0.5 h-4 rounded-full ${
                  mark <= value ? "bg-theme-primary-400" : "bg-stone-600"
                }`}
                style={{ zIndex: 1 }}
              />
            ))}
          </div>
          {/* Thumb */}
          <div
            className="absolute top-1/2 z-10"
            style={{
              left: `calc(${((value - min) / (max - min)) * 100}% - 16px)`,
            }}
          >
            <button
              className="w-8 h-8 bg-theme-primary-400 rounded-lg border-2 border-white/80 shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-theme-primary-300 transition"
              style={{ transform: "translateY(-50%)" }}
              tabIndex={0}
              aria-label={label}
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="w-4 h-4 bg-white rounded" />
            </button>
          </div>
          {/* Native input for accessibility */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={label}
            disabled={disabled}
          />
        </div>
        {/* Right arrow */}
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-700/60 border border-stone-600/40 text-theme-primary-400 hover:bg-theme-primary-400/20 transition disabled:opacity-40"
          onClick={() => !disabled && onChange(Math.min(max, value + step))}
          disabled={disabled || value >= max}
          tabIndex={-1}
        >
          <span className="text-lg">&#8594;</span>
        </button>
      </div>
      {/* Min/Max labels */}
      <div className="flex justify-between text-xs text-stone-500 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};
