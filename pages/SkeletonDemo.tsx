
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassButton } from '../components/ui/Glass';
import { Skeleton } from '../components/ui/Skeleton';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import { SkeletonList } from '../components/ui/SkeletonList';
import { SkeletonProfile } from '../components/ui/SkeletonProfile';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Play, Pause } from 'lucide-react';

export const SkeletonDemo: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    // Demo state için loading simülasyonu
    const [isLoading, setIsLoading] = useState(true);
    const [isAutoPlay, setIsAutoPlay] = useState(false);

    // Auto-play için timer
    useEffect(() => {
        if (!isAutoPlay) return;

        const interval = setInterval(() => {
            setIsLoading(prev => !prev);
        }, 3000);

        return () => clearInterval(interval);
    }, [isAutoPlay]);

    // Manuel toggle
    const toggleLoading = () => setIsLoading(!isLoading);

    const CodeBlock: React.FC<{ code: string }> = ({ code }) => (
        <div className={`p-4 rounded-xl font-mono text-xs overflow-x-auto border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white/80'}`}>
            <pre>{code}</pre>
        </div>
    );

    return (
        <div className={`min-h-screen pb-24 ${isLight ? 'bg-slate-50' : 'bg-slate-950'}`}>
            {/* Header */}
            <div className="sticky top-0 z-50 p-6 backdrop-blur-xl border-b" style={{ background: isLight ? 'rgba(248, 250, 252, 0.8)' : 'rgba(2, 6, 23, 0.8)', borderColor: isLight ? 'rgb(226, 232, 240)' : 'rgba(255, 255, 255, 0.1)' }}>
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className={`p-2 rounded-full transition-colors ${isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className={`text-2xl font-display font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                Skeleton Screen Demo
                            </h1>
                            <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                                İskelet ekranlar ve shimmer efekti örnekleri
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsAutoPlay(!isAutoPlay)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${isAutoPlay
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-green-500 text-white hover:bg-green-600'
                                }`}
                        >
                            {isAutoPlay ? <><Pause size={14} /> Auto</> : <><Play size={14} /> Auto</>}
                        </button>
                        <button
                            onClick={toggleLoading}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${isLoading
                                    ? (isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-black hover:bg-gray-200')
                                    : 'bg-neon-blue text-black hover:opacity-90'
                                }`}
                        >
                            {isLoading ? 'Show Content' : 'Show Skeleton'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-8 space-y-12">

                {/* Basic Skeleton Components */}
                <section>
                    <h2 className={`text-xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        1. Temel Skeleton Komponentleri
                    </h2>

                    <GlassCard className={`p-6 mb-4 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="space-y-4">
                            <div>
                                <p className={`text-sm font-bold mb-2 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Text Skeleton</p>
                                {isLoading ? (
                                    <>
                                        <Skeleton width="80%" height={16} />
                                        <Skeleton width="60%" height={16} style={{ marginTop: '8px' }} />
                                        <Skeleton width="90%" height={16} style={{ marginTop: '8px' }} />
                                    </>
                                ) : (
                                    <div className={isLight ? 'text-slate-600' : 'text-white/70'}>
                                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                                        <p>Sed do eiusmod tempor incididunt ut labore.</p>
                                        <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco.</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <p className={`text-sm font-bold mb-2 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Circular Skeleton (Avatar)</p>
                                {isLoading ? (
                                    <div className="flex items-center gap-3">
                                        <Skeleton variant="circular" width={60} height={60} />
                                        <div className="flex-1">
                                            <Skeleton width="40%" height={16} />
                                            <Skeleton width="60%" height={14} style={{ marginTop: '6px' }} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <img
                                            src="https://i.pravatar.cc/150?u=demo"
                                            className="w-15 h-15 rounded-full"
                                            alt="User"
                                        />
                                        <div>
                                            <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>John Doe</div>
                                            <div className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Professional Athlete</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <p className={`text-sm font-bold mb-2 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Rounded Image Skeleton</p>
                                {isLoading ? (
                                    <Skeleton variant="rounded" height={200} />
                                ) : (
                                    <img
                                        src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=60"
                                        className="w-full h-[200px] object-cover rounded-xl"
                                        alt="Demo"
                                    />
                                )}
                            </div>
                        </div>
                    </GlassCard>

                    <CodeBlock code={`import { Skeleton } from '../components/ui/Skeleton';

// Text
<Skeleton width="80%" height={16} />

// Avatar
<Skeleton variant="circular" width={60} height={60} />

// Image
<Skeleton variant="rounded" height={200} />

// Pulse animation instead of wave
<Skeleton animation="pulse" width="100%" height={20} />`} />
                </section>

                {/* Skeleton Cards */}
                <section>
                    <h2 className={`text-xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        2. Skeleton Card Varyantları
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className={`text-sm font-bold mb-2 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Club Card</p>
                            {isLoading ? (
                                <SkeletonCard variant="club" />
                            ) : (
                                <GlassCard className={`overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                    <img src="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=60" className="w-full h-[140px] object-cover" alt="Club" />
                                    <div className="p-4">
                                        <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Midnight Runners</h3>
                                        <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-white/70'}`}>We run the city when it sleeps.</p>
                                        <div className="flex gap-2 mt-3">
                                            <span className="px-3 py-1 rounded-full bg-neon-blue/20 text-neon-blue text-xs font-bold">RUNNING</span>
                                            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">1.2K Members</span>
                                        </div>
                                    </div>
                                </GlassCard>
                            )}
                        </div>

                        <div>
                            <p className={`text-sm font-bold mb-2 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Trainer Card</p>
                            {isLoading ? (
                                <SkeletonCard variant="trainer" />
                            ) : (
                                <GlassCard className={`p-6 text-center ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                    <img src="https://i.pravatar.cc/150?u=trainer" className="w-20 h-20 rounded-full mx-auto mb-3" alt="Trainer" />
                                    <h3 className={`font-bold text-lg mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Coach David</h3>
                                    <p className={`text-sm mb-4 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>HIIT & Strength Specialist</p>
                                    <div className="flex justify-center gap-6 mb-4">
                                        <div className="text-center">
                                            <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>4.9</div>
                                            <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Rating</div>
                                        </div>
                                        <div className="text-center">
                                            <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>127</div>
                                            <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Reviews</div>
                                        </div>
                                    </div>
                                    <button className="w-full py-3 rounded-full bg-neon-blue text-black font-bold">Book Session</button>
                                </GlassCard>
                            )}
                        </div>

                        <div>
                            <p className={`text-sm font-bold mb-2 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Event Card</p>
                            {isLoading ? (
                                <SkeletonCard variant="event" />
                            ) : (
                                <GlassCard className={`overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                    <img src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=60" className="w-full h-[180px] object-cover" alt="Event" />
                                    <div className="p-4">
                                        <span className={`text-xs font-bold ${isLight ? 'text-slate-500' : 'text-white/60'}`}>TODAY • 18:00</span>
                                        <h3 className={`font-bold text-lg my-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Sunset Yoga Session</h3>
                                        <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-white/70'}`}>📍 Central Park • 25 going</p>
                                        <button className="w-full mt-3 py-2 rounded-full bg-green-500 text-white font-bold">Join Event</button>
                                    </div>
                                </GlassCard>
                            )}
                        </div>

                        <div>
                            <p className={`text-sm font-bold mb-2 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Match Card</p>
                            {isLoading ? (
                                <SkeletonCard variant="match" />
                            ) : (
                                <GlassCard className={`p-6 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                    <p className={`text-xs font-bold mb-4 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>BASKETBALL • TOMORROW 16:00</p>
                                    <div className="flex justify-between items-center">
                                        <div className="text-center">
                                            <img src="https://i.pravatar.cc/150?u=team1" className="w-16 h-16 rounded-full mx-auto mb-2" alt="Team 1" />
                                            <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Hawks</p>
                                        </div>
                                        <div className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>VS</div>
                                        <div className="text-center">
                                            <img src="https://i.pravatar.cc/150?u=team2" className="w-16 h-16 rounded-full mx-auto mb-2" alt="Team 2" />
                                            <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Eagles</p>
                                        </div>
                                    </div>
                                </GlassCard>
                            )}
                        </div>
                    </div>

                    <CodeBlock code={`import { SkeletonCard } from '../components/ui/SkeletonCard';

<SkeletonCard variant="club" />
<SkeletonCard variant="trainer" />
<SkeletonCard variant="event" />
<SkeletonCard variant="match" />

// Basic card with custom options
<SkeletonCard 
  variant="basic" 
  showAvatar={true} 
  showImage={true}
  lines={4}
/>`} />
                </section>

                {/* Skeleton List */}
                <section>
                    <h2 className={`text-xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        3. Skeleton List (Tekrarlayan Öğeler)
                    </h2>

                    <p className={`text-sm mb-4 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                        Liste görünümleri için tekrarlayan skeleton komponentleri
                    </p>

                    {isLoading ? (
                        <SkeletonList count={3} gap={16}>
                            <SkeletonCard variant="club" />
                        </SkeletonList>
                    ) : (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <GlassCard key={i} className={`overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                    <img src={`https://images.unsplash.com/photo-${1517649763962 + i}?w=800&auto=format&fit=crop&q=60`} className="w-full h-[140px] object-cover" alt={`Club ${i}`} />
                                    <div className="p-4">
                                        <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Sports Club {i}</h3>
                                        <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-white/70'}`}>Amazing community for athletes</p>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    )}

                    <CodeBlock code={`import { SkeletonList } from '../components/ui/SkeletonList';
import { SkeletonCard } from '../components/ui/SkeletonCard';

<SkeletonList count={5} gap={16}>
  <SkeletonCard variant="club" />
</SkeletonList>

// Farklı card tipleri ile
<SkeletonList count={3}>
  <SkeletonCard variant="trainer" />
</SkeletonList>`} />
                </section>

                {/* Skeleton Profile */}
                <section>
                    <h2 className={`text-xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        4. Skeleton Profile (Profil Sayfası)
                    </h2>

                    <p className={`text-sm mb-4 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                        Profil sayfaları için tam sayfa skeleton layout
                    </p>

                    {isLoading ? (
                        <GlassCard className={`${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                            <SkeletonProfile variant="user" showStats={true} showBio={true} />
                        </GlassCard>
                    ) : (
                        <GlassCard className={`p-6 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                            <div className="text-center mb-6">
                                <img src="https://i.pravatar.cc/150?u=profile" className="w-24 h-24 rounded-full mx-auto mb-4" alt="Profile" />
                                <h2 className={`text-2xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Jane Athlete</h2>
                                <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-white/70'}`}>Professional Runner • New York</p>
                            </div>
                            <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-neon-blue/10 to-purple-500/10 rounded-xl">
                                {['Workouts', 'Friends', 'Achievements'].map((stat, i) => (
                                    <div key={i} className="text-center">
                                        <div className={`text-2xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{42 + i * 10}</div>
                                        <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/70'}`}>{stat}</div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    )}

                    <CodeBlock code={`import { SkeletonProfile } from '../components/ui/SkeletonProfile';

// User profile
<SkeletonProfile variant="user" showStats={true} showBio={true} />

// Club profile
<SkeletonProfile variant="club" />

// Trainer profile
<SkeletonProfile variant="trainer" />`} />
                </section>

                {/* Real-world Integration Example */}
                <section>
                    <h2 className={`text-xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        5. Gerçek Kullanım Örneği
                    </h2>

                    <p className={`text-sm mb-4 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                        Bir React bileşeninde nasıl kullanılır
                    </p>

                    <CodeBlock code={`import { useState, useEffect } from 'react';
import { SkeletonList } from '../components/ui/SkeletonList';
import { SkeletonCard } from '../components/ui/SkeletonCard';

export const ClubsPage = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API'den veri çek
    fetchClubs().then(data => {
      setClubs(data);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1>Kulüpler</h1>
      
      {loading ? (
        // Loading state - Skeleton göster
        <SkeletonList count={5}>
          <SkeletonCard variant="club" />
        </SkeletonList>
      ) : (
        // Gerçek içerik
        clubs.map(club => (
          <ClubCard key={club.id} {...club} />
        ))
      )}
    </div>
  );
};`} />
                </section>

                {/* Animation Comparison */}
                <section>
                    <h2 className={`text-xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        6. Animasyon Karşılaştırması
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <GlassCard className={`p-6 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                            <h3 className={`font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Wave (Shimmer) - Default</h3>
                            <Skeleton animation="wave" width="100%" height={20} style={{ marginBottom: '12px' }} />
                            <Skeleton animation="wave" width="80%" height={20} style={{ marginBottom: '12px' }} />
                            <Skeleton animation="wave" width="90%" height={20} />
                        </GlassCard>

                        <GlassCard className={`p-6 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                            <h3 className={`font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Pulse (Alternative)</h3>
                            <Skeleton animation="pulse" width="100%" height={20} style={{ marginBottom: '12px' }} />
                            <Skeleton animation="pulse" width="80%" height={20} style={{ marginBottom: '12px' }} />
                            <Skeleton animation="pulse" width="90%" height={20} />
                        </GlassCard>
                    </div>

                    <div className={`mt-6 p-4 rounded-xl border ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-950/30 border-blue-800/30'}`}>
                        <p className={`text-sm font-bold mb-2 ${isLight ? 'text-blue-900' : 'text-blue-300'}`}>💡 UX İpucu</p>
                        <p className={`text-sm ${isLight ? 'text-blue-700' : 'text-blue-200/80'}`}>
                            Shimmer (wave) efekti, kullanıcılara "veri yükleniyor" hissini daha iyi verir.
                            Pulse efekti ise daha minimal bir alternatiftir. Varsayılan olarak shimmer kullanmanızı öneririz.
                        </p>
                    </div>
                </section>

                {/* Footer Info */}
                <section className={`p-6 rounded-2xl border ${isLight ? 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200' : 'bg-gradient-to-r from-white/5 to-white/10 border-white/10'}`}>
                    <h3 className={`text-lg font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>✨ Skeleton Screen Neden Önemli?</h3>
                    <ul className={`space-y-2 text-sm ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                        <li className="flex items-start gap-2">
                            <span className="text-neon-blue font-bold">•</span>
                            <span><strong>Algısal Performans:</strong> Uygulama olduğundan daha hızlı hissedilir</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-neon-blue font-bold">•</span>
                            <span><strong>Belirsizliği Azaltır:</strong> Kullanıcı ne beklediğini bilir</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-neon-blue font-bold">•</span>
                            <span><strong>Premium Görünüm:</strong> Modern uygulamalarla rekabet edebilir UX</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-neon-blue font-bold">•</span>
                            <span><strong>Donma Hissi Yok:</strong> Animasyon sayesinde "kilitlenme" algısı ortadan kalkar</span>
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    );
};

export default SkeletonDemo;
