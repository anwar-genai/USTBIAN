import { useState, useEffect } from 'react';

export const useResponsiveInput = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < 640;
  const isTablet = windowSize.width >= 640 && windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;

  const getResponsivePadding = () => ({
    paddingLeft: isMobile ? '16px' : '24px',
    paddingRight: isMobile ? '16px' : '24px',
  });

  const getResponsiveMaxHeight = () => 
    windowSize.height * (isMobile ? 0.3 : 0.4);

  const getResponsivePlaceholderPosition = () => 
    isMobile ? 'left-4' : 'left-6';

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    getResponsivePadding,
    getResponsiveMaxHeight,
    getResponsivePlaceholderPosition,
  };
};
