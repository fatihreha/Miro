import { createClient } from '@supabase/supabase-js';
import { emailSchema, passwordSchema } from '../utils/validation';

// Supabase Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Running in demo mode.');
}

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// =============================================
// API Performance Measurement Helper
// =============================================
const SLOW_API_THRESHOLD_MS = 1000; // Log warning for API calls > 1 second

/**
 * Measure API call performance and log slow queries
 */
export async function measureApiCall<T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await apiCall();
    const duration = performance.now() - start;

    if (duration > SLOW_API_THRESHOLD_MS) {
      console.warn(`⚠️ Slow API call: ${name} took ${duration.toFixed(0)}ms`);
    } else if (import.meta.env.MODE === 'development') {
      console.log(`📊 API: ${name} - ${duration.toFixed(0)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ API error: ${name} failed after ${duration.toFixed(0)}ms`, error);
    throw error;
  }
}

// Supabase Auth Helpers
export const authHelpers = {
  // Sign up with email
  async signUp(email: string, password: string, userData: any) {
    // ✅ SECURITY: Validate email and password before signup
    emailSchema.parse(email);
    passwordSchema.parse(password);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData // metadata
      }
    });
    return { data, error };
  },

  // Sign in with email
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // Sign in with phone OTP
  async signInWithPhone(phone: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone
    });
    return { data, error };
  },

  // Verify OTP
  async verifyOtp(phone: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Reset password
  async resetPasswordForEmail(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`
    });
    return { data, error };
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Update user profile
  async updateProfile(updates: any) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    return { data, error };
  },

  // Sign in with OAuth (Google, Apple)
  async signInWithOAuth(provider: 'google' | 'apple') {
    const redirectUrl = `${window.location.origin}${window.location.pathname}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false
      }
    });
    return { data, error };
  }
};

// Supabase Database Helpers
export const dbHelpers = {
  // Generic fetch
  async fetch(table: string, query?: any) {
    let request = supabase.from(table).select(query || '*');
    const { data, error } = await request;
    return { data, error };
  },

  // Insert
  async insert(table: string, record: any) {
    const { data, error } = await supabase
      .from(table)
      .insert(record)
      .select();
    return { data, error };
  },

  // Update
  async update(table: string, id: string, updates: any) {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },

  // Delete
  async delete(table: string, id: string) {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    return { data, error };
  }
};

// Supabase Storage Helpers
export const storageHelpers = {
  // Upload file
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
    return { data, error };
  },

  // Upload avatar - specialized function for user avatars
  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) return { data: null, error };

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return { data: { path: filePath, url: publicUrl }, error: null };
  },

  // Get public URL
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  // Delete file
  async deleteFile(bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    return { data, error };
  }
};

export default supabase;
