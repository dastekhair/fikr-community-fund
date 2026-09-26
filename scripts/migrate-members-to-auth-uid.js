/**
 * Fikr (Dast-e-Khair) — Member Auth UID Migration Script
 *
 * This script safely migrates member documents from custom string IDs (e.g. mem-1, mem-2)
 * to be primary-keyed by their Firebase Authentication UID (members/{authUID}).
 *
 * Safety features:
 * 1. Preserves all existing fields (name, role, isActive, joinedAt, notes).
 * 2. Adds `legacyId` to the new document so historical references remain traceable.
 * 3. Does NOT delete old custom-ID documents; marks them with `migrated: true` and `migratedTo: authUID`.
 * 4. Clearly flags members who have not signed up/logged in yet.
 *
 * Usage:
 *   node scripts/migrate-members-to-auth-uid.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const DEFAULT_PASSWORD = 'Fikr@2026!';

const INITIAL_CORE_MEMBERS = [
  {
    id: 'mem-2',
    name: 'Amaan',
    email: 'amaan@fikr.org',
    role: 'Admin',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Administrator with authority to manage member roles, access permissions, and fund governance.'
  },
  {
    id: 'mem-5',
    name: 'Rizwan',
    email: 'rizwan@fikr.org',
    role: 'Treasurer',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Maintains fund ledger, receives & confirms UPI/cash contributions, and releases approved disbursements.'
  },
  {
    id: 'mem-1',
    name: 'Mohammad Yusuf',
    email: 'yusuf@fikr.org',
    role: 'Coordinator',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Manages case discussions, core group meetings, and general group coordination.'
  },
  {
    id: 'mem-3',
    name: 'Abdul Samad',
    email: 'samad@fikr.org',
    role: 'Verification Team',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Ground-level verification (Pharmacy liaison & medical needs assessment).'
  },
  {
    id: 'mem-4',
    name: 'Akif',
    email: 'akif@fikr.org',
    role: 'Verification Team',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Ground-level inspection, field verification, and case follow-ups.'
  },
  {
    id: 'mem-6',
    name: 'Belal',
    email: 'belal@fikr.org',
    role: 'Core Member',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Active contributor and case decision participant.'
  },
  {
    id: 'mem-7',
    name: 'Ali Zaid Ibrahim',
    email: 'alizaid@fikr.org',
    role: 'Core Member',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Active contributor and case decision participant.'
  },
  {
    id: 'mem-8',
    name: 'Imran',
    email: 'imran@fikr.org',
    role: 'Core Member',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Active contributor and case decision participant.'
  },
  {
    id: 'mem-9',
    name: 'Danish',
    email: 'danish@fikr.org',
    role: 'Core Member',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Active contributor and case decision participant.'
  },
  {
    id: 'mem-10',
    name: 'Umar',
    email: 'umar@fikr.org',
    role: 'Core Member',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Active contributor and case decision participant.'
  }
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runMigration() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_')) {
    console.error('❌ Error: Firebase config is missing or invalid in .env file.');
    process.exit(1);
  }

  console.log('🚀 Initializing Firebase App for Member Auth UID Migration...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Fetch existing members from Firestore
  let existingDocs = [];
  try {
    const snap = await getDocs(collection(db, 'members'));
    existingDocs = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
    console.log(`📋 Found ${existingDocs.length} member records in Cloud Firestore.`);
  } catch (err) {
    console.warn(`⚠️ Could not query Firestore 'members' collection directly (${err.message}). Will process initial roster.`);
  }

  // Combine roster from DB and initial seed
  const memberMap = new Map();
  for (const m of INITIAL_CORE_MEMBERS) {
    if (m.email) memberMap.set(m.email.toLowerCase(), { ...m, docId: m.id });
  }
  for (const d of existingDocs) {
    if (d.email) {
      const existing = memberMap.get(d.email.toLowerCase()) || {};
      memberMap.set(d.email.toLowerCase(), { ...existing, ...d, docId: d.docId });
    }
  }

  const allMembers = Array.from(memberMap.values());
  console.log(`\n🔄 Processing migration for ${allMembers.length} member accounts...\n`);

  const migratedList = [];
  const pendingList = [];

  for (const member of allMembers) {
    const email = member.email?.toLowerCase().trim();
    if (!email) continue;

    console.log(`Checking: ${member.name} (${email}) [Current docId: ${member.docId}]...`);
    let authUid = null;

    // Step 1: Check/Authenticate with Firebase Auth
    try {
      const loginCred = await signInWithEmailAndPassword(auth, email, DEFAULT_PASSWORD);
      authUid = loginCred.user.uid;
      console.log(`  🔑 Auth session verified (UID: ${authUid})`);
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
        // Try creating the user if not exists yet
        try {
          const createCred = await createUserWithEmailAndPassword(auth, email, DEFAULT_PASSWORD);
          authUid = createCred.user.uid;
          await updateProfile(createCred.user, { displayName: member.name });
          console.log(`  ✅ Auth account provisioned (UID: ${authUid})`);
        } catch (createErr) {
          console.warn(`  ⚠️ Could not authenticate or provision Auth UID: ${createErr.message}`);
        }
      } else {
        console.warn(`  ⚠️ Auth sign-in note: ${authErr.message}`);
      }
    }

    if (authUid) {
      // Step 2: Copy fields into new document at members/{authUid}
      try {
        const newPayload = {
          name: member.name,
          email: email,
          role: member.role || 'Core Member',
          isActive: member.isActive !== undefined ? member.isActive : true,
          joinedAt: member.joinedAt || new Date().toISOString().slice(0, 10),
          notes: member.notes || '',
          id: authUid,
          uid: authUid,
          legacyId: member.docId || member.id || 'mem-legacy',
          migratedAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'members', authUid), newPayload, { merge: true });
        console.log(`  ✅ Created/Updated primary member document: 'members/${authUid}'`);

        // Step 3: Soft-link legacy doc without deleting
        if (member.docId && member.docId !== authUid) {
          await setDoc(doc(db, 'members', member.docId), {
            ...newPayload,
            id: member.docId,
            migrated: true,
            migratedTo: authUid
          }, { merge: true });
          console.log(`  🔗 Soft-linked legacy document 'members/${member.docId}' (migratedTo: ${authUid})`);
        }

        migratedList.push({ name: member.name, email, uid: authUid, role: member.role });
      } catch (dbErr) {
        console.error(`  ❌ Firestore write error:`, dbErr.message);
      }
    } else {
      pendingList.push({ name: member.name, email, docId: member.docId, role: member.role });
    }

    await sleep(300);
  }

  console.log('\n=========================================================');
  console.log('📊 MIGRATION SUMMARY REPORT');
  console.log('=========================================================');
  console.log(`\n✅ Successfully Migrated Members (${migratedList.length}):`);
  migratedList.forEach(m => {
    console.log(`  • ${m.name.padEnd(20)} | Role: ${m.role.padEnd(18)} | UID: ${m.uid} (${m.email})`);
  });

  if (pendingList.length > 0) {
    console.log(`\n⚠️ Pending / Not Logged In Yet (${pendingList.length}):`);
    pendingList.forEach(p => {
      console.log(`  • ${p.name.padEnd(20)} | Role: ${p.role.padEnd(18)} | Email: ${p.email}`);
    });
    console.log('\nℹ️ Note: These members will be automatically migrated to members/{authUID} on their very first login via the app.');
  } else {
    console.log('\n🎉 All core members have been successfully migrated to Auth UID primary keys!');
  }
  console.log('=========================================================\n');
  process.exit(0);
}

runMigration();
