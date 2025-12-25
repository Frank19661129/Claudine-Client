import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pepper.app',
  appName: 'Pepper',
  webDir: 'dist',
  server: {
    // Allow localhost for development
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
  plugins: {
    // Platform-specific plugin configuration
  },
};

export default config;
