import { recordError } from './nativeCrashlytics';

const LOG_PREFIX = '[BayFatura]';

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };
const currentLevel = LOG_LEVELS[import.meta.env.VITE_LOG_LEVEL] ?? (import.meta.env.DEV ? LOG_LEVELS.debug : LOG_LEVELS.warn);

function formatError(err) {
    if (err instanceof Error) return { message: err.message, code: err.code || err.name, stack: import.meta.env.DEV ? err.stack : undefined };
    if (typeof err === 'object' && err !== null) return { message: err.message || JSON.stringify(err), code: err.code };
    return { message: String(err) };
}

export const logger = {
    debug(module, message, data) {
        if (currentLevel > LOG_LEVELS.debug) return;
        console.debug(`${LOG_PREFIX}[${module}]`, message, data || '');
    },
    info(module, message, data) {
        if (currentLevel > LOG_LEVELS.info) return;
        console.info(`${LOG_PREFIX}[${module}]`, message, data || '');
    },
    warn(module, message, data) {
        if (currentLevel > LOG_LEVELS.warn) return;
        console.warn(`${LOG_PREFIX}[${module}]`, message, data || '');
    },
    error(module, message, error) {
        if (currentLevel > LOG_LEVELS.error) return;
        const err = error ? formatError(error) : {};
        console.error(`${LOG_PREFIX}[${module}]`, message, err.code ? `(${err.code})` : '', err.message, err.stack || '');
        if (error && typeof window !== 'undefined') {
            recordError(error);
        }
    },
    userError(module, message) {
        this.error(module, message);
        return message;
    },
};

export function userFacingError(message, action = '') {
    return action ? `${message} ${action}` : message;
}
