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
  const pct = ((value - min) / (max - min)) * 100;
  const markList =
    marks || Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="w-full flex flex-col gap-0.5">
      {/* Label row */}
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-white/40 uppercase tracking-wide">
            {label}
          </span>
          <span className="text-[11px] tabular-nums text-theme-primary-300/80 bg-white/[0.04] px-2 py-0.5 rounded-md font-medium">
            {value.toFixed(1)}
            {unit}
          </span>
        </div>
      )}

      {/* Slider body */}
      <div className="relative w-full h-7 flex items-center">
        {/* Background track */}
        <div className="absolute inset-x-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-white/[0.06]" />

        {/* Active fill */}
        <div
          className="absolute top-1/2 left-0 h-[4px] -translate-y-1/2 rounded-full bg-theme-primary-400/80"
          style={{ width: `${pct}%` }}
        />

        {/* Marks */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
          {markList.map((m) => (
            <div
              key={m}
              className={`w-px h-2 rounded-full ${
                m <= value ? "bg-theme-primary-400/50" : "bg-white/[0.08]"
              }`}
            />
          ))}
        </div>

        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-10"
          style={{ left: `calc(${pct}% - 6px)` }}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-theme-primary-400 ring-2 ring-theme-primary-400/25 shadow-md shadow-theme-primary-400/30" />
        </div>

        {/* Invisible native range for interaction */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={label}
          disabled={disabled}
        />
      </div>

      {/* Min / Max */}
      <div className="flex justify-between text-[9px] text-white/15 -mt-0.5">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};
