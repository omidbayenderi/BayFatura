import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const hasFirestoreEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const describeWithEmulator = hasFirestoreEmulator ? describe : describe.skip;

let testEnv;

describeWithEmulator('Firestore rules emulator', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'bayfatura-rules-test',
      firestore: {
        rules: fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv?.cleanup();
  });

  const authedDb = (uid, email = `${uid}@example.com`) =>
    testEnv.authenticatedContext(uid, { email }).firestore();

  const seed = async (callback) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await callback(context.firestore());
    });
  };

  test('users can read their own invoice but not another user invoice', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'invoices', 'owned'), { userId: 'user-a', invoiceNumber: 'A-1' });
      await setDoc(doc(db, 'invoices', 'foreign'), { userId: 'user-b', invoiceNumber: 'B-1' });
    });

    const db = authedDb('user-a');

    await assertSucceeds(getDoc(doc(db, 'invoices', 'owned')));
    await assertFails(getDoc(doc(db, 'invoices', 'foreign')));
  });

  test('users can create documents only for their own userId', async () => {
    const db = authedDb('user-a');

    await assertSucceeds(setDoc(doc(db, 'customers', 'own-customer'), {
      userId: 'user-a',
      name: 'Own Customer',
    }));

    await assertFails(setDoc(doc(db, 'customers', 'foreign-customer'), {
      userId: 'user-b',
      name: 'Foreign Customer',
    }));
  });

  test('users cannot escalate their own plan or role', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'users', 'user-a'), {
        name: 'User A',
        email: 'user-a@example.com',
        plan: 'standard',
        role: 'admin',
        tenantId: 'user-a',
      });
    });

    const db = authedDb('user-a', 'user-a@example.com');

    await assertSucceeds(updateDoc(doc(db, 'users', 'user-a'), {
      name: 'Updated User A',
    }));
    await assertFails(updateDoc(doc(db, 'users', 'user-a'), {
      plan: 'elite',
    }));
    await assertFails(updateDoc(doc(db, 'users', 'user-a'), {
      role: 'owner',
    }));
    await assertFails(updateDoc(doc(db, 'users', 'user-a'), {
      tenantId: 'user-b',
    }));
  });

  test('users cannot transfer business documents by changing userId', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'invoices', 'invoice-a'), {
        userId: 'user-a',
        invoiceNumber: 'A-1',
        status: 'draft',
      });
    });

    const db = authedDb('user-a');

    await assertSucceeds(updateDoc(doc(db, 'invoices', 'invoice-a'), {
      status: 'sent',
    }));
    await assertFails(updateDoc(doc(db, 'invoices', 'invoice-a'), {
      userId: 'user-b',
    }));
  });

  test('super admin can read protected business documents', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'expenses', 'expense-a'), { userId: 'user-a', amount: 42 });
    });

    const db = authedDb('admin-user', 'support@bayfatura.com');

    await assertSucceeds(getDoc(doc(db, 'expenses', 'expense-a')));
  });

  test('feature flag app config is readable by signed-in users and writable only by super admins', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'app_config', 'feature_flags'), { flags: {} });
    });

    const userDb = authedDb('user-a');
    const adminDb = authedDb('admin-user', 'support@bayfatura.com');

    await assertSucceeds(getDoc(doc(userDb, 'app_config', 'feature_flags')));
    await assertFails(updateDoc(doc(userDb, 'app_config', 'feature_flags'), { flags: { test: true } }));
    await assertSucceeds(updateDoc(doc(adminDb, 'app_config', 'feature_flags'), { flags: { test: true } }));
  });

  test('company config can be read by joined team members but not arbitrary users', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'company_config', 'owner-a'), {
        featureOverrides: { mobile_card_layout: true },
      });
      await setDoc(doc(db, 'users', 'member-a', 'myTeams', 'owner-a'), {
        tenantId: 'owner-a',
        role: 'member',
      });
    });

    await assertSucceeds(getDoc(doc(authedDb('owner-a'), 'company_config', 'owner-a')));
    await assertSucceeds(getDoc(doc(authedDb('member-a'), 'company_config', 'owner-a')));
    await assertFails(getDoc(doc(authedDb('stranger'), 'company_config', 'owner-a')));
  });

  test('myTeams is readable by the owner user but client writes are denied', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'users', 'member-a', 'myTeams', 'owner-a'), {
        tenantId: 'owner-a',
        role: 'member',
      });
    });

    const db = authedDb('member-a');

    await assertSucceeds(getDoc(doc(db, 'users', 'member-a', 'myTeams', 'owner-a')));
    await assertFails(setDoc(doc(db, 'users', 'member-a', 'myTeams', 'owner-b'), {
      tenantId: 'owner-b',
      role: 'member',
    }));
    await assertFails(deleteDoc(doc(db, 'users', 'member-a', 'myTeams', 'owner-a')));
  });
});

if (!hasFirestoreEmulator) {
  describe('Firestore rules emulator', () => {
    test('skips when FIRESTORE_EMULATOR_HOST is not set', () => {
      expect(hasFirestoreEmulator).toBe(false);
    });
  });
}
