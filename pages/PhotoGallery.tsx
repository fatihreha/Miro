import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLayout } from '../context/LayoutContext';

export const PhotoGallery: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setTabBarVisible } = useLayout();
  
  const photos = location.state?.photos as string[] || [];
  const initialIndex = location.state?.initialIndex || 0;
  
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Hide TabBar when in gallery
  useEffect(() => {
    setTabBarVisible(false);
    return () => setTabBarVisible(true);
  }, [setTabBarVisible]);

  useEffect(() => {
    if (!photos || photos.length === 0) {
      navigate(-1);
    }
  }, [photos, navigate]);

  if (!photos.length) return null;

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black animate-fade-in touch-none">
       {/* Ambient Background */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
              key={`bg-${currentIndex}`}
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out opacity-40 blur-[80px] scale-125"
              style={{ backgroundImage: `url(${photos[currentIndex]})` }}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
       </div>

       {/* Header */}
       <div className="relative z-20 flex justify-between items-center p-6 pt-safe-top">
          <div className="px-4 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-xs font-display font-bold tracking-widest text-white/80">
              {currentIndex + 1} <span className="opacity-40 mx-1">/</span> {photos.length}
          </div>
          <button 
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-white/20 transition active:scale-95"
          >
              <X size={24} />
          </button>
       </div>

       {/* Main Image */}
       <div className="flex-1 relative z-10 flex items-center justify-center p-4 overflow-hidden">
          {/* Nav Zones */}
          <div className="absolute inset-0 flex justify-between z-20">
              <div onClick={handlePrev} className="w-1/3 h-full flex items-center justify-start pl-4 cursor-pointer group">
                  <div className={`p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition-all duration-300 ${currentIndex === 0 ? 'opacity-0' : 'opacity-0 group-hover:opacity-100 group-active:opacity-100 scale-90 group-hover:scale-100'}`}>
                      <ChevronLeft size={32} />
                  </div>
              </div>
              <div onClick={handleNext} className="w-1/3 h-full flex items-center justify-end pr-4 cursor-pointer group">
                  <div className={`p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition-all duration-300 ${currentIndex === photos.length - 1 ? 'opacity-0' : 'opacity-0 group-hover:opacity-100 group-active:opacity-100 scale-90 group-hover:scale-100'}`}>
                      <ChevronRight size={32} />
                  </div>
              </div>
          </div>

          <img 
              key={currentIndex}
              src={photos[currentIndex]} 
              className="max-h-full max-w-full w-auto h-auto object-contain rounded-[24px] shadow-2xl shadow-black/50 animate-pop border border-white/10" 
              alt={`Gallery ${currentIndex}`} 
              draggable={false}
          />
       </div>

       {/* Thumbnail Dock */}
       <div className="relative z-20 p-6 pb-safe-bottom w-full max-w-md mx-auto">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[24px] p-2 shadow-2xl">
              <div className="flex gap-2 overflow-x-auto no-scrollbar justify-center items-center py-1">
                  {photos.map((photo, index) => (
                      <button 
                          key={index}
                          onClick={() => setCurrentIndex(index)}
                          className={`
                              relative rounded-xl overflow-hidden transition-all duration-300 flex-shrink-0
                              ${currentIndex === index 
                                  ? 'w-14 h-14 ring-2 ring-brand-lime ring-offset-2 ring-offset-black opacity-100 scale-110' 
                                  : 'w-12 h-12 opacity-50 hover:opacity-80 grayscale hover:grayscale-0'}
                          `}
                      >
                          <img src={photo} className="w-full h-full object-cover" alt="" />
                      </button>
                  ))}
              </div>
          </div>
       </div>
    </div>
  );
};
