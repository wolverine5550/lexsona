import React from 'react';

interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function LoadingButton({
  isLoading = false,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={isLoading}
      type="submit"
      className={`flex items-center justify-center space-x-2 rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ''}`}
    >
      {children}
      {isLoading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
    </button>
  );
}
