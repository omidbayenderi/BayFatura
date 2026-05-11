import { FLAG_DEFAULTS, hasKillSwitch } from './definitions.js';

export function evaluateFlag({
  flagName,
  remoteOverrides = {},
  companyOverrides = {},
  user = null,
  platform = 'web',
  locale = 'en',
  country = '',
}) {
  if (!flagName || !FLAG_DEFAULTS[flagName]) return false;

  const definition = FLAG_DEFAULTS[flagName];

  // Platform check: flag only applies to certain platforms
  if (definition.platform && !definition.platform.includes(platform)) {
    return false;
  }

  // Kill switch: remote kill takes precedence over everything
  if (remoteOverrides[flagName]?.killSwitch === true) {
    return false;
  }
  if (hasKillSwitch(flagName) && companyOverrides[flagName]?.disabled === true) {
    return false;
  }

  // Company-level override (most specific)
  if (companyOverrides[flagName] !== undefined) {
    return Boolean(companyOverrides[flagName]);
  }

  const remote = remoteOverrides[flagName] || {};

  // ===== USER TARGETING =====
  // If any targeting list is specified, user must match at least one.
  // "allowedEmails" and "allowedUserIds" are explicit allowlists.
  // If none are specified, skip targeting checks.

  let hasTargeting = false;
  let userMatches = false;

  // allowedEmails: exact email match
  if (remote.allowedEmails) {
    hasTargeting = true;
    if (Array.isArray(remote.allowedEmails) && remote.allowedEmails.length > 0) {
      if (user?.email && remote.allowedEmails.includes(user.email)) {
        userMatches = true;
      }
    }
  }

  // allowedUserIds: exact uid match
  if (remote.allowedUserIds) {
    hasTargeting = true;
    if (Array.isArray(remote.allowedUserIds) && remote.allowedUserIds.length > 0) {
      if (user?.uid && remote.allowedUserIds.includes(user.uid)) {
        userMatches = true;
      }
    }
  }

  // betaTesters: backward-compatible alias for allowedEmails
  if (remote.betaTesters) {
    hasTargeting = true;
    if (Array.isArray(remote.betaTesters) && remote.betaTesters.length > 0) {
      if (user?.email && remote.betaTesters.includes(user.email)) {
        userMatches = true;
      }
    }
  }

  // If targeting was specified but user doesn't match, deny
  if (hasTargeting && !userMatches) {
    return false;
  }

  // Locale/Country targeting
  if (remote.locales) {
    if (Array.isArray(remote.locales) && remote.locales.length > 0) {
      if (!locale || !remote.locales.includes(locale)) {
        return false;
      }
    }
  }

  if (remote.countries) {
    if (Array.isArray(remote.countries) && remote.countries.length > 0) {
      if (!country || !remote.countries.includes(country)) {
        return false;
      }
    }
  }

  // Percentage rollout
  if (remote.rolloutPercentage !== undefined && user) {
    if (remote.rolloutPercentage >= 100) return true;
    if (remote.rolloutPercentage <= 0) return false;
    const userHash = simpleHash(user.uid || user.email || '');
    return userHash % 100 < remote.rolloutPercentage;
  }

  // Remote global override
  if (remote.enabled !== undefined) {
    return Boolean(remote.enabled);
  }

  // Default from local definition
  return definition.enabled;
}

function simpleHash(str) {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
