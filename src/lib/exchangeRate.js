const CACHE_KEY = 'bayfatura_exchange_rates';
const CACHE_DURATION = 6 * 60 * 60 * 1000;
const API_BASE = 'https://api.frankfurter.dev';

let memoryCache = null;

async function fetchRates() {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
            memoryCache = data;
            return data;
        }
    }

    try {
        const res = await fetch(`${API_BASE}/latest?from=EUR`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rates = { ...json.rates, EUR: 1 };
        memoryCache = rates;
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: rates, timestamp: Date.now() }));
        return rates;
    } catch {
        if (memoryCache) return memoryCache;
        return { EUR: 1, USD: 1.08, TRY: 35.5, GBP: 0.85, CHF: 0.96 };
    }
}

export async function convertAmount(amount, from, to) {
    if (from === to || !amount) return amount;
    const rates = await fetchRates();
    const inEur = from === 'EUR' ? amount : amount / (rates[from] || 1);
    const result = to === 'EUR' ? inEur : inEur * (rates[to] || 1);
    return Math.round(result * 100) / 100;
}

export async function getRate(from, to) {
    if (from === to) return 1;
    const rates = await fetchRates();
    const inEur = 1 / (rates[from] || 1);
    return inEur * (rates[to] || 1);
}

export async function getSupportedCurrencies() {
    try {
        const res = await fetch(`${API_BASE}/currencies`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch {
        return { EUR: 'Euro', USD: 'US Dollar', TRY: 'Turkish Lira', GBP: 'British Pound', CHF: 'Swiss Franc' };
    }
}

export function formatCurrency(amount, currency, locale = 'de-DE') {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}
