import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Helper to check if we are running in a native app context
const isNative = () => {
  return (window as any).Capacitor?.isNativePlatform();
};

export const hapticFeedback = {
  // Subtle feedback for small UI interactions (typing, toggles)
  light: async () => {
    try {
      if (isNative()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch (e) { 
      // Fail silently on unsupported devices
    }
  },
  
  // Distinct feedback for significant actions (swipes, buttons)
  medium: async () => {
    try {
      if (isNative()) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(25);
      }
    } catch (e) { }
  },
  
  // Strong feedback for alerts or warnings
  heavy: async () => {
    try {
      if (isNative()) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (e) { }
  },
  
  // Pattern for success events (e.g., match, joined club)
  success: async () => {
    try {
      if (isNative()) {
        await Haptics.notification({ type: NotificationType.Success });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([10, 30, 10]);
      }
    } catch (e) { }
  },
  
  // Pattern for errors or destructive actions
  error: async () => {
    try {
      if (isNative()) {
        await Haptics.notification({ type: NotificationType.Error });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    } catch (e) { }
  }
};
