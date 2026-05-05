import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-slate-200';
  
  const variantStyles = {
    text: 'h-4 w-full rounded',
    rect: 'rounded-xl',
    circle: 'rounded-full'
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} />
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" className={`h-4 ${i === 0 ? 'w-12' : 'flex-1'}`} />
        ))}
      </div>
      {/* Row Skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton 
              key={j} 
              variant="rect" 
              className={`h-6 ${j === 0 ? 'w-6' : 'flex-1'} ${j === cols - 1 ? 'max-w-[100px] ml-auto' : ''}`} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}
