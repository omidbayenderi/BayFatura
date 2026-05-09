/**
 * BayFatura — Portugal Compliance Library
 * 
 * Implements mandatory Portuguese tax requirements:
 * - ATCUD (Código Único de Documento) — Decreto-Lei n.º 28/2019
 * - Portuguese AT QR Code — Portaria n.º 195/2020
 * - NIF validation (Número de Identificação Fiscal)
 * - IVA rates (Imposto sobre o Valor Acrescentado)
 * 
 * Reference: https://info.portaldasfinancas.gov.pt
 */

// ─── IVA Rates ─────────────────────────────────────────────────────────────────
export const IVA_RATES_PT = [
    { value: 23, label: 'IVA Normal (23%)', code: 'S' },
    { value: 13, label: 'IVA Intermédia (13%)', code: 'INT' },
    { value: 6, label: 'IVA Reduzida (6%)', code: 'R' },
    { value: 0, label: 'Isento (0%)', code: 'Z' },
];

// Standard EU VAT rates for other countries
export const VAT_RATES_EU = [
    { value: 19, label: 'MwSt Standard (19%)' },   // DE
    { value: 7, label: 'MwSt Ermäßigt (7%)' },     // DE
    { value: 23, label: 'IVA Normal (23%)' },       // PT
    { value: 20, label: 'TVA Standard (20%)' },     // FR
    { value: 10, label: 'IVA Reducido (10%)' },     // ES
    { value: 21, label: 'BTW Standard (21%)' },     // NL/BE
    { value: 0, label: 'Steuerbefreit (0%)' },
];

// ─── Document Type Codes ────────────────────────────────────────────────────────
export const PT_DOC_TYPES = {
    invoice: 'FT',    // Fatura
    quote: 'OR',      // Orçamento
    receipt: 'FR',    // Fatura-Recibo
    credit: 'NC',     // Nota de Crédito
    debit: 'ND',      // Nota de Débito
};

// ─── NIF Validation ─────────────────────────────────────────────────────────────
/**
 * Validates a Portuguese NIF (Número de Identificação Fiscal)
 * Rules: 9 digits, checksum validation
 * @param {string} nif 
 * @returns {{ valid: boolean, message: string }}
 */
export const validateNIF = (nif) => {
    if (!nif) return { valid: false, message: 'NIF obrigatório' };
    
    const cleaned = nif.replace(/\s/g, '');
    if (!/^\d{9}$/.test(cleaned)) {
        return { valid: false, message: 'NIF deve ter 9 dígitos' };
    }
    
    // First digit must be 1-9
    const firstDigit = parseInt(cleaned[0]);
    if (firstDigit === 0) {
        return { valid: false, message: 'NIF inválido' };
    }
    
    // Checksum validation
    let sum = 0;
    for (let i = 0; i < 8; i++) {
        sum += parseInt(cleaned[i]) * (9 - i);
    }
    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? 0 : 11 - remainder;
    
    if (checkDigit !== parseInt(cleaned[8])) {
        return { valid: false, message: 'NIF inválido (dígito de controlo)' };
    }
    
    return { valid: true, message: 'NIF válido' };
};

// ─── ATCUD Generation ───────────────────────────────────────────────────────────
/**
 * Generates ATCUD code for a Portuguese invoice
 * Format: ATCUD:{ValidationCode}-{SequentialNumber}
 * 
 * @param {string} atValidationCode - The code obtained from AT portal (per series)
 * @param {string|number} invoiceNumber - Invoice number or sequential number
 * @returns {string} ATCUD code
 */
export const generateATCUD = (atValidationCode, invoiceNumber) => {
    if (!atValidationCode) return null;
    
    // Extract sequential number from invoice number if it's a string like "2026-0042"
    let sequential = invoiceNumber;
    if (typeof invoiceNumber === 'string') {
        const match = invoiceNumber.match(/(\d+)$/);
        sequential = match ? parseInt(match[1]) : 1;
    }
    
    return `${atValidationCode}-${sequential}`;
};

// ─── Portuguese QR Code Data ─────────────────────────────────────────────────────
/**
 * Generates the data string for the mandatory Portuguese AT QR Code
 * Per Portaria n.º 195/2020, all invoices must include this QR code.
 * 
 * Field reference:
 * A = Seller NIF
 * B = Buyer NIF (or "CONSUMIDOR" for consumers)
 * C = Buyer country code
 * D = Document type (FT, OR, etc.)
 * E = Document status (N = Normal)
 * F = Document date (YYYYMMDD)
 * G = Unique document ID (DocType SeriesNumber/SequentialNumber)
 * H = ATCUD
 * I1-I8 = IVA breakdown by rate
 * N = Total IVA
 * O = Grand total (with IVA)
 * Q = First 4 chars of document hash (simplified)
 * R = Program certificate number (0 = not certified)
 * S = Program certificate subcode
 */
