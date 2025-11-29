import React from 'react';
import Skeleton from './Skeleton';

export interface SkeletonCardProps {
    variant?: 'club' | 'trainer' | 'event' | 'match' | 'basic';
    showAvatar?: boolean;
    showImage?: boolean;
    lines?: number;
    className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
    variant = 'basic',
    showAvatar = true,
    showImage = false,
    lines = 3,
    className = '',
}) => {
    const renderBasicCard = () => (
        <div className={`skeleton-card ${className}`} style={cardStyles}>
            {showImage && (
                <Skeleton variant="rectangular" height={160} style={{ marginBottom: '12px' }} />
            )}
            <div style={{ padding: '16px' }}>
                {showAvatar && (
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <div style={{ marginLeft: '12px', flex: 1 }}>
                            <Skeleton width="60%" height={16} />
                            <Skeleton width="40%" height={12} style={{ marginTop: '4px' }} />
                        </div>
                    </div>
                )}
                {[...Array(lines)].map((_, index) => (
                    <Skeleton
                        key={index}
                        width={index === lines - 1 ? '80%' : '100%'}
                        height={14}
                        style={{ marginBottom: '8px' }}
                    />
                ))}
            </div>
        </div>
    );

    const renderClubCard = () => (
        <div className={`skeleton-card ${className}`} style={cardStyles}>
            <div style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
                <Skeleton variant="rectangular" height={140} />
            </div>
            <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <Skeleton variant="circular" width={50} height={50} />
                    <div style={{ marginLeft: '12px', flex: 1 }}>
                        <Skeleton width="70%" height={18} />
                        <Skeleton width="50%" height={14} style={{ marginTop: '6px' }} />
                    </div>
                </div>
                <Skeleton width="100%" height={12} style={{ marginBottom: '6px' }} />
                <Skeleton width="85%" height={12} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <Skeleton width={60} height={28} variant="rounded" />
                    <Skeleton width={60} height={28} variant="rounded" />
                    <Skeleton width={60} height={28} variant="rounded" />
                </div>
            </div>
        </div>
    );

    const renderTrainerCard = () => (
        <div className={`skeleton-card ${className}`} style={cardStyles}>
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                    <Skeleton variant="circular" width={80} height={80} />
                </div>
                <Skeleton width="60%" height={20} style={{ margin: '0 auto 8px' }} />
                <Skeleton width="40%" height={14} style={{ margin: '0 auto 16px' }} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Skeleton width={40} height={16} style={{ margin: '0 auto 4px' }} />
                        <Skeleton width={60} height={12} style={{ margin: '0 auto' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <Skeleton width={40} height={16} style={{ margin: '0 auto 4px' }} />
                        <Skeleton width={60} height={12} style={{ margin: '0 auto' }} />
                    </div>
                </div>
                <Skeleton width="100%" height={40} variant="rounded" />
            </div>
        </div>
    );

    const renderEventCard = () => (
        <div className={`skeleton-card ${className}`} style={cardStyles}>
            <Skeleton variant="rectangular" height={180} />
            <div style={{ padding: '16px' }}>
                <Skeleton width="30%" height={12} style={{ marginBottom: '8px' }} />
                <Skeleton width="80%" height={20} style={{ marginBottom: '12px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton width="60%" height={14} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton width="50%" height={14} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Skeleton width="40%" height={16} />
                    <Skeleton width={100} height={36} variant="rounded" />
                </div>
            </div>
        </div>
    );

    const renderMatchCard = () => (
        <div className={`skeleton-card ${className}`} style={cardStyles}>
            <div style={{ padding: '20px' }}>
                <Skeleton width="40%" height={12} style={{ marginBottom: '12px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Skeleton variant="circular" width={60} height={60} style={{ margin: '0 auto 8px' }} />
                        <Skeleton width={80} height={14} style={{ margin: '0 auto' }} />
                    </div>
                    <Skeleton width={40} height={32} />
                    <div style={{ textAlign: 'center' }}>
                        <Skeleton variant="circular" width={60} height={60} style={{ margin: '0 auto 8px' }} />
                        <Skeleton width={80} height={14} style={{ margin: '0 auto' }} />
                    </div>
                </div>
                <Skeleton width="100%" height={1} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Skeleton width="30%" height={14} />
                    <Skeleton width="30%" height={14} />
                </div>
            </div>
        </div>
    );

    const cardStyles: React.CSSProperties = {
        backgroundColor: 'var(--card-bg, #ffffff)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        marginBottom: '16px',
    };

    switch (variant) {
        case 'club':
            return renderClubCard();
        case 'trainer':
            return renderTrainerCard();
        case 'event':
            return renderEventCard();
        case 'match':
            return renderMatchCard();
        default:
            return renderBasicCard();
    }
};

export default SkeletonCard;
