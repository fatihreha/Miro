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
                // Set authenticated immediately to speed up UI response
                setIsAuthenticated(true);
                setIsLoading(false);
                // Fetch profile in background
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
            let profile = await userService.getUserById(userId);
            
            if (!profile) {
                console.warn("AuthContext: User profile not found for ID", userId, "- attempting to create");
                
                // Get email from auth session
                const { data: { session } } = await supabase.auth.getSession();
                const userEmail = session?.user?.email || '';
                
                // Create minimal profile
                const created = await userService.createProfile({
                    id: userId,
                    email: userEmail,
                    name: userEmail.split('@')[0] || 'User',
                    isTrainer: false,
                    isPremium: false,
                    interests: [],
                    bio: '',
                    location: '',
                    level: 'Beginner',
                    workoutTimePreference: 'Anytime'
                } as User);
                
                if (created) {
                    // Retry fetching the profile
                    profile = await userService.getUserById(userId);
                }
            }
            
            if (profile) {
                setUser(profile);
                setIsAuthenticated(true);
            } else {
                console.error("AuthContext: Could not create or fetch profile for", userId);
                // Profile missing - redirect to onboarding
                setUser(null);
                setIsAuthenticated(false);
                // Check if we're not already on onboarding/welcome/auth pages
                const currentPath = window.location.hash.replace('#', '');
                if (!currentPath.includes('onboarding') && !currentPath.includes('welcome') && !currentPath.includes('auth')) {
                    console.log('AuthContext: Redirecting to onboarding due to missing profile');
                    window.location.hash = '/onboarding';
                }
            }
        } catch (error) {
            console.error("AuthContext: Fetch profile error", error);
            setUser(null);
            setIsAuthenticated(false);
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
        try {
            console.log('AuthContext: Logout initiated');
            await supabase.auth.signOut();
            setUser(null);
            setIsAuthenticated(false);
            
            // Preserve hasSeenSplash when clearing storage
            const hasSeenSplash = localStorage.getItem('hasSeenSplash');
            localStorage.clear();
            sessionStorage.clear();
            if (hasSeenSplash) {
                localStorage.setItem('hasSeenSplash', hasSeenSplash);
            }
            
            console.log('AuthContext: Redirecting to welcome');
            // Force navigation to welcome page with full URL
            window.location.href = window.location.origin + window.location.pathname + '#/welcome';
        } catch (error) {
            console.error('Logout error:', error);
        }
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
