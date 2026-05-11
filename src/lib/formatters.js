const LOCALE_MAP = {
  tr: 'tr-TR',
  de: 'de-DE',
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  pt: 'pt-PT',
};

export function resolveLocale(appLanguage) {
  return LOCALE_MAP[appLanguage] || 'de-DE';
}

let cachedFormatters = {};

export function formatCurrency(amount, appLanguage = 'de', currency = 'EUR') {
  const locale = resolveLocale(appLanguage);
  const key = `${locale}|${currency}`;

  if (!cachedFormatters[key]) {
    cachedFormatters[key] = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    });
  }

  return cachedFormatters[key].format(amount || 0);
}

export function formatNumber(amount, appLanguage = 'de', options = {}) {
  const locale = resolveLocale(appLanguage);
  const key = `${locale}|${JSON.stringify(options)}`;

  if (!cachedFormatters[key]) {
    cachedFormatters[key] = new Intl.NumberFormat(locale, options);
  }

  return cachedFormatters[key].format(amount || 0);
}

export function formatDate(date, appLanguage = 'de', options = {}) {
  const locale = resolveLocale(appLanguage);
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(
    date instanceof Date ? date : new Date(date)
  );
}

export function clearFormatterCache() {
  cachedFormatters = {};
}
