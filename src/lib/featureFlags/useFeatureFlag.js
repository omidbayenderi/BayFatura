import { useState, useEffect, useCallback } from 'react';
import { loadRemoteOverrides, loadCompanyOverrides } from './config.js';
import { evaluateFlag } from './evaluate.js';

export function useFeatureFlag(flagName, options = {}) {
  const {
    user = null,
    platform = 'web',
    locale = 'en',
    country = '',
  } = options;

  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function evaluate() {
      setLoading(true);
      try {
        const [remoteOverrides, companyOverrides] = await Promise.all([
          loadRemoteOverrides(),
          user?.tenantId ? loadCompanyOverrides(user.tenantId) : Promise.resolve({}),
        ]);

        if (cancelled) return;

        const result = evaluateFlag({
          flagName,
          remoteOverrides,
          companyOverrides,
          user,
          platform,
          locale,
          country,
        });

        setEnabled(result);
      } catch (err) {
        console.warn(`[FeatureFlags] Error evaluating "${flagName}":`, err);
        if (!cancelled) setEnabled(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    evaluate();

    return () => { cancelled = true; };
  }, [flagName, user?.uid, user?.tenantId, user?.email, platform, locale, country]);

  const refresh = useCallback(async () => {
    const remoteOverrides = await loadRemoteOverrides();
    const companyOverrides = user?.tenantId ? await loadCompanyOverrides(user.tenantId) : {};
    const result = evaluateFlag({ flagName, remoteOverrides, companyOverrides, user, platform, locale, country });
    setEnabled(result);
  }, [flagName, user, platform, locale, country]);

  return { enabled, loading, refresh };
}
