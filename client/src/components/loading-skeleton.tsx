/**
 * Loading skeleton components for better UX during data fetching
 *
 * Provides visual feedback while content loads, replacing generic spinners
 * with content-shaped placeholders that match the final layout.
 */

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component with shimmer animation
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

/**
 * Text line skeleton
 */
export function SkeletonText({
  lines = 1,
  className = ""
}: SkeletonProps & { lines?: number }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/**
 * Card skeleton for list items
 */
export function SkeletonCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`glass-card p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        {/* Image placeholder */}
        <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />

        {/* Content placeholder */}
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <SkeletonText lines={2} />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Stat card skeleton for analytics
 */
export function SkeletonStatCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`glass-card p-6 ${className}`}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

/**
 * Table row skeleton
 */
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Table skeleton with header and rows
 */
export function SkeletonTable({
  columns = 4,
  rows = 5,
  className = ""
}: { columns?: number; rows?: number; className?: string }) {
  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Grid skeleton for car listings
 */
export function SkeletonCarGrid({
  count = 6,
  className = ""
}: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card overflow-hidden">
          <Skeleton className="w-full h-48" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <SkeletonText lines={2} />
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state component for when there's no data
 */
export function EmptyState({
  icon = "📭",
  title = "No data available",
  description = "There's nothing to display here yet.",
  action,
  className = ""
}: {
  icon?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
        {title}
      </h3>
      <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * Error state component for failed data loads
 */
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
  className = ""
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
        {title}
      </h3>
      <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
        {description}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 rounded-lg font-medium transition-all duration-200"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Loading spinner for inline use
 */
export function LoadingSpinner({
  size = "md",
  className = ""
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  return (
    <div
      className={`${sizeClasses[size]} border-gray-200 border-t-primary rounded-full animate-spin ${className}`}
      style={{ borderTopColor: 'var(--primary)' }}
    />
  );
}

/**
 * Full page loading state
 */
export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {message}
      </p>
    </div>
  );
}

/**
 * Data wrapper component that handles loading, error, and empty states
 */
export function DataWrapper<T>({
  isLoading,
  isError,
  isEmpty,
  error,
  data,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
  onRetry
}: {
  isLoading: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  error?: Error | null;
  data?: T;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  children: React.ReactNode | ((data: T) => React.ReactNode);
  onRetry?: () => void;
}) {
  if (isLoading) {
    return <>{loadingComponent || <SkeletonCard />}</>;
  }

  if (isError) {
    return <>{errorComponent || <ErrorState onRetry={onRetry} />}</>;
  }

  if (isEmpty) {
    return <>{emptyComponent || <EmptyState />}</>;
  }

  if (typeof children === 'function' && data) {
    return <>{children(data)}</>;
  }

  return <>{children}</>;
}
