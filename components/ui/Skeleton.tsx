import React from 'react';

export interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: number | string;
    height?: number | string;
    animation?: 'pulse' | 'wave' | 'none';
    className?: string;
    style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    animation = 'wave',
    className = '',
    style = {},
}) => {
    const getVariantStyles = (): React.CSSProperties => {
        const baseStyles: React.CSSProperties = {
            backgroundColor: 'var(--skeleton-bg, #e0e0e0)',
            display: 'inline-block',
            ...style,
        };

        switch (variant) {
            case 'text':
                return {
                    ...baseStyles,
                    width: width || '100%',
                    height: height || '1em',
                    borderRadius: '4px',
                    transform: 'scale(1, 0.6)',
                };
            case 'circular':
                const size = width || height || 40;
                return {
                    ...baseStyles,
                    width: size,
                    height: size,
                    borderRadius: '50%',
                };
            case 'rectangular':
                return {
                    ...baseStyles,
                    width: width || '100%',
                    height: height || 100,
                    borderRadius: 0,
                };
            case 'rounded':
                return {
                    ...baseStyles,
                    width: width || '100%',
                    height: height || 100,
                    borderRadius: '12px',
                };
            default:
                return baseStyles;
        }
    };

    const getAnimationClass = () => {
        if (animation === 'none') return '';
        return animation === 'pulse' ? 'skeleton-pulse' : 'skeleton-wave';
    };

    return (
        <span
            className={`skeleton ${getAnimationClass()} ${className}`.trim()}
            style={getVariantStyles()}
            aria-live="polite"
            aria-busy="true"
        />
    );
};

export default Skeleton;
