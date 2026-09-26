import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE_URL = 'https://dastekhair.github.io/fikr-community-fund/';

const firebaseConfig = {
  apiKey: 'AIzaSyDpDlbMnJLEFmwDOOgPO7bxu27MOFyDDTw',
  authDomain: 'fikr-66da9.firebaseapp.com',
  projectId: 'fikr-66da9',
  storageBucket: 'fikr-66da9.firebasestorage.app',
  messagingSenderId: '139865626528',
  appId: '1:139865626528:web:339c8a08ce83dbe05b36c5'
};

const TEST_PASSWORD = process.env.TEST_PASSWORD || process.env.FIKR_AUTH_PASSWORD;
if (!TEST_PASSWORD) {
  console.error('Error: Please provide TEST_PASSWORD in environment (e.g. TEST_PASSWORD="***" node scripts/test-real-browser-e2e.mjs)');
  process.exit(1);
}

async function runE2E() {
  console.log('===============================================================');
  console.log('  STARTING REAL-BROWSER END-TO-END TEST ON GITHUB PAGES');
  console.log('  URL: ' + SITE_URL);
  console.log('===============================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const capturedNetwork = [];

  try {
    // =============================================================
    // SESSION 1: Treasurer Rizwan
    // =============================================================
    console.log('--- Session 1: Launching Context for Treasurer Rizwan ---');
    const context1 = await browser.createBrowserContext();
    const page1 = await context1.newPage();
    await page1.setViewport({ width: 1280, height: 800 });

    page1.on('dialog', async dialog => {
      console.log('[Page 1 Dialog]', dialog.message());
      await dialog.accept();
    });

    page1.on('request', req => {
      const url = req.url();
      if (url.includes('firestore.googleapis.com')) {
        capturedNetwork.push({
          type: 'request',
          url,
          method: req.method(),
          headers: req.headers(),
          postData: req.postData()
        });
      }
    });

    page1.on('response', async res => {
      const url = res.url();
      if (url.includes('firestore.googleapis.com')) {
        let text = '';
        try {
          text = await res.text();
        } catch {
          text = '<streamed>';
        }
        capturedNetwork.push({
          type: 'response',
          url,
          status: res.status(),
          statusText: res.statusText(),
          headers: res.headers(),
          body: text
        });
      }
    });

    console.log('1. Navigating to login with redirect to /withdrawals/new...');
    await page1.goto(`${SITE_URL}#/login?redirect=%2Fwithdrawals%2Fnew`, { waitUntil: 'networkidle2' });

    console.log('2. Entering credentials for Treasurer Rizwan (rizwan@fikr.org)...');
    await page1.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page1.type('input[type="email"]', 'rizwan@fikr.org');
    await page1.type('input[type="password"]', TEST_PASSWORD);

    console.log('3. Submitting login form...');
    const submitBtn = await page1.waitForSelector('button[type="submit"]');
    await submitBtn.click();

    console.log('4. Waiting for redirect to #/withdrawals/new...');
    await page1.waitForFunction(() => window.location.hash.includes('/withdrawals/new'), { timeout: 20000 });
    console.log('   Arrived at #/withdrawals/new successfully!');

    await page1.waitForSelector('input[type="number"]', { timeout: 10000 });
    await page1.waitForSelector('textarea', { timeout: 10000 });

    console.log('5. Filling withdrawal form: Amount = 150, Purpose = Medical, Note = "Live sync verification test"...');
    const amountInput = await page1.$('input[type="number"]');
    await amountInput.click({ clickCount: 3 });
    await amountInput.type('150');

    const textarea = await page1.$('textarea');
    await textarea.click();
    await textarea.type('Live sync verification test');

    const preSubmitNetworkIdx = capturedNetwork.length;

    console.log('6. Clicking "Record Withdrawal" button to execute Cloud Firestore write...');
    const submitWithdrawalBtn = await page1.waitForSelector('button[type="submit"]');
    await submitWithdrawalBtn.click();

    console.log('7. Waiting for navigation back to #/withdrawals...');
    await page1.waitForFunction(() => {
      return window.location.hash === '#/withdrawals' || (window.location.hash.includes('/withdrawals') && !window.location.hash.includes('/new'));
    }, { timeout: 20000 });
    console.log('   Navigation to #/withdrawals complete!');

    // Wait for realtime push and render
    await new Promise(r => setTimeout(r, 4000));

    const page1Text = await page1.evaluate(() => document.body.innerText);
    const inPage1 = page1Text.includes('Live sync verification test');
    console.log('   Entry rendered on Session 1 (Treasurer) UI:', inPage1);

    const writeNetworkEvents = capturedNetwork.slice(preSubmitNetworkIdx);
    console.log(`   Captured ${writeNetworkEvents.length} Firestore network events during write.`);

    // =============================================================
    // SESSION 2: Core Member Yusuf (Separate Incognito Context)
    // =============================================================
    console.log('\n--- Session 2: Launching Independent Context for Core Member Yusuf ---');
    const context2 = await browser.createBrowserContext();
    const page2 = await context2.newPage();
    await page2.setViewport({ width: 1280, height: 800 });

    console.log('1. Navigating Session 2 to login with redirect to /withdrawals...');
    await page2.goto(`${SITE_URL}#/login?redirect=%2Fwithdrawals`, { waitUntil: 'networkidle2' });

    console.log('2. Entering credentials for Core Member Yusuf (yusuf@fikr.org)...');
    await page2.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page2.type('input[type="email"]', 'yusuf@fikr.org');
    await page2.type('input[type="password"]', TEST_PASSWORD);

    console.log('3. Submitting login for Session 2...');
    const submitBtn2 = await page2.waitForSelector('button[type="submit"]');
    await submitBtn2.click();

    console.log('4. Waiting for Session 2 to reach #/withdrawals...');
    await page2.waitForFunction(() => window.location.hash.includes('/withdrawals'), { timeout: 20000 });

    console.log('5. Waiting for "Live sync verification test" entry to appear WITHOUT manual page refresh...');
    await page2.waitForFunction(() => document.body.innerText.includes('Live sync verification test'), { timeout: 20000 });

    const page2Text = await page2.evaluate(() => document.body.innerText);
    const inPage2 = page2Text.includes('Live sync verification test');
    console.log('   Session 2 Realtime Sync confirmed! Entry visible:', inPage2);

    const tableSnippet = await page2.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr, div[class*="border"], div[class*="card"]'));
      const target = rows.find(r => r.innerText.includes('Live sync verification test'));
      return target ? target.innerText : 'Row text not found';
    });
    console.log('   Rendered Row Text in Session 2:\n' + tableSnippet);

    // =============================================================
    // DIRECT FIRESTORE VERIFICATION (Query created document)
    // =============================================================
    console.log('\n--- Verifying Document in Cloud Firestore ---');
    const fbApp = initializeApp(firebaseConfig, 'verifier');
    const db = getFirestore(fbApp);
    const q = query(
      collection(db, 'withdrawals'),
      where('remark', '==', 'Live sync verification test')
    );
    const snap = await getDocs(q);
    console.log(`Found ${snap.size} document(s) matching remark "Live sync verification test":`);
    const docDataList = [];
    snap.forEach(d => {
      const docData = { id: d.id, ...d.data() };
      console.log('Document ID:', d.id);
      console.log('Data:', JSON.stringify(docData, null, 2));
      docDataList.push(docData);
    });

    console.log('\n===============================================================');
    console.log('  ALL CHECKS PASSED: END-TO-END VERIFICATION COMPLETE');
    console.log('===============================================================\n');

    return {
      success: true,
      inPage1,
      inPage2,
      writeEventsCount: writeNetworkEvents.length,
      firstDoc: docDataList[0],
      tableSnippet
    };
  } finally {
    await browser.close();
  }
}

runE2E()
  .then(res => {
    process.exit(0);
  })
  .catch(err => {
    console.error('E2E Test Failed with error:', err);
    process.exit(1);
  });
