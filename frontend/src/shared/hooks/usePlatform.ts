import { useState, useEffect } from 'react';

export function usePlatform() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: windowWidth <= 768,
    isTablet: windowWidth > 768 && windowWidth <= 1024,
    isDesktop: windowWidth > 1024
  };
}
