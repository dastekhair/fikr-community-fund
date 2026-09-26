import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Automatically scrolls the window to the top whenever the route pathname or hash changes.
 * Essential for mobile devices where footer or in-page links otherwise leave the viewport
 * scrolled to the bottom of the page.
 */
export const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search]);

  return null;
};
