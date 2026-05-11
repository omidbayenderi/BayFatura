export const FLAG_DEFAULTS = {
  mobile_card_layout: {
    enabled: false,
    type: 'beta',
    description: 'Convert table rows to card layout on mobile devices',
    killSwitch: false,
    platform: ['web', 'native'],
  },
  optimized_invoice_list: {
    enabled: false,
    type: 'beta',
    description: 'Use paginated/virtualized invoice list for better performance',
    killSwitch: false,
    platform: ['web', 'native'],
  },
  virtualized_customer_list: {
    enabled: false,
    type: 'beta',
    description: 'Virtualize customer list for smoother scrolling with many customers',
    killSwitch: false,
    platform: ['web', 'native'],
  },
  new_dashboard_metrics: {
    enabled: false,
    type: 'beta',
    description: 'Show enhanced dashboard metrics and charts',
    killSwitch: false,
    platform: ['web'],
  },
  beta_invoice_editor: {
    enabled: false,
    type: 'beta',
    description: 'Use the new invoice editor with improved UX',
    killSwitch: true,
    platform: ['web'],
  },
  native_camera_receipts: {
    enabled: false,
    type: 'native',
    description: 'Use native camera for receipt scanning (Capacitor)',
    killSwitch: false,
    platform: ['native'],
  },
  native_push_notifications: {
    enabled: false,
    type: 'native',
    description: 'Use native push notifications (Capacitor)',
    killSwitch: false,
    platform: ['native'],
  },
};

export const FLAG_TYPES = {
  BETA: 'beta',
  STABLE: 'stable',
  NATIVE: 'native',
  INTERNAL: 'internal',
};

export const PLATFORMS = {
  WEB: 'web',
  NATIVE: 'native',
};

export const FLAG_NAMES = Object.keys(FLAG_DEFAULTS);

export function getFlagDefault(name) {
  if (!FLAG_DEFAULTS[name]) return false;
  return FLAG_DEFAULTS[name].enabled;
}

export function hasKillSwitch(name) {
  if (!FLAG_DEFAULTS[name]) return false;
  return !!FLAG_DEFAULTS[name].killSwitch;
}
