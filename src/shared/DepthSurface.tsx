import React from "react";
import { twMerge } from "tailwind-merge";

type ClickHandler<T> = (() => void) | ((event: React.MouseEvent<T>) => void);

interface DepthSurfaceProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onClick"
> {
  className?: string;
  surfaceClassName?: string;
  children: React.ReactNode;
  onClick?: ClickHandler<HTMLDivElement>;
}

export const DepthSurface: React.FC<DepthSurfaceProps> = ({
  className = "",
  surfaceClassName = "depth-surface-shell",
  children,
  onClick,
  ...divProps
}) => {
  const handleClick: React.MouseEventHandler<HTMLDivElement> | undefined =
    onClick
      ? (event) => {
          onClick(event);
        }
      : undefined;

  return (
    <div
      {...divProps}
      onClick={handleClick}
      className={twMerge(
        "relative overflow-hidden rounded",
        onClick ? "cursor-pointer" : "",
        className,
      )}
    >
      <span
        className={`absolute inset-0 pointer-events-none ${surfaceClassName}`}
      />
      <span
        className="absolute left-2 right-2 top-[2px] h-1.5 rounded-full blur-[1px] pointer-events-none"
        style={{
          background:
            "color-mix(in srgb, var(--select-bg-alt) 50%, transparent)",
        }}
      />
      <span
        className="absolute inset-[1px] rounded-[inherit] pointer-events-none"
        style={{
          boxShadow:
            "inset 0 1px 0 var(--select-border-hover), inset 0 -1px 0 var(--select-border)",
        }}
      />
      <div className="relative z-10 h-full min-h-0">{children}</div>
    </div>
  );
};
