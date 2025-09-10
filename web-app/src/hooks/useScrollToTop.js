import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top instantly when location changes
    window.scrollTo(0, 0);
  }, [location.pathname]);
};
