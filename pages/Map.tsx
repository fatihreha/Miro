import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GlassCard, GlassButton, GlassSelectable, GlassInput } from '../components/ui/Glass';
import { Plus, Star, MapPin, X, Info, Crosshair, Search, LayoutGrid, Compass, ChevronRight, Phone, Globe, Clock, Tag, Crown, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { LocationType, MapLocation } from '../types';
import { notificationService } from '../services/notificationService';
import { hapticFeedback } from '../services/hapticService';
import { useLayout } from '../context/LayoutContext';
import { locationService } from '../services/locationService';
import { useAuth } from '../context/AuthContext';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (emoji: string, isSponsored: boolean = false, isLight: boolean = false) => {
  return L.divIcon({
    html: `<div style="
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${isSponsored ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : (isLight ? 'white' : '#1e293b')};
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      border: 2px solid ${isSponsored ? '#fbbf24' : (isLight ? '#e2e8f0' : '#334155')};
      font-size: 20px;
    ">${emoji}</div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// User location icon
const userLocationIcon = L.divIcon({
  html: `<div style="position: relative; width: 24px; height: 24px;">
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      background: rgba(59, 130, 246, 0.3);
      border-radius: 50%;
      animation: pulse 2s infinite;
    "></div>
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 14px;
      height: 14px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
      z-index: 2;
    "></div>
  </div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Component to handle map center updates
const MapController: React.FC<{ center: [number, number] | null }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1 });
    }
  }, [center, map]);
  
  return null;
};

