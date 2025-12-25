import React, { useEffect, useState } from 'react';
import { Footprints, Timer, AlertTriangle, Play } from 'lucide-react';

interface TimeStatusPanelProps {
    dateStr: string;
    timeStr: string;
    isLight: boolean;
    currentStatus?: 'on_time' | 'late' | 'missed';
    onUpdateStatus: (status: 'on_time' | 'late' | 'missed') => void;
    onStartWorkout: () => void;
}

const checkIsUrgent = (dateStr: string, timeStr: string) => {
    const now = new Date();
    let targetDate = new Date();
    if (dateStr.toLowerCase() === 'today') {
        // keep today
    } else if (dateStr.toLowerCase() === 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1);
    } else {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
            targetDate = parsed;
            targetDate.setFullYear(now.getFullYear());
        }
    }
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    let h = parseInt(hours);
    if (modifier === 'PM' && h < 12) h += 12;
    if (modifier === 'AM' && h === 12) h = 0;
    targetDate.setHours(h, parseInt(minutes), 0, 0);
    const diff = targetDate.getTime() - now.getTime();
    return diff <= 30 * 60 * 1000 && diff > -60 * 60 * 1000;
};

export const TimeStatusPanel: React.FC<TimeStatusPanelProps> = ({
    dateStr,
    timeStr,
    isLight,
    currentStatus,
    onUpdateStatus,
    onStartWorkout
}) => {
    const isUrgent = checkIsUrgent(dateStr, timeStr);

    return (
        <div className="space-y-3 animate-slide-up">
            {isUrgent && (
                <div className={`p-3 rounded-2xl border flex items-center justify-center gap-2 mb-3 ${isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                    <Timer size={16} className="animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Session Starting Soon!</span>
                </div>
            )}
            
            <div className="grid grid-cols-3 gap-2">
                <button 
                    onClick={() => onUpdateStatus('on_time')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                        currentStatus === 'on_time' 
                            ? (isLight ? 'bg-green-100 border-green-300 text-green-700' : 'bg-green-500/20 border-green-500/50 text-green-400')
                            : (isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10')
                    }`}
                >
                    <Footprints size={20} className="mb-1" />
                    <span className="text-[9px] font-bold uppercase text-center">On Time</span>
                </button>
                
                <button 
                    onClick={() => onUpdateStatus('late')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                        currentStatus === 'late' 
                            ? (isLight ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-amber-500/20 border-amber-500/50 text-amber-400')
                            : (isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10')
                    }`}
                >
                    <Timer size={20} className="mb-1" />
                    <span className="text-[9px] font-bold uppercase text-center">Late</span>
                </button>
                
                <button 
                    onClick={() => onUpdateStatus('missed')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                        currentStatus === 'missed' 
                            ? (isLight ? 'bg-red-100 border-red-300 text-red-700' : 'bg-red-500/20 border-red-500/50 text-red-400')
                            : (isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10')
                    }`}
                >
                    <AlertTriangle size={20} className="mb-1" />
                    <span className="text-[9px] font-bold uppercase text-center">Cancel</span>
                </button>
            </div>
            
            {isUrgent && (
                <button
                    onClick={onStartWorkout}
                    className="w-full h-14 rounded-[24px] bg-brand-lime text-black font-display font-bold text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(222,255,144,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <Play size={18} fill="currentColor" />
                    START WORKOUT
                </button>
            )}
        </div>
    );
};
