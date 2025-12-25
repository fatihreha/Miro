import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserX, Unlock, Search, AlertCircle } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from '../components/ui/Glass';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { hapticFeedback as hapticService } from '../services/hapticService';

interface BlockedUser {
  id: string;
  blocked_user_id: string;
  blocked_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export const BlockedUsers: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLight = theme === 'light';

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    loadBlockedUsers();
  }, [user]);

  const loadBlockedUsers = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          id,
          blocked_user_id,
          blocked_at,
          user:blocked_user_id (
            id,
            name,
            avatar_url
          )
        `)
        .eq('blocker_id', user.id)
        .order('blocked_at', { ascending: false });

      if (error) {
        // Tablo yoksa boş liste göster
        if (error.code === '42P01') {
          setBlockedUsers([]);
          return;
        }
        throw error;
      }

      setBlockedUsers(data || []);
    } catch (error) {
      console.error('Error loading blocked users:', error);
      setBlockedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockedUserId: string) => {
    if (!user?.id) return;

    try {
      setUnblocking(blockedUserId);
      hapticService.medium();

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_user_id', blockedUserId);

      if (error) throw error;

      setBlockedUsers(prev => prev.filter(u => u.blocked_user_id !== blockedUserId));
      hapticService.success();
    } catch (error) {
      console.error('Error unblocking user:', error);
      hapticService.error();
    } finally {
      setUnblocking(null);
    }
  };

  const filteredUsers = blockedUsers.filter(blocked =>
    blocked.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-50' : 'bg-slate-900'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 ${isLight ? 'bg-white/80' : 'bg-slate-900/80'} backdrop-blur-xl border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-full ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}
          >
            <ArrowLeft size={24} className={isLight ? 'text-slate-900' : 'text-white'} />
          </button>
          <h1 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Engellenen Kullanıcılar
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <GlassInput
          placeholder="Kullanıcı ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search size={18} />}
        />

        {/* Info Card */}
        <GlassCard className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isLight ? 'bg-blue-100' : 'bg-blue-500/20'}`}>
              <AlertCircle size={20} className="text-blue-500" />
            </div>
            <div>
              <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                Engellediğiniz kullanıcılar sizinle eşleşemez, mesaj gönderemez ve profilinizi göremez.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          /* Empty State */
          <GlassCard className="p-8 text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isLight ? 'bg-slate-100' : 'bg-white/10'} flex items-center justify-center`}>
              <UserX size={32} className={isLight ? 'text-slate-400' : 'text-white/40'} />
            </div>
            <h3 className={`font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {searchQuery ? 'Sonuç bulunamadı' : 'Engellenen kullanıcı yok'}
            </h3>
            <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              {searchQuery
                ? 'Arama kriterlerinize uygun kullanıcı bulunamadı.'
                : 'Henüz kimseyi engellememiş görünüyorsunuz.'}
            </p>
          </GlassCard>
        ) : (
          /* Blocked Users List */
          <div className="space-y-2">
            {filteredUsers.map((blocked) => (
              <GlassCard key={blocked.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {blocked.user?.avatar_url ? (
                      <img
                        src={blocked.user.avatar_url}
                        alt={blocked.user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full ${isLight ? 'bg-slate-200' : 'bg-white/10'} flex items-center justify-center`}>
                        <UserX size={24} className={isLight ? 'text-slate-400' : 'text-white/40'} />
                      </div>
                    )}
                    <div>
                      <p className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {blocked.user?.name || 'Kullanıcı'}
                      </p>
                      <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        {formatDate(blocked.blocked_at)} tarihinde engellendi
                      </p>
                    </div>
                  </div>
                  <GlassButton
                    size="sm"
                    variant="secondary"
                    onClick={() => handleUnblock(blocked.blocked_user_id)}
                    disabled={unblocking === blocked.blocked_user_id}
                    className="flex items-center gap-2"
                  >
                    {unblocking === blocked.blocked_user_id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Unlock size={14} />
                        <span>Engeli Kaldır</span>
                      </>
                    )}
                  </GlassButton>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Count Info */}
        {!loading && blockedUsers.length > 0 && (
          <p className={`text-center text-xs ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
            Toplam {blockedUsers.length} kullanıcı engellendi
          </p>
        )}
      </div>
    </div>
  );
};
