import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Trash2, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { GlassCard, GlassButton } from '../components/ui/Glass';
import { useTheme } from '../context/ThemeContext';
import { hapticFeedback } from '../services/hapticService';
import { useLayout } from '../context/LayoutContext';
import { userService } from '../services/userService';
import { compressImage } from '../utils/imageCompression';
import { notificationService } from '../services/notificationService';

interface PhotoManagerProps {
    userId: string;
    photos: string[];
    onPhotosChange: (newPhotos: string[]) => Promise<void>;
    onClose: () => void;
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({ userId, photos: initialPhotos, onPhotosChange, onClose }) => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { setTabBarVisible } = useLayout();
    const isLight = theme === 'light';

    const [photos, setPhotos] = useState<string[]>(initialPhotos);
    const [isUploading, setIsUploading] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Hide TabBar when active
    useEffect(() => {
        setTabBarVisible(false);
        return () => setTabBarVisible(true);
    }, [setTabBarVisible]);

    const handleSave = async () => {
        hapticFeedback.success();
        try {
            await onPhotosChange(photos);
            notificationService.showNotification("Fotoğraflar Güncellendi", { body: "Profil fotoğraflarınız kaydedildi." });
            onClose();
        } catch (error) {
            console.error('Error saving photos:', error);
            hapticFeedback.error();
            notificationService.showNotification("Hata", { body: "Fotoğraflar kaydedilemedi. Tekrar deneyin." });
        }
    };

    const handleCancel = () => {
        hapticFeedback.medium();
        onClose();
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const files = Array.from(e.target.files);
        const remainingSlots = 6 - photos.length;

        if (files.length > remainingSlots) {
            notificationService.showNotification("Limit Aşıldı", { body: `Maksimum ${remainingSlots} fotoğraf ekleyebilirsiniz.` });
            return;
        }

        setIsUploading(true);
        hapticFeedback.light();

        try {
            // Compress images
            const compressedFiles: File[] = [];
            for (const file of files) {
                const compressed = await compressImage(file as File);
                compressedFiles.push(compressed);
            }

            // Upload to Supabase
            const urls = await userService.uploadPhotos(userId, compressedFiles);

            if (urls.length > 0) {
                setPhotos(prev => [...prev, ...urls]);
                hapticFeedback.success();
                notificationService.showNotification("Fotoğraflar Eklendi", { body: `${urls.length} fotoğraf başarıyla yüklendi.` });
            } else {
                hapticFeedback.error();
                notificationService.showNotification("Yükleme Başarısız", { body: "Fotoğraflar yüklenemedi. Tekrar deneyin." });
            }
        } catch (error) {
            console.error('Photo upload error:', error);
            hapticFeedback.error();
            notificationService.showNotification("Hata", { body: "Bir hata oluştu. Tekrar deneyin." });
        } finally {
            setIsUploading(false);
        }
    };

    const removePhoto = async (index: number) => {
        if (photos.length <= 1) {
            notificationService.showNotification("Uyarı", { body: "En az bir fotoğrafınız olmalıdır." });
            return;
        }

        hapticFeedback.medium();

        const photoToDelete = photos[index];
        setPhotos(prev => prev.filter((_, i) => i !== index));

        // Delete from storage in background
        try {
            await userService.deletePhoto(photoToDelete);
        } catch (error) {
            console.error('Error deleting photo:', error);
        }
    };

    const setMainPhoto = (index: number) => {
        if (index === 0) return;

        hapticFeedback.success();
        const newPhotos = [...photos];
        const selected = newPhotos.splice(index, 1)[0];
        newPhotos.unshift(selected); // Move to start
        setPhotos(newPhotos);
    };

    // Drag & Drop handlers
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
        hapticFeedback.light();
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === index) return;

        const newPhotos = [...photos];
        const draggedPhoto = newPhotos[draggedIndex];
        newPhotos.splice(draggedIndex, 1);
        newPhotos.splice(index, 0, draggedPhoto);

        setPhotos(newPhotos);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        hapticFeedback.success();
    };

    return (
        <div className={`fixed inset-0 z-50 flex flex-col ${isLight ? 'bg-[#f0f4f8]' : 'bg-black'}`}>

            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className={`absolute inset-0 transition-colors duration-700 ${isLight ? 'bg-gradient-to-br from-slate-50 via-blue-50/20 to-white' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#000000] to-[#000000]'}`}></div>
                <div className={`absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[90px] animate-blob opacity-40 ${isLight ? 'bg-blue-300/30' : 'bg-brand-indigo/30'}`}></div>
            </div>

            {/* Header */}
            <div className="relative z-10 px-6 pt-safe-top py-4 flex items-center justify-between">
                <button
                    onClick={handleCancel}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md ${isLight ? 'bg-white/40 border border-slate-200 text-slate-600' : 'bg-white/5 border border-white/10 text-white/60'}`}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className={`text-xl font-display font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Fotoğrafları Düzenle</h1>
                <button
                    onClick={handleSave}
                    disabled={isUploading}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md ${isLight ? 'bg-slate-900 text-white shadow-lg' : 'bg-brand-lime text-black shadow-[0_0_15px_rgba(222,255,144,0.4)]'}`}
                >
                    {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} strokeWidth={2.5} />}
                </button>
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 px-6 pb-safe-bottom overflow-y-auto no-scrollbar">
                <p className={`text-sm mb-6 text-center ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Sürükleyerek sıralayın. İlk fotoğraf ana profil resminizdir.
                </p>

                <div className="grid grid-cols-2 gap-4 pb-20">
                    {photos.map((photo, index) => (
                        <div
                            key={index}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`relative aspect-[3/4] rounded-[24px] overflow-hidden group shadow-lg animate-slide-up border cursor-move ${isLight ? 'border-white' : 'border-white/10'} ${draggedIndex === index ? 'opacity-50' : ''}`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <img src={photo} className="w-full h-full object-cover" alt="" draggable={false} />

                            {/* Controls Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                {index !== 0 && (
                                    <button
                                        onClick={() => setMainPhoto(index)}
                                        className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/30 hover:bg-brand-lime hover:text-black hover:border-brand-lime transition-all transform hover:scale-105"
                                    >
                                        Ana Yap
                                    </button>
                                )}
                                <button
                                    onClick={() => removePhoto(index)}
                                    className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-red-500 hover:border-red-500 transition-all transform hover:scale-105"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Main Badge */}
                            {index === 0 && (
                                <div className="absolute top-3 left-3 px-3 py-1.5 bg-brand-lime text-black text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-lg border-2 border-white/20">
                                    Ana
                                </div>
                            )}

                            {/* Number Badge */}
                            <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
                                {index + 1}
                            </div>
                        </div>
                    ))}

                    {/* Add Button */}
                    {photos.length < 6 && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className={`
                          aspect-[3/4] rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all active:scale-95 group animate-slide-up
                          ${isLight
                                    ? 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                                    : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-brand-lime/50'}
                          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                            style={{ animationDelay: `${photos.length * 50}ms` }}
                        >
                            {isUploading ? (
                                <Loader2 size={28} className={`animate-spin ${isLight ? 'text-slate-600' : 'text-white/60'}`} />
                            ) : (
                                <>
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-sm ${isLight ? 'bg-white' : 'bg-white/10 group-hover:bg-brand-lime/20'}`}>
                                        <Plus size={28} className={isLight ? 'text-slate-600' : 'text-white/60 group-hover:text-brand-lime'} />
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/50 group-hover:text-white'}`}>
                                        Fotoğraf Ekle
                                    </span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                />
            </div>
        </div>
    );
};
