'use client';

import { useCallback } from 'react';

export function useScrollTo() {
  const scrollTo = useCallback((elementId: string) => {
    // Remove the '#' if it exists
    const id = elementId.replace('#', '');
    const element = document.getElementById(id);

    if (element) {
      // Get navbar height for offset (assuming 64px, adjust if different)
      const navbarHeight = 64;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  return scrollTo;
}
