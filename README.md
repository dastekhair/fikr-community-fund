# Fikr (Dast-e-Khair) — Community Assistance Fund Web App

> *"Start with ₹100. Build trust. Build a system. Build a community. Then, InshaAllah, build something that can genuinely serve people at a much larger scale."*

**Fikr** (also known as **Dast-e-Khair**) is a transparent, role-based digital record-keeping and coordination web app for a small 9–10 person community assistance fund. Core members contribute weekly (₹100 minimum), the group collectively reviews ground-level cases needing emergency medical, educational, or ration aid, and the Treasurer releases funds with complete transparency and accountability.

---

## ⚡ Key Architectural Tenets (Zero-Cost & Non-Custodial)

- **Strictly Non-Custodial:** This app **never touches real money movement**. It does not process payments or hold bank balances. All real transactions happen directly between humans via external UPI apps or cash. The app functions solely as an auto-balanced digital ledger, verification record, and coordination platform.
- **100% Free to Run Indefinitely:**
  - **Frontend:** React + Vite + TypeScript hosted on **GitHub Pages** (free).
  - **Backend & Data:** **Firebase Spark Plan** (Firestore, Firebase Authentication, Firebase Storage) — 100% free forever tier.
  - **No Custom Server / Docker:** Zero backend maintenance, zero server costs.
- **Beneficiary Dignity & Privacy Covenant:** Beneficiary names and identifying personal circumstances are strictly private to verified Core Members. The public withdrawal ledger only displays sanitized categories and purposes.

---

## 🏛️ Three-Tier Role-Based Access Model

| Tier | Who | Permissions & Visibility |
| :--- | :--- | :--- |
| **Tier 1: Core Member** *(Treasurer, Coordinator, Verification Team, Core Members)* | 9–10 named individuals (managed dynamically in Firestore) | • Full access to Case intake, ground inspection notes, and internal discussions.<br>• Submit concurrence / agreement votes on requested amounts.<br>• Record withdrawals (Treasurer / Core Member).<br>• Access full General Ledger & CSV Export.<br>• Weekly contribution tracking & WhatsApp reminder tools. |
| **Tier 2: Supporter / External Donor** | Authenticated supporters | • View aggregate transparency stats and live fund balance.<br>• View public withdrawal ledger.<br>• *Cannot* see sensitive beneficiary data, submit cases, or vote. |
| **Tier 3: Public / Anonymous Visitor** | General public | • View landing page transparency dashboard and public proof.<br>• View sanitized public withdrawal ledger (dates, amounts, categories).<br>• *No login required.* |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### 1. Clone & Install
```bash
git clone https://github.com/your-username/fikr-community-fund.git
cd fikr-community-fund
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Note: If no Firebase credentials are provided initially, the app gracefully launches in high-fidelity **Demo / Local Mode** with pre-seeded test personas for immediate review!)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔥 Firebase Spark Free-Tier Setup Guide

Follow these steps to configure your free Firebase backend:

### Step 1: Create Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it (e.g. `fikr-community-fund`).
3. Select the default **Spark (Free)** plan. Disable Google Analytics (optional).

### Step 2: Enable Firebase Authentication
1. Navigate to **Build > Authentication** in the left sidebar.
2. Under the **Sign-in method** tab, enable:
   - **Email/Password**
   - **Google** (optional, for one-click login)

### Step 3: Enable Cloud Firestore
1. Navigate to **Build > Firestore Database** and click **Create database**.
2. Select your closest location (e.g., `asia-south1` for India).
3. Start in **Production mode**.
4. Deploy the rules from [`firestore.rules`](file:///d:/Projects/FikrProject/firestore.rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function getMemberData() { return get(/databases/$(database)/documents/members/$(request.auth.uid)).data; }
    function isRegisteredMember() { return isAuthenticated() && exists(/databases/$(database)/documents/members/$(request.auth.uid)); }
    function isActiveMember() { return isRegisteredMember() && getMemberData().isActive == true; }
    function isTreasurer() { return isActiveMember() && getMemberData().role == 'Treasurer'; }
    function isCoordinator() { return isActiveMember() && getMemberData().role == 'Coordinator'; }
    function isPrivilegedAdmin() { return isTreasurer() || isCoordinator(); }

    match /members/{memberId} {
      allow read: if isAuthenticated();
      allow write: if isPrivilegedAdmin() || !exists(/databases/$(database)/documents/members/$(memberId));
    }

    match /cases/{caseId} {
      allow read, create, update: if isActiveMember();
      allow delete: if false;
    }

    match /comments/{commentId} {
      allow read, create: if isActiveMember();
      allow update, delete: if false;
    }

    match /withdrawals/{withdrawalId} {
      allow read: if true;
      allow create: if isActiveMember();
      allow update, delete: if isPrivilegedAdmin();
    }

    match /contributions/{contributionId} {
      allow read, create: if isActiveMember();
      allow update: if isTreasurer() || isCoordinator();
      allow delete: if false;
    }
  }
}
```

### Step 4: Register Web App & Add Keys
1. In Project Settings > General, scroll to **Your apps** and click **Web** (`</>`).
2. Copy the config values into your `.env` file:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=fikr-fund.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fikr-fund
VITE_FIREBASE_STORAGE_BUCKET=fikr-fund.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:...
```

---

## 👥 Dynamic Member Roster Management (`/members`)

The list of Core Members is **never hardcoded in application code**. It is stored directly in the Firestore `members` collection:

1. Log in as **Amaan (Coordinator)** or **Mohammad Yusuf (Treasurer)**.
2. Navigate to **[Members Management](/members)**.
3. **Add New Member:** Click *Add New Member*, specify their full name, email, role (Coordinator, Treasurer, Verification Team, or Core Member), and area notes.
4. **Edit Roles:** Edit role tags directly in place.
5. **Safe Deactivation:** Instead of deleting records (which would orphan historical transactions), clicking **Deactivate** immediately revokes write access and removes the member from active withdrawal selectors while keeping their past contributions and ledger history 100% intact.

---

## 📱 WhatsApp Group Sharing (Zero-Infrastructure)

This app avoids brittle backend bots or paid WhatsApp Cloud APIs. Instead, it provides one-tap client-side `wa.me` deep links for Core Members:

- **Weekly Reminder:** Pre-populates the standard ₹100 commitment reminder and opens WhatsApp for group broadcast.
- **Live Fund Summary:** Pulls live numbers from Firestore (Total Collected, Total Released, Current Balance, Cases Helped) and generates an instant status message.
- **Case Discussion Share:** Formats case summary for quick WhatsApp group discussion.

---

## 🚢 Continuous Deployment to GitHub Pages

A ready-to-use GitHub Actions workflow is included at `.github/workflows/deploy.yml`.

### Setup Steps:
1. Push your repository to GitHub.
2. Go to your GitHub repository **Settings > Secrets and variables > Actions**.
3. Add the `VITE_FIREBASE_*` variables as repository secrets.
4. Go to **Settings > Pages > Build and deployment**, and select **Source: GitHub Actions**.
5. Every push to `main` will automatically build and deploy the app to your free GitHub Pages URL!

---

## 📄 License & Attribution

Designed and built for **Fikr / Dast-e-Khair Community Assistance Fund**. Free & open-source under the MIT License.
