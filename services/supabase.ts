import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

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

// Supabase Auth Helpers
export const authHelpers = {
  // Sign up with email
  async signUp(email: string, password: string, userData: any) {
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

export default supabase;
