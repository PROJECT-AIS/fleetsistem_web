import React from 'react';

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/10 ${className}`}
      {...props}
    />
  );
};

export const SkeletonCard = ({ className, children }) => {
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border border-white/8 bg-[#292c31] p-4 shadow-lg ${className}`}>
      {children || (
        <>
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </>
      )}
    </div>
  );
};

export const SkeletonTableRow = ({ columns = 5, className }) => {
  return (
    <div className={`flex items-center gap-4 border-b border-white/5 px-4 py-3 ${className}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-10' : 'flex-1'}`} />
      ))}
    </div>
  );
};
