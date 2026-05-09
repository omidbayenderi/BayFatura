import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

let cachedOverrides = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function loadRemoteOverrides() {
  if (!isFirebaseConfigured()) return {};

  if (cachedOverrides && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedOverrides;
  }

  try {
    const configRef = doc(db, 'app_config', 'feature_flags');
    const configSnap = await getDoc(configRef);

    if (configSnap.exists()) {
      cachedOverrides = configSnap.data()?.flags || {};
      cacheTimestamp = Date.now();
      return cachedOverrides;
    }

    return {};
  } catch (err) {
    console.warn('[FeatureFlags] Failed to load remote config:', err);
    return {};
  }
}

export async function loadCompanyOverrides(tenantId) {
  if (!tenantId || !isFirebaseConfigured()) return {};

  try {
    const companyRef = doc(db, 'company_config', tenantId);
    const companySnap = await getDoc(companyRef);

    if (companySnap.exists()) {
      return companySnap.data()?.featureOverrides || {};
    }

    return {};
  } catch (err) {
    console.warn('[FeatureFlags] Failed to load company config:', err);
    return {};
  }
}

export function clearCache() {
  cachedOverrides = null;
  cacheTimestamp = 0;
}
