import { describe, test, expect } from 'vitest';
import { FLAG_DEFAULTS, FLAG_NAMES, getFlagDefault, hasKillSwitch } from '../lib/featureFlags/definitions';
import { evaluateFlag } from '../lib/featureFlags/evaluate';

describe('Feature Flag Definitions', () => {
  test('all flags have required fields', () => {
    FLAG_NAMES.forEach((name) => {
      const def = FLAG_DEFAULTS[name];
      expect(def).toBeDefined();
      expect(typeof def.enabled).toBe('boolean');
      expect(typeof def.description).toBe('string');
      expect(Array.isArray(def.platform)).toBe(true);
    });
  });

  test('getFlagDefault returns correct default', () => {
    expect(getFlagDefault('mobile_card_layout')).toBe(false);
    expect(getFlagDefault('unknown_flag')).toBe(false);
  });

  test('hasKillSwitch identifies flags with kill switch', () => {
    expect(hasKillSwitch('beta_invoice_editor')).toBe(true);
    expect(hasKillSwitch('mobile_card_layout')).toBe(false);
  });
});

describe('Feature Flag Evaluation', () => {
  const user = { uid: 'test-uid-123', email: 'test@bayfatura.com', tenantId: 'tenant-1' };

  test('returns false for unknown flag', () => {
    expect(evaluateFlag({ flagName: 'unknown_flag' })).toBe(false);
  });

  test('returns default value when no overrides', () => {
    expect(evaluateFlag({ flagName: 'mobile_card_layout' })).toBe(false);
  });

  test('kill switch overrides everything', () => {
    expect(evaluateFlag({
      flagName: 'beta_invoice_editor',
      remoteOverrides: { beta_invoice_editor: { killSwitch: true } },
      user,
    })).toBe(false);
  });

  test('company override takes priority over remote', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: { mobile_card_layout: { enabled: false } },
      companyOverrides: { mobile_card_layout: true },
      user,
    })).toBe(true);
  });

  test('remote enabled override works', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: { mobile_card_layout: { enabled: true } },
      user,
    })).toBe(true);
  });

  test('percentage rollout includes user in range', () => {
    const result = evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: { mobile_card_layout: { rolloutPercentage: 100 } },
      user,
    });
    expect(result).toBe(true);
  });

  test('percentage rollout excludes user at 0%', () => {
    const result = evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: { mobile_card_layout: { rolloutPercentage: 0 } },
      user,
    });
    expect(result).toBe(false);
  });

  test('beta tester list includes user', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: { mobile_card_layout: { enabled: true, betaTesters: ['test@bayfatura.com'] } },
      user,
    })).toBe(true);
  });

  test('beta tester list excludes other users', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: { mobile_card_layout: { enabled: true, betaTesters: ['other@bayfatura.com'] } },
      user,
    })).toBe(false);
  });

  test('platform filter returns false for wrong platform', () => {
    expect(evaluateFlag({
      flagName: 'native_camera_receipts',
      platform: 'web',
      user,
    })).toBe(false);
  });

  test('platform filter returns default for correct platform', () => {
    expect(evaluateFlag({
      flagName: 'native_camera_receipts',
      platform: 'native',
      user,
    })).toBe(false); // default is false
  });

  test('locale targeting works', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: { mobile_card_layout: { enabled: true, locales: ['de'] } },
      locale: 'de',
      user,
    })).toBe(true);
  });

  test('locale targeting excludes non-matching', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: { mobile_card_layout: { enabled: true, locales: ['de'] } },
      locale: 'tr',
      user,
    })).toBe(false);
  });

  // ===== ALLOWED EMAILS =====
  test('allowedEmails includes user and enabled is true — returns true', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: {
        mobile_card_layout: { enabled: true, allowedEmails: ['test@bayfatura.com'] }
      },
      user,
    })).toBe(true);
  });

  test('allowedEmails includes other user — returns false', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: {
        mobile_card_layout: { enabled: true, allowedEmails: ['other@bayfatura.com'] }
      },
      user,
    })).toBe(false);
  });

  test('allowedEmails is empty array — returns false', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: {
        mobile_card_layout: { enabled: true, allowedEmails: [] }
      },
      user,
    })).toBe(false);
  });

  test('allowedEmails with enabled false — user matches but flag is off', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: {
        mobile_card_layout: { enabled: false, allowedEmails: ['test@bayfatura.com'] }
      },
      user,
    })).toBe(false);
  });

  // ===== ALLOWED USER IDs =====
  test('allowedUserIds includes user and enabled is true — returns true', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: {
        mobile_card_layout: { enabled: true, allowedUserIds: ['test-uid-123'] }
      },
      user,
    })).toBe(true);
  });

  test('allowedUserIds excludes user — returns false', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: {
        mobile_card_layout: { enabled: true, allowedUserIds: ['other-uid'] }
      },
      user,
    })).toBe(false);
  });

  // ===== ALLOWED EMAILS + ALLOWED USER IDs (combined) =====
  test('allowedEmails and allowedUserIds — user matches email — returns true', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: {
        mobile_card_layout: {
          enabled: true,
          allowedEmails: ['test@bayfatura.com'],
          allowedUserIds: ['other-uid']
        }
      },
      user,
    })).toBe(true);
  });

  test('allowedEmails and allowedUserIds — user matches uid — returns true', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: {
        mobile_card_layout: {
          enabled: true,
          allowedEmails: ['other@bayfatura.com'],
          allowedUserIds: ['test-uid-123']
        }
      },
      user,
    })).toBe(true);
  });

  test('allowedEmails and allowedUserIds — neither matches — returns false', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: {
        mobile_card_layout: {
          enabled: true,
          allowedEmails: ['other@bayfatura.com'],
          allowedUserIds: ['other-uid']
        }
      },
      user,
    })).toBe(false);
  });

  // ===== BETA TESTERS (backward compatible) =====
  test('betaTesters and allowedEmails both specified — email match on betaTesters — returns true', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: {
        mobile_card_layout: {
          enabled: true,
          allowedEmails: ['other@bayfatura.com'],
          betaTesters: ['test@bayfatura.com']
        }
      },
      user,
    })).toBe(true);
  });

  // ===== NO USER =====
  test('allowedEmails specified but no user — returns false', () => {
    expect(evaluateFlag({
      flagName: 'mobile_card_layout',
      remoteOverrides: {
        mobile_card_layout: { enabled: true, allowedEmails: ['test@bayfatura.com'] }
      },
      user: null,
    })).toBe(false);
  });
});