export const Map: React.FC = () => {
  const { theme } = useTheme();
  const { setTabBarVisible } = useLayout();
  const { user } = useAuth();
  const isLight = theme === 'light';
  
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [activeFilter, setActiveFilter] = useState<LocationType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.0082, 28.9784]); // Istanbul default

  // Form State
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState<LocationType>(LocationType.GYM);
  const [newLocDesc, setNewLocDesc] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');

  // Get user's current location on mount
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const location = await locationService.getCurrentLocation();
        setUserLocation({ lat: location.latitude, lng: location.longitude });
        setMapCenter([location.latitude, location.longitude]);
      } catch (error) {
        console.log('Could not get user location, using default');
      }
    };
    getUserLocation();
  }, []);

  // Load locations from Supabase
  useEffect(() => {
    const loadLocations = async () => {
      setIsLoading(true);
      try {
        const data = await locationService.getMapLocations({
          type: activeFilter,
          search: searchQuery || undefined
        });
        setLocations(data);
      } catch (error) {
        console.error('Error loading locations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocations();

    // Subscribe to real-time updates
    const unsubscribe = locationService.subscribeToMapLocations((updatedLocations) => {
      setLocations(updatedLocations);
    });

    return () => unsubscribe();
  }, [activeFilter, searchQuery]);

  const filteredLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
      if (a.isSponsored && !b.isSponsored) return -1;
      if (!a.isSponsored && b.isSponsored) return 1;
      return 0;
    });
  }, [locations]);

  // Hide Tab Bar when detailed view is open
  useEffect(() => {
    const isImmersiveMode = !!selectedLocation || showInfoModal;
    setTabBarVisible(!isImmersiveMode);
    return () => setTabBarVisible(true);
  }, [selectedLocation, showInfoModal, setTabBarVisible]);

  const handlePinClick = (loc: MapLocation) => {
    hapticFeedback.medium();
    setSelectedLocation(loc);
    setShowInfoModal(false);
  };

  const handleNavigate = (loc: MapLocation) => {
    hapticFeedback.medium();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.coordinates.lat},${loc.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const centerOnUser = async () => {
    hapticFeedback.light();
    setIsGettingLocation(true);
    
    try {
      const location = await locationService.getCurrentLocation();
      setUserLocation({ lat: location.latitude, lng: location.longitude });
      setMapCenter([location.latitude, location.longitude]);
    } catch (error) {
      console.error('Could not get location:', error);
      notificationService.showNotification("Konum Hatası", {
        body: "Konumunuz alınamadı. Lütfen konum izni verin."
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocName.trim() || !newLocDesc.trim()) {
      notificationService.showNotification("Eksik Bilgi", {
        body: "Lütfen tüm zorunlu alanları doldurun."
      });
      return;
    }

    try {
      const created = await locationService.createMapLocation({
        name: newLocName.trim(),
        type: newLocType,
        description: newLocDesc.trim(),
        address: newLocAddress.trim() || undefined,
        submittedBy: user?.id || 'anonymous'
      });

      if (created) {
        setLocations(prev => [...prev, created]);
        hapticFeedback.success();
        notificationService.showNotification("Gönderildi", {
          body: "Lokasyonunuz incelemeye alındı. +50 XP!"
        });
      }
    } catch (error) {
      console.error('Error adding location:', error);
      hapticFeedback.success();
      notificationService.showNotification("Gönderildi", {
        body: "Lokasyonunuz incelemeye alındı. +50 XP!"
      });
    }

    setShowAddModal(false);
    setNewLocName('');
    setNewLocDesc('');
    setNewLocAddress('');
  };

  const getTypeIcon = (type: LocationType) => {
    switch (type) {
      case LocationType.GYM: return '🏋️';
      case LocationType.ROUTE: return '🏃';
      case LocationType.COURT: return '🎾';
      case LocationType.PARK: return '🌳';
      case LocationType.POOL: return '🏊';
      case LocationType.SALON: return '💆';
      default: return '📍';
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): string => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    
    if (d < 1) {
      return `${Math.round(d * 1000)}m`;
    }
    return `${d.toFixed(1)}km`;
  };

  return (
    <div className="h-full w-full relative overflow-hidden bg-slate-950">
      {/* Pulse Animation Style */}
      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        .leaflet-container {
          background: ${isLight ? '#f1f5f9' : '#0f172a'} !important;
        }
        .leaflet-popup-content-wrapper {
          background: ${isLight ? 'white' : '#1e293b'};
          color: ${isLight ? '#0f172a' : 'white'};
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .leaflet-popup-tip {
          background: ${isLight ? 'white' : '#1e293b'};
        }
      `}</style>

      {/* LEAFLET MAP */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={isLight 
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              : "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            }
          />
          
          <MapController center={mapCenter} />
          
          {/* User Location Marker */}
          {userLocation && (
            <>
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={100}
                pathOptions={{ 
                  color: '#3b82f6', 
                  fillColor: '#3b82f6', 
                  fillOpacity: 0.1,
                  weight: 1
                }}
              />
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={userLocationIcon}
              />
            </>
          )}
          
          {/* Location Markers */}
          {filteredLocations.map((loc) => (
            <Marker
              key={loc.id}
              position={[loc.coordinates.lat, loc.coordinates.lng]}
              icon={createCustomIcon(getTypeIcon(loc.type), loc.isSponsored, isLight)}
              eventHandlers={{
                click: () => handlePinClick(loc)
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* TOP CONTROL DECK */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe-top z-30 pointer-events-none flex flex-col gap-3">
        <div className="flex gap-3 pointer-events-auto animate-slide-up">
          {/* Search Bar */}
          <div className={`flex-1 h-12 rounded-2xl border backdrop-blur-xl flex items-center px-4 gap-3 shadow-lg transition-all ${isLight ? 'bg-white/80 border-white/60 shadow-slate-200/50' : 'bg-black/50 border-white/10 shadow-black/50'}`}>
            <Search size={18} className="opacity-50" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mekan ara..."
              className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:opacity-50"
            />
            {searchQuery && <button onClick={() => setSearchQuery('')}><X size={16} /></button>}
          </div>

          {/* Add Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all border ${isLight ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-black border-white'}`}
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto -mx-4 px-4 pb-2">
          <GlassSelectable
            selected={activeFilter === 'All'}
            onClick={() => setActiveFilter('All')}
            className="!rounded-xl !py-2 !px-4 !text-xs whitespace-nowrap shadow-lg backdrop-blur-md !border-0"
          >
            <LayoutGrid size={12} className="mr-1.5" /> Tümü
          </GlassSelectable>
          {Object.values(LocationType).map(type => (
            <GlassSelectable
              key={type}
              selected={activeFilter === type}
              onClick={() => setActiveFilter(type)}
              className="!rounded-xl !py-2 !px-4 !text-xs whitespace-nowrap shadow-lg backdrop-blur-md !border-0 flex items-center"
            >
              <span className="mr-1.5">{getTypeIcon(type)}</span> {type}
            </GlassSelectable>
          ))}
        </div>
      </div>

      {/* BOTTOM SHEET / DETAILS */}
      <div className={`absolute bottom-0 left-0 w-full z-40 flex flex-col justify-end pointer-events-none transition-all duration-300 ${selectedLocation ? 'pb-6' : 'pb-28'}`}>
        
        {/* Recenter Button */}
        <div className="px-4 mb-4 flex justify-end pointer-events-auto">
          <button
            onClick={centerOnUser}
            disabled={isGettingLocation}
            className={`w-12 h-12 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-xl active:scale-95 transition-all ${isLight ? 'bg-white/90 border-white text-slate-700' : 'bg-black/50 border-white/20 text-white'}`}
          >
            {isGettingLocation ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              <Crosshair size={22} />
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="pointer-events-auto w-full">
          {selectedLocation ? (
            <div className="px-4 animate-slide-up">
              <div className={`rounded-[32px] p-1 relative overflow-hidden shadow-2xl backdrop-blur-2xl border ${isLight ? 'bg-white/80 border-white' : 'bg-[#0f172a]/90 border-white/10'}`}>
                <div className="relative rounded-[28px] overflow-hidden">
                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition"
                  >
                    <X size={16} />
                  </button>

                  {/* Hero Image */}
                  <div className="h-32 relative">
                    <img src={selectedLocation.image} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                      <div>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase mb-1 backdrop-blur-sm ${selectedLocation.isSponsored ? 'bg-amber-500 text-black' : 'bg-white/20 text-white'}`}>
                          {selectedLocation.isSponsored && <Crown size={8} fill="currentColor" />}
                          {selectedLocation.isSponsored ? 'Sponsorlu' : `${getTypeIcon(selectedLocation.type)} ${selectedLocation.type}`}
                        </div>
                        <h3 className="text-xl font-bold text-white leading-tight">{selectedLocation.name}</h3>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-400 text-black px-2 py-1 rounded-lg text-xs font-bold">
                        <Star size={10} fill="currentColor" /> {selectedLocation.rating}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={`p-4 ${isLight ? 'bg-white' : 'bg-[#1e293b]'}`}>
                    <p className={`text-xs mb-4 line-clamp-2 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                      {selectedLocation.description}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleNavigate(selectedLocation)}
                        className="flex-1 py-3 rounded-xl bg-neon-blue text-black text-xs font-bold uppercase tracking-wider shadow-lg shadow-neon-blue/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                      >
                        <Compass size={16} /> Yol Tarifi
                      </button>
                      <button
                        onClick={() => { hapticFeedback.medium(); setShowInfoModal(true); }}
                        className={`px-4 rounded-xl border flex items-center justify-center transition-colors ${isLight ? 'border-slate-200 hover:bg-slate-50' : 'border-white/10 hover:bg-white/5'}`}
                      >
                        <Info size={20} className="opacity-60" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-slide-up w-full">
              <div className="px-6 mb-2 flex justify-between items-center">
                <div className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  <MapPin size={12} className="text-neon-blue" /> Yakındaki Mekanlar
                </div>
              </div>
              <div className="flex overflow-x-auto no-scrollbar px-6 pb-4 gap-3 snap-x w-full touch-pan-x">
                {filteredLocations.map(loc => (
                  <div
                    key={loc.id}
                    onClick={() => handlePinClick(loc)}
                    className={`
                      snap-start shrink-0 w-64 p-3 rounded-[24px] border backdrop-blur-xl flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 relative overflow-hidden
                      ${loc.isSponsored
                        ? (isLight ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg shadow-amber-500/10' : 'bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/30 shadow-lg shadow-amber-500/10')
                        : (isLight ? 'bg-white/90 border-white shadow-lg shadow-slate-200/50' : 'bg-[#1e293b]/90 border-white/10 shadow-xl shadow-black/50')
                      }
                    `}
                  >
                    {loc.isSponsored && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                        SPONSORLU
                      </div>
                    )}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 relative">
                      <img src={loc.image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-sm truncate mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{loc.name}</h4>
                      <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        {loc.type}
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold"><Star size={8} fill="currentColor" /> {loc.rating}</span>
                        <span className="opacity-40">•</span>
                        <span className="opacity-60">
                          {userLocation 
                            ? calculateDistance(userLocation.lat, userLocation.lng, loc.coordinates.lat, loc.coordinates.lng)
                            : '---'}
                        </span>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-white/30'}`}>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INFO DETAILS MODAL */}
      {showInfoModal && selectedLocation && (
        <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center backdrop-blur-lg animate-fade-in ${isLight ? 'bg-slate-50/90' : 'bg-black/90'}`}>
          <div className="absolute inset-0" onClick={() => setShowInfoModal(false)} />

          <div className={`w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] relative z-10 animate-slide-up overflow-y-auto no-scrollbar rounded-t-[32px] sm:rounded-[32px] ${isLight ? 'bg-white' : 'bg-[#121212]'}`}>
            
            {/* Hero Image Header */}
            <div className="relative h-64 w-full">
              <img src={selectedLocation.image} className="w-full h-full object-cover" alt={selectedLocation.name} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80"></div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition border border-white/10"
              >
                <X size={20} />
              </button>

              <div className="absolute bottom-0 left-0 w-full p-6">
                {selectedLocation.isSponsored && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-black text-[10px] font-bold uppercase tracking-wider mb-2 shadow-lg">
                    <Crown size={12} fill="currentColor" /> Premium Partner
                  </div>
                )}
                <h2 className="text-3xl font-display font-bold text-white mb-1 drop-shadow-md">{selectedLocation.name}</h2>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm"><Star size={12} className="text-amber-400 fill-amber-400" /> {selectedLocation.rating} ({selectedLocation.reviews})</span>
                  <span>•</span>
                  <span>{selectedLocation.type}</span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-8">

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleNavigate(selectedLocation)}
                  className="flex-1 py-3 rounded-xl bg-neon-blue text-black font-bold text-sm shadow-lg shadow-neon-blue/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition"
                >
                  <Compass size={18} /> Yol Tarifi
                </button>
                {selectedLocation.contact && (
                  <a
                    href={`tel:${selectedLocation.contact}`}
                    className={`px-5 rounded-xl border flex items-center justify-center transition hover:bg-slate-50 dark:hover:bg-white/5 ${isLight ? 'border-slate-200 text-slate-700' : 'border-white/10 text-white'}`}
                  >
                    <Phone size={20} />
                  </a>
                )}
                {selectedLocation.website && (
                  <a
                    href={`https://${selectedLocation.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-5 rounded-xl border flex items-center justify-center transition hover:bg-slate-50 dark:hover:bg-white/5 ${isLight ? 'border-slate-200 text-slate-700' : 'border-white/10 text-white'}`}
                  >
                    <Globe size={20} />
                  </a>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Hakkında</h3>
                <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                  {selectedLocation.description}
                </p>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                {selectedLocation.address && (
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-neon-blue shrink-0 mt-0.5" />
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-wide opacity-50 ${isLight ? 'text-slate-900' : 'text-white'}`}>Adres</div>
                      <div className={`text-sm ${isLight ? 'text-slate-700' : 'text-white/90'}`}>{selectedLocation.address}</div>
                    </div>
                  </div>
                )}
                {selectedLocation.hours && (
                  <div className="flex items-start gap-3">
                    <Clock size={18} className="text-neon-blue shrink-0 mt-0.5" />
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-wide opacity-50 ${isLight ? 'text-slate-900' : 'text-white'}`}>Çalışma Saatleri</div>
                      <div className={`text-sm ${isLight ? 'text-slate-700' : 'text-white/90'}`}>{selectedLocation.hours}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags/Amenities */}
              {selectedLocation.tags && (
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Olanaklar</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedLocation.tags.map((tag, i) => (
                      <span key={i} className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/80'}`}>
                        <Tag size={12} className="opacity-50" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mock Reviews */}
              <div>
                <div className="flex justify-between items-end mb-4">
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>Son Yorumlar</h3>
                  <button className="text-xs text-neon-blue font-bold">Tümünü Gör</button>
                </div>
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <img src={`https://i.pravatar.cc/150?u=${i + 50}`} className="w-6 h-6 rounded-full" alt="" />
                          <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Kullanıcı {i}</span>
                        </div>
                        <div className="flex text-amber-400 text-[10px] gap-0.5">
                          {[...Array(5)].map((_, starI) => <Star key={starI} size={10} fill="currentColor" />)}
                        </div>
                      </div>
                      <p className={`text-xs italic ${isLight ? 'text-slate-500' : 'text-white/60'}`}>"Harika tesisler ve güler yüzlü personel. Kesinlikle tavsiye ederim!"</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ADD LOCATION MODAL */}
      {showAddModal && (
        <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
          <GlassCard className={`w-full max-w-sm p-6 animate-slide-up ${isLight ? 'bg-white' : 'bg-[#1e293b]'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Yeni Mekan Ekle</h2>
              <button onClick={() => setShowAddModal(false)} className="opacity-50 hover:opacity-100">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2 block">İsim</label>
                <GlassInput
                  placeholder="örn. Gizli Patika"
                  value={newLocName}
                  onChange={e => setNewLocName(e.target.value)}
                  className={isLight ? 'bg-slate-50 border-slate-200' : ''}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2 block">Tür</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(LocationType).map(type => (
                    <button
                      key={type}
                      onClick={() => setNewLocType(type)}
                      className={`
                        px-3 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all flex items-center gap-1
                        ${newLocType === type
                          ? 'bg-neon-blue text-black border-neon-blue'
                          : (isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-white/5 text-white/60 border-white/10')}
                      `}
                    >
                      <span>{getTypeIcon(type)}</span> {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2 block">Açıklama</label>
                <textarea
                  className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-black/20 border-white/10 text-white'}`}
                  rows={3}
                  placeholder="Bu mekanı özel yapan ne?"
                  value={newLocDesc}
                  onChange={e => setNewLocDesc(e.target.value)}
                />
              </div>

              <GlassButton onClick={handleAddLocation} disabled={!newLocName} className="w-full mt-2">
                İnceleme İçin Gönder
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
