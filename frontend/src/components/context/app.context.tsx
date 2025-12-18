import { createContext, useContext, useState, useEffect } from "react";
import { getToken, isValidToken, removeToken } from "@/utils/token.util";
import { fetchAccountAPI } from "@/services/api";

interface IAppContext {
    isAuthenticated: boolean;
    setIsAuthenticated: (v: boolean) => void;
    setUser: (v: IUser) => void;
    isAppLoading: boolean
    setIsAppLoading: (v: boolean) => void
    user: IUser | null;
}

const CurrentAppContext = createContext<IAppContext | null>(null);


type TProps = {
    children: React.ReactNode;
};

export const AppProvider = (props: TProps) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        const token = getToken();
        return token ? isValidToken() : false;
    });
    const [user, setUser] = useState<IUser | null>(null);
    const [isAppLoading, setIsAppLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchAccount = async () => {
            const token = getToken();

            if (!token) {
                setIsAppLoading(false);
                setIsAuthenticated(false);
                return;
            }

            if (!isValidToken()) {
                removeToken();
                setIsAppLoading(false);
                setIsAuthenticated(false);
                return;
            }

            // Don't set loading to true here because it defaults to true
            // setIsAppLoading(true);

            try {
                // Determine if we need to cast the response. Using 'any' for safety if types aren't global, 
                // but attempting to follow layout.tsx pattern if possible.
                // Since I cannot see the types file, I will use 'any' to avoid build errors if IFetchAccount isn't available here, 
                // essentially copying the logic but being safe.
                // The original code in layout.tsx used: await fetchAccountAPI() as IFetchAccount | { data: { user: IUser } };
                // I'll import fetchAccountAPI first (next step handles imports), here is the body.
                const res = await fetchAccountAPI() as any;

                if (res && res.user) {
                    setUser(res.user);
                    setIsAuthenticated(true);
                } else if (res && res.data && res.data.user) {
                    setUser(res.data.user);
                    setIsAuthenticated(true);
                } else {
                    // console.warn('Failed to fetch account: no user data', res);
                    setIsAuthenticated(false);
                    // allow loading to finish even if failed, so user sees content (likely redirected by protected route)
                }
            } catch (error: any) {
                // console.error('Error fetching account:', error);
                if (error?.response?.status === 401 || error?.statusCode === 401) {
                    removeToken();
                    setIsAuthenticated(false);
                } else {
                    setIsAuthenticated(false);
                }
            } finally {
                setIsAppLoading(false);
            }
        };

        // Run fetchAccount immediately
        fetchAccount();

        // Keep storage listener
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'access_token') {
                const token = getToken();
                setIsAuthenticated(token ? isValidToken() : false);
                if (!token) {
                    setUser(null);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return (
        <CurrentAppContext.Provider value={{
            isAuthenticated, user, setIsAuthenticated, setUser, isAppLoading, setIsAppLoading
        }}>
            {props.children}
        </CurrentAppContext.Provider>
    );
};

export const useCurrentApp = () => {
    const currentAppContext = useContext(CurrentAppContext);

    if (!currentAppContext) {
        throw new Error(
            "useCurrentApp has to be used within <CurrentAppContext.Provider>"
        );
    }

    return currentAppContext;
};
