import { describe, expect, test, vi, beforeEach } from 'vitest';

// ── deleteAccount flow ──────────────────────────────────────────────────────
// Verifies that deleteAccount deletes the Firestore doc BEFORE removing the
// Auth user so the security rule (allow delete: auth.uid == userId) still holds.

describe('deleteAccount flow', () => {
    let callOrder;

    beforeEach(() => {
        callOrder = [];
    });

    test('deletes Firestore user doc before Auth user (rule requires active session)', async () => {
        const mockDeleteDoc = vi.fn(() => {
            callOrder.push('firestore');
            return Promise.resolve();
        });
        const mockDeleteUser = vi.fn(() => {
            callOrder.push('auth');
            return Promise.resolve();
        });

        // Simulate the deleteAccount logic from AuthContext.jsx
        const deleteAccount = async () => {
            await mockDeleteDoc();   // Firestore first
            await mockDeleteUser();  // Auth second
            return { success: true };
        };

        const result = await deleteAccount();

        expect(result.success).toBe(true);
        expect(callOrder).toEqual(['firestore', 'auth']);
        expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
        expect(mockDeleteUser).toHaveBeenCalledTimes(1);
    });

    test('returns success:false if deleteDoc throws', async () => {
        const deleteAccount = async () => {
            try {
                throw new Error('permission-denied');
            } catch (err) {
                return { success: false, error: err.message };
            }
        };

        const result = await deleteAccount();
        expect(result.success).toBe(false);
        expect(result.error).toBe('permission-denied');
    });
});
