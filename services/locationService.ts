import { Geolocation, Position } from '@capacitor/geolocation';
import { supabase } from './supabase';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface NearbyUser {
  id: string;
  name: string;
  avatarUrl: string;
  distance: number;
  sport?: string;
  level?: string;
}

export const locationService = {
  /**
   * Get current device location
   */
  async getCurrentLocation(): Promise<LocationData> {
    try {
      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
    } catch (error) {
      console.error('Location error:', error);
      throw new Error('Could not get location. Please enable location services.');
    }
  },

  /**
   * Check if location permission is granted
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const permission = await Geolocation.checkPermissions();
      return permission.location === 'granted';
    } catch {
      return false;
    }
  },

  /**
   * Request location permission
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const permission = await Geolocation.requestPermissions({
        permissions: ['location', 'coarseLocation']
      });
      return permission.location === 'granted';
    } catch {
      return false;
    }
  },

  /**
   * Update user's location in database
   */
  async updateUserLocation(userId: string): Promise<void> {
    try {
      const location = await this.getCurrentLocation();
      
      const { error } = await supabase
        .from('users')
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          location_accuracy: location.accuracy,
          location_updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update location:', error);
      throw error;
    }
  },

  /**
   * Get nearby users within radius
   */
  async getNearbyUsers(
    userId: string, 
    radiusKm: number = 10,
    filters?: {
      sport?: string;
      level?: string;
      minAge?: number;
      maxAge?: number;
    }
  ): Promise<NearbyUser[]> {
    try {
      const { data, error } = await supabase.rpc('get_nearby_users', {
        user_id: userId,
        radius_km: radiusKm,
        sport_filter: filters?.sport || null,
        level_filter: filters?.level || null,
        min_age: filters?.minAge || null,
        max_age: filters?.maxAge || null
      });

      if (error) throw error;

      return data?.map((user: any) => ({
        id: user.user_id,
        name: user.name,
        avatarUrl: user.avatar_url,
        distance: user.distance_km,
        sport: user.sport,
        level: user.level
      })) || [];
    } catch (error) {
      console.error('Failed to get nearby users:', error);
      return [];
    }
  },

  /**
   * Set location privacy (show/hide location)
   */
  async setLocationPrivacy(userId: string, showLocation: boolean): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ show_location: showLocation })
      .eq('id', userId);

    if (error) throw error;
  },

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Watch user location (real-time updates)
   */
  async watchPosition(
    userId: string,
    callback: (location: LocationData) => void
  ): Promise<string> {
    const watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000 // Update every minute
      },
      (position, error) => {
        if (error) {
          console.error('Watch position error:', error);
          return;
        }

        if (position) {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          // Update database
          this.updateUserLocation(userId).catch(console.error);

          // Call callback
          callback(location);
        }
      }
    );

    return watchId;
  },

  /**
   * Stop watching position
   */
  async clearWatch(watchId: string): Promise<void> {
    await Geolocation.clearWatch({ id: watchId });
  },

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
};
