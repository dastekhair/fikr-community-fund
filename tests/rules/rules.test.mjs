import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import fs from 'fs';

const PROJECT_ID = 'fikr-security-test';
const RULES_PATH = 'firestore.rules.proposed';

let testEnv;
let passedCount = 0;
let failedCount = 0;

async function runTest(testName, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    ${err.message || err}`);
    failedCount++;
  }
}

async function setup() {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  const rules = fs.readFileSync(RULES_PATH, 'utf8');

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules
    }
  });

  // Clear data and seed base users
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, 'members', 'admin-uid'), {
      name: 'Admin Member',
      role: 'Admin',
      isActive: true,
      email: 'admin@fikr.org'
    });

    await setDoc(doc(db, 'members', 'treasurer-uid'), {
      name: 'Treasurer Member',
      role: 'Treasurer',
      isActive: true,
      email: 'treasurer@fikr.org'
    });

    await setDoc(doc(db, 'members', 'member-uid'), {
      name: 'Regular Core Member',
      role: 'Core Member',
      isActive: true,
      email: 'member@fikr.org'
    });

    await setDoc(doc(db, 'members', 'inactive-uid'), {
      name: 'Inactive Member',
      role: 'Core Member',
      isActive: false,
      email: 'inactive@fikr.org'
    });
  });
}

async function main() {
  console.log('================================================================');
  console.log('FIRESTORE SECURITY RULES UNIT TESTS (LOCAL EMULATOR)');
  console.log('================================================================');
  console.log(`Rules file: ${RULES_PATH}`);
  console.log(`Emulator host: 127.0.0.1:8080`);
  console.log(`Project ID: ${PROJECT_ID}\n`);

  await setup();

  const anonDb = testEnv.unauthenticatedContext().firestore();
  const nonMemberDb = testEnv.authenticatedContext('unregistered-uid').firestore();
  const inactiveDb = testEnv.authenticatedContext('inactive-uid').firestore();
  const memberDb = testEnv.authenticatedContext('member-uid').firestore();
  const treasurerDb = testEnv.authenticatedContext('treasurer-uid').firestore();
  const adminDb = testEnv.authenticatedContext('admin-uid').firestore();

  // -------------------------------------------------------------------------
  console.log('\n--- 1. MEMBERS COLLECTION ---');
  // -------------------------------------------------------------------------

  await runTest('Anonymous visitor can read members list', async () => {
    await assertSucceeds(getDoc(doc(anonDb, 'members', 'treasurer-uid')));
  });

  await runTest('Anonymous visitor CANNOT write to members collection', async () => {
    await assertFails(setDoc(doc(anonDb, 'members', 'anon-doc'), { name: 'Hacker', role: 'Admin', isActive: true }));
  });

  await runTest('Signed-in non-member CANNOT create members doc with role: Admin', async () => {
    await assertFails(setDoc(doc(nonMemberDb, 'members', 'unregistered-uid'), {
      name: 'Self Admin',
      role: 'Admin',
      isActive: false
    }));
  });

  await runTest('Signed-in non-member CANNOT create members doc with isActive: true', async () => {
    await assertFails(setDoc(doc(nonMemberDb, 'members', 'unregistered-uid'), {
      name: 'Self Active',
      role: 'Core Member',
      isActive: true
    }));
  });

  await runTest('Signed-in non-member CAN create own members doc with role: Core Member and isActive: false', async () => {
    await assertSucceeds(setDoc(doc(nonMemberDb, 'members', 'unregistered-uid'), {
      name: 'New Core Member',
      role: 'Core Member',
      isActive: false,
      email: 'newuser@fikr.org'
    }));
  });

  await runTest('User CANNOT create members doc for someone else (UID mismatch)', async () => {
    const otherUserDb = testEnv.authenticatedContext('other-user-uid').firestore();
    await assertFails(setDoc(doc(otherUserDb, 'members', 'victim-uid'), {
      role: 'Core Member',
      isActive: false
    }));
  });

  await runTest('Member self-update: changing name, notes, role, or isActive is DENIED', async () => {
    await assertFails(updateDoc(doc(memberDb, 'members', 'member-uid'), { role: 'Admin' }));
    await assertFails(updateDoc(doc(memberDb, 'members', 'member-uid'), { isActive: false }));
    await assertFails(updateDoc(doc(memberDb, 'members', 'member-uid'), { name: 'Renamed Member' }));
    await assertFails(updateDoc(doc(memberDb, 'members', 'member-uid'), { notes: 'Privileged note' }));
  });

  await runTest('Member self-update: updating email ONLY is ALLOWED', async () => {
    await assertSucceeds(updateDoc(doc(memberDb, 'members', 'member-uid'), {
      email: 'updated-member@fikr.org'
    }));
  });

  await runTest('Member deleting own document is DENIED', async () => {
    await assertFails(deleteDoc(doc(memberDb, 'members', 'member-uid')));
  });

  await runTest('Admin can create any member document with any role/isActive', async () => {
    await assertSucceeds(setDoc(doc(adminDb, 'members', 'new-admin-provisioned'), {
      name: 'Provisioned Officer',
      role: 'Treasurer',
      isActive: true,
      email: 'officer@fikr.org'
    }));
  });

  await runTest('Admin can update any member fields (role, isActive, notes)', async () => {
    await assertSucceeds(updateDoc(doc(adminDb, 'members', 'new-admin-provisioned'), {
      role: 'Admin',
      notes: 'Promoted by lead admin'
    }));
  });

  await runTest('Admin can delete member document', async () => {
    await assertSucceeds(deleteDoc(doc(adminDb, 'members', 'new-admin-provisioned')));
  });

  // -------------------------------------------------------------------------
  console.log('\n--- 2. WITHDRAWALS COLLECTION ---');
  // -------------------------------------------------------------------------

  await runTest('Public read: unauthenticated/anonymous user can read withdrawals', async () => {
    await assertSucceeds(getDoc(doc(anonDb, 'withdrawals', 'non-existent-w1')));
  });

  await runTest('Withdrawal create by anonymous or non-member is DENIED', async () => {
    await assertFails(setDoc(doc(anonDb, 'withdrawals', 'w-anon'), {
      amount: 500,
      timestamp: serverTimestamp(),
      recordedById: 'anon'
    }));
    await assertFails(setDoc(doc(nonMemberDb, 'withdrawals', 'w-nonmember'), {
      amount: 500,
      timestamp: serverTimestamp(),
      recordedById: 'unregistered-uid'
    }));
  });

  await runTest('Withdrawal create by inactive member is DENIED', async () => {
    await assertFails(setDoc(doc(inactiveDb, 'withdrawals', 'w-inactive'), {
      amount: 500,
      timestamp: serverTimestamp(),
      recordedById: 'inactive-uid'
    }));
  });

  await runTest('Withdrawal create with amount not a number is DENIED', async () => {
    await assertFails(setDoc(doc(memberDb, 'withdrawals', 'w-bad-amount-string'), {
      amount: '500',
      timestamp: serverTimestamp(),
      recordedById: 'member-uid'
    }));
  });

  await runTest('Withdrawal create with amount <= 0 is DENIED', async () => {
    await assertFails(setDoc(doc(memberDb, 'withdrawals', 'w-amount-zero'), {
      amount: 0,
      timestamp: serverTimestamp(),
      recordedById: 'member-uid'
    }));
    await assertFails(setDoc(doc(memberDb, 'withdrawals', 'w-amount-neg'), {
      amount: -100,
      timestamp: serverTimestamp(),
      recordedById: 'member-uid'
    }));
  });

  await runTest('Withdrawal create with amount > 1,000,000 is DENIED', async () => {
    await assertFails(setDoc(doc(memberDb, 'withdrawals', 'w-amount-huge'), {
      amount: 1000001,
      timestamp: serverTimestamp(),
      recordedById: 'member-uid'
    }));
  });

  await runTest('Withdrawal create with recordedById != caller uid is DENIED', async () => {
    await assertFails(setDoc(doc(memberDb, 'withdrawals', 'w-spoofed-recordedBy'), {
      amount: 500,
      timestamp: serverTimestamp(),
      recordedById: 'admin-uid'
    }));
  });

  await runTest('Withdrawal create with timestamp != request.time is DENIED', async () => {
    await assertFails(setDoc(doc(memberDb, 'withdrawals', 'w-bad-timestamp'), {
      amount: 500,
      timestamp: Timestamp.fromDate(new Date('2025-01-01')),
      recordedById: 'member-uid'
    }));
  });

  await runTest('Withdrawal create with valid fields by active member is ALLOWED', async () => {
    await assertSucceeds(setDoc(doc(memberDb, 'withdrawals', 'w-valid-1'), {
      amount: 2500,
      purpose: 'School uniforms',
      caseId: 'case-123',
      timestamp: serverTimestamp(),
      recordedById: 'member-uid'
    }));
  });

  await runTest('Withdrawal hard delete is DENIED for all callers (including Admin)', async () => {
    await assertFails(deleteDoc(doc(adminDb, 'withdrawals', 'w-valid-1')));
  });

  // Seed withdrawals for void testing
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    // Legacy doc without status field
    await setDoc(doc(db, 'withdrawals', 'w-legacy-nostatus'), {
      amount: 1000,
      purpose: 'Medical grant',
      recordedById: 'admin-uid',
      timestamp: Timestamp.fromDate(new Date('2025-06-01'))
    });
    // Active doc
    await setDoc(doc(db, 'withdrawals', 'w-active-to-void'), {
      amount: 2000,
      purpose: 'Books',
      status: 'active',
      recordedById: 'member-uid',
      timestamp: Timestamp.fromDate(new Date('2025-06-01'))
    });
    // Already voided doc
    await setDoc(doc(db, 'withdrawals', 'w-already-voided'), {
      amount: 3000,
      purpose: 'Ration bags',
      status: 'voided',
      voidedBy: 'admin-uid',
      voidedAt: Timestamp.fromDate(new Date('2025-06-02')),
      voidReason: 'Duplicate entry'
    });
    // Doc created 20s ago by member-uid (within 60s undo window)
    await setDoc(doc(db, 'withdrawals', 'w-recent-undo'), {
      amount: 4000,
      purpose: 'Urgent assistance',
      status: 'active',
      recordedById: 'member-uid',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 20000))
    });
    // Doc created 5 minutes ago by member-uid (outside 60s undo window)
    await setDoc(doc(db, 'withdrawals', 'w-expired-undo'), {
      amount: 4500,
      purpose: 'Urgent assistance 2',
      status: 'active',
      recordedById: 'member-uid',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 300000))
    });
  });

  await runTest('Void of legacy withdrawal with NO status field by Treasurer is ALLOWED', async () => {
    await assertSucceeds(updateDoc(doc(treasurerDb, 'withdrawals', 'w-legacy-nostatus'), {
      status: 'voided',
      voidedBy: 'treasurer-uid',
      voidedAt: serverTimestamp(),
      voidReason: 'Correcting legacy entry without status'
    }));
  });

  await runTest('Re-void of already voided withdrawal is DENIED', async () => {
    await assertFails(updateDoc(doc(treasurerDb, 'withdrawals', 'w-already-voided'), {
      status: 'voided',
      voidedBy: 'treasurer-uid',
      voidedAt: serverTimestamp(),
      voidReason: 'Attempting to re-void an already voided record'
    }));
  });

  await runTest('Void with voidedBy != caller uid is DENIED', async () => {
    await assertFails(updateDoc(doc(treasurerDb, 'withdrawals', 'w-active-to-void'), {
      status: 'voided',
      voidedBy: 'someone-else-uid',
      voidedAt: serverTimestamp(),
      voidReason: 'Spoofed voidedBy field'
    }));
  });

  await runTest('Void with voidedAt != request.time is DENIED', async () => {
    await assertFails(updateDoc(doc(treasurerDb, 'withdrawals', 'w-active-to-void'), {
      status: 'voided',
      voidedBy: 'treasurer-uid',
      voidedAt: Timestamp.fromDate(new Date('2025-01-01')),
      voidReason: 'Backdated voidedAt'
    }));
  });

  await runTest('Void missing any of 4 fields (e.g. missing voidReason) is DENIED', async () => {
    await assertFails(updateDoc(doc(treasurerDb, 'withdrawals', 'w-active-to-void'), {
      status: 'voided',
      voidedBy: 'treasurer-uid',
      voidedAt: serverTimestamp()
    }));
  });

  await runTest('Void with voidReason > 300 characters is DENIED', async () => {
    const longReason = 'x'.repeat(301);
    await assertFails(updateDoc(doc(treasurerDb, 'withdrawals', 'w-active-to-void'), {
      status: 'voided',
      voidedBy: 'treasurer-uid',
      voidedAt: serverTimestamp(),
      voidReason: longReason
    }));
  });

  await runTest('Void by author within 60s undo window is ALLOWED', async () => {
    await assertSucceeds(updateDoc(doc(memberDb, 'withdrawals', 'w-recent-undo'), {
      status: 'voided',
      voidedBy: 'member-uid',
      voidedAt: serverTimestamp(),
      voidReason: 'Mistake entered 20s ago'
    }));
  });

  await runTest('Void by author outside 60s undo window is DENIED', async () => {
    await assertFails(updateDoc(doc(memberDb, 'withdrawals', 'w-expired-undo'), {
      status: 'voided',
      voidedBy: 'member-uid',
      voidedAt: serverTimestamp(),
      voidReason: 'Trying to undo after 5 minutes'
    }));
  });

  // -------------------------------------------------------------------------
  console.log('\n--- 3. CONTRIBUTIONS COLLECTION ---');
  // -------------------------------------------------------------------------

  await runTest('Public read: unauthenticated/anonymous user can read contributions', async () => {
    await assertSucceeds(getDoc(doc(anonDb, 'contributions', 'non-existent-c1')));
  });

  await runTest('Contribution create by regular member is DENIED', async () => {
    await assertFails(setDoc(doc(memberDb, 'contributions', 'c-member-create'), {
      memberId: 'member-uid',
      amount: 1000,
      recordedById: 'member-uid',
      createdAt: serverTimestamp(),
      status: 'active'
    }));
  });

  await runTest('Contribution create by Treasurer with valid fields is ALLOWED', async () => {
    await assertSucceeds(setDoc(doc(treasurerDb, 'contributions', 'c-treasurer-valid'), {
      memberId: 'member-uid',
      amount: 1000,
      recordedById: 'treasurer-uid',
      createdAt: serverTimestamp(),
      status: 'active'
    }));
  });

  await runTest('Contribution create with amount <= 0 or > 1,000,000 is DENIED', async () => {
    await assertFails(setDoc(doc(treasurerDb, 'contributions', 'c-amount-zero'), {
      memberId: 'member-uid',
      amount: 0,
      recordedById: 'treasurer-uid',
      createdAt: serverTimestamp()
    }));
    await assertFails(setDoc(doc(treasurerDb, 'contributions', 'c-amount-huge'), {
      memberId: 'member-uid',
      amount: 1000001,
      recordedById: 'treasurer-uid',
      createdAt: serverTimestamp()
    }));
  });

  await runTest('Contribution create with recordedById mismatch is DENIED', async () => {
    await assertFails(setDoc(doc(treasurerDb, 'contributions', 'c-spoofed-recordedBy'), {
      memberId: 'member-uid',
      amount: 1000,
      recordedById: 'admin-uid',
      createdAt: serverTimestamp()
    }));
  });

  await runTest('Contribution create with createdAt != request.time is DENIED', async () => {
    await assertFails(setDoc(doc(treasurerDb, 'contributions', 'c-bad-created-at'), {
      memberId: 'member-uid',
      amount: 1000,
      recordedById: 'treasurer-uid',
      createdAt: Timestamp.fromDate(new Date('2025-01-01'))
    }));
  });

  await runTest('Contribution hard delete is DENIED for all users (including Admin)', async () => {
    await assertFails(deleteDoc(doc(adminDb, 'contributions', 'c-treasurer-valid')));
  });

  // Seed contributions for confirm & void testing
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    // Legacy unconfirmed doc without status field
    await setDoc(doc(db, 'contributions', 'c-legacy-nostatus'), {
      memberId: 'member-uid',
      amount: 1000,
      confirmedByTreasurer: false,
      recordedById: 'treasurer-uid',
      createdAt: Timestamp.fromDate(new Date('2025-06-01'))
    });
    // Active unconfirmed doc
    await setDoc(doc(db, 'contributions', 'c-unconfirmed-active'), {
      memberId: 'member-uid',
      amount: 1500,
      status: 'active',
      confirmedByTreasurer: false,
      recordedById: 'treasurer-uid',
      createdAt: Timestamp.fromDate(new Date('2025-06-01'))
    });
    // Already voided doc
    await setDoc(doc(db, 'contributions', 'c-already-voided'), {
      memberId: 'member-uid',
      amount: 2000,
      status: 'voided',
      confirmedByTreasurer: false,
      voidedBy: 'admin-uid',
      voidedAt: Timestamp.fromDate(new Date('2025-06-02')),
      voidReason: 'Mistaken amount'
    });
    // Doc created 15s ago by treasurer (within 60s undo window)
    await setDoc(doc(db, 'contributions', 'c-recent-undo'), {
      memberId: 'member-uid',
      amount: 2500,
      status: 'active',
      recordedById: 'treasurer-uid',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 15000))
    });
  });

  await runTest('Case A Confirm by regular member is DENIED', async () => {
    await assertFails(updateDoc(doc(memberDb, 'contributions', 'c-unconfirmed-active'), {
      confirmedByTreasurer: true,
      confirmedBy: 'member-uid',
      confirmedAt: serverTimestamp()
    }));
  });

  await runTest('Case A Confirm by Treasurer on active contribution is ALLOWED', async () => {
    await assertSucceeds(updateDoc(doc(treasurerDb, 'contributions', 'c-unconfirmed-active'), {
      confirmedByTreasurer: true,
      confirmedBy: 'treasurer-uid',
      confirmedAt: serverTimestamp()
    }));
  });

  await runTest('Case A Confirm on an ALREADY VOIDED contribution is DENIED', async () => {
    await assertFails(updateDoc(doc(treasurerDb, 'contributions', 'c-already-voided'), {
      confirmedByTreasurer: true,
      confirmedBy: 'treasurer-uid',
      confirmedAt: serverTimestamp()
    }));
  });

  await runTest('Case A Confirm touching forbidden fields (e.g. amount) is DENIED', async () => {
    await assertFails(updateDoc(doc(treasurerDb, 'contributions', 'c-legacy-nostatus'), {
      confirmedByTreasurer: true,
      confirmedBy: 'treasurer-uid',
      confirmedAt: serverTimestamp(),
      amount: 9999
    }));
  });

  await runTest('Case B Void of contribution with NO status field by Treasurer is ALLOWED', async () => {
    await assertSucceeds(updateDoc(doc(treasurerDb, 'contributions', 'c-legacy-nostatus'), {
      status: 'voided',
      voidedBy: 'treasurer-uid',
      voidedAt: serverTimestamp(),
      voidReason: 'Voiding unconfirmed legacy entry'
    }));
  });

  await runTest('Case B Re-void of already voided contribution is DENIED', async () => {
    await assertFails(updateDoc(doc(treasurerDb, 'contributions', 'c-already-voided'), {
      status: 'voided',
      voidedBy: 'treasurer-uid',
      voidedAt: serverTimestamp(),
      voidReason: 'Duplicate void attempt'
    }));
  });

  await runTest('Case B Void by author within 60s undo window is ALLOWED', async () => {
    await assertSucceeds(updateDoc(doc(treasurerDb, 'contributions', 'c-recent-undo'), {
      status: 'voided',
      voidedBy: 'treasurer-uid',
      voidedAt: serverTimestamp(),
      voidReason: 'Mistaken amount entered 15s ago'
    }));
  });

  // -------------------------------------------------------------------------
  console.log('\n--- 4. CASES & COMMENTS COLLECTIONS ---');
  // -------------------------------------------------------------------------

  await runTest('Anonymous visitor CANNOT read or write cases', async () => {
    await assertFails(getDoc(doc(anonDb, 'cases', 'case-1')));
    await assertFails(setDoc(doc(anonDb, 'cases', 'case-1'), { title: 'Secret case' }));
  });

  await runTest('Signed-in non-member CANNOT read or write cases', async () => {
    await assertFails(getDoc(doc(nonMemberDb, 'cases', 'case-1')));
    await assertFails(setDoc(doc(nonMemberDb, 'cases', 'case-1'), { title: 'Secret case' }));
  });

  await runTest('Active Core Member CAN read and create cases', async () => {
    await assertSucceeds(setDoc(doc(memberDb, 'cases', 'case-100'), {
      title: 'Family medical support',
      status: 'open',
      requestedAmount: 5000
    }));
    await assertSucceeds(getDoc(doc(memberDb, 'cases', 'case-100')));
  });

  await runTest('Active Core Member CAN update cases', async () => {
    await assertSucceeds(updateDoc(doc(memberDb, 'cases', 'case-100'), {
      status: 'approved'
    }));
  });

  await runTest('Case hard delete is DENIED for all members', async () => {
    await assertFails(deleteDoc(doc(memberDb, 'cases', 'case-100')));
    await assertFails(deleteDoc(doc(adminDb, 'cases', 'case-100')));
  });

  await runTest('Active Core Member CAN read and create comments', async () => {
    await assertSucceeds(setDoc(doc(memberDb, 'comments', 'comment-1'), {
      caseId: 'case-100',
      text: 'Verified bills with clinic',
      createdAt: serverTimestamp()
    }));
    await assertSucceeds(getDoc(doc(memberDb, 'comments', 'comment-1')));
  });

  await runTest('Comment update or delete is DENIED (immutable audit trail)', async () => {
    await assertFails(updateDoc(doc(memberDb, 'comments', 'comment-1'), {
      text: 'Tampered comment'
    }));
    await assertFails(deleteDoc(doc(memberDb, 'comments', 'comment-1')));
  });

  // -------------------------------------------------------------------------
  console.log('\n--- 5. AUTHCONTEXT CLAIM-ON-FIRST-LOGIN SIMULATION ---');
  // -------------------------------------------------------------------------

  // Seed legacy member doc with non-uid id
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'members', 'legacy-doc-ali'), {
      name: 'Ali Khan',
      email: 'ali@fikr.org',
      role: 'Treasurer',
      isActive: true
    });
  });

  await runTest('Flow (i): Existing member already keyed by UID logs in -> succeeds without writes', async () => {
    // Existing member: member-uid
    // AuthContext reads members/member-uid
    const docSnap = await getDoc(doc(memberDb, 'members', 'member-uid'));
    if (!docSnap.exists() || docSnap.id !== 'member-uid') {
      throw new Error('Expected member doc to exist keyed by UID');
    }
    // match.id === activeFbUser.uid, so AuthContext performs NO WRITES.
  });

  await runTest('Flow (ii): Legacy doc keyed by legacy ID -> AuthContext migration write FAILS under hardened rules', async () => {
    // Simulated new Firebase Auth user for Ali Khan: uid = 'ali-new-auth-uid'
    const aliDb = testEnv.authenticatedContext('ali-new-auth-uid').firestore();

    // Legacy AuthContext logic attempts to setDoc on members/ali-new-auth-uid
    // with role: 'Treasurer' and isActive: true
    const legacyClaimAttempt = setDoc(doc(aliDb, 'members', 'ali-new-auth-uid'), {
      name: 'Ali Khan',
      email: 'ali@fikr.org',
      role: 'Treasurer',
      isActive: true,
      claimedAt: serverTimestamp()
    });

    // Under hardened rules, self-creation with role: 'Treasurer' or isActive: true MUST FAIL
    await assertFails(legacyClaimAttempt);
  });

  await runTest('Flow (iii): Brand new user with no member doc -> supporter in memory, no writes', async () => {
    const brandNewDb = testEnv.authenticatedContext('brand-new-uid').firestore();
    const docSnap = await getDoc(doc(brandNewDb, 'members', 'brand-new-uid'));
    if (docSnap.exists()) {
      throw new Error('Expected no doc to exist');
    }
    // AuthContext sets user in memory as { role: 'Core Member', isActive: false, tier: 'supporter' }
    // No writes attempted.
  });

  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${passedCount + failedCount})`);
  console.log('================================================================\n');

  await testEnv.cleanup();

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
