# Fikr (Dast-e-Khair) — Scripts & Operational Tooling

This directory contains test suites, migration utilities, and security tools for the Fikr web application.

---

## Security Guidelines

1. **Zero Hardcoded Secrets:**  
   Never commit passwords, private keys, or API tokens directly into any script or tracked file.
2. **Environment Variable Injection:**  
   Scripts requiring credentials read from process environment variables (`FIKR_AUTH_PASSWORD` or `TEST_PASSWORD`) or prompt the operator for hidden input at runtime.
3. **Protected Output Directory:**  
   Local files containing credentials or user exports are kept in `scripts/.local/`, which is ignored by Git in `.gitignore`. Never track files in `scripts/.local/`.

---

## Script Inventory

### 1. `rotate-member-passwords.mjs`
Automated tool to rotate member account passwords in Firebase Authentication to unique, cryptographically random 16-character passwords.
- **Prerequisites:** Create `scripts/.local/members.txt` with one member login email per line.
- **Dry-Run (Tests sign-in without modifying passwords):**
  ```bash
  node scripts/rotate-member-passwords.mjs --dry-run
  ```
- **Real Rotation:**
  ```bash
  node scripts/rotate-member-passwords.mjs
  ```
  *(Prompts for the current default password with masked input. Saves output to `scripts/.local/new-passwords.txt`.)*
- **Post-Rotation Requirement:**  
  Securely distribute the credentials to each member individually. Once delivered, immediately delete `scripts/.local/new-passwords.txt`.

---

### 2. `test-password-rotation-unit.mjs`
Unit test validating the password generation logic (uniqueness, length, character set, exclusion of look-alikes `0/O/1/l/I`) and mock auth rotation flow.
```bash
node scripts/test-password-rotation-unit.mjs
```

---

### 3. `verify-phase-a.mjs` & `verify-phase-b.mjs`
Automated end-to-end headless browser test suites (using Puppeteer) verifying touch targets, bottom tab bar, skeletons, My Status card, and soft-voiding workflows.
- **Required Environment Variables:**
  - `TEST_PASSWORD` or `FIKR_AUTH_PASSWORD`
- **Execution:**
  ```bash
  TEST_PASSWORD="[MEMBER_PASSWORD]" node scripts/verify-phase-a.mjs
  TEST_PASSWORD="[MEMBER_PASSWORD]" node scripts/verify-phase-b.mjs
  ```

---

### 4. `verify-design-and-touch.mjs`
Automated verification suite validating Scandinavian fintech design tokens, 375px mobile touch targets, dark mode, role gating, and Firestore real-time sync.
- **Execution:**
  ```bash
  TEST_PASSWORD="[MEMBER_PASSWORD]" node scripts/verify-design-and-touch.mjs
  ```

---

### 5. `migrate-members-to-auth-uid.js`
One-time migration script that mapped legacy member document keys (`mem-1`, `mem-2`, etc.) to Firebase Auth UIDs while preserving references.
- **Execution (Archival / Reference only):**
  ```bash
  FIKR_AUTH_PASSWORD="[PASSWORD]" node scripts/migrate-members-to-auth-uid.js
  ```

---

### 6. `create-firebase-users.js`
Batch account creation script used during initial setup.
- **Execution (Reference only):**
  ```bash
  FIKR_AUTH_PASSWORD="[PASSWORD]" node scripts/create-firebase-users.js
  ```
