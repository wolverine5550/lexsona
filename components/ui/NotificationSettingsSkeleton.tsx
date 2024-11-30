'use client';

export function NotificationSettingsSkeleton() {
  return (
    <div className="space-y-8 p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 pb-4">
        <div className="h-7 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-5 bg-gray-200 rounded w-2/3"></div>
      </div>

      {/* Email Section Skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/6"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mt-1"></div>
            </div>
          </div>
        ))}
      </div>

      {/* In-app Section Skeleton */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/6"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mt-1"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
