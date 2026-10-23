/**
 * Fikr (Dast-e-Khair) — Member Password Rotation Tool
 *
 * This script automates rotating member passwords in Firebase Authentication.
 * It generates unique, cryptographically random 16-character passwords for each account.
 *
 * SAFETY RULES:
 * 1. NEVER hardcode any password or secret in this file or any tracked file.
 * 2. Prompts for the current/old password at runtime using masked terminal input.
 * 3. Before writing new credentials, verifies scripts/.local/ is ignored by git.
 * 4. Logs ONLY success/failure status per email — NEVER prints passwords to console.
 * 5. Supports --dry-run to test credentials without modifying passwords.
 *
 * USAGE:
 *   Dry run:  node scripts/rotate-member-passwords.mjs --dry-run
 *   Real run: node scripts/rotate-member-passwords.mjs
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  updatePassword,
  signOut
} from 'firebase/auth';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

// Firebase project configuration from environment or fallback
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDpDlbMnJLEFmwDOOgPO7bxu27MOFyDDTw',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'fikr-66da9.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'fikr-66da9',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'fikr-66da9.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '139865626528',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:139865626528:web:339c8a08ce83dbe05b36c5'
};

const LOCAL_DIR = path.resolve('scripts/.local');
const MEMBERS_FILE = path.join(LOCAL_DIR, 'members.txt');
const OUTPUT_FILE = path.join(LOCAL_DIR, 'new-passwords.txt');

// Character set for password generation (excluding look-alikes 0, O, 1, l, I)
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz!@#$%&*';

/**
 * Generates a cryptographically secure random password of specified length
 */
export function generateSecurePassword(length = 16) {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, CHARSET.length);
    result += CHARSET[randomIndex];
  }
  return result;
}

/**
 * Prompts user for hidden input in the terminal (does not echo characters)
 */
function promptHidden(promptText) {
  return new Promise((resolve) => {
    process.stdout.write(promptText);
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';
    const onData = (ch) => {
      const char = ch.toString('utf8');
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(wasRaw);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.stdout.write('\nOperation cancelled by user.\n');
          process.exit(1);
          break;
        case '\b':
        case '\x7f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
          }
          break;
        default:
          password += char;
          break;
      }
    };
    stdin.on('data', onData);
  });
}

/**
 * Validates that scripts/.local is ignored by Git to avoid accidental commits
 */
function verifyGitIgnored() {
  try {
    const result = execSync('git check-ignore scripts/.local/ scripts/.local/new-passwords.txt', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    if (!result || !result.includes('scripts/.local')) {
      throw new Error('scripts/.local/ is not properly ignored by Git!');
    }
    return true;
  } catch (err) {
    console.error('CRITICAL ERROR: scripts/.local/ is NOT ignored by git. Aborting for security.');
    process.exit(1);
  }
}

async function run() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('====================================================');
  console.log('  FIKR (DAST-E-KHAIR) — MEMBER PASSWORD ROTATION');
  console.log(`  Mode: ${isDryRun ? 'DRY RUN (no passwords changed)' : 'REAL ROTATION (passwords will be updated)'}`);
  console.log('====================================================\n');

  // 1. Verify Git ignore status
  verifyGitIgnored();

  // 2. Verify members list file exists
  if (!fs.existsSync(MEMBERS_FILE)) {
    console.error(`Error: Member login list not found at: ${MEMBERS_FILE}`);
    console.error('Please create this file with one member login email per line.');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(MEMBERS_FILE, 'utf8');
  const emails = fileContent
    .split(/\r?\n/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0 && e.includes('@'));

  if (emails.length === 0) {
    console.error(`Error: No valid email addresses found in: ${MEMBERS_FILE}`);
    process.exit(1);
  }

  console.log(`Found ${emails.length} account(s) to process.`);

  // 3. Prompt for old password securely
  const oldPassword = await promptHidden('Enter CURRENT shared default password (input hidden): ');
  if (!oldPassword) {
    console.error('Error: Password cannot be empty.');
    process.exit(1);
  }

  // 4. Initialize Firebase App
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const results = [];
  const rotationLog = [];

  console.log('\nProcessing accounts...\n');

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    process.stdout.write(`[${i + 1}/${emails.length}] ${email}: `);

    try {
      // Sign in with existing credentials
      const userCred = await signInWithEmailAndPassword(auth, email, oldPassword);

      if (isDryRun) {
        await signOut(auth);
        console.log('VALID (Dry-run: signed in and out successfully)');
        results.push({ email, status: 'SUCCESS_DRY_RUN' });
      } else {
        // Generate unique cryptographically random password
        const newPassword = generateSecurePassword(16);

        // Update password in Firebase Auth
        await updatePassword(userCred.user, newPassword);
        await signOut(auth);

        rotationLog.push(`${email}\t${newPassword}`);
        console.log('ROTATED SUCCESSFULLY');
        results.push({ email, status: 'ROTATED' });
      }
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        console.log('SKIPPED (password mismatch - already rotated or invalid)');
        results.push({ email, status: 'SKIPPED_CREDENTIAL_MISMATCH' });
      } else if (err.code === 'auth/too-many-requests') {
        console.log('RATE-LIMITED (too many requests from this IP; retry later)');
        results.push({ email, status: 'RATE_LIMITED' });
      } else if (err.code === 'auth/user-not-found') {
        console.log('NOT FOUND (user does not exist in Firebase Auth)');
        results.push({ email, status: 'NOT_FOUND' });
      } else {
        console.log(`FAILED (${err.code || err.message})`);
        results.push({ email, status: 'FAILED', error: err.code || err.message });
      }
    }

    // Rate-limit buffer (1.5 seconds)
    if (i < emails.length - 1) {
      await new Promise(res => setTimeout(res, 1500));
    }
  }

  // 5. Output results
  console.log('\n---------------- SUMMARY ----------------');
  const successCount = results.filter(r => r.status === 'ROTATED' || r.status === 'SUCCESS_DRY_RUN').length;
  console.log(`Processed: ${emails.length} | Success: ${successCount} | Issues/Skipped: ${emails.length - successCount}`);

  if (!isDryRun && rotationLog.length > 0) {
    fs.writeFileSync(OUTPUT_FILE, rotationLog.join('\n') + '\n', { mode: 0o600 });
    console.log(`\nNew credentials securely saved to: ${OUTPUT_FILE}`);
    console.log('IMPORTANT: Deliver these credentials to members securely via individual private channels.');
    console.log('Once distributed, immediately delete scripts/.local/new-passwords.txt.\n');
  }
}

// Only auto-run if directly executed via CLI
if (process.argv[1] && process.argv[1].endsWith('rotate-member-passwords.mjs')) {
  run().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
  });
}
