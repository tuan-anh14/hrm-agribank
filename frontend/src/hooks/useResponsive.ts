import { useState, useEffect } from 'react';
import { MOBILE_BREAKPOINT, BREAKPOINTS } from '@/utils/constants';

interface UseResponsiveReturn {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    width: number;
}

/**
 * Custom hook for responsive design
 * Detects screen size and provides responsive flags
 */
export const useResponsive = (): UseResponsiveReturn => {
    const [width, setWidth] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth;
        }
        return 0;
    });

    useEffect(() => {
        const handleResize = () => {
            setWidth(window.innerWidth);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return {
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < BREAKPOINTS.lg,
        isDesktop: width >= BREAKPOINTS.lg,
        width,
    };
};

/**
 * Simple hook to check if screen is mobile
 */
export const useIsMobile = (): boolean => {
    const { isMobile } = useResponsive();
    return isMobile;
};

