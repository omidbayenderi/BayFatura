/**
 * BayFatura — Magic Bank Matcher Engine
 * 
 * Banka ekstresini parse eder ve açık faturalarla akıllıca eşleştirir.
 * Desteklenen formatlar: CSV (IBAN, MT940-benzeri), kopyala-yapıştır metin
 * 
 * Eşleştirme algoritması:
 *   1. Tutar tam eşleşmesi (±0.01 tolerans)
 *   2. Fatura numarası referans alanında aranır
 *   3. Müşteri adı fuzzy eşleştirmesi (levenshtein benzeri)
 *   4. Skor tabanlı ranking (en iyi eşleşme önce)
 */

// ─── CSV / Metin Parser ───────────────────────────────────────────────────────

/**
 * Raw banka ekstresini satır satır parse eder.
 * Yaygın Alman banka CSV formatlarını (Deutsche Bank, Sparkasse, ING, N26) destekler.
 */
export const parseBankCSV = (text) => {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const transactions = [];

    // Farklı delimiter'ları dene
    const detectDelimiter = (line) => {
        if ((line.match(/;/g) || []).length > 2) return ';';
        if ((line.match(/,/g) || []).length > 2) return ',';
        if ((line.match(/\t/g) || []).length > 2) return '\t';
        return ';';
    };

    const delimiter = detectDelimiter(lines[0] || '');

    // Başlık satırını bul
    let dataStart = 0;
    for (let i = 0; i < Math.min(lines.length, 8); i++) {
        const lower = lines[i].toLowerCase();
        if (lower.includes('betrag') || lower.includes('amount') ||
            lower.includes('umsatz') || lower.includes('buchung') ||
            lower.includes('datum') || lower.includes('date')) {
            dataStart = i + 1;
            break;
        }
    }

    for (let i = dataStart; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
        if (cols.length < 3) continue;

        // Tutarı bul (negatif = çıkış, pozitif = giriş)
        let amount = null;
        let amountStr = '';
        for (const col of cols) {
            const cleaned = col.replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-+]/g, '');
            const num = parseFloat(cleaned);
            if (!isNaN(num) && Math.abs(num) > 0.01 && Math.abs(num) < 1000000) {
                amount = num;
                amountStr = col;
                break;
            }
        }
        if (amount === null) continue;

        // Tarihi bul
        let date = '';
        for (const col of cols) {
            if (/\d{2}[.\-/]\d{2}[.\-/]\d{2,4}/.test(col) || /\d{4}-\d{2}-\d{2}/.test(col)) {
                date = col;
                break;
            }
        }

        // Referans / Verwendungszweck (en uzun kolon genellikle açıklamadır)
        const reference = cols.reduce((a, b) => b.length > a.length ? b : a, '');

        if (Math.abs(amount) > 0) {
            transactions.push({
                id: `txn_${i}`,
                date,
                amount: Math.abs(amount),
                isCredit: amount > 0,
                reference,
                raw: cols.join(' | '),
                matched: false,
                matchedInvoiceId: null,
                matchScore: 0,
            });
        }
    }

    return transactions;
};

// ─── Fuzzy String Matching ────────────────────────────────────────────────────

/**
 * Basit fuzzy match skoru (0-1 arası)
 * İki string arasındaki benzerliği ölçer
 */
const fuzzyScore = (a, b) => {
    if (!a || !b) return 0;
    const s1 = a.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = b.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Ortak karakter sayısı / max uzunluk
    let common = 0;
    const shorter = s1.length < s2.length ? s1 : s2;
    const longer = s1.length < s2.length ? s2 : s1;
    for (const ch of shorter) {
        if (longer.includes(ch)) common++;
    }
    return common / Math.max(s1.length, s2.length, 1);
};

// ─── Core Matcher ─────────────────────────────────────────────────────────────

/**
 * Her banka işlemi için en iyi fatura eşleşmesini bulur
 * 
 * @param {Object[]} transactions - parse edilmiş banka işlemleri
 * @param {Object[]} invoices - açık faturalar
 * @returns {Object[]} suggestions - { transaction, invoice, score, reason }
 */
export const matchTransactionsToInvoices = (transactions, invoices) => {
    // Sadece ödenmemiş faturaları dikkate al
    const openInvoices = invoices.filter(inv =>
        inv.status !== 'paid' && inv.status !== 'draft' && inv.total > 0
    );

    const suggestions = [];

    for (const txn of transactions) {
        if (!txn.isCredit) continue; // Sadece gelen ödemeleri eşleştir

        let bestScore = 0;
        let bestInvoice = null;
        let bestReason = '';

        for (const inv of openInvoices) {
            let score = 0;
            const reasons = [];

            // 1. Tutar eşleşmesi (en önemli kriter — %60 ağırlık)
            const amountDiff = Math.abs(txn.amount - (inv.total || 0));
            if (amountDiff < 0.02) {
                score += 60;
                reasons.push('✓ Tutar tam eşleşti');
            } else if (amountDiff / inv.total < 0.01) {
                score += 40;
                reasons.push('~ Tutar yakın (%1)');
            } else if (amountDiff / inv.total < 0.05) {
                score += 15;
                reasons.push('~ Tutar yaklaşık (%5)');
            }

            // 2. Fatura numarası referansta var mı? (%25 ağırlık)
            if (inv.invoiceNumber) {
                const invNumClean = inv.invoiceNumber.replace(/[^a-z0-9]/gi, '').toLowerCase();
                const refClean = txn.reference.replace(/[^a-z0-9]/gi, '').toLowerCase();
                if (refClean.includes(invNumClean)) {
                    score += 25;
                    reasons.push(`✓ Fatura no. referansta: ${inv.invoiceNumber}`);
                }
            }

            // 3. Müşteri adı fuzzy eşleşmesi (%15 ağırlık)
            const nameScore = fuzzyScore(inv.recipientName, txn.reference);
            if (nameScore > 0.7) {
                score += Math.round(nameScore * 15);
                reasons.push(`✓ Müşteri adı eşleşti: ${inv.recipientName}`);
            } else if (nameScore > 0.4) {
                score += Math.round(nameScore * 8);
                reasons.push(`~ Müşteri adı benzer`);
            }

            if (score > bestScore) {
                bestScore = score;
                bestInvoice = inv;
                bestReason = reasons.join(', ');
            }
        }

        if (bestInvoice && bestScore >= 30) {
            suggestions.push({
                transaction: txn,
                invoice: bestInvoice,
                score: bestScore,
                confidence: bestScore >= 80 ? 'high' : bestScore >= 50 ? 'medium' : 'low',
                reason: bestReason,
            });
        }
    }

    // Skora göre sırala (azalan)
    return suggestions.sort((a, b) => b.score - a.score);
};

/**
 * Eşleşme güven seviyesine göre renk
 */
export const confidenceColor = (confidence) => ({
    high: '#10b981',
    medium: '#f59e0b',
    low: '#ef4444',
}[confidence] || '#94a3b8');

/**
 * Eşleşme güven seviyesine göre etiket
 */
export const confidenceLabel = (confidence, t) => ({
    high: t('matchHigh'),
    medium: t('matchMedium'),
    low: t('matchLow'),
}[confidence] || '—');
