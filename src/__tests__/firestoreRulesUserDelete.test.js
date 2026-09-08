import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';

const rules = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');

// Extract the users/{userId} match block (up to the next top-level match)
const getUsersBlock = () => {
    const start = rules.indexOf('match /users/{userId}');
    const end = rules.indexOf('\n    match /', start + 1);
    return rules.slice(start, end > start ? end : start + 600);
};

// ── Firestore rules: user self-delete ──────────────────────────────────────
describe('Firestore rules — user self-delete (GDPR Art. 17)', () => {
    test('users/{userId} delete rule exists', () => {
        const block = getUsersBlock();
        expect(block).toContain('allow delete');
    });

    test('users/{userId} delete rule allows owner (request.auth.uid == userId)', () => {
        const block = getUsersBlock();
        // The fix: allow delete: if isAuthenticated() && (request.auth.uid == userId || isSuperAdmin())
        expect(block).toMatch(/allow delete:.*request\.auth\.uid == userId/);
    });

    test('users/{userId} delete is not restricted to super admin only', () => {
        const block = getUsersBlock();
        // Must NOT be the old broken pattern: allow delete: if isAuthenticated() && isSuperAdmin();
        expect(block).not.toMatch(/allow delete: if isAuthenticated\(\) && isSuperAdmin\(\);/);
    });
});

// ── Firestore rules: cascade collections keep owner-delete ─────────────────
describe('Firestore rules — tenant collections allow owner delete', () => {
    const tenantCollections = ['invoices', 'quotes', 'expenses', 'customers', 'products'];

    tenantCollections.forEach(col => {
        test(`${col} allows owner to delete their own docs`, () => {
            // Find the match block by scanning lines
            const lines = rules.split('\n');
            const startLine = lines.findIndex(l => l.includes(`match /${col}/{docId}`));
            expect(startLine).toBeGreaterThan(-1);
            // Collect lines until the closing `}` at the same indentation level
            let depth = 0, blockLines = [];
            for (let i = startLine; i < lines.length; i++) {
                const l = lines[i];
                blockLines.push(l);
                // Count only standalone braces (not inside strings or Firestore paths)
                for (const ch of l) {
                    if (ch === '{') depth++;
                    else if (ch === '}') depth--;
                }
                if (i > startLine && depth <= 0) break;
            }
            const block = blockLines.join('\n');
            expect(block).toContain('allow delete');
            const hasOwnerCheck = block.includes('userId') || block.includes('request.auth.uid');
            expect(hasOwnerCheck).toBe(true);
        });
    });
});
