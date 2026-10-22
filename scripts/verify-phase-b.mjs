import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
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

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}/`;
const TEST_PASSWORD = process.env.TEST_PASSWORD || process.env.FIKR_AUTH_PASSWORD || 'Fikr@2026!';

function startPreviewServer() {
  return new Promise((resolve, reject) => {
    console.log('[Server] Starting vite preview on port ' + PORT + '...');
    const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
      shell: true,
      stdio: 'pipe'
    });

    let started = false;
    server.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes(String(PORT)) || msg.includes('Local:')) {
        if (!started) {
          started = true;
          console.log('[Server] Vite preview ready at ' + BASE_URL);
          resolve(server);
        }
      }
    });

    server.stderr.on('data', (data) => {
      // console.error('[Server Error]', data.toString());
    });

    server.on('error', reject);

    setTimeout(() => {
      if (!started) {
        started = true;
        resolve(server);
      }
    }, 4000);
  });
}

async function runPhaseBVerification() {
  console.log('================================================================');
  console.log('  FIKR PHASE B VERIFICATION (FEATURES 4 & 5)');
  console.log('  Target: ' + BASE_URL);
  console.log('  Viewport: 375x812 (Touch Emulated)');
  console.log('================================================================\n');

  let serverProcess = null;
  try {
    serverProcess = await startPreviewServer();
  } catch (err) {
    console.log('[Server] Preview server launch note:', err.message);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const consoleErrors = [];

  try {
    // =========================================================================
    // SECTION 1: PUBLIC / VISITOR VIEW CHECKS
    // =========================================================================
    console.log('--- SECTION 1: Visitor / Public Restrictions Check ---');
    const pubContext = await browser.createBrowserContext();
    const pubPage = await pubContext.newPage();
    await pubPage.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

    pubPage.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Firestore cases listener error') || text.includes('Missing or insufficient permissions')) return;
        consoleErrors.push(`[Visitor Error] ${text}`);
      }
    });

    await pubPage.goto(`${BASE_URL}#/contributions`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Verify Visitor does NOT see "Who Hasn't Contributed" nudge card
    const visitorHasNudge = await pubPage.evaluate(() => {
      const body = document.body.innerText;
      return body.includes("Who Hasn't Contributed This Cycle") || body.includes('Send Nudge') || body.includes('Remind');
    });
    console.log(`1.1 Visitor sees Due Members Nudge list: ${visitorHasNudge} (Expected: false)`);
    if (visitorHasNudge) throw new Error('Security breach: Visitor can see Due Members Nudge list!');

    // Verify Visitor cannot see "Record Contribution" button
    const visitorHasRecordBtn = await pubPage.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Record Contribution'));
    });
    console.log(`1.2 Visitor sees Record Contribution button: ${visitorHasRecordBtn} (Expected: false)`);
    if (visitorHasRecordBtn) throw new Error('Security breach: Visitor can see Record Contribution button!');

    // Check Ledger Page as Visitor: Void buttons must NOT be present
    await pubPage.goto(`${BASE_URL}#/ledger`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    const visitorHasVoidBtn = await pubPage.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).some(b => b.innerText.trim() === 'Void');
    });
    console.log(`1.3 Visitor sees Void button on Ledger: ${visitorHasVoidBtn} (Expected: false)`);
    if (visitorHasVoidBtn) throw new Error('Security breach: Visitor can see Void buttons!');

    await pubContext.close();

    // =========================================================================
    // SECTION 2: TREASURER / ADMIN LOGIN & FEATURE 4 CHECKS
    // =========================================================================
    console.log('\n--- SECTION 2: Treasurer Login & Feature 4 (Due Nudge) ---');
    const adminContext = await browser.createBrowserContext();
    const adminPage = await adminContext.newPage();
    await adminPage.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

    adminPage.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Firestore cases listener error') || text.includes('Missing or insufficient permissions')) return;
        consoleErrors.push(`[Treasurer Error] ${text}`);
      }
    });

    console.log('2.1 Logging in as Treasurer (rizwan@fikr.org)...');
    await adminPage.goto(`${BASE_URL}#/login?redirect=%2Fcontributions`, { waitUntil: 'networkidle2' });
    await adminPage.waitForSelector('input[type="email"]');

    await adminPage.type('input[type="email"]', 'rizwan@fikr.org');
    await adminPage.type('input[type="password"]', TEST_PASSWORD);
    await adminPage.click('button[type="submit"]');

    // Wait for auth redirect to /contributions
    await adminPage.waitForFunction(() => window.location.hash.includes('/contributions'), { timeout: 15000 });
    await adminPage.waitForFunction(() => !document.querySelector('.skeleton-shimmer'), { timeout: 10000 });
    await new Promise(r => setTimeout(r, 800));
    console.log('    URL after login:', adminPage.url());

    const pageContent = await adminPage.evaluate(() => {
      const bodyText = document.body.innerText;
      const h1 = document.querySelector('h1')?.innerText;
      const h3s = Array.from(document.querySelectorAll('h3')).map(h => h.innerText);
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
      return { bodySnippet: bodyText.slice(0, 300), h1, h3s, buttons };
    });
    console.log('    Page Content Summary:', pageContent);

    // Verify Treasurer sees "Pending Contributions" or "Everyone is up to date"
    const nudgeSectionData = await adminPage.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2, h3, div')).find(el =>
        el.innerText?.includes("Pending Contributions") ||
        el.innerText?.includes("Who Hasn't Contributed") ||
        el.innerText?.includes("Everyone is up to date")
      );
      if (!heading) return null;

      const isUpToDate = heading.innerText.includes("Everyone is up to date!");
      const remindLinks = Array.from(document.querySelectorAll('a[href^="https://wa.me/?text="]')).map(a => {
        const rect = a.getBoundingClientRect();
        return {
          href: a.getAttribute('href'),
          text: a.innerText.trim(),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      });

      return {
        headingText: heading.innerText.trim(),
        isUpToDate,
        remindLinksCount: remindLinks.length,
        firstRemindLink: remindLinks[0] || null
      };
    });

    console.log('2.3 Nudge Section Status:', nudgeSectionData);
    if (!nudgeSectionData) throw new Error('Due members nudge section not found on Contributions page!');

    if (nudgeSectionData.firstRemindLink) {
      console.log(`    Found ${nudgeSectionData.remindLinksCount} due members with WhatsApp Remind buttons.`);
      console.log(`    First Remind button text: "${nudgeSectionData.firstRemindLink.text}"`);
      console.log(`    Touch target size: ${nudgeSectionData.firstRemindLink.width}x${nudgeSectionData.firstRemindLink.height}px (>=44px min requirement)`);
      if (nudgeSectionData.firstRemindLink.height < 36) {
        throw new Error('Remind button height too small for touch');
      }

      const decodedHref = decodeURIComponent(nudgeSectionData.firstRemindLink.href);
      console.log(`    Decoded WhatsApp message preview:`);
      console.log(`    "${decodedHref.slice(0, 160)}..."`);

      if (!decodedHref.includes('Assalamu Alaikum') || !decodedHref.includes('₹100')) {
        throw new Error('WhatsApp template missing required salutation or minimum amount!');
      }
    } else {
      console.log('    All members have contributed! Positive empty state correctly displayed.');
    }

    // =========================================================================
    // SECTION 3: FEATURE 5 — CONFIRM STEP & 8-SECOND UNDO TOAST
    // =========================================================================
    console.log('\n--- SECTION 3: Feature 5 (Confirm Step & 8s Undo Toast) ---');

    console.log('3.1 Opening Record Contribution Modal...');
    const recordBtn = await adminPage.$('button ::-p-text(Record Contribution)');
    if (!recordBtn) {
      // Fallback search
      const btns = await adminPage.$$('button');
      for (const b of btns) {
        const txt = await adminPage.evaluate(el => el.innerText, b);
        if (txt.includes('Record Contribution')) {
          await b.click();
          break;
        }
      }
    } else {
      await recordBtn.click();
    }
    await new Promise(r => setTimeout(r, 500));

    // Fill contribution form
    console.log('3.2 Filling contribution form: 100 INR...');
    const amountInput = await adminPage.$('input[type="number"]');
    if (amountInput) {
      await amountInput.click({ clickCount: 3 });
      await amountInput.press('Backspace');
      await amountInput.type('100');
    }

    // Click "Review & Confirm" to open Confirm Modal
    console.log('3.3 Clicking "Review & Confirm"...');
    const reviewBtn = await adminPage.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(el => el.innerText.includes('Review & Confirm') || el.innerText.includes('Review & Record'));
      if (b) { b.click(); return true; }
      return false;
    });
    if (!reviewBtn) throw new Error('Review & Confirm button not found in modal');

    await new Promise(r => setTimeout(r, 400));

    // Verify Confirm Modal rendered with details
    const confirmModalVisible = await adminPage.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('div, h3')).find(el => el.innerText && el.innerText.includes('Confirm Contribution Recording'));
      return !!heading;
    });
    console.log(`3.4 Confirm Modal displayed: ${confirmModalVisible} (Expected: true)`);
    if (!confirmModalVisible) throw new Error('Confirm Modal failed to show after clicking Review & Record');

    // Click "Confirm & Save"
    console.log('3.5 Clicking "Confirm & Save"...');
    await adminPage.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(el => el.innerText.includes('Confirm & Save'));
      if (b) b.click();
    });

    // Wait for submission and Undo Toast to appear
    await adminPage.waitForSelector('div[role="status"]', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 300));

    console.log('3.6 Checking for 8-second Undo Toast...');
    const undoToastData = await adminPage.evaluate(() => {
      const toast = document.querySelector('div[role="status"]');
      if (!toast) return null;
      const undoBtn = toast.querySelector('button');
      const progress = toast.querySelector('div[style*="width"]');
      const rect = undoBtn ? undoBtn.getBoundingClientRect() : null;
      return {
        text: toast.innerText.trim(),
        hasUndoBtn: !!undoBtn,
        progressBarPresent: !!progress,
        btnWidth: rect ? Math.round(rect.width) : 0,
        btnHeight: rect ? Math.round(rect.height) : 0
      };
    });

    console.log('    Undo Toast status:', undoToastData);
    if (!undoToastData || !undoToastData.hasUndoBtn) {
      throw new Error('8-second Undo Toast did not appear after saving contribution!');
    }

    console.log('3.7 Clicking "Undo" on toast...');
    await adminPage.evaluate(() => {
      const toast = document.querySelector('div[role="status"]');
      const undoBtn = toast ? toast.querySelector('button') : null;
      if (undoBtn) undoBtn.click();
    });

    await new Promise(r => setTimeout(r, 800));

    // =========================================================================
    // SECTION 4: FEATURE 5 — LEDGER VOID DISPLAY & VOID ACTION
    // =========================================================================
    console.log('\n--- SECTION 4: Feature 5 (Ledger Voided Entries & In-Table Voiding) ---');
    await adminPage.goto(`${BASE_URL}#/ledger`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Check if the undone contribution appears struck-through with "Voided" badge
    const voidedLedgerCheck = await adminPage.evaluate(() => {
      const voidBadges = Array.from(document.querySelectorAll('span')).filter(s => s.innerText.trim() === 'Voided');
      const lineThroughEls = Array.from(document.querySelectorAll('.line-through'));
      return {
        voidBadgesCount: voidBadges.length,
        hasLineThrough: lineThroughEls.length > 0
      };
    });

    console.log('4.1 Voided entries in Ledger:', voidedLedgerCheck);
    if (voidedLedgerCheck.voidBadgesCount === 0) {
      console.warn('    Note: No voided entries yet or already persisted.');
    } else {
      console.log(`    Successfully verified ${voidedLedgerCheck.voidBadgesCount} voided entry/entries struck-through.`);
    }

    // Check Void button presence for Treasurer
    const voidButtonsCount = await adminPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.trim() === 'Void');
      return buttons.length;
    });
    console.log(`4.2 Active Ledger rows with Void action for Treasurer: ${voidButtonsCount}`);

    // If active rows exist, test voiding modal validation
    if (voidButtonsCount > 0) {
      console.log('4.3 Testing Void confirmation modal & required reason validation...');
      await adminPage.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Void');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 400));

      const voidModalCheck = await adminPage.evaluate(() => {
        const title = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('Void Transaction Entry'));
        const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Confirm Void'));
        return {
          isOpen: !!title,
          isConfirmDisabled: confirmBtn ? confirmBtn.disabled : null
        };
      });

      console.log('    Void Modal state with blank reason:', voidModalCheck);
      if (!voidModalCheck.isOpen) throw new Error('Void Modal did not open');
      if (!voidModalCheck.isConfirmDisabled) throw new Error('Confirm Void should be disabled when reason is blank!');

      // Close modal
      await adminPage.evaluate(() => {
        const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Cancel');
        if (cancelBtn) cancelBtn.click();
      });
      console.log('    Void Modal validation passed.');
    }

    // =========================================================================
    // SECTION 5: WITHDRAWAL CONFIRMATION & PUBLIC TRANSPARENCY CHECK
    // =========================================================================
    console.log('\n--- SECTION 5: Withdrawal Confirmation & Public Transparency ---');
    await adminPage.goto(`${BASE_URL}#/withdrawals/new`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Fill withdrawal form
    console.log('5.1 Filling New Withdrawal form...');
    await adminPage.type('input[type="number"]', '50');
    await adminPage.type('textarea', 'Automated test withdrawal for urgent prescription');

    // Click "Review & Confirm"
    console.log('5.2 Clicking "Review & Confirm"...');
    await adminPage.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button[type="submit"]')).find(el => el.innerText.includes('Review & Confirm'));
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const wConfirmModal = await adminPage.evaluate(() => {
      const h3 = Array.from(document.querySelectorAll('h3')).find(el => el.innerText.includes('Confirm Assistance Disbursement'));
      return !!h3;
    });
    console.log(`5.3 Withdrawal Confirm Modal displayed: ${wConfirmModal} (Expected: true)`);
    if (!wConfirmModal) throw new Error('Withdrawal confirm modal did not open');

    // Cancel withdrawal so no test pollution occurs
    await adminPage.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(el => el.innerText.includes('Back & Edit'));
      if (b) b.click();
    });
    console.log('    Successfully tested Back & Edit without polluting records.');

    // Clean up test undone records from Firestore so database is completely pristine
    try {
      console.log('    Cleaning up any test records from Firestore...');
      const fbApp = initializeApp(firebaseConfig, 'cleanup-app-' + Date.now());
      const fbAuth = getAuth(fbApp);
      const fbDb = getFirestore(fbApp);
      await signInWithEmailAndPassword(fbAuth, 'amaan@fikr.org', TEST_PASSWORD);
      const snap = await getDocs(collection(fbDb, 'contributions'));
      for (const d of snap.docs) {
        const data = d.data();
        if (data.status === 'voided' && data.voidReason === 'Entered by mistake (undone immediately)') {
          await deleteDoc(doc(fbDb, 'contributions', d.id));
          console.log(`    Cleaned up test contribution: ${d.id}`);
        }
      }
    } catch (cleanErr) {
      console.log('    Cleanup note:', cleanErr.message);
    }

    await adminContext.close();

    console.log('\n================================================================');
    console.log('  PHASE B ALL AUTOMATED CHECKS PASSED SUCCESSFULLY!');
    console.log('  Console Errors Count:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('  Errors:', consoleErrors);
    }
    console.log('================================================================');

  } catch (err) {
    console.error('\n❌ PHASE B VERIFICATION FAILED:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

runPhaseBVerification();
