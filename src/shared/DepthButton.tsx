import React from "react";
import { twMerge } from "tailwind-merge";

type ClickHandler<T> = (() => void) | ((event: React.MouseEvent<T>) => void);

export interface DepthButtonProps extends Omit<
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
      sizeClassName = "w-8 h-8 rounded-xl",
      className = "",
      inactiveClassName = "text-theme-primary-300 hover:text-theme-primary-100 bg-theme-primary-800/40 hover:bg-theme-primary-700/60 border-theme-primary-600/30",
      activeClassName = "text-white bg-primary-600 hover:bg-primary-500 border-primary-400/50 shadow-sm",
      inactiveSurfaceClassName,
      activeSurfaceClassName,
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
          "relative inline-flex items-center justify-center border font-medium transition-all duration-200 outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95",
          sizeClassName,
          active ? activeClassName : inactiveClassName,
          className,
        )}
      >
        <span className="relative z-10 flex items-center justify-center w-full h-full">
          {children}
        </span>
      </button>
    );
  },
);

DepthButton.displayName = "DepthButton";
