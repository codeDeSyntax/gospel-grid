import React from "react";
import { twMerge } from "tailwind-merge";

type ClickHandler<T> = (() => void) | ((event: React.MouseEvent<T>) => void);

interface DepthButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
> {
  active?: boolean;
  sizeClassName?: string;
  inactiveClassName?: string;
  activeClassName?: string;
  inactiveSurfaceClassName?: string;
  activeSurfaceClassName?: string;
  onClick?: ClickHandler<HTMLButtonElement>;
}

export const DepthButton = React.forwardRef<
  HTMLButtonElement,
  DepthButtonProps
>(
  (
    {
      active = false,
      sizeClassName = "w-7 h-7 rounded-3xl",
      className = "",
      inactiveClassName = "text-primary-200/85 border-primary-500/35 hover:text-primary-100",
      activeClassName = "text-white border-primary-300/70",
      inactiveSurfaceClassName = "depth-inactive-surface",
      activeSurfaceClassName = "depth-active-surface",
      children,
      ...buttonProps
    },
    ref,
  ) => {
    const { disabled, onClick, ...restButtonProps } = buttonProps;

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      if (disabled || !onClick) return;
      onClick(event);
    };

    return (
      <button
        {...restButtonProps}
        ref={ref}
        onClick={handleClick}
        className={twMerge(
          "relative flex items-center justify-center overflow-hidden border transition-all duration-200 outline-none group",
          sizeClassName,
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          active ? activeClassName : inactiveClassName,
          className,
        )}
      >
        <span
          className={`absolute inset-0 transition-all duration-200 ${
            active ? activeSurfaceClassName : inactiveSurfaceClassName
          }`}
        />
        <span
          className="absolute left-1.5 right-1.5 top-1 h-2 rounded-full blur-[1px] opacity-85"
          style={{
            background:
              "color-mix(in srgb, var(--select-bg-alt) 70%, transparent)",
          }}
        />
        <span
          className="absolute inset-[1px] rounded-[inherit]"
          style={{
            boxShadow:
              "inset 0 1px 0 var(--select-border-hover), inset 0 -1px 0 var(--select-border)",
          }}
        />
        <span className="relative z-10 flex items-center justify-center">
          {children}
        </span>
      </button>
    );
  },
);

DepthButton.displayName = "DepthButton";
