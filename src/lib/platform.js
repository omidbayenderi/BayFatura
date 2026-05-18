import { Capacitor } from '@capacitor/core';

let _isNative = null;

export function isNativePlatform() {
  if (_isNative !== null) return _isNative;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    _isNative = false;
    return false;
  }

  _isNative = Capacitor.isNativePlatform();
  return _isNative;
}

export function getPlatform() {
  if (typeof navigator === 'undefined') return 'server';

  if (isNativePlatform()) {
    return Capacitor.getPlatform();
  }

  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android-web';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios-web';
  return 'web';
}

export function resetPlatformCache() {
  _isNative = null;
}
