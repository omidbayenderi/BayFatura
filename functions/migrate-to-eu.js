/**
 * Firestore Migration: nam5 (default) → eur3 (bayfatura-eu)
 *
 * Migrates EU users and their data from the US database to the Frankfurt database.
 * EU users are identified by companyProfile.country being in EU_COUNTRIES.
 *
 * Usage:
 *   node migrate-to-eu.js --dry-run   (preview what would be migrated)
 *   node migrate-to-eu.js             (execute migration)
 *   node migrate-to-eu.js --uid=xxx   (migrate single user)
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const EU_COUNTRIES = new Set([
    'DE','AT','CH','FR','ES','PT','NL','BE','IT','SE','NO','DK','FI',
    'PL','CZ','SK','HU','RO','BG','HR','SI','EE','LV','LT','LU',
    'IE','GR','CY','MT','IS','LI',
]);

const TOP_COLLECTIONS = [
    'invoices','quotes','expenses','recurring_templates',
    'customers','products','customizations',
];

const SUBCOLLECTIONS = ['notifications','team'];

const isDryRun = process.argv.includes('--dry-run');
const singleUid = process.argv.find(a => a.startsWith('--uid='))?.split('=')[1];

// ── Init two DB connections ──────────────────────────────────────────────────

const app = initializeApp({ projectId: 'bayfatura-b283c' });

const sourceDb = getFirestore(app, '(default)');
const targetDb = getFirestore(app, 'bayfatura-eu');

// ── Helpers ──────────────────────────────────────────────────────────────────

const BATCH_SIZE = 400;

async function batchWrite(targetDb, docs) {
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = targetDb.batch();
        docs.slice(i, i + BATCH_SIZE).forEach(({ ref, data }) => {
            batch.set(ref, data, { merge: false });
        });
        await batch.commit();
    }
}

async function migrateCollection(col, userId) {
    const snap = await sourceDb.collection(col)
        .where('userId', '==', userId)
        .get();
    if (snap.empty) return 0;

    const docs = snap.docs.map(d => ({
        ref: targetDb.collection(col).doc(d.id),
        data: d.data(),
    }));

    if (!isDryRun) await batchWrite(targetDb, docs);
    return docs.length;
}

async function migrateSubcollection(userId, sub) {
    const snap = await sourceDb
        .collection('users').doc(userId)
        .collection(sub).get();
    if (snap.empty) return 0;

    const docs = snap.docs.map(d => ({
        ref: targetDb.collection('users').doc(userId).collection(sub).doc(d.id),
        data: d.data(),
    }));

    if (!isDryRun) await batchWrite(targetDb, docs);
    return docs.length;
}

async function migrateUser(uid, userData) {
    const log = (msg) => console.log(`  [${uid}] ${msg}`);
    let total = 0;

    // User doc
    if (!isDryRun) {
        await targetDb.collection('users').doc(uid).set({
            ...userData,
            _migratedAt: new Date().toISOString(),
            _sourceDb: 'nam5',
        });
    }
    log(`users doc → ${isDryRun ? '[DRY]' : 'written'}`);

    // Top-level collections
    for (const col of TOP_COLLECTIONS) {
        if (col === 'customizations') {
            // Single doc keyed by uid
            const snap = await sourceDb.collection('customizations').doc(uid).get();
            if (snap.exists) {
                if (!isDryRun) {
                    await targetDb.collection('customizations').doc(uid).set(snap.data());
                }
                log(`customizations → ${isDryRun ? '[DRY]' : 'written'}`);
                total++;
            }
        } else {
            const count = await migrateCollection(col, uid);
            if (count > 0) log(`${col}: ${count} docs → ${isDryRun ? '[DRY]' : 'written'}`);
            total += count;
        }
    }

    // Subcollections
    for (const sub of SUBCOLLECTIONS) {
        const count = await migrateSubcollection(uid, sub);
        if (count > 0) log(`users/${uid}/${sub}: ${count} docs → ${isDryRun ? '[DRY]' : 'written'}`);
        total += count;
    }

    return total;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n🌍 BayFatura — Firestore Migration: nam5 → eur3`);
    console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no writes)' : '✍️  LIVE MIGRATION'}`);
    if (singleUid) console.log(`Scope: single user ${singleUid}`);
    console.log('─'.repeat(60));

    // Fetch users
    let usersQuery = sourceDb.collection('users');
    const usersSnap = singleUid
        ? await usersQuery.where('__name__', '==', singleUid).get()
        : await usersQuery.get();

    const euUsers = usersSnap.docs.filter(d => {
        const country = d.data()?.country || d.data()?.companyCountry || '';
        return EU_COUNTRIES.has(country.toUpperCase());
    });

    console.log(`\nTotal users in source DB: ${usersSnap.size}`);
    console.log(`EU users to migrate: ${euUsers.length}`);
    console.log(`EU countries detected: ${[...new Set(euUsers.map(d => d.data()?.country || '?'))].join(', ')}\n`);

    if (euUsers.length === 0) {
        console.log('No EU users found. Nothing to migrate.');
        process.exit(0);
    }

    let migratedUsers = 0;
    let totalDocs = 0;
    const errors = [];

    for (const userDoc of euUsers) {
        const uid = userDoc.id;
        const userData = userDoc.data();
        const country = userData.country || userData.companyCountry || '?';
        console.log(`\n▶ ${uid} (${country} — ${userData.email || userData.name || 'unknown'})`);

        try {
            const count = await migrateUser(uid, userData);
            totalDocs += count;
            migratedUsers++;
        } catch (err) {
            console.error(`  ❌ Error: ${err.message}`);
            errors.push({ uid, error: err.message });
        }
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`✅ Migration ${isDryRun ? 'preview' : 'complete'}:`);
    console.log(`   Users: ${migratedUsers}/${euUsers.length}`);
    console.log(`   Docs:  ${totalDocs}`);
    if (errors.length > 0) {
        console.log(`   Errors: ${errors.length}`);
        errors.forEach(e => console.log(`     - ${e.uid}: ${e.error}`));
    }

    if (!isDryRun && migratedUsers > 0) {
        console.log('\n⚠️  NEXT STEP: Update firebase.js to route EU users to bayfatura-eu DB.');
        console.log('   Then mark users as migrated: users/{uid}._db = "eu"');
    }
}

main().catch(console.error);
