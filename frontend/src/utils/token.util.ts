const TOKEN_KEY = 'access_token';

const decodeJwtPayload = (token: string): any | null => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
};

export const saveToken = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

export const isTokenExpired = (): boolean => {
    const token = getToken();
    if (!token) {
        return true;
    }

    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) {
        return false;
    }

    const expirationTime = payload.exp * 1000;
    const now = Date.now();
    return now >= (expirationTime - 5000);
};

export const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
};

export const isValidToken = (): boolean => {
    const token = getToken();
    if (!token) {
        return false;
    }
    return !isTokenExpired();
};

