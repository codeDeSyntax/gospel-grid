import React from "react";
import { twMerge } from "tailwind-merge";

type ClickHandler<T> = (() => void) | ((event: React.MouseEvent<T>) => void);

export interface DepthSurfaceProps extends Omit<
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
  surfaceClassName = "",
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
        "relative overflow-hidden rounded-xl border border-theme-primary-800/40 bg-theme-primary-900/50 backdrop-blur-sm transition-all duration-200",
        onClick ? "cursor-pointer hover:border-theme-primary-700/60" : "",
        className,
      )}
    >
      <div className="relative z-10 h-full min-h-0">{children}</div>
    </div>
  );
};
