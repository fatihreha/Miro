import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sportpulse.app',
  appName: 'SportPulse',
  webDir: 'dist',
  
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },

  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f172a',
    preferredContentMode: 'mobile'
  },

  android: {
    backgroundColor: '#0f172a',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false
  },

  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
      style: 'dark'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f172a',
      overlaysWebView: false
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#00f2ff',
      sound: 'default'
    }
  }
};

export default config;
