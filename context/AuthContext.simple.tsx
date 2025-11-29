import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (userData: User) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => Promise<void>;
    reloadUser: () => Promise<void>;
    consumeSwipe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DAILY_SWIPE_LIMIT = 10;

// SIMPLIFIED AuthProvider - No Supabase, just local state
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Set to false immediately

    const login = async (userData: User) => {
        console.log("AuthContext: Manual Login", userData.id);
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.clear();
    };

    const updateUser = async (data: Partial<User>) => {
        setUser((prev) => prev ? { ...prev, ...data } : null);
    };

    const reloadUser = async () => {
        // No-op for now
    };

    const consumeSwipe = async () => {
        if (!user || user.isPremium) return;

        const currentSwipes = user.dailySwipes ?? DAILY_SWIPE_LIMIT;
        if (currentSwipes > 0) {
            await updateUser({ dailySwipes: currentSwipes - 1 });
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoading,
            login,
            logout,
            updateUser,
            reloadUser,
            consumeSwipe
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
