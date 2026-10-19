import { memo } from 'react';

const PropertySkeletonDisabled = memo(function PropertySkeletonDisabled({ count = 6 }) {
  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 lg:max-w-6xl">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-card border border-border bg-card shadow-card"
        >
          <div className="aspect-[4/3] w-full animate-pulse bg-soft-blue sm:aspect-[16/9]" />

          <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
            <div className="h-5 w-3/4 animate-pulse rounded-md bg-soft-blue" />
            <div className="h-4 w-1/2 animate-pulse rounded-md bg-soft-blue/70" />

            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-soft-blue/60" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-soft-blue/60" />
            </div>

            <div className="mt-1 h-7 w-1/3 animate-pulse rounded-md bg-soft-blue" />

            <div className="mt-2 flex flex-col gap-2 border-t border-dark-gray/5 pt-4">
              <div className="h-10 w-full animate-pulse rounded-xl bg-soft-blue" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-soft-blue/70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default PropertySkeletonDisabled;