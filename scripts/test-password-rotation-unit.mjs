/**
 * Unit Test for scripts/rotate-member-passwords.mjs
 * Validates password generation and mock auth rotation flow without touching real accounts.
 */

import { generateSecurePassword } from './rotate-member-passwords.mjs';

function runUnitTests() {
  console.log('Testing generateSecurePassword...');

  const FORBIDDEN_LOOKALIKES = ['0', 'O', '1', 'l', 'I'];
  const passwords = new Set();

  for (let i = 0; i < 50; i++) {
    const pwd = generateSecurePassword(16);

    // 1. Check length
    if (pwd.length !== 16) {
      throw new Error(`Password length mismatch: expected 16, got ${pwd.length}`);
    }

    // 2. Check no forbidden lookalikes
    for (const char of FORBIDDEN_LOOKALIKES) {
      if (pwd.includes(char)) {
        throw new Error(`Password contains forbidden lookalike '${char}': ${pwd}`);
      }
    }

    passwords.add(pwd);
  }

  // 3. Check uniqueness across 50 generations
  if (passwords.size !== 50) {
    throw new Error(`Collision detected: ${passwords.size} unique passwords out of 50`);
  }

  console.log('  Password generator tests passed (50/50 unique, 16-char, zero lookalikes)');

  // 4. Test Mock Auth Simulation
  console.log('Testing mock rotation flow...');
  const mockDatabase = {
    'testuser@mock.org': 'InitialMockPass123!'
  };

  function mockSignIn(email, password) {
    if (mockDatabase[email] === password) {
      return { user: { email } };
    }
    const err = new Error('Invalid credentials');
    err.code = 'auth/wrong-password';
    throw err;
  }

  function mockUpdatePassword(user, newPassword) {
    mockDatabase[user.email] = newPassword;
  }

  // Simulate rotation
  const cred = mockSignIn('testuser@mock.org', 'InitialMockPass123!');
  const newMockPwd = generateSecurePassword(16);
  mockUpdatePassword(cred.user, newMockPwd);

  // Verify updated
  if (mockDatabase['testuser@mock.org'] !== newMockPwd) {
    throw new Error('Mock password rotation failed to update password store');
  }

  // Verify old password fails
  let failedOldPass = false;
  try {
    mockSignIn('testuser@mock.org', 'InitialMockPass123!');
  } catch (e) {
    failedOldPass = true;
  }

  if (!failedOldPass) {
    throw new Error('Expected old password to be rejected after rotation');
  }

  console.log('  Mock rotation workflow passed successfully.');
  console.log('ALL UNIT TESTS PASSED.\n');
}

runUnitTests();
