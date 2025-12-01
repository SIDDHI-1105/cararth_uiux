// FILE: client/src/components/skeleton-card.tsx – Luxury Glassmorphic redesign applied

export function SkeletonCard() {
  return (
    <div
      className="glass-card-premium overflow-hidden animate-pulse"
      style={{
        animationDuration: '1.5s'
      }}
    >
      {/* Skeleton Image with Shimmer */}
      <div
        className="w-full h-56 relative overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer-premium 2s infinite'
        }}
      >
        {/* Shimmer Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>

      {/* Skeleton Content */}
      <div className="p-6 space-y-4">
        {/* Title Skeleton */}
        <div
          className="h-6 rounded-2xl w-3/4"
          style={{
            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.08) 25%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer-premium 2s infinite'
          }}
        />

        {/* Price and Score Skeleton */}
        <div className="flex items-center justify-between">
          <div
            className="h-8 rounded-2xl w-1/3"
            style={{
              background: 'linear-gradient(90deg, rgba(0, 113, 227, 0.1) 25%, rgba(0, 113, 227, 0.2) 50%, rgba(0, 113, 227, 0.1) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer-premium 2s infinite 0.2s'
            }}
          />
          <div
            className="h-6 rounded-full w-16"
            style={{
              background: 'linear-gradient(90deg, rgba(255, 193, 7, 0.1) 25%, rgba(255, 193, 7, 0.2) 50%, rgba(255, 193, 7, 0.1) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer-premium 2s infinite 0.3s'
            }}
          />
        </div>

        {/* Specs Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-2xl"
              style={{
                background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.05) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer-premium 2s infinite',
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>

        {/* Location Skeleton */}
        <div
          className="h-4 rounded-2xl w-1/3"
          style={{
            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer-premium 2s infinite 0.5s'
          }}
        />

        {/* Footer Skeleton */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
          <div
            className="h-6 rounded-full w-24"
            style={{
              background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.08) 25%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer-premium 2s infinite 0.6s'
            }}
          />
          <div
            className="h-4 rounded-2xl w-20"
            style={{
              background: 'linear-gradient(90deg, rgba(0, 113, 227, 0.1) 25%, rgba(0, 113, 227, 0.2) 50%, rgba(0, 113, 227, 0.1) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer-premium 2s infinite 0.7s'
            }}
          />
        </div>
      </div>
    </div>
  );
}
