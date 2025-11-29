import React from 'react';

export interface SkeletonListProps {
    count?: number;
    gap?: number;
    children: React.ReactElement;
    className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
    count = 3,
    gap = 16,
    children,
    className = '',
}) => {
    return (
        <div className={`skeleton-list ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
            {[...Array(count)].map((_, index) => (
                <div key={`skeleton-item-${index}`}>
                    {React.cloneElement(children, { key: index })}
                </div>
            ))}
        </div>
    );
};

export default SkeletonList;
