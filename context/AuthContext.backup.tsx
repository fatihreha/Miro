
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';
import { pushNotificationService } from '../services/pushNotificationService';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Ref to track if we are in a manual demo session
  // This prevents onAuthStateChanged(null) from logging us out immediately after a manual login
  const isDemoModeRef = useRef(false);

  // Listen for Supabase Auth State Changes
  useEffect(() => {
    // Wrap in try-catch to prevent crash
    const initAuth = async () => {
      try {
        // Check for existing session on mount
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('AuthProvider initialization error:', error);
        // Continue without auth - don't crash the app
        setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth event:', event);

          if (session?.user) {
            // User logged in
            isDemoModeRef.current = false;
            await loadUserProfile(session.user.id);

            // Initialize push notifications
            try {
              await pushNotificationService.initialize(session.user.id);
            } catch (error) {
              console.warn('Push notification init failed:', error);
            }
          } else {
            // User logged out
            if (isDemoModeRef.current) {
              console.log("AuthContext: Ignoring Supabase logout event (Demo Mode Active)");
              return;
            }

            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Supabase auth subscription error:', error);
      // App can still run without auth subscription
    }
  }, []);

  // Helper function to load user profile from Supabase
  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        // Create new user profile if doesn't exist
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user) {
          const newUser: Partial<User> = {
            auth_id: userId,
            name: authUser.user.user_metadata?.name || 'New User',
            email: authUser.user.email || '',
            age: 0,
            location: '',
            avatarUrl: authUser.user.user_metadata?.avatar_url || '',
            interests: [],
            level: 'Beginner',
            bio: '',
            dailySwipes: DAILY_SWIPE_LIMIT,
            lastSwipeReset: new Date().toISOString()
          };

          const { data: created } = await supabase
            .from('users')
            .insert(newUser)
            .select()
            .single();

          if (created) {
            setUser({ ...created, id: created.id } as User);
            setIsAuthenticated(true);
          }
        }
      } else if (data) {
        const processedUser = checkAndResetSwipes({ ...data, id: data.id } as User);
        setUser(processedUser);
        setIsAuthenticated(true);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading user profile:", error);
      setIsLoading(false);
    }
  };

  // Helper to reset swipes if it's a new day
  const checkAndResetSwipes = (userData: User): User => {
    const today = new Date().toDateString();
    const lastReset = userData.lastSwipeReset ? new Date(userData.lastSwipeReset).toDateString() : '';

    if (lastReset !== today) {
      // It's a new day, reset swipes
      const updatedData = {
        ...userData,
        dailySwipes: DAILY_SWIPE_LIMIT,
        lastSwipeReset: new Date().toISOString()
      };
      // Trigger async update but don't wait for it
      updateSupabaseUser({
        dailySwipes: DAILY_SWIPE_LIMIT,
        lastSwipeReset: new Date().toISOString()
      }, userData.id);
      return updatedData;
    }

    // Ensure dailySwipes is defined even if not resetting
    if (userData.dailySwipes === undefined) {
      return { ...userData, dailySwipes: DAILY_SWIPE_LIMIT };
    }

    return userData;
  };

  const reloadUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await loadUserProfile(authUser.id);
    }
  };

  // Manual login function (for demo mode or initial setup)
  const login = async (userData: User) => {
    console.log("AuthContext: Manual Login Triggered", userData.id);

    if (userData.id.startsWith('demo-')) {
      isDemoModeRef.current = true;
    }

    // Check resets
    const processedUser = checkAndResetSwipes(userData);

    setUser(processedUser);
    setIsAuthenticated(true);

    // Try to sync with Supabase if possible, but don't crash if not
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      try {
        await updateSupabaseUser(processedUser, authUser.id);
      } catch (e) {
        console.warn("Supabase sync failed during login (expected in demo mode)", e);
      }
    }
  };

  const updateSupabaseUser = async (data: Partial<User>, uid?: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const targetId = uid || user?.id;
    if (!targetId) return;

    // Convert camelCase to snake_case for Supabase
    const snakeCaseData: any = {};
    Object.keys(data).forEach(key => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      snakeCaseData[snakeKey] = (data as any)[key];
    });

    await supabase
      .from('users')
      .update(snakeCaseData)
      .eq('id', targetId);
  };

  const logout = async () => {
    try {
      isDemoModeRef.current = false; // Clear demo flag

      // Remove push notification token
      if (user?.id) {
        await pushNotificationService.removeToken(user.id);
      }

      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      localStorage.clear();
    } catch (error) {
      console.error("Logout failed", error);
      // Force clear even on error
      isDemoModeRef.current = false;
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    // Optimistic UI update
    setUser((prev) => prev ? { ...prev, ...data } : null);
    try {
      await updateSupabaseUser(data);
    } catch (e) {
      console.warn("Failed to sync update to Supabase", e);
    }
  };

  const consumeSwipe = async () => {
    if (!user) return;

    // Premium users have unlimited swipes
    if (user.isPremium) return;

    const currentSwipes = user.dailySwipes ?? DAILY_SWIPE_LIMIT;
    if (currentSwipes > 0) {
      const newCount = currentSwipes - 1;
      await updateUser({ dailySwipes: newCount });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, updateUser, reloadUser, consumeSwipe }}>
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
