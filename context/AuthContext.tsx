import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';
import { userService } from '../services/userService';
import { pushNotificationService } from '../services/pushNotificationService';
import { presenceService } from '../services/presenceService';
import { notificationService } from '../services/notificationService';

// Auth error types for better error handling
export interface AuthError {
    code: 'SESSION_EXPIRED' | 'ACCOUNT_BANNED' | 'PROFILE_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN';
    message: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    authError: AuthError | null;
    login: (userData: User) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => Promise<void>;
    reloadUser: () => Promise<void>;
    consumeSwipe: () => Promise<void>;
    clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DAILY_SWIPE_LIMIT = 10;
const MAX_RETRY_ATTEMPTS = 2; // Reduced from 3 for faster response
const RETRY_DELAY = 300; // Reduced from 500 for faster response

// REAL AuthProvider - Connected to Supabase with Production-Ready Error Handling
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<AuthError | null>(null);

    const clearAuthError = () => setAuthError(null);

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

        // Global timeout - ensure loading never exceeds 5 seconds
        const timeoutId = setTimeout(() => {
            console.warn("AuthContext: Global timeout reached, forcing loading to stop");
            setIsLoading(false);
        }, 5000);

        checkSession().finally(() => {
            clearTimeout(timeoutId);
        });

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
                setIsLoading(true);
                // Do not set isAuthenticated=true here, wait for profile fetch
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
            setAuthError({ code: 'ACCOUNT_BANNED', message: 'Your account has been suspended. Please contact support.' });
            notificationService.showNotification('Account Suspended', { body: 'Please contact support for assistance.' });
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
        setAuthError({ code: 'SESSION_EXPIRED', message: 'Your session has expired. Please log in again.' });
        notificationService.showNotification('Session Expired', { body: 'Please log in again.' });
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
                // Wait briefly to give registration flow time to create the profile
                // This prevents race conditions where AuthContext tries to create a generic profile
                // while Auth.tsx is creating the detailed one.
                if (attempt === 1) {
                    console.log("AuthContext: Profile not found, waiting for potential registration...");
                    await new Promise(resolve => setTimeout(resolve, 800));
                    profile = await userService.getUserById(userId);
                }

                if (!profile) {
                    console.warn("AuthContext: Profile still not found, attempting to create");
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
            }

            // Double-check profile is valid
            if (!profile || !profile.id) {
                console.error("AuthContext: Profile is null or invalid");
                throw new Error("Invalid profile data received");
            }

            // Check if user is banned
            if ((profile as any).isBanned || (profile as any).status === 'banned') {
                console.error("AuthContext: User is banned");
                setAuthError({ code: 'ACCOUNT_BANNED', message: 'Your account has been suspended. Please contact support.' });
                notificationService.showNotification('Account Suspended', { body: 'Please contact support for assistance.' });
                await forceLogout();
                return;
            }

            console.log("AuthContext: Profile loaded successfully", profile.id);
            setUser(profile);
            setIsAuthenticated(true);
            profileFetchAttempts.current = 0;

            // Initialize push notifications after successful login
            try {
                await pushNotificationService.initialize(profile.id);
            } catch (pushError) {
                console.warn('AuthContext: Push notification initialization failed:', pushError);
            }

            // Initialize presence service
            try {
                await presenceService.initialize(profile.id);
            } catch (presenceError) {
                console.warn('AuthContext: Presence initialization failed:', presenceError);
            }

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
     * Uses OAuth metadata (name, avatar) when available from social logins
     */
    const createUserProfile = async (userId: string): Promise<User | null> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userEmail = session?.user?.email || '';
            const userMetadata = session?.user?.user_metadata || {};

            // Use OAuth provider data if available (Google/Apple provide these)
            const displayName = userMetadata.full_name || userMetadata.name || userEmail.split('@')[0] || 'User';
            const avatarUrl = userMetadata.avatar_url || userMetadata.picture || '';

            const profileData = {
                id: userId,
                email: userEmail,
                name: displayName,
                avatarUrl: avatarUrl,
                age: 0, // Will be updated during onboarding
                isTrainer: false,
                isPremium: false,
                interests: [] as any[],
                bio: '',
                location: '',
                level: 'Beginner' as const,
                workoutTimePreference: 'Anytime' as const  // Must match DB constraint
            };

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
                setIsLoading(false); // Important: stop loading
                return;
            }
        } catch (finalError) {
            console.error('AuthContext: Final attempt failed:', finalError);
        }

        // Profile doesn't exist - set loading to false and show auth error
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false); // Critical: stop loading spinner
        setAuthError({
            code: 'PROFILE_ERROR',
            message: 'Could not load your profile. Please try again or contact support.'
        });

        // Redirect to onboarding to create profile
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

            // Remove push notification token before logging out
            if (user?.id) {
                try {
                    await pushNotificationService.removeToken(user.id);
                } catch (pushError) {
                    console.warn('AuthContext: Failed to remove push token:', pushError);
                }
            }

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
            await fetchUserProfileWithRetry(user.id);
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
            authError,
            login,
            logout,
            updateUser,
            reloadUser,
            consumeSwipe,
            clearAuthError
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
