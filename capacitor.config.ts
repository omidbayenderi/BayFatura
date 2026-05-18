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
      backgroundColor: '#6366f1',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },

    // ─── Status Bar ───────────────────────────────────────
    StatusBar: {
      style: 'Dark',                // Açık arka plan → koyu ikonlar
      backgroundColor: '#6366f1',
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
      providers: ['google.com', 'apple.com'],
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
