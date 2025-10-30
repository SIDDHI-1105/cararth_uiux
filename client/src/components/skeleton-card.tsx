export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-800 animate-pulse">
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-800"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
        <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}
