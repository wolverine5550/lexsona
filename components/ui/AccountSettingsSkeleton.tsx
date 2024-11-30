export function AccountSettingsSkeleton() {
  return (
    <div className="space-y-8 p-6 animate-pulse" data-testid="loading-skeleton">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 pb-4">
        <div className="h-7 bg-gray-200 rounded w-1/4 mb-2" />
        <div className="h-5 bg-gray-200 rounded w-2/3" />
      </div>

      {/* Email Section Skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/6" />
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-32" />
        </div>
      </div>

      {/* Password Form Skeleton */}
      <div className="space-y-6">
        <div className="h-6 bg-gray-200 rounded w-1/6" />
        {/* Password Fields */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-32" />
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
        ))}
        {/* Submit Button */}
        <div className="flex justify-end">
          <div className="h-10 bg-gray-200 rounded w-32" />
        </div>
      </div>

      {/* Session Management Skeleton */}
      <div className="pt-6 border-t border-gray-200">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      {/* Danger Zone Skeleton */}
      <div className="pt-6 border-t border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/6 mb-2" />
        <div className="h-5 bg-gray-200 rounded w-2/3 mb-4" />
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>
    </div>
  );
}
