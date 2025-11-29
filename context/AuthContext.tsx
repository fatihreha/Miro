import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';
import { userService } from '../services/userService';

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

// REAL AuthProvider - Connected to Supabase
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check active session
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    console.log("AuthContext: Session found", session.user.id);
                    await fetchUserProfile(session.user.id);
                } else {
                    console.log("AuthContext: No session");
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("AuthContext: Session check error", error);
                setIsLoading(false);
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("AuthContext: Auth Change", event);
            if (event === 'SIGNED_IN' && session?.user) {
                await fetchUserProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsAuthenticated(false);
                setIsLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchUserProfile = async (userId: string) => {
        try {
            const profile = await userService.getUserById(userId);
            if (profile) {
                setUser(profile);
                setIsAuthenticated(true);
            } else {
                console.warn("AuthContext: User profile not found for ID", userId);
                // If profile missing but auth exists, maybe create it? 
                // For now, just set authenticated but no profile data might be risky.
                // Let's assume Auth.tsx handles creation.
            }
        } catch (error) {
            console.error("AuthContext: Fetch profile error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (userData: User) => {
        // This is now mostly for Demo/Manual overrides if needed, 
        // but normally Supabase Auth handles this via onAuthStateChange.
        // If we pass a full user object (like from Demo Mode), we set it directly.
        console.log("AuthContext: Manual Login (Demo/Override)", userData.id);
        setUser(userData);
        setIsAuthenticated(true);
        setIsLoading(false);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsAuthenticated(false);
        localStorage.clear();
    };

    const updateUser = async (data: Partial<User>) => {
        if (!user) return;

        // Optimistic update
        setUser(prev => prev ? { ...prev, ...data } : null);

        // Persist to DB
        await userService.updateProfile(user.id, data);
    };

    const reloadUser = async () => {
        if (user) {
            await fetchUserProfile(user.id);
        }
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
