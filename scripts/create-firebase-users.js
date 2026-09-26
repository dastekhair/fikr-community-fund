/**
 * Fikr (Dast-e-Khair) — Batch Core Member Accounts Setup Script
 *
 * This script creates the initial 10 core member accounts in Firebase Authentication
 * and sets up their matching profiles in Cloud Firestore.
 *
 * Usage:
 *   1. Fill in your .env with your Firebase keys
 *   2. Run: node scripts/create-firebase-users.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
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

const DEFAULT_PASSWORD = process.env.FIKR_AUTH_PASSWORD || process.env.DEFAULT_MEMBER_PASSWORD;
if (!DEFAULT_PASSWORD) {
  console.error('Error: Please provide DEFAULT_MEMBER_PASSWORD or FIKR_AUTH_PASSWORD in your environment or .env file.');
  process.exit(1);
}

const CORE_MEMBERS = [
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

async function seed() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_')) {
    console.error('❌ Error: Firebase config is missing or invalid in .env file.');
    process.exit(1);
  }

  console.log('🚀 Initializing Firebase App...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log(`\n📦 Registering ${CORE_MEMBERS.length} Core Member accounts in Firebase...\n`);

  for (const member of CORE_MEMBERS) {
    try {
      console.log(`Processing: ${member.name} (${member.email}) -> Role: ${member.role}...`);
      let uid = member.id;
      try {
        const userCred = await createUserWithEmailAndPassword(auth, member.email, DEFAULT_PASSWORD);
        uid = userCred.user.uid;
        await updateProfile(userCred.user, { displayName: member.name });
        console.log(`  ✅ Auth account created (UID: ${uid})`);
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          console.log(`  ℹ️ Auth account already exists. Signing in...`);
          try {
            const loginCred = await signInWithEmailAndPassword(auth, member.email, DEFAULT_PASSWORD);
            uid = loginCred.user.uid;
            console.log(`  ✅ Verified auth session for ${member.name}`);
          } catch (e) {
            console.warn(`  ⚠️ Existing user password mismatch or sign in note: ${e.message}`);
          }
        } else {
          console.warn(`  ⚠️ Auth note: ${authErr.message}`);
        }
      }

      // Write to Firestore members collection using Auth UID as primary key
      try {
        const payload = {
          ...member,
          id: uid,
          legacyId: member.id,
          uid: uid
        };
        await setDoc(doc(db, 'members', uid), payload);
        if (member.id !== uid) {
          await setDoc(doc(db, 'members', member.id), payload);
        }
        console.log(`  ✅ Firestore roster saved ('members/${uid}' and 'members/${member.id}')`);
      } catch (fsErr) {
        console.error(`  ❌ Firestore write error:`, fsErr.message);
      }

      await sleep(300);
    } catch (err) {
      console.error(`  ❌ Error on ${member.name}:`, err.message);
    }
  }

  console.log('\n🎉 Setup finished!');
  console.log('---------------------------------------------------------');
  console.log('Default Admin: Amaan (amaan@fikr.org)');
  console.log('Default Treasurer: Rizwan (rizwan@fikr.org)');
  console.log(`Default Password: ${DEFAULT_PASSWORD}`);
  console.log('---------------------------------------------------------');
  process.exit(0);
}

seed();
