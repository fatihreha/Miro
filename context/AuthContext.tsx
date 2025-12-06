import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// REAL AuthProvider - Connected to Supabase with Production-Ready Error Handling
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const isLoggingOut = useRef(false);
    const profileFetchAttempts = useRef(0);
    const refreshRetryCount = useRef(0);

    useEffect(() => {
        // Check active session with retry logic
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error("AuthContext: Session check error", error);
                    await handleSessionError(error);
                    return;
                }
                
                if (session?.user) {
                    console.log("AuthContext: Session found", session.user.id);
                    await fetchUserProfileWithRetry(session.user.id);
                } else {
                    console.log("AuthContext: No session");
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("AuthContext: Unexpected error in checkSession", error);
                setIsLoading(false);
            }
        };

        checkSession();

        // Listen for auth changes with enhanced error handling
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("AuthContext: Auth Change", event, {
                hasSession: !!session,
                isLoggingOut: isLoggingOut.current
            });

            // Prevent race conditions during logout
            if (isLoggingOut.current) {
                console.log("AuthContext: Ignoring event during logout");
                return;
            }

            if (event === 'SIGNED_IN' && session?.user) {
                setIsAuthenticated(true);
                setIsLoading(false);
                await fetchUserProfileWithRetry(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                handleSignOut();
            } else if (event === 'TOKEN_REFRESHED') {
                console.log("AuthContext: Token refreshed successfully");
                refreshRetryCount.current = 0;
                if (session?.user) {
                    await verifyProfileAccess(session.user.id);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    /**
     * Handle session errors (expired token, banned user, etc.)
     */
    const handleSessionError = async (error: any) => {
        const errorMessage = error?.message || '';
        
        // Check if user is banned/suspended
        if (errorMessage.includes('banned') || errorMessage.includes('suspended')) {
            console.error("AuthContext: User account is banned or suspended");
            setIsLoading(false);
            alert('Your account has been suspended. Please contact support.');
            await forceLogout();
            return;
        }

        // Token refresh failed
        if (errorMessage.includes('refresh') || errorMessage.includes('token')) {
            console.error("AuthContext: Token refresh failed", error);
            await handleTokenRefreshFailure();
            return;
        }

        // Generic error - retry
        if (refreshRetryCount.current < MAX_RETRY_ATTEMPTS) {
            refreshRetryCount.current++;
            console.log(`AuthContext: Retrying session check (${refreshRetryCount.current}/${MAX_RETRY_ATTEMPTS})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * refreshRetryCount.current));
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchUserProfileWithRetry(session.user.id);
            }
        } else {
            console.error("AuthContext: Max retry attempts reached");
            setIsLoading(false);
            await forceLogout();
        }
    };

    /**
     * Handle token refresh failure with retry
     */
    const handleTokenRefreshFailure = async () => {
        if (refreshRetryCount.current < MAX_RETRY_ATTEMPTS) {
            refreshRetryCount.current++;
            console.log(`AuthContext: Retrying token refresh (${refreshRetryCount.current}/${MAX_RETRY_ATTEMPTS})`);
            
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * refreshRetryCount.current));
            
            try {
                const { data: { session }, error } = await supabase.auth.refreshSession();
                
                if (!error && session) {
                    console.log("AuthContext: Token refresh successful");
                    refreshRetryCount.current = 0;
                    return;
                }
            } catch (error) {
                console.error("AuthContext: Token refresh retry failed", error);
            }
        }
        
        // All retries failed - force logout
        console.error("AuthContext: Token refresh failed after all retries");
        alert('Your session has expired. Please log in again.');
        await forceLogout();
    };

    /**
     * Fetch user profile with retry and race condition prevention
     */
    const fetchUserProfileWithRetry = async (userId: string, attempt: number = 1): Promise<void> => {
        try {
            // Prevent infinite retry loops
            if (attempt > MAX_RETRY_ATTEMPTS) {
                console.error("AuthContext: Max profile fetch attempts reached");
                profileFetchAttempts.current = 0;
                await handleProfileFetchFailure(userId);
                return;
            }

            profileFetchAttempts.current = attempt;
            console.log(`AuthContext: Fetching profile (attempt ${attempt}) for userId: ${userId}`);

            let profile = await userService.getUserById(userId);
            console.log("AuthContext: getUserById result:", profile ? "Found" : "NULL");
            
            if (!profile) {
                console.warn("AuthContext: Profile not found, attempting to create");
                profile = await createUserProfile(userId);
                console.log("AuthContext: createUserProfile result:", profile ? "Created" : "NULL");
                
                if (!profile) {
                    // Retry after delay
                    console.log(`AuthContext: Profile creation failed, retrying in ${RETRY_DELAY * attempt}ms`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
                    await fetchUserProfileWithRetry(userId, attempt + 1);
                    return;
                }
            }

            // Double-check profile is valid
            if (!profile || !profile.id) {
                console.error("AuthContext: Profile is null or invalid");
                throw new Error("Invalid profile data received");
            }

            // Check if user is banned
            if ((profile as any).isBanned || (profile as any).status === 'banned') {
                console.error("AuthContext: User is banned");
                alert('Your account has been suspended. Please contact support.');
                await forceLogout();
                return;
            }

            console.log("AuthContext: Profile loaded successfully", profile.id);
            setUser(profile);
            setIsAuthenticated(true);
            profileFetchAttempts.current = 0;
            
        } catch (error) {
            console.error("AuthContext: Profile fetch error", error);
            
            // Network error - retry
            if (attempt < MAX_RETRY_ATTEMPTS) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
                await fetchUserProfileWithRetry(userId, attempt + 1);
            } else {
                await handleProfileFetchFailure(userId);
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Create user profile with proper error handling
     */
    const createUserProfile = async (userId: string): Promise<User | null> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userEmail = session?.user?.email || '';
            
            const profileData = {
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
            } as User;

            const created = await userService.createProfile(profileData);
            
            if (created) {
                // Verify profile was actually created
                const verified = await userService.getUserById(userId);
                return verified;
            }
            
            return null;
        } catch (error) {
            console.error("AuthContext: Profile creation error", error);
            return null;
        }
    };

    /**
     * Handle profile fetch failure
     */
    const handleProfileFetchFailure = async (userId: string) => {
        console.error("AuthContext: Could not fetch or create profile");
        
        // Try one final time with direct query
        try {
            console.log('AuthContext: Final attempt to fetch profile');
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .limit(1);
            
            if (data && data.length > 0) {
                console.log('AuthContext: Final attempt successful!');
                setUser(userService['formatUser'](data[0]));
                setIsAuthenticated(true);
                return;
            }
        } catch (finalError) {
            console.error('AuthContext: Final attempt failed:', finalError);
        }
        
        setUser(null);
        setIsAuthenticated(false);
        
        // Redirect to onboarding
        const currentPath = window.location.hash.replace('#', '');
        if (!currentPath.includes('onboarding') && !currentPath.includes('welcome') && !currentPath.includes('auth')) {
            console.log('AuthContext: Redirecting to onboarding due to profile failure');
            window.location.hash = '/onboarding';
        }
    };

    /**
     * Verify profile is still accessible after token refresh
     */
    const verifyProfileAccess = async (userId: string) => {
        try {
            const profile = await userService.getUserById(userId);
            if (!profile) {
                console.warn("AuthContext: Profile no longer accessible after refresh");
                await handleTokenRefreshFailure();
            }
        } catch (error) {
            console.error("AuthContext: Profile verification failed", error);
        }
    };

    /**
     * Handle sign out event
     */
    const handleSignOut = () => {
        console.log("AuthContext: Handling sign out");
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        isLoggingOut.current = false;
    };

    /**
     * Force logout (used for error states)
     */
    const forceLogout = async () => {
        try {
            isLoggingOut.current = true;
            await supabase.auth.signOut();
            handleSignOut();
            
            // Preserve splash screen state
            const hasSeenSplash = localStorage.getItem('hasSeenSplash');
            localStorage.clear();
            sessionStorage.clear();
            if (hasSeenSplash) {
                localStorage.setItem('hasSeenSplash', hasSeenSplash);
            }
            
            window.location.href = window.location.origin + window.location.pathname + '#/welcome';
        } catch (error) {
            console.error("AuthContext: Force logout error", error);
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
            isLoggingOut.current = true;
            
            await supabase.auth.signOut();
            handleSignOut();
            
            // Preserve hasSeenSplash when clearing storage
            const hasSeenSplash = localStorage.getItem('hasSeenSplash');
            localStorage.clear();
            sessionStorage.clear();
            if (hasSeenSplash) {
                localStorage.setItem('hasSeenSplash', hasSeenSplash);
            }
            
            console.log('AuthContext: Redirecting to welcome');
            window.location.href = window.location.origin + window.location.pathname + '#/welcome';
        } catch (error) {
            console.error('Logout error:', error);
            isLoggingOut.current = false;
            // Force cleanup even if logout fails
            handleSignOut();
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
