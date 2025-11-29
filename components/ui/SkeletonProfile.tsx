import React from 'react';
import Skeleton from './Skeleton';

export interface SkeletonProfileProps {
    variant?: 'user' | 'club' | 'trainer';
    showStats?: boolean;
    showBio?: boolean;
    className?: string;
}

export const SkeletonProfile: React.FC<SkeletonProfileProps> = ({
    variant = 'user',
    showStats = true,
    showBio = true,
    className = '',
}) => {
    return (
        <div className={`skeleton-profile ${className}`} style={{ padding: '20px' }}>
            {/* Header Section */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                {/* Cover Photo (optional for club/trainer) */}
                {(variant === 'club' || variant === 'trainer') && (
                    <Skeleton variant="rectangular" height={180} style={{ marginBottom: '16px', borderRadius: '12px' }} />
                )}

                {/* Avatar */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <Skeleton variant="circular" width={100} height={100} />
                </div>

                {/* Name & Title */}
                <Skeleton width="50%" height={24} style={{ margin: '0 auto 8px' }} />
                <Skeleton width="35%" height={16} style={{ margin: '0 auto 12px' }} />

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
                    <Skeleton width={120} height={40} variant="rounded" />
                    <Skeleton width={120} height={40} variant="rounded" />
                </div>
            </div>

            {/* Stats Section */}
            {showStats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px',
                    padding: '16px',
                    backgroundColor: 'var(--stats-bg, #f5f5f5)',
                    borderRadius: '12px'
                }}>
                    {[...Array(variant === 'trainer' ? 4 : 3)].map((_, index) => (
                        <div key={index} style={{ textAlign: 'center' }}>
                            <Skeleton width={60} height={28} style={{ margin: '0 auto 8px' }} />
                            <Skeleton width={80} height={14} style={{ margin: '0 auto' }} />
                        </div>
                    ))}
                </div>
            )}

            {/* Bio Section */}
            {showBio && (
                <div style={{ marginBottom: '24px' }}>
                    <Skeleton width={100} height={20} style={{ marginBottom: '12px' }} />
                    <Skeleton width="100%" height={14} style={{ marginBottom: '6px' }} />
                    <Skeleton width="95%" height={14} style={{ marginBottom: '6px' }} />
                    <Skeleton width="88%" height={14} />
                </div>
            )}

            {/* Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {[...Array(2)].map((_, index) => (
                    <div
                        key={index}
                        style={{
                            padding: '16px',
                            backgroundColor: 'var(--card-bg, #ffffff)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color, #e0e0e0)'
                        }}
                    >
                        <Skeleton width={120} height={18} style={{ marginBottom: '12px' }} />
                        {[...Array(3)].map((_, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <Skeleton variant="circular" width={20} height={20} style={{ marginRight: '8px' }} />
                                <Skeleton width="70%" height={14} />
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Recent Activity / Content Section */}
            <div style={{ marginTop: '24px' }}>
                <Skeleton width={150} height={20} style={{ marginBottom: '16px' }} />
                <div style={{ display: 'grid', gap: '12px' }}>
                    {[...Array(3)].map((_, index) => (
                        <div
                            key={index}
                            style={{
                                padding: '12px',
                                backgroundColor: 'var(--card-bg, #ffffff)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color, #e0e0e0)'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Skeleton variant="rounded" width={60} height={60} />
                                <div style={{ flex: 1 }}>
                                    <Skeleton width="80%" height={16} style={{ marginBottom: '6px' }} />
                                    <Skeleton width="60%" height={12} style={{ marginBottom: '6px' }} />
                                    <Skeleton width="40%" height={12} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SkeletonProfile;
