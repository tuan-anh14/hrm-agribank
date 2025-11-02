/**
 * Breakpoint constants for responsive design
 * Based on Ant Design breakpoints
 */
export const BREAKPOINTS = {
    xs: 480,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1600,
} as const;

/**
 * Mobile breakpoint threshold
 */
export const MOBILE_BREAKPOINT = BREAKPOINTS.md; // 768px

/**
 * Sidebar dimensions
 */
export const SIDEBAR = {
    width: 200,
    collapsedWidth: 80,
    mobileWidth: 250,
    headerHeight: 64,
} as const;

/**
 * Layout spacing
 */
export const SPACING = {
    mobile: {
        padding: '12px',
        contentPadding: '16px',
    },
    desktop: {
        padding: '24px',
        contentPadding: '24px',
    },
} as const;

