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
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
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

const DEFAULT_PASSWORD = 'Fikr@2026!';

const CORE_MEMBERS = [
  {
    id: 'mem-1',
    name: 'Mohammad Yusuf',
    email: 'yusuf@fikr.org',
    role: 'Treasurer',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Maintains fund ledger, receives UPI/cash contributions, and releases approved amounts.'
  },
  {
    id: 'mem-2',
    name: 'Amaan',
    email: 'amaan@fikr.org',
    role: 'Coordinator',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Manages case discussions, core group meetings, and general administration.'
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
    id: 'mem-5',
    name: 'Rizwan',
    email: 'rizwan@fikr.org',
    role: 'Core Member',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Founding contributor and case scout.'
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

async function seed() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_')) {
    console.error('❌ Error: Firebase config is missing or invalid in .env file.');
    process.exit(1);
  }

  console.log('🚀 Initializing Firebase App...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log(`\n📦 Creating ${CORE_MEMBERS.length} Core Member accounts in Firebase Auth & Firestore...\n`);

  for (const member of CORE_MEMBERS) {
    try {
      console.log(`Creating user: ${member.name} (${member.email})...`);
      let uid = member.id;
      try {
        const userCred = await createUserWithEmailAndPassword(auth, member.email, DEFAULT_PASSWORD);
        uid = userCred.user.uid;
        await updateProfile(userCred.user, { displayName: member.name });
        console.log(`  ✅ Auth user created with UID: ${uid}`);
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          console.log(`  ℹ️ Auth account already exists for ${member.email}`);
        } else {
          console.warn(`  ⚠️ Auth creation note: ${authErr.message}`);
        }
      }

      // Write to Firestore members collection
      await setDoc(doc(db, 'members', member.id), {
        ...member,
        uid: uid
      });
      console.log(`  ✅ Firestore member profile saved in 'members/${member.id}'`);
    } catch (err) {
      console.error(`  ❌ Error creating ${member.name}:`, err.message);
    }
  }

  console.log('\n🎉 Setup completed successfully!');
  console.log('---------------------------------------------------------');
  console.log('All members can now log in at /login with:');
  console.log(`Default Password: ${DEFAULT_PASSWORD}`);
  console.log('---------------------------------------------------------');
  process.exit(0);
}

seed();
