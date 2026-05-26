import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { AuthService } from '../services/auth.service';
import { setAccessToken } from '../services/api';
import type {
    LoginPayload,
    RegisterPayload,
    User,
} from '../types/auth.types';

interface AuthContextValue {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (payload: LoginPayload) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ACCESS_TOKEN_KEY = 'find_pair_access_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessTokenState, setAccessTokenState] = useState<string | null>(
        localStorage.getItem(ACCESS_TOKEN_KEY),
    );
    const [isLoading, setIsLoading] = useState(true);

    const applySession = useCallback((nextUser: User | null, nextToken: string | null) => {
        setUser(nextUser);
        setAccessTokenState(nextToken);
        setAccessToken(nextToken);
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const savedToken = localStorage.getItem(ACCESS_TOKEN_KEY);

                if (savedToken) {
                    setAccessToken(savedToken);
                    const me = await AuthService.getMe();
                    applySession(me, savedToken);
                } else {
                    const refreshed = await AuthService.refresh();
                    applySession(refreshed.user, refreshed.accessToken);
                }
            } catch {
                applySession(null, null);
            } finally {
                setIsLoading(false);
            }
        };

        void initAuth();
    }, [applySession]);

    const login = useCallback(
        async (payload: LoginPayload) => {
            const data = await AuthService.login(payload);
            applySession(data.user, data.accessToken);
        },
        [applySession],
    );

    const register = useCallback(
        async (payload: RegisterPayload) => {
            const data = await AuthService.register(payload);
            applySession(data.user, data.accessToken);
        },
        [applySession],
    );

    const logout = useCallback(async () => {
        try {
            await AuthService.logout();
        } finally {
            applySession(null, null);
        }
    }, [applySession]);

    const value = useMemo(
        () => ({
            user,
            accessToken: accessTokenState,
            isAuthenticated: Boolean(user && accessTokenState),
            isLoading,
            login,
            register,
            logout,
        }),
        [user, accessTokenState, isLoading, login, register, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuthContext must be used within AuthProvider');
    }

    return context;
};