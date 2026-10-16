import { memo } from 'react';

const PropertySkeletonDisabled = memo(function PropertySkeletonDisabled({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-card border border-border bg-card shadow-card"
        >
          <div className="h-32 w-full animate-pulse bg-soft-blue sm:h-56" />
          
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="h-5 w-3/4 animate-pulse rounded-md bg-soft-blue" />
            <div className="h-4 w-1/2 animate-pulse rounded-md bg-soft-blue/70" />
            
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-soft-blue/60" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-soft-blue/60" />
            </div>
            
            <div className="mt-1 h-7 w-1/3 animate-pulse rounded-md bg-soft-blue" />
            
            <div className="mt-2 flex gap-2 border-t border-dark-gray/5 pt-4">
              <div className="h-10 flex-1 animate-pulse rounded-xl bg-soft-blue" />
              <div className="h-10 flex-1 animate-pulse rounded-xl bg-soft-blue/70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default PropertySkeletonDisabled;