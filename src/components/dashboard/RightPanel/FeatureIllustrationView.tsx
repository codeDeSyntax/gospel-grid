import React from "react";

export const FeatureIllustrationView: React.FC = () => {
  return (
    <div className="h-full w-full flex items-center justify-center rounded-2xl border border-theme-primary-500/20 bg-theme-primary-900/35 text-center px-6">
      <div>
        <p className="text-sm font-semibold tracking-wide text-theme-primary-100/90 uppercase">
          Illustration Feature Window
        </p>
        <p className="mt-2 text-xs text-theme-primary-300/75">
          Illustration workspace is ready. Drawing tools and assets can be
          placed here next.
        </p>
      </div>
    </div>
  );
};
