import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bayfatura.app',
  appName: 'BayFatura',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    // ─── Splash Screen ───────────────────────────────────
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      launchFadeOutDuration: 400,
      backgroundColor: '#1A2436',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },

    // ─── Status Bar ───────────────────────────────────────
    StatusBar: {
      style: 'Light',               // Koyu arka plan → açık ikonlar
      backgroundColor: '#1A2436',
      overlaysWebView: false,
    },

    // ─── Keyboard ─────────────────────────────────────────
    Keyboard: {
      resize: 'body',               // Klavye açılınca body küçülsün
      resizeOnFullScreen: true,
      style: 'dark',
    },

    // ─── Push Notifications ───────────────────────────────
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // ─── Camera ───────────────────────────────────────────
    Camera: {
      useSupportActionModeInsteadOfDefaultEditorImageSelector: true,
    },

    // ─── Firebase Authentication ─────────────────────────
    FirebaseAuthentication: {
      providers: ['google.com'],
      skipNativeAuth: true,
    },
  },

  // ─── iOS Native Ayarları ──────────────────────────────
  ios: {
    allowsLinkPreview: false,             // Uzun basma link önizlemesini kapat (daha temiz UX)
    preferredContentMode: 'mobile',        // Mobil görünüm
    contentInset: 'never',                 // Safe area inset yönetimini web katmanına bırak
    scrollEnabled: true,                   // Scroll aktif
  },
};

export default config;
