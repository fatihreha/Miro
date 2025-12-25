import { Geolocation, Position } from '@capacitor/geolocation';
import { supabase } from './supabase';
import { LocationType, MapLocation } from '../types';

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

// Default locations for initial load / fallback - Real Istanbul coordinates
const DEFAULT_LOCATIONS: MapLocation[] = [
  {
    id: '1',
    name: 'MacFit Levent',
    type: LocationType.GYM,
    coordinates: { lat: 41.0822, lng: 29.0111 },
    rating: 4.8,
    reviews: 120,
    description: 'Modern spor salonu, 24/7 erişim ve sauna.',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60',
    verified: true,
    address: 'Levent Mah. Büyükdere Cad.',
    contact: '+90 212 555 0101',
    website: 'macfit.com.tr',
    hours: '24/7 Açık',
    tags: ['Sauna', 'Free Weights', 'Kardiyo', 'Duşlar']
  },
  {
    id: '2',
    name: 'Bebek Koşu Yolu',
    type: LocationType.ROUTE,
    coordinates: { lat: 41.0769, lng: 29.0436 },
    rating: 4.9,
    reviews: 85,
    description: 'Boğaz manzaralı 3km koşu parkuru. Gün batımları için mükemmel.',
    image: 'https://images.unsplash.com/photo-1506197061617-7f5c0b093236?w=800&auto=format&fit=crop&q=60',
    verified: true,
    address: 'Bebek Sahil',
    tags: ['Manzaralı', '3km', 'Asfalt', 'Aydınlatmalı']
  },
  {
    id: '3',
    name: 'Kemer Country Kortları',
    type: LocationType.COURT,
    coordinates: { lat: 41.1536, lng: 29.0089 },
    rating: 4.5,
    reviews: 42,
    description: 'Profesyonel tenis kortları.',
    image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&auto=format&fit=crop&q=60',
    verified: true,
    address: 'Kemer Country, Göktürk',
    contact: '+90 212 555 0103',
    hours: '06:00 - 22:00',
    tags: ['Tenis', 'Ekipman Kiralama', 'Işıklı']
  },
  {
    id: '4',
    name: 'Maçka Parkı',
    type: LocationType.PARK,
    coordinates: { lat: 41.0465, lng: 28.9953 },
    rating: 5.0,
    reviews: 210,
    description: 'Şehrin ortasında açık hava yoga ve meditasyon için huzurlu alan.',
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800&auto=format&fit=crop&q=60',
    verified: true,
    address: 'Maçka, Şişli',
    tags: ['Yoga', 'Meditasyon', 'Sessiz Alan']
  },
  {
    id: '5',
    name: 'Galatasaray Yüzme Havuzu',
    type: LocationType.POOL,
    coordinates: { lat: 41.0340, lng: 28.9877 },
    rating: 4.7,
    reviews: 156,
    description: 'Olimpik yüzme havuzu.',
    image: 'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?w=800&auto=format&fit=crop&q=60',
    verified: true,
    address: 'Mecidiyeköy',
    contact: '+90 212 555 0199',
    hours: '06:00 - 21:00',
    tags: ['Isıtmalı', 'Kulvarlar', 'Kurslar', 'Dolap']
  },
  {
    id: 's1',
    name: 'Gold Standard Recovery',
    type: LocationType.SALON,
    coordinates: { lat: 41.0556, lng: 29.0093 },
    rating: 5.0,
    reviews: 342,
    description: 'Lüks spor iyileşme salonu. Kriyoterapi, masaj ve elit sporcular için IV damla.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=60',
    verified: true,
    isSponsored: true,
    address: 'Nişantaşı, Teşvikiye Cad.',
    contact: '+90 800 RECOVER',
    website: 'goldstandard.recovery',
    hours: '08:00 - 20:00',
    tags: ['Kriyo', 'Masaj', 'Sauna', 'IV Terapi', 'Lüks']
  },
  {
    id: 's2',
    name: 'Pro Nutrition Hub',
    type: LocationType.SALON,
    coordinates: { lat: 41.0631, lng: 29.0169 },
    rating: 4.8,
    reviews: 128,
    description: 'Yüksek performans için kişiselleştirilmiş yemek hazırlama ve beslenme danışmanlığı.',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=60',
    verified: true,
    isSponsored: true,
    address: 'Etiler',
    contact: '+90 555 EAT-WELL',
    hours: '09:00 - 19:00',
    tags: ['Yemek Hazırlama', 'Takviyeler', 'Danışmanlık']
  }
];

