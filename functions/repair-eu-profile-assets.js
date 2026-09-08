/**
 * Repair EU profile assets/settings after default → bayfatura-eu migration.
 *
 * Copies missing profile/customization fields from the default DB to bayfatura-eu.
 * By default it does not overwrite non-empty target values.
 *
 * Usage:
 *   node functions/repair-eu-profile-assets.js --dry-run
 *   node functions/repair-eu-profile-assets.js
 *   node functions/repair-eu-profile-assets.js --uid=USER_UID
 *   node functions/repair-eu-profile-assets.js --overwrite
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const EU_COUNTRIES = new Set([
    'DE','AT','CH','FR','ES','PT','NL','BE','IT','SE','NO','DK','FI',
    'PL','CZ','SK','HU','RO','BG','HR','SI','EE','LV','LT','LU',
    'IE','GR','CY','MT','IS','LI',
]);

const PROFILE_FIELDS = [
    'name', 'companyName', 'owner', 'companyEmail', 'companyPhone', 'website',
    'taxId', 'vatId', 'street', 'houseNum', 'zip', 'city', 'country',
    'bankName', 'iban', 'bic', 'logo', 'signatureUrl', 'stampUrl',
    'paymentTerms', 'industry', 'logoDisplayMode', 'defaultCurrency', 'defaultTaxRate',
    'paypalMe', 'stripeLink', 'kleinunternehmer', 'kleinunternehmerText',
    'atValidationCode', 'ptQrEnabled', 'ptDocType', 'invoiceSeries',
];

const CUSTOMIZATION_FIELDS = [
    'primaryColor', 'secondaryColor', 'accentColor', 'fontFamily', 'template',
    'showLogo', 'showTax', 'showTotalInWords', 'notes', 'quoteValidityDays',
    'brandPalette', 'expenseCategories',
];

const isDryRun = process.argv.includes('--dry-run');
const overwrite = process.argv.includes('--overwrite');
const singleUid = process.argv.find((arg) => arg.startsWith('--uid='))?.split('=')[1];

const app = initializeApp({ projectId: 'bayfatura-b283c' });
const sourceDb = getFirestore(app, '(default)');
const targetDb = getFirestore(app, 'bayfatura-eu');

const hasValue = (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
};

const pickRepairFields = (source, target, fields) => {
    const patch = {};
    for (const field of fields) {
        if (!hasValue(source[field])) continue;
        if (!overwrite && hasValue(target[field])) continue;
        patch[field] = source[field];
    }
    return patch;
};

const summarize = (patch) => Object.keys(patch).join(', ') || 'none';

async function repairUser(uid, sourceUser) {
    const targetUserRef = targetDb.collection('users').doc(uid);
    const targetUserSnap = await targetUserRef.get();
    const targetUser = targetUserSnap.exists ? targetUserSnap.data() : {};

    const profilePatch = pickRepairFields(sourceUser, targetUser, PROFILE_FIELDS);

    const sourceCustomSnap = await sourceDb.collection('customizations').doc(uid).get();
    const targetCustomRef = targetDb.collection('customizations').doc(uid);
    const targetCustomSnap = await targetCustomRef.get();
    const customizationPatch = sourceCustomSnap.exists
        ? pickRepairFields(sourceCustomSnap.data(), targetCustomSnap.exists ? targetCustomSnap.data() : {}, CUSTOMIZATION_FIELDS)
        : {};

    console.log(`\n▶ ${uid} — ${sourceUser.email || sourceUser.name || 'unknown'}`);
    console.log(`  profile fields: ${summarize(profilePatch)}`);
    console.log(`  customization fields: ${summarize(customizationPatch)}`);

    if (isDryRun) return { profile: Object.keys(profilePatch).length, customization: Object.keys(customizationPatch).length };

    if (Object.keys(profilePatch).length > 0) {
        await targetUserRef.set({
            ...profilePatch,
            _db: 'bayfatura-eu',
            _profileAssetsRepairedAt: new Date().toISOString(),
        }, { merge: true });
    }

    if (Object.keys(customizationPatch).length > 0) {
        await targetCustomRef.set({
            ...customizationPatch,
            _profileAssetsRepairedAt: new Date().toISOString(),
        }, { merge: true });
    }

    return { profile: Object.keys(profilePatch).length, customization: Object.keys(customizationPatch).length };
}

async function main() {
    console.log('\nBayFatura — EU profile asset repair');
    console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE WRITE'}${overwrite ? ' + overwrite' : ''}`);
    if (singleUid) console.log(`Scope: ${singleUid}`);
    console.log('─'.repeat(60));

    const usersSnap = singleUid
        ? await sourceDb.collection('users').where('__name__', '==', singleUid).get()
        : await sourceDb.collection('users').get();

    const users = usersSnap.docs.filter((doc) => {
        const data = doc.data();
        const country = data.country || data.companyCountry || '';
        return EU_COUNTRIES.has(String(country).toUpperCase());
    });

    let profileFields = 0;
    let customizationFields = 0;

    for (const userDoc of users) {
        const result = await repairUser(userDoc.id, userDoc.data());
        profileFields += result.profile;
        customizationFields += result.customization;
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`Users checked: ${users.length}`);
    console.log(`Profile fields ${isDryRun ? 'to repair' : 'repaired'}: ${profileFields}`);
    console.log(`Customization fields ${isDryRun ? 'to repair' : 'repaired'}: ${customizationFields}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
