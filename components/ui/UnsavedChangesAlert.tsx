'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface UnsavedChangesAlertProps {
  hasUnsavedChanges: boolean;
  /**
   * Optional message to show when user tries to leave
   * Defaults to a generic unsaved changes message
   */
  message?: string;
}

/**
 * Component that warns users when they try to navigate away with unsaved changes
 * Uses the beforeunload event and intercepts navigation attempts
 */
export default function UnsavedChangesAlert({
  hasUnsavedChanges,
  message = 'You have unsaved changes. Are you sure you want to leave?'
}: UnsavedChangesAlertProps) {
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Handler for the beforeunload event
   * Shows browser's default confirmation dialog
   */
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    },
    [hasUnsavedChanges, message]
  );

  /**
   * Intercept navigation attempts when there are unsaved changes
   * Note: This is a simplified version that works with direct link clicks
   */
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!hasUnsavedChanges) return;

      // Check if the click was on an anchor tag
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      // Only intercept internal navigation
      if (
        anchor &&
        anchor.href &&
        anchor.href.startsWith(window.location.origin) &&
        anchor.href !== window.location.href
      ) {
        // If there are unsaved changes, show confirmation
        if (!window.confirm(message)) {
          e.preventDefault();
        }
      }
    },
    [hasUnsavedChanges, message]
  );

  useEffect(() => {
    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick);

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick);
    };
  }, [handleBeforeUnload, handleClick]);

  // This component doesn't render anything
  return null;
}
