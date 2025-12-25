import React, { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { GlassButton } from './Glass';
import { hapticFeedback } from '../../services/hapticService';

export interface TutorialStep {
    targetId: string;
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

interface TutorialOverlayProps {
    isActive: boolean;
    steps: TutorialStep[];
    onComplete: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isActive, steps, onComplete }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

    const currentStep = steps[currentStepIndex];

    useEffect(() => {
        if (!isActive || !currentStep) return;

        const updateSpotlight = () => {
            const targetElement = document.getElementById(currentStep.targetId);
            if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                setSpotlightRect(rect);

                // Calculate tooltip position
                const tooltipWidth = 320;
                const tooltipHeight = 200;
                const padding = 20;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                let top = 0;
                let left = 0;

                const position = currentStep.position || 'auto';

                if (position === 'auto') {
                    // Smart positioning based on available space
                    const spaceBelow = viewportHeight - (rect.bottom + padding);
                    const spaceAbove = rect.top - padding;
                    const spaceRight = viewportWidth - (rect.right + padding);
                    const spaceLeft = rect.left - padding;

                    if (spaceBelow >= tooltipHeight) {
                        // Position below
                        top = rect.bottom + padding;
                        left = Math.max(padding, Math.min(rect.left, viewportWidth - tooltipWidth - padding));
                    } else if (spaceAbove >= tooltipHeight) {
                        // Position above
                        top = rect.top - tooltipHeight - padding;
                        left = Math.max(padding, Math.min(rect.left, viewportWidth - tooltipWidth - padding));
                    } else if (spaceRight >= tooltipWidth) {
                        // Position right
                        top = Math.max(padding, Math.min(rect.top, viewportHeight - tooltipHeight - padding));
                        left = rect.right + padding;
                    } else if (spaceLeft >= tooltipWidth) {
                        // Position left
                        top = Math.max(padding, Math.min(rect.top, viewportHeight - tooltipHeight - padding));
                        left = rect.left - tooltipWidth - padding;
                    } else {
                        // Fallback: center on screen
                        top = (viewportHeight - tooltipHeight) / 2;
                        left = (viewportWidth - tooltipWidth) / 2;
                    }
                } else {
                    // Manual positioning
                    switch (position) {
                        case 'bottom':
                            top = rect.bottom + padding;
                            left = Math.max(padding, Math.min(rect.left, viewportWidth - tooltipWidth - padding));
                            break;
                        case 'top':
                            top = rect.top - tooltipHeight - padding;
                            left = Math.max(padding, Math.min(rect.left, viewportWidth - tooltipWidth - padding));
                            break;
                        case 'right':
                            top = Math.max(padding, Math.min(rect.top, viewportHeight - tooltipHeight - padding));
                            left = rect.right + padding;
                            break;
                        case 'left':
                            top = Math.max(padding, Math.min(rect.top, viewportHeight - tooltipHeight - padding));
                            left = rect.left - tooltipWidth - padding;
                            break;
                    }
                }

                setTooltipPosition({ top, left });
            }
        };

        updateSpotlight();
        window.addEventListener('resize', updateSpotlight);
        window.addEventListener('scroll', updateSpotlight);

        return () => {
            window.removeEventListener('resize', updateSpotlight);
            window.removeEventListener('scroll', updateSpotlight);
        };
    }, [isActive, currentStep]);

    const handleNext = () => {
        hapticFeedback.light();
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handlePrevious = () => {
        hapticFeedback.light();
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        hapticFeedback.light();
        onComplete();
    };

    if (!isActive || !currentStep || !spotlightRect) return null;

    return (
        <div className="fixed inset-0 z-[300] pointer-events-none animate-fade-in">
            {/* Dark Overlay with cutout */}
            <div className="absolute inset-0 pointer-events-auto">
                {/* Top */}
                <div 
                    className="absolute left-0 right-0 top-0 bg-black/80 backdrop-blur-sm"
                    style={{ height: spotlightRect.top }}
                />
                {/* Bottom */}
                <div 
                    className="absolute left-0 right-0 bottom-0 bg-black/80 backdrop-blur-sm"
                    style={{ top: spotlightRect.bottom }}
                />
                {/* Left */}
                <div 
                    className="absolute left-0 bg-black/80 backdrop-blur-sm"
                    style={{ 
                        top: spotlightRect.top, 
                        width: spotlightRect.left,
                        height: spotlightRect.height
                    }}
                />
                {/* Right */}
                <div 
                    className="absolute right-0 bg-black/80 backdrop-blur-sm"
                    style={{ 
                        top: spotlightRect.top, 
                        left: spotlightRect.right,
                        height: spotlightRect.height
                    }}
                />
            </div>

            {/* Spotlight Border */}
            <div 
                className="absolute border-4 border-brand-lime rounded-2xl animate-pulse-slow shadow-[0_0_30px_rgba(163,230,53,0.6)]"
                style={{
                    top: spotlightRect.top - 4,
                    left: spotlightRect.left - 4,
                    width: spotlightRect.width + 8,
                    height: spotlightRect.height + 8,
                }}
            />

            {/* Tooltip */}
            <div 
                className="absolute w-[320px] pointer-events-auto animate-scale-in"
                style={{
                    top: tooltipPosition.top,
                    left: tooltipPosition.left,
                }}
            >
                <div className="relative">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-brand-lime/20 rounded-3xl blur-2xl" />
                    
                    {/* Main tooltip */}
                    <div className="relative bg-black/90 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
                        <button
                            onClick={handleSkip}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition"
                        >
                            <X size={16} />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-2 pr-8">{currentStep.title}</h3>
                        <p className="text-sm text-white/70 leading-relaxed mb-6">{currentStep.description}</p>

                        <div className="flex items-center justify-between">
                            <div className="flex gap-1.5">
                                {steps.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`h-1 rounded-full transition-all duration-300 ${
                                            index === currentStepIndex ? 'bg-brand-lime w-8' : 'bg-white/30 w-1.5'
                                        }`}
                                    />
                                ))}
                            </div>

                            <div className="flex gap-2">
                                {currentStepIndex > 0 && (
                                    <button
                                        onClick={handlePrevious}
                                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                )}
                                <GlassButton
                                    onClick={handleNext}
                                    className="h-10 px-6 bg-brand-lime text-black border-0 hover:bg-brand-lime/90"
                                >
                                    {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                                    {currentStepIndex < steps.length - 1 && <ChevronRight size={18} className="ml-1" />}
                                </GlassButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
