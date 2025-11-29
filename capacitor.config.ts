import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sportpulse.app',
  appName: 'SportPulse',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    // iOS Permission Descriptions - Required by App Store
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
