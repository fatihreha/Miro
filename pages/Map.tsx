
import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard, GlassButton, GlassSelectable, GlassInput } from '../components/ui/Glass';
import { Navigation, Plus, Star, MapPin, X, CheckCircle2, Info, Crosshair, Search, LayoutGrid, Compass, ChevronRight, Map as MapIcon, Phone, Globe, Clock, Tag, Crown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { LocationType, MapLocation } from '../types';
import { notificationService } from '../services/notificationService';
import { hapticFeedback } from '../services/hapticService';
import { useLayout } from '../context/LayoutContext';

// Optimized coordinates for the new map layout
const INITIAL_LOCATIONS: MapLocation[] = [
  {
    id: '1',
    name: 'Iron Paradise',
    type: LocationType.GYM,
    coordinates: { x: 62, y: 45 },
    rating: 4.8,
    reviews: 120,
    description: 'Premier strength training facility with 24/7 access and sauna.',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60',
    verified: true,
    address: '123 Fitness Blvd',
    contact: '+1 555-0101',
    website: 'ironparadise.com',
    hours: '24/7 Open',
    tags: ['Sauna', 'Free Weights', 'Cardio', 'Showers']
  },
  {
    id: '2',
    name: 'River Run Path',
    type: LocationType.ROUTE,
    coordinates: { x: 30, y: 75 },
    rating: 4.9,
    reviews: 85,
    description: 'Scenic 5km running track along the water. Perfect for sunsets.',
    image: 'https://images.unsplash.com/photo-1506197061617-7f5c0b093236?w=800&auto=format&fit=crop&q=60',
    verified: true,
    address: 'Riverfront Park Entrance',
    tags: ['Scenic', '5km', 'Paved', 'Lighting']
  },
  {
    id: '3',
    name: 'Skyline Courts',
    type: LocationType.COURT,
    coordinates: { x: 80, y: 25 },
    rating: 4.5,
    reviews: 42,
    description: 'Rooftop tennis courts with panoramic city views.',
    image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&auto=format&fit=crop&q=60',
    verified: true,
    address: '500 High Rise Ave, Roof',
    contact: '+1 555-0103',
    hours: '06:00 AM - 10:00 PM',
    tags: ['Tennis', 'Equipment Rental', 'Lights']
  },
  {
    id: '4',
    name: 'Central Zen',
    type: LocationType.PARK,
    coordinates: { x: 45, y: 55 },
    rating: 5.0,
    reviews: 210,
    description: 'Peaceful grassy zone designated for outdoor yoga and meditation.',
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800&auto=format&fit=crop&q=60',
    verified: true,
    address: 'Central Park West',
    tags: ['Yoga', 'Meditation', 'Quiet Zone']
  },
  {
    id: '5',
    name: 'Aqua Center',
    type: LocationType.POOL,
    coordinates: { x: 20, y: 30 },
    rating: 4.7,
    reviews: 156,
    description: 'Olympic-sized heated pool with dedicated lap lanes.',
    image: 'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?w=800&auto=format&fit=crop&q=60',
    verified: true,
    address: '88 Splash Way',
    contact: '+1 555-0199',
    website: 'aquacenter.city',
    hours: '05:00 AM - 09:00 PM',
    tags: ['Heated', 'Lanes', 'Classes', 'Lockers']
  },
  // Sponsored Spot
  {
    id: 's1',
    name: 'Gold Standard Recovery',
    type: LocationType.SALON,
    coordinates: { x: 55, y: 65 },
    rating: 5.0,
    reviews: 342,
    description: 'Luxury sports recovery salon. Cryotherapy, massage, and IV drips for elite athletes.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=60',
    verified: true,
    isSponsored: true,
    address: '101 Elite Way, Suite 100',
    contact: '+1 800-RECOVER',
    website: 'goldstandard.recovery',
    hours: '08:00 AM - 08:00 PM',
    tags: ['Cryo', 'Massage', 'Sauna', 'IV Therapy', 'Luxury']
  },
  {
    id: 's2',
    name: 'Pro Nutrition Hub',
    type: LocationType.SALON,
    coordinates: { x: 35, y: 40 },
    rating: 4.8,
    reviews: 128,
    description: 'Personalized meal prep and nutrition consulting for high performance.',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=60',
    verified: true,
    isSponsored: true,
    address: '45 Health St',
    contact: '+1 555-EAT-WELL',
    hours: '09:00 AM - 07:00 PM',
    tags: ['Meal Prep', 'Supplements', 'Consulting']
  }
];

export const Map: React.FC = () => {
  const { theme } = useTheme();
  const { setTabBarVisible } = useLayout();
  const isLight = theme === 'light';
  
  const [activeFilter, setActiveFilter] = useState<LocationType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{x: number, y: number}>({ x: 50, y: 50 });

  // Form State
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState<LocationType>(LocationType.GYM);
  const [newLocDesc, setNewLocDesc] = useState('');

  const filteredLocations = useMemo(() => {
    const filtered = INITIAL_LOCATIONS.filter(loc => {
      const matchesType = activeFilter === 'All' || loc.type === activeFilter;
      const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            loc.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });

    // Sort Sponsored locations to the beginning
    return filtered.sort((a, b) => {
        if (a.isSponsored && !b.isSponsored) return -1;
        if (!a.isSponsored && b.isSponsored) return 1;
        return 0;
    });
  }, [activeFilter, searchQuery]);

  // Hide Tab Bar when detailed view is open
  useEffect(() => {
    const isImmersiveMode = !!selectedLocation || showInfoModal;
    setTabBarVisible(!isImmersiveMode);
    return () => setTabBarVisible(true);
  }, [selectedLocation, showInfoModal, setTabBarVisible]);

  // Simulated GPS drift
  useEffect(() => {
    const interval = setInterval(() => {
      setUserLocation(prev => ({
        x: 50 + Math.sin(Date.now() / 2000) * 2,
        y: 50 + Math.cos(Date.now() / 2000) * 2
      }));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handlePinClick = (loc: MapLocation) => {
    hapticFeedback.medium();
    setSelectedLocation(loc);
    setShowInfoModal(false); // Reset info modal when switching pins
  };

  const handleAddLocation = () => {
    hapticFeedback.success();
    notificationService.showNotification("Submission Received", {
      body: "Your location is pending review. +50 XP!"
    });
    setShowAddModal(false);
    setNewLocName('');
    setNewLocDesc('');
  };

  const centerOnUser = () => {
      hapticFeedback.light();
      setUserLocation({ x: 50, y: 50 });
  };

  const getTypeColor = (type: LocationType) => {
    switch(type) {
      case LocationType.GYM: return 'text-orange-500 bg-orange-500/20 border-orange-500';
      case LocationType.ROUTE: return 'text-emerald-500 bg-emerald-500/20 border-emerald-500';
      case LocationType.COURT: return 'text-blue-500 bg-blue-500/20 border-blue-500';
      case LocationType.PARK: return 'text-green-500 bg-green-500/20 border-green-500';
      case LocationType.POOL: return 'text-cyan-500 bg-cyan-500/20 border-cyan-500';
      case LocationType.SALON: return 'text-amber-500 bg-amber-500/20 border-amber-500';
      default: return 'text-purple-500 bg-purple-500/20 border-purple-500';
    }
  };

  const getTypeIcon = (type: LocationType) => {
      switch(type) {
          case LocationType.GYM: return '🏋️';
          case LocationType.ROUTE: return '🏃';
          case LocationType.COURT: return '🎾';
          case LocationType.PARK: return '🌳';
          case LocationType.POOL: return '🏊';
          case LocationType.SALON: return '💆';
          default: return '📍';
      }
  };

  return (
    <div className="h-full w-full relative overflow-hidden bg-slate-950">
      
      {/* IMMERSIVE MAP LAYER */}
      <div className="absolute inset-0 z-0 touch-none">
        <svg 
            viewBox="0 0 100 100" 
            preserveAspectRatio="xMidYMid slice" 
            className={`w-full h-full transition-colors duration-700 ${isLight ? 'bg-slate-100' : 'bg-[#0b0f19]'}`}
        >
            <defs>
                <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke={isLight ? "#cbd5e1" : "#1e293b"} strokeWidth="0.1"/>
                </pattern>
                <linearGradient id="fade-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={isLight ? "#ffffff" : "#0b0f19"} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={isLight ? "#ffffff" : "#0b0f19"} stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Background Grid */}
            <rect width="100" height="100" fill="url(#grid-pattern)" />

            {/* Map Features - Stylized */}
            <g className={isLight ? "opacity-40" : "opacity-20"}>
                {/* Park Areas */}
                <path d="M30,60 Q50,40 70,70 T40,90 Z" className="fill-emerald-500" />
                <path d="M85,10 Q95,20 90,40 L70,30 Z" className="fill-emerald-500" />
                
                {/* Water Bodies */}
                <path d="M0,15 Q25,35 40,0 L0,0 Z" className="fill-blue-500" />
                <path d="M20,80 Q40,70 50,100 L0,100 L0,80 Z" className="fill-blue-500" />
            </g>

            {/* Roads / Paths */}
            <g fill="none" stroke={isLight ? "#94a3b8" : "#334155"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M-5,45 Q40,40 105,55" />
                <path d="M35,-5 L40,105" />
                <path d="M75,-5 L65,105" />
                <path d="M-5,25 L105,25" strokeWidth="0.8" opacity="0.5" />
                <circle cx="50" cy="50" r="25" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
            </g>

            {/* Abstract Buildings */}
            <g className={isLight ? "fill-slate-300" : "fill-slate-800"} stroke={isLight ? "#cbd5e1" : "#1e293b"} strokeWidth="0.2">
                <rect x="58" y="40" width="8" height="8" rx="1" />
                <rect x="76" y="21" width="8" height="6" rx="1" />
                <rect x="16" y="26" width="8" height="8" rx="1" />
                <rect x="42" y="52" width="6" height="6" rx="1" />
            </g>
        </svg>

        {/* Dynamic User Location Dot */}
        <div 
            className="absolute transition-all duration-500 ease-out z-10 pointer-events-none"
            style={{ top: `${userLocation.y}%`, left: `${userLocation.x}%` }}
        >
             {/* Radar Sweep */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-blue-500/10 animate-[spin_4s_linear_infinite] opacity-30">
                <div className="w-full h-1/2 bg-gradient-to-r from-transparent to-blue-500/20 border-b border-blue-500/20 origin-bottom transform rotate-45" />
             </div>
             {/* Pulse */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500/30 rounded-full animate-ping" />
             {/* Core */}
             <div className="w-3 h-3 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] relative z-20 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
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
                    placeholder="Search spots..."
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
                  <LayoutGrid size={12} className="mr-1.5" /> All
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

      {/* INTERACTIVE PINS LAYER */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {filteredLocations.map((loc) => (
            <button
                key={loc.id}
                onClick={() => handlePinClick(loc)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto group"
                style={{ top: `${loc.coordinates.y}%`, left: `${loc.coordinates.x}%` }}
            >
                <div className={`relative transition-transform duration-300 ${selectedLocation?.id === loc.id ? 'scale-125 -translate-y-2' : 'hover:scale-110'}`}>
                    {/* Label on Hover/Active */}
                    <div className={`
                        absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap backdrop-blur-md border shadow-xl transition-all
                        ${selectedLocation?.id === loc.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                        ${loc.isSponsored 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-300' 
                            : (isLight ? 'bg-white/90 text-slate-900 border-white/50' : 'bg-black/80 text-white border-white/10')}
                    `}>
                        {loc.isSponsored && <Crown size={10} className="inline mr-1 -mt-0.5 fill-white" />}
                        {loc.name}
                    </div>

                    {/* Pin Head */}
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-2xl border-2 relative z-10
                        ${loc.isSponsored 
                            ? 'bg-gradient-to-br from-amber-400 to-orange-600 border-amber-200 text-white shadow-orange-500/50' 
                            : (isLight ? 'bg-white border-white' : 'bg-[#0f172a] border-[#1e293b]')}
                        ${selectedLocation?.id === loc.id ? 'ring-4 ring-neon-blue/30' : ''}
                    `}>
                        {getTypeIcon(loc.type)}
                        {/* Verified Check */}
                        {loc.verified && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white" />}
                    </div>
                    
                    {/* Pin Needle */}
                    <div className="w-0.5 h-3 bg-current mx-auto opacity-50" />
                    
                    {/* Ground Shadow */}
                    <div className="w-6 h-2 bg-black/30 rounded-full blur-[2px] mx-auto -mt-1" />
                </div>
            </button>
        ))}
      </div>

      {/* BOTTOM SHEET / DETAILS (Anchored above Tab Bar) */}
      <div className={`absolute bottom-0 left-0 w-full z-40 flex flex-col justify-end pointer-events-none transition-all duration-300 ${selectedLocation ? 'pb-6' : 'pb-28'}`}>
          
          {/* Recenter Button */}
          <div className="px-4 mb-4 flex justify-end pointer-events-auto">
             <button 
                onClick={centerOnUser}
                className={`w-12 h-12 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-xl active:scale-95 transition-all ${isLight ? 'bg-white/90 border-white text-slate-700' : 'bg-black/50 border-white/20 text-white'}`}
            >
                <Crosshair size={22} />
            </button>
          </div>

          {/* Content Area */}
          <div className="pointer-events-auto w-full">
            {selectedLocation ? (
                // Selected Detail Card (Slide Up)
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
                                            {selectedLocation.isSponsored ? 'Sponsored Salon' : `${getTypeIcon(selectedLocation.type)} ${selectedLocation.type}`}
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
                                    <button className="flex-1 py-3 rounded-xl bg-neon-blue text-black text-xs font-bold uppercase tracking-wider shadow-lg shadow-neon-blue/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                                        <Compass size={16} /> Navigate
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
                // Nearby Carousel (Horizontal Scroll)
                <div className="animate-slide-up w-full">
                    <div className="px-6 mb-2 flex justify-between items-center">
                        <div className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                            <MapPin size={12} className="text-neon-blue" /> Nearby Spots
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
                                        SPONSORED
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
                                        <span className="opacity-60">0.8km</span>
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
                          <button className="flex-1 py-3 rounded-xl bg-neon-blue text-black font-bold text-sm shadow-lg shadow-neon-blue/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition">
                              <Compass size={18} /> Navigate
                          </button>
                          {selectedLocation.contact && (
                              <button className={`px-5 rounded-xl border flex items-center justify-center transition hover:bg-slate-50 dark:hover:bg-white/5 ${isLight ? 'border-slate-200 text-slate-700' : 'border-white/10 text-white'}`}>
                                  <Phone size={20} />
                              </button>
                          )}
                          {selectedLocation.website && (
                              <button className={`px-5 rounded-xl border flex items-center justify-center transition hover:bg-slate-50 dark:hover:bg-white/5 ${isLight ? 'border-slate-200 text-slate-700' : 'border-white/10 text-white'}`}>
                                  <Globe size={20} />
                              </button>
                          )}
                      </div>

                      {/* Description */}
                      <div>
                          <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>About</h3>
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
                                      <div className={`text-xs font-bold uppercase tracking-wide opacity-50 ${isLight ? 'text-slate-900' : 'text-white'}`}>Address</div>
                                      <div className={`text-sm ${isLight ? 'text-slate-700' : 'text-white/90'}`}>{selectedLocation.address}</div>
                                  </div>
                              </div>
                          )}
                          {selectedLocation.hours && (
                              <div className="flex items-start gap-3">
                                  <Clock size={18} className="text-neon-blue shrink-0 mt-0.5" />
                                  <div>
                                      <div className={`text-xs font-bold uppercase tracking-wide opacity-50 ${isLight ? 'text-slate-900' : 'text-white'}`}>Hours</div>
                                      <div className={`text-sm ${isLight ? 'text-slate-700' : 'text-white/90'}`}>{selectedLocation.hours}</div>
                                  </div>
                              </div>
                          )}
                      </div>

                      {/* Tags/Amenities */}
                      {selectedLocation.tags && (
                          <div>
                              <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Amenities</h3>
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
                              <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>Recent Reviews</h3>
                              <button className="text-xs text-neon-blue font-bold">View All</button>
                          </div>
                          <div className="space-y-3">
                              {[1, 2].map((i) => (
                                  <div key={i} className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                                      <div className="flex justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                              <img src={`https://i.pravatar.cc/150?u=${i+50}`} className="w-6 h-6 rounded-full" alt="" />
                                              <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>User {i}</span>
                                          </div>
                                          <div className="flex text-amber-400 text-[10px] gap-0.5">
                                              {[...Array(5)].map((_, starI) => <Star key={starI} size={10} fill="currentColor" />)}
                                          </div>
                                      </div>
                                      <p className={`text-xs italic ${isLight ? 'text-slate-500' : 'text-white/60'}`}>"Great facilities and friendly staff. Highly recommended!"</p>
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
                  <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Add New Spot</h2>
                  <button onClick={() => setShowAddModal(false)} className="opacity-50 hover:opacity-100">
                     <X size={24} />
                  </button>
               </div>
               
               <div className="space-y-4">
                  <div>
                     <label className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2 block">Name</label>
                     <GlassInput 
                        placeholder="e.g. Hidden Trail Start" 
                        value={newLocName}
                        onChange={e => setNewLocName(e.target.value)}
                        className={isLight ? 'bg-slate-50 border-slate-200' : ''}
                     />
                  </div>
                  
                  <div>
                     <label className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2 block">Type</label>
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
                     <label className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2 block">Description</label>
                     <textarea 
                        className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-black/20 border-white/10 text-white'}`}
                        rows={3}
                        placeholder="What makes this spot special?"
                        value={newLocDesc}
                        onChange={e => setNewLocDesc(e.target.value)}
                     />
                  </div>
                  
                  <GlassButton onClick={handleAddLocation} disabled={!newLocName} className="w-full mt-2">
                     Submit for Review
                  </GlassButton>
               </div>
            </GlassCard>
         </div>
      )}
    </div>
  );
};
