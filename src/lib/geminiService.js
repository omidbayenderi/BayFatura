/**
 * Gemini AI Scanner Service for BayFatura
 * Uses Gemini 1.5 Flash for high-speed OCR extraction
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Gemini calls are now securely handled by Firebase Cloud Functions.

export const scanReceipt = async (base64Image) => {
  try {
    const base64Data = base64Image.split(',')[1] || base64Image;
    const mimeMatch = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const scanReceiptFn = httpsCallable(functions, 'scanReceipt');
    const result = await scanReceiptFn({
        base64Image: base64Data,
        mimeType: mimeType
    });

    return result.data.receiptData;
  } catch (error) {
    console.error("Cloud Function Scan Error:", error);
    throw error;
  }
};

export const analyzeFinancials = async (historyData) => {
    try {
        const analyzeFinancialsFn = httpsCallable(functions, 'analyzeFinancials');
        const result = await analyzeFinancialsFn({ historyData });
        return result.data.analysis;
    } catch (error) {
        console.error("Cloud Function Analysis Error:", error);
        throw error;
    }
};
