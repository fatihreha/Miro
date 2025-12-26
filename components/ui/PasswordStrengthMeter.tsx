import React from 'react';
import { checkPasswordStrength, getPasswordStrengthLabel } from '../../utils/validation';
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface PasswordStrengthMeterProps {
    password: string;
    isLight?: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
    password,
    isLight = false
}) => {
    const strength = checkPasswordStrength(password);
    const label = getPasswordStrengthLabel(strength);

    // Color and icon based on strength
    const getStrengthConfig = () => {
        switch (strength) {
            case 0:
            case 1:
                return {
                    color: '#ef4444', // red
                    bgColor: 'rgba(239, 68, 68, 0.2)',
                    icon: ShieldX,
                    barWidth: '20%'
                };
            case 2:
                return {
                    color: '#f97316', // orange
                    bgColor: 'rgba(249, 115, 22, 0.2)',
                    icon: ShieldAlert,
                    barWidth: '40%'
                };
            case 3:
                return {
                    color: '#eab308', // yellow
                    bgColor: 'rgba(234, 179, 8, 0.2)',
                    icon: Shield,
                    barWidth: '60%'
                };
            case 4:
                return {
                    color: '#22c55e', // green
                    bgColor: 'rgba(34, 197, 94, 0.2)',
                    icon: ShieldCheck,
                    barWidth: '80%'
                };
            case 5:
                return {
                    color: '#10b981', // emerald
                    bgColor: 'rgba(16, 185, 129, 0.2)',
                    icon: ShieldCheck,
                    barWidth: '100%'
                };
            default:
                return {
                    color: '#6b7280',
                    bgColor: 'rgba(107, 114, 128, 0.2)',
                    icon: Shield,
                    barWidth: '0%'
                };
        }
    };

    const config = getStrengthConfig();
    const Icon = config.icon;

    if (!password) return null;

    return (
        <div className="mt-2 space-y-2 animate-fade-in">
            {/* Progress Bar */}
            <div
                className="h-1.5 rounded-full overflow-hidden transition-colors"
                style={{ backgroundColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)' }}
            >
                <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                        width: config.barWidth,
                        backgroundColor: config.color,
                        boxShadow: `0 0 10px ${config.color}40`
                    }}
                />
            </div>

            {/* Label and Requirements */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Icon
                        size={14}
                        style={{ color: config.color }}
                        className="transition-colors"
                    />
                    <span
                        className="text-xs font-bold transition-colors"
                        style={{ color: config.color }}
                    >
                        {label}
                    </span>
                </div>
                <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                    {strength}/5
                </span>
            </div>

            {/* Requirements Checklist */}
            <div className={`text-[10px] space-y-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                <RequirementItem met={password.length >= 8} text="En az 8 karakter" isLight={isLight} />
                <RequirementItem met={/[A-Z]/.test(password)} text="Büyük harf (A-Z)" isLight={isLight} />
                <RequirementItem met={/[a-z]/.test(password)} text="Küçük harf (a-z)" isLight={isLight} />
                <RequirementItem met={/[0-9]/.test(password)} text="Rakam (0-9)" isLight={isLight} />
                <RequirementItem met={/[@$!%*?&]/.test(password)} text="Özel karakter (@$!%*?&)" isLight={isLight} />
            </div>
        </div>
    );
};

// Requirement Item Component
const RequirementItem: React.FC<{ met: boolean; text: string; isLight: boolean }> = ({
    met,
    text,
    isLight
}) => (
    <div className={`flex items-center gap-1.5 transition-colors ${met ? 'opacity-100' : 'opacity-50'}`}>
        <div
            className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] transition-all ${met
                    ? 'bg-green-500 text-white'
                    : isLight ? 'bg-slate-200' : 'bg-white/10'
                }`}
        >
            {met && '✓'}
        </div>
        <span className={met ? (isLight ? 'text-slate-700' : 'text-white/70') : ''}>
            {text}
        </span>
    </div>
);

export default PasswordStrengthMeter;
