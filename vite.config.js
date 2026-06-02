import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const firebaseEnvKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID',
    'VITE_FIREBASE_APP_CHECK_KEY',
    'VITE_APP_ENV',
  ];

  const define = mode === 'preview'
    ? Object.fromEntries(
      firebaseEnvKeys.map((key) => [
        `import.meta.env.${key}`,
        JSON.stringify(env[key] || ''),
      ])
    )
    : {};

  return {
    plugins: [react()],
    // Change base to '/' for Firebase Hosting
    base: '/',
    define,
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            ui: ['lucide-react', 'recharts', 'html2canvas', 'jspdf']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  };
})
