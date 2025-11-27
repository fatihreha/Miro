import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassButton } from '../components/ui/Glass';
import { Check, Crown, Zap, Users, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { revenueCatService } from '../services/revenueCatService';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';

export const PremiumUpgrade: React.FC = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const isLight = theme === 'light';

    const [offerings, setOfferings] = useState<any>(null);
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [loading, setLoading] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);

    useEffect(() => {
        loadOfferings();
    }, []);

    const loadOfferings = async () => {
        try {
            const current = await revenueCatService.getOfferings();
            setOfferings(current);

            // Pre-select yearly package (best value)
            const yearlyPkg = current?.availablePackages.find(
                (pkg: PurchasesPackage) => pkg.identifier.includes('yearly')
            );
            setSelectedPackage(yearlyPkg || current?.availablePackages[0]);
        } catch (error) {
            console.error('Failed to load offerings:', error);
        }
    };

    const handlePurchase = async () => {
        if (!selectedPackage) return;

        setLoading(true);
        try {
            await revenueCatService.purchasePremium(selectedPackage);
            setPurchaseSuccess(true);

            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (error: any) {
            if (error.message !== 'PURCHASE_CANCELLED') {
                alert('Purchase failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        try {
            await revenueCatService.restorePurchases();
            alert('Purchases restored successfully!');
            navigate('/');
        } catch (error) {
            alert('No purchases found to restore.');
        } finally {
            setLoading(false);
        }
    };

    const premiumFeatures = [
        { icon: <Zap className="w-5 h-5" />, title: 'Unlimited Swipes', desc: 'No daily limit' },
        { icon: <MapPin className="w-5 h-5" />, title: 'Advanced Filters', desc: 'Location, age, level' },
        { icon: <Users className="w-5 h-5" />, title: 'Personal Trainers', desc: 'Book sessions' },
        { icon: <Calendar className="w-5 h-5" />, title: 'Event Priority', desc: 'First access to events' },
        { icon: <Crown className="w-5 h-5" />, title: 'Premium Badge', desc: 'Stand out' },
        { icon: <Check className="w-5 h-5" />, title: 'Ad-Free', desc: 'No interruptions' },
    ];

    if (purchaseSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <GlassCard className="p-8 text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                        <Crown className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Welcome to Premium!</h2>
                    <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        You now have access to all premium features
                    </p>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-6 pt-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => navigate(-1)} className="p-2">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <button onClick={handleRestore} className="text-sm text-blue-500">
                    Restore Purchases
                </button>
            </div>

            {/* Hero Section */}
            <div className="text-center mb-12">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Crown className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Go Premium
                </h1>
                <p className={`text-lg ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                    Unlock unlimited potential
                </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mb-12">
                {premiumFeatures.map((feature, idx) => (
                    <GlassCard key={idx} className="p-4">
                        <div className="text-yellow-500 mb-3">{feature.icon}</div>
                        <h3 className="font-semibold mb-1 text-sm">{feature.title}</h3>
                        <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            {feature.desc}
                        </p>
                    </GlassCard>
                ))}
            </div>

            {/* Pricing Plans */}
            {offerings && (
                <div className="space-y-4 mb-8">
                    {offerings.availablePackages.map((pkg: PurchasesPackage) => {
                        const isYearly = pkg.identifier.includes('yearly');
                        const isSelected = selectedPackage?.identifier === pkg.identifier;

                        return (
                            <GlassCard
                                key={pkg.identifier}
                                className={`p-5 cursor-pointer transition-all ${isSelected
                                    ? 'ring-2 ring-yellow-500 shadow-lg shadow-yellow-500/20'
                                    : ''
                                    }`}
                                onClick={() => setSelectedPackage(pkg)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-lg">{pkg.product.title}</h3>
                                            {isYearly && (
                                                <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
                                                    BEST VALUE
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {pkg.product.description}
                                        </p>
                                        {isYearly && (
                                            <p className="text-xs text-green-500 mt-1">
                                                Save 20% vs monthly
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold">{pkg.product.priceString}</div>
                                        <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {isYearly ? '/year' : '/month'}
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}

            {/* CTA Button */}
            <GlassButton
                onClick={handlePurchase}
                disabled={loading || !selectedPackage}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-lg"
            >
                {loading ? 'Processing...' : 'Start Premium'}
            </GlassButton>

            {/* Terms */}
            <p className={`text-xs text-center mt-6 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                Subscription auto-renews. Cancel anytime in App Store or Google Play settings.
            </p>
        </div>
    );
};
