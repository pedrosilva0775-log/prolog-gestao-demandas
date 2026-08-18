import React from 'react';

interface TooltipProps {
  content: string;
  badge?: string | number;
  children: React.ReactNode;
  side?: 'right' | 'top' | 'bottom';
  enabled?: boolean;
}

export const CollapsedTooltip: React.FC<TooltipProps> = ({
  content,
  badge,
  children,
  side = 'right',
  enabled = true
}) => {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative group flex items-center justify-center w-full">
      {children}
      <div
        role="tooltip"
        className="pointer-events-none absolute left-full ml-3.5 z-50 hidden group-hover:flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap border border-slate-700/80 animate-in fade-in zoom-in-95 duration-150"
      >
        <span>{content}</span>
        {badge !== undefined && (
          <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {badge}
          </span>
        )}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-800" />
      </div>
    </div>
  );
};
