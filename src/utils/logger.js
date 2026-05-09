const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4,
};

const currentLevel = import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;

function shouldLog(level) {
  return level >= currentLevel;
}

function formatMessage(module, message, data) {
  const parts = [`[${module}]`, message];
  if (data) parts.push(JSON.stringify(data));
  return parts.join(' ');
}

export const logger = {
  debug(module, message, data) {
    if (!shouldLog(LOG_LEVELS.DEBUG)) return;
    console.debug(formatMessage(module, message, data));
  },

  info(module, message, data) {
    if (!shouldLog(LOG_LEVELS.INFO)) return;
    console.info(formatMessage(module, message, data));
  },

  warn(module, message, data) {
    if (!shouldLog(LOG_LEVELS.WARN)) return;
    console.warn(formatMessage(module, message, data));
  },

  error(module, message, data) {
    if (!shouldLog(LOG_LEVELS.ERROR)) return;
    console.error(formatMessage(module, message, data));
  },

  flag(flagName, userId, result, context) {
    this.info('FeatureFlags', `Flag "${flagName}" = ${result}`, {
      userId: userId?.substring(0, 8),
      result,
      ...context,
    });
  },
};