export const generatePTQRData = ({
    sellerNif,
    buyerNif,
    buyerCountry = 'PT',
    docType = 'FT',
    docDate,
    invoiceNumber,
    atcud,
    subtotal,
    tax,
    total,
    taxRate = 23,
    atValidationCode,
}) => {
    // Format date as YYYYMMDD
    const dateStr = docDate ? docDate.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    // Sequential number from invoice number
    const seqNum = (() => {
        if (!invoiceNumber) return '1';
        const match = String(invoiceNumber).match(/(\d+)$/);
        return match ? match[1] : '1';
    })();
    
    // Unique document ID: DocType/SeriesYear/SequentialNumber
    const year = docDate ? docDate.slice(0, 4) : new Date().getFullYear();
    const uniqueId = `${docType} ${year}/${seqNum}`;
    
    // ATCUD (use generated or fallback)
    const atcudValue = atcud || (atValidationCode ? `${atValidationCode}-${seqNum}` : '0');
    
    // Round values
    const subtotalRounded = parseFloat(subtotal || 0).toFixed(2);
    const taxRounded = parseFloat(tax || 0).toFixed(2);
    const totalRounded = parseFloat(total || 0).toFixed(2);
    
    // Build QR fields based on tax rate
    // I7 = normal rate (23%) taxable base, I8 = normal rate tax
    // I5 = intermediate rate (13%) taxable base, I6 = intermediate rate tax
    // I3 = reduced rate (6%) taxable base, I4 = reduced rate tax
    let ivaFields = '';
    if (taxRate === 23) {
        ivaFields = `*I1:PT*I7:${subtotalRounded}*I8:${taxRounded}`;
    } else if (taxRate === 13) {
        ivaFields = `*I1:PT*I5:${subtotalRounded}*I6:${taxRounded}`;
    } else if (taxRate === 6) {
        ivaFields = `*I1:PT*I3:${subtotalRounded}*I4:${taxRounded}`;
    } else {
        ivaFields = `*I1:PT*I2:${subtotalRounded}`; // Exempt
    }
    
    // Simplified hash (first 4 chars — real implementation needs RSA signing)
    const hashBase = `${dateStr}${totalRounded}${invoiceNumber || ''}`;
    const hashChars = btoa(hashBase).replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase();
    
    const qrData = [
        `A:${sellerNif || '999999990'}`,
        `B:${buyerNif || 'CONSUMIDOR'}`,
        `C:${buyerCountry}`,
        `D:${docType}`,
        `E:N`,
        `F:${dateStr}`,
        `G:${uniqueId}`,
        `H:${atcudValue}`,
        ivaFields.slice(1), // Remove leading *
        `N:${taxRounded}`,
        `O:${totalRounded}`,
        `Q:${hashChars}`,
        `R:0`,
    ].join('*');
    
    return qrData;
};

// ─── IVA Breakdown Calculator ────────────────────────────────────────────────────
/**
 * Calculates IVA breakdown when items have different tax rates
 * @param {Array} items - Invoice line items, each with optional taxRate
 * @param {number} defaultTaxRate - Default tax rate if item doesn't specify
 * @returns {Array} Breakdown by rate: [{rate, base, tax, total}]
 */
export const calculateIVABreakdown = (items, defaultTaxRate = 23) => {
    const breakdown = {};
    
    (items || []).forEach(item => {
        const rate = parseFloat(item.taxRate ?? defaultTaxRate);
        const lineTotal = parseFloat(item.price || 0) * parseFloat(item.quantity || 1);
        
        if (!breakdown[rate]) {
            breakdown[rate] = { rate, base: 0, tax: 0 };
        }
        breakdown[rate].base += lineTotal;
        breakdown[rate].tax += lineTotal * (rate / 100);
    });
    
    return Object.values(breakdown)
        .map(b => ({ ...b, base: parseFloat(b.base.toFixed(2)), tax: parseFloat(b.tax.toFixed(2)), total: parseFloat((b.base + b.tax).toFixed(2)) }))
        .sort((a, b) => b.rate - a.rate);
};

/**
 * Returns whether an invoice is Portuguese (to show PT-specific elements)
 */
export const isPortugueseInvoice = (companyProfile) => {
    return companyProfile?.country === 'PT' || companyProfile?.countryCode === 'PT';
};