export const locationService = {
  /**
   * Check if running on native platform (Capacitor)
   */
  isNativePlatform(): boolean {
    return typeof (window as any).Capacitor !== 'undefined' &&
      (window as any).Capacitor.isNativePlatform();
  },

  /**
   * Get current device location (works on both web and native)
   */
  async getCurrentLocation(): Promise<LocationData> {
    // Use native Capacitor on mobile, browser API on web
    if (this.isNativePlatform()) {
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
        console.error('Capacitor location error:', error);
        throw new Error('Could not get location. Please enable location services.');
      }
    } else {
      // Web browser fallback
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by this browser.'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            console.error('Browser geolocation error:', error);
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error('Konum izni verilmedi. Lütfen tarayıcı ayarlarından izin verin.'));
                break;
              case error.POSITION_UNAVAILABLE:
                reject(new Error('Konum bilgisi alınamadı.'));
                break;
              case error.TIMEOUT:
                reject(new Error('Konum isteği zaman aşımına uğradı.'));
                break;
              default:
                reject(new Error('Konum alınırken bir hata oluştu.'));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });
    }
  },

  /**
   * Reverse geocode coordinates to city name using OpenStreetMap Nominatim
   * Returns city/town name with country (e.g., "İstanbul, Türkiye")
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SportPulse/1.0 (contact@sportpulse.app)',
            'Accept-Language': 'tr,en'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();

      // Extract city and country
      const address = data.address || {};
      const city = address.city || address.town || address.municipality || address.county || address.state || '';
      const country = address.country || '';

      if (city && country) {
        return `${city}, ${country}`;
      } else if (city) {
        return city;
      } else if (data.display_name) {
        // Fallback: use first two parts of display name
        const parts = data.display_name.split(',').map((p: string) => p.trim());
        return parts.slice(0, 2).join(', ');
      }

      return 'Unknown Location';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Location unavailable';
    }
  },

  /**
   * Get current location with city name
   * Returns both coordinates and human-readable address
   */
  async getCurrentLocationWithCity(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
    cityName: string;
  }> {
    const location = await this.getCurrentLocation();
    const cityName = await this.reverseGeocode(location.latitude, location.longitude);

    return {
      ...location,
      cityName
    };
  },

  /**
   * Check if location permission is granted (works on both web and native)
   */
  async checkPermissions(): Promise<boolean> {
    if (this.isNativePlatform()) {
      try {
        const permission = await Geolocation.checkPermissions();
        return permission.location === 'granted';
      } catch {
        return false;
      }
    } else {
      // Web: check via permissions API if available
      if (navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          return result.state === 'granted';
        } catch {
          return false;
        }
      }
      // If permissions API not available, assume we need to try
      return false;
    }
  },

  /**
   * Request location permission (works on both web and native)
   */
  async requestPermissions(): Promise<boolean> {
    if (this.isNativePlatform()) {
      try {
        const permission = await Geolocation.requestPermissions({
          permissions: ['location', 'coarseLocation']
        });
        return permission.location === 'granted';
      } catch {
        return false;
      }
    } else {
      // Web: trigger permission by trying to get location
      try {
        await this.getCurrentLocation();
        return true;
      } catch {
        return false;
      }
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

  toRad(value: number): number {
    return (value * Math.PI) / 180;
  },

  // ============================================
  // MAP LOCATIONS (Places/Venues)
  // ============================================

  /**
   * Get all map locations (gyms, courts, parks, etc.)
   */
  async getMapLocations(filters?: {
    type?: LocationType | 'All';
    search?: string;
    verified?: boolean;
  }): Promise<MapLocation[]> {
    try {
      let query = supabase
        .from('locations')
        .select('*')
        .order('is_sponsored', { ascending: false })
        .order('rating', { ascending: false });

      if (filters?.type && filters.type !== 'All') {
        query = query.eq('type', filters.type);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.verified !== undefined) {
        query = query.eq('verified', filters.verified);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching locations:', error);
        // Return default locations as fallback
        return this.filterDefaultLocations(filters);
      }

      if (!data || data.length === 0) {
        return this.filterDefaultLocations(filters);
      }

      return data.map(this.formatMapLocation);
    } catch (error) {
      console.error('Get locations error:', error);
      return this.filterDefaultLocations(filters);
    }
  },

  /**
   * Filter default locations based on filters
   */
  filterDefaultLocations(filters?: {
    type?: LocationType | 'All';
    search?: string;
  }): MapLocation[] {
    let filtered = [...DEFAULT_LOCATIONS];

    if (filters?.type && filters.type !== 'All') {
      filtered = filtered.filter(loc => loc.type === filters.type);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(loc =>
        loc.name.toLowerCase().includes(searchLower) ||
        loc.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort sponsored to top
    return filtered.sort((a, b) => {
      if (a.isSponsored && !b.isSponsored) return -1;
      if (!a.isSponsored && b.isSponsored) return 1;
      return 0;
    });
  },

  /**
   * Get location by ID
   */
  async getMapLocationById(locationId: string): Promise<MapLocation | null> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single();

      if (error) {
        // Check default locations
        const defaultLoc = DEFAULT_LOCATIONS.find(l => l.id === locationId);
        return defaultLoc || null;
      }

      return this.formatMapLocation(data);
    } catch (error) {
      console.error('Get location error:', error);
      return DEFAULT_LOCATIONS.find(l => l.id === locationId) || null;
    }
  },

  /**
   * Create a new map location (user submission)
   */
  async createMapLocation(locationData: {
    name: string;
    type: LocationType;
    description: string;
    coordinates?: { x: number; y: number };
    address?: string;
    contact?: string;
    website?: string;
    hours?: string;
    tags?: string[];
    submittedBy: string;
  }): Promise<MapLocation | null> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({
          name: locationData.name,
          type: locationData.type,
          description: locationData.description,
          coordinates_x: locationData.coordinates?.x || Math.random() * 80 + 10,
          coordinates_y: locationData.coordinates?.y || Math.random() * 80 + 10,
          address: locationData.address,
          contact: locationData.contact,
          website: locationData.website,
          hours: locationData.hours,
          tags: locationData.tags || [],
          submitted_by: locationData.submittedBy,
          verified: false,
          is_sponsored: false,
          rating: 0,
          reviews: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating location:', error);
        return null;
      }

      return this.formatMapLocation(data);
    } catch (error) {
      console.error('Create location error:', error);
      return null;
    }
  },

  /**
   * Rate a map location
   */
  async rateMapLocation(locationId: string, rating: number): Promise<boolean> {
    try {
      const { data: location } = await supabase
        .from('locations')
        .select('rating, reviews')
        .eq('id', locationId)
        .single();

      if (!location) return false;

      const currentTotal = location.rating * location.reviews;
      const newReviews = location.reviews + 1;
      const newRating = (currentTotal + rating) / newReviews;

      const { error } = await supabase
        .from('locations')
        .update({
          rating: Math.round(newRating * 10) / 10,
          reviews: newReviews
        })
        .eq('id', locationId);

      return !error;
    } catch (error) {
      console.error('Rate location error:', error);
      return false;
    }
  },

  /**
   * Subscribe to location updates
   */
  subscribeToMapLocations(callback: (locations: MapLocation[]) => void): () => void {
    const channelName = 'locations:all';

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'locations'
        },
        async () => {
          const locations = await this.getMapLocations();
          callback(locations);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  },

  /**
   * Format database record to MapLocation
   */
  formatMapLocation(data: any): MapLocation {
    return {
      id: data.id,
      name: data.name,
      type: data.type as LocationType,
      coordinates: {
        lat: data.coordinates_x || 50,
        lng: data.coordinates_y || 50
      },
      rating: data.rating || 0,
      reviews: data.reviews || 0,
      description: data.description || '',
      image: data.image_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60',
      verified: data.verified || false,
      isSponsored: data.is_sponsored || false,
      address: data.address,
      contact: data.contact,
      website: data.website,
      hours: data.hours,
      tags: data.tags || []
    };
  }
};
