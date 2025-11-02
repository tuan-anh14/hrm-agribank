import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface ISidebarContext {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    toggleSidebar: () => void;
}

const SidebarContext = createContext<ISidebarContext | null>(null);

SidebarContext.displayName = 'SidebarContext';

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = useCallback(() => {
        setCollapsed((prev) => !prev);
    }, []);

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed, toggleSidebar }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within SidebarProvider');
    }
    return context;
};

