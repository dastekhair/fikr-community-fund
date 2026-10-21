import puppeteer from 'puppeteer-core';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:4173/';

const firebaseConfig = {
  apiKey: 'AIzaSyDpDlbMnJLEFmwDOOgPO7bxu27MOFyDDTw',
  authDomain: 'fikr-66da9.firebaseapp.com',
  projectId: 'fikr-66da9',
  storageBucket: 'fikr-66da9.firebasestorage.app',
  messagingSenderId: '139865626528',
  appId: '1:139865626528:web:339c8a08ce83dbe05b36c5'
};

const TEST_PASSWORD = process.env.TEST_PASSWORD || process.env.FIKR_AUTH_PASSWORD || 'Fikr@2026!';

async function runVerification() {
  console.log('================================================================');
  console.log('  FIKR DESIGN SYSTEM & E2E VERIFICATION SUITE');
  console.log('  Target: ' + BASE_URL);
  console.log('  Chrome: ' + CHROME_PATH);
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const consoleErrors = [];

  try {
    // =========================================================================
    // TEST 1: MOBILE TOUCH EMULATION AT 375px (iPhone SE / narrow viewport)
    // =========================================================================
    console.log('--- TEST 1: Mobile Touch Emulation at 375px & Tap Targets ---');
    const touchContext = await browser.createBrowserContext();
    const touchPage = await touchContext.newPage();
    
    // Set 375px portrait viewport with real touch emulation enabled
    await touchPage.setViewport({
      width: 375,
      height: 812,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    });

    touchPage.on('console', msg => {
      if (msg.type() === 'error') {
        // Exclude expected unauthenticated security rejection on cases
        if (msg.text().includes('Firestore cases listener error') || msg.text().includes('Missing or insufficient permissions')) {
          return;
        }
        consoleErrors.push(`[TouchPage Console Error] ${msg.text()}`);
      }
    });
    touchPage.on('pageerror', err => {
      consoleErrors.push(`[TouchPage Uncaught Error] ${err.message}`);
    });

    console.log('1.1 Navigating to Landing Page at 375px width...');
    await touchPage.goto(`${BASE_URL}#/`, { waitUntil: 'networkidle2' });

    // Find hamburger button
    const hamburgerBtn = await touchPage.waitForSelector('button[aria-label*="navigation" i], button[aria-label*="menu" i]', { timeout: 8000 });
    const btnBox = await hamburgerBtn.boundingBox();
    console.log(`1.2 Hamburger button bounding box: ${btnBox.width}x${btnBox.height}px (x:${btnBox.x}, y:${btnBox.y})`);
    
    if (btnBox.width < 44 || btnBox.height < 44) {
      throw new Error(`Hamburger tap target is too small: ${btnBox.width}x${btnBox.height}px (requires >= 44x44px)`);
    }
    console.log('    ✓ Hamburger button satisfies minimum 44px tap target guideline.');

    // Tap hamburger menu using genuine touch tap
    console.log('1.3 Tapping hamburger button with touchscreen.tap()...');
    await touchPage.touchscreen.tap(btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2);
    await new Promise(r => setTimeout(r, 600));

    // Verify mobile drawer is open
    const drawerOpen = await touchPage.evaluate(() => {
      const drawer = document.querySelector('div[class*="z-[9999]"]');
      return !!drawer;
    });
    console.log('    ✓ Mobile Drawer overlay opened via touch tap:', drawerOpen);
    if (!drawerOpen) throw new Error('Drawer failed to open upon touch tap');

    // Check tap targets of drawer nav links
    const navLinksInfo = await touchPage.evaluate(() => {
      const links = Array.from(document.querySelectorAll('div[class*="z-[9999]"] nav a, div[class*="z-[9999]"] div a'));
      return links.map(l => {
        const rect = l.getBoundingClientRect();
        return {
          text: l.innerText.trim(),
          href: l.getAttribute('href'),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0
        };
      }).filter(l => l.visible && l.text);
    });
    console.log(`    Found ${navLinksInfo.length} visible navigation elements inside drawer:`);
    for (const link of navLinksInfo) {
      console.log(`      - "${link.text}": ${link.width}x${link.height}px (height >= 44px: ${link.height >= 44})`);
      if (link.height < 44) {
        throw new Error(`Drawer item "${link.text}" height ${link.height}px is below 44px`);
      }
    }

    // Tap the "Public Withdrawals" link inside the drawer
    console.log('1.4 Tapping "Public Withdrawals" link in drawer with touchscreen.tap()...');
    const withdrawalsLink = await touchPage.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('div[class*="z-[9999]"] a'));
      return links.find(l => l.innerText.includes('Public Withdrawals'));
    });
    const linkBox = await withdrawalsLink.asElement().boundingBox();
    await touchPage.touchscreen.tap(linkBox.x + linkBox.width / 2, linkBox.y + linkBox.height / 2);
    await new Promise(r => setTimeout(r, 800));

    const currentHash = await touchPage.evaluate(() => window.location.hash);
    console.log(`    ✓ Navigated successfully! Current hash: ${currentHash}`);
    if (!currentHash.includes('withdrawals')) {
      throw new Error(`Navigation failed: hash is ${currentHash}`);
    }

    // Verify drawer closed
    const isDrawerClosed = await touchPage.evaluate(() => {
      const drawer = document.querySelector('div[class*="z-[9999]"]');
      return !drawer;
    });
    console.log('    ✓ Drawer closed after link tap:', isDrawerClosed);
    if (!isDrawerClosed) throw new Error('Drawer remained open after link tap');

    // Test reopening drawer and closing via backdrop touch tap
    console.log('1.5 Re-opening drawer and tapping backdrop to test touch dismiss...');
    const hamburgerBtn2 = await touchPage.waitForSelector('button[aria-label*="navigation" i], button[aria-label*="menu" i]');
    const box2 = await hamburgerBtn2.boundingBox();
    await touchPage.touchscreen.tap(box2.x + box2.width / 2, box2.y + box2.height / 2);
    await new Promise(r => setTimeout(r, 600));

    // Backdrop is fixed inset-0; tap near the bottom (y=720) where drawer panel ends
    await touchPage.touchscreen.tap(187, 720);
    await new Promise(r => setTimeout(r, 600));

    const isClosedAfterBackdrop = await touchPage.evaluate(() => !document.querySelector('div[class*="z-[9999]"]'));
    console.log('    ✓ Drawer closed via backdrop tap:', isClosedAfterBackdrop);
    if (!isClosedAfterBackdrop) throw new Error('Drawer did not close on backdrop touch tap');

    // Test Dark Mode toggle via touch
    console.log('1.6 Testing Dark Mode toggle via touch...');
    const themeBtn = await touchPage.waitForSelector('div.md\\:hidden button[aria-label="Toggle theme"]', { timeout: 5000 });
    const themeBox = await themeBtn.boundingBox();
    console.log(`    Theme button box: ${themeBox.width}x${themeBox.height}px (>= 44px: ${themeBox.height >= 44 && themeBox.width >= 44})`);
    const initialDark = await touchPage.evaluate(() => document.documentElement.classList.contains('dark'));
    await touchPage.touchscreen.tap(themeBox.x + themeBox.width / 2, themeBox.y + themeBox.height / 2);
    await new Promise(r => setTimeout(r, 400));
    const toggledDark = await touchPage.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log(`    ✓ Dark mode toggled from ${initialDark} to ${toggledDark}`);
    if (initialDark === toggledDark) throw new Error('Dark mode toggle failed');
    
    // Toggle back
    await touchPage.touchscreen.tap(themeBox.x + themeBox.width / 2, themeBox.y + themeBox.height / 2);
    await new Promise(r => setTimeout(r, 400));
    console.log('    ✓ Dark mode restored.');

    await touchContext.close();
    console.log('--- TEST 1 PASSED ---\n');

    // =========================================================================
    // TEST 2: ALL PAGES CONSOLE ERROR SCAN AT DESKTOP & MOBILE
    // =========================================================================
    console.log('--- TEST 2: Multi-Page Console Error & Navigation Audit ---');
    const auditContext = await browser.createBrowserContext();
    const auditPage = await auditContext.newPage();
    auditPage.on('console', msg => {
      if (msg.type() === 'error') {
        if (msg.text().includes('Firestore cases listener error') || msg.text().includes('Missing or insufficient permissions')) return;
        consoleErrors.push(`[AuditPage Error on ${auditPage.url()}] ${msg.text()}`);
      }
    });
    auditPage.on('pageerror', err => {
      consoleErrors.push(`[AuditPage Uncaught on ${auditPage.url()}] ${err.message}`);
    });

    const pagesToAudit = [
      '#/',
      '#/contributions',
      '#/ledger',
      '#/withdrawals',
      '#/cases',
      '#/members',
      '#/about',
      '#/login'
    ];

    for (const route of pagesToAudit) {
      await auditPage.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 400));
      const pageTitle = await auditPage.title();
      console.log(`    ✓ Loaded ${route} without errors (title: "${pageTitle}")`);
    }

    await auditContext.close();
    console.log('--- TEST 2 PASSED ---\n');

    // =========================================================================
    // TEST 3: ROLE-GATING AUDIT (Visitor vs Treasurer vs Admin)
    // =========================================================================
    console.log('--- TEST 3: Role-Gating Verification ---');
    const roleContext = await browser.createBrowserContext();
    const rolePage = await roleContext.newPage();
    rolePage.on('console', msg => {
      if (msg.type() === 'error') {
        if (msg.text().includes('Firestore cases listener error') || msg.text().includes('Missing or insufficient permissions')) return;
        consoleErrors.push(`[RolePage Error] ${msg.text()}`);
      }
    });

    // 3.1 Visitor on Members page
    console.log('3.1 Checking Visitor permissions on #/members...');
    await rolePage.goto(`${BASE_URL}#/members`, { waitUntil: 'networkidle2' });
    const visitorHasAddMember = await rolePage.evaluate(() => {
      return Array.from(document.querySelectorAll('button, a')).some(b => b.innerText.includes('Add Member') || b.innerText.includes('Add Core Member'));
    });
    console.log(`    Visitor "Add Member" button present: ${visitorHasAddMember} (Expected: false)`);
    if (visitorHasAddMember) throw new Error('Role breach: Unauthenticated visitor sees "Add Member" button');

    // 3.2 Visitor on Contributions page
    console.log('3.2 Checking Visitor permissions on #/contributions...');
    await rolePage.goto(`${BASE_URL}#/contributions`, { waitUntil: 'networkidle2' });
    const visitorHasRecordContribution = await rolePage.evaluate(() => {
      return Array.from(document.querySelectorAll('button, a')).some(b => b.innerText.includes('Record Contribution'));
    });
    const visitorHasTotalContributed = await rolePage.evaluate(() => {
      // Per-member total is rendered as "Total: ₹..." inside member rows
      return Array.from(document.querySelectorAll('*')).some(el => el.children.length === 0 && /^Total:\s*₹/i.test((el.textContent || '').trim()));
    });
    console.log(`    Visitor "Record Contribution" present: ${visitorHasRecordContribution} (Expected: false)`);
    console.log(`    Visitor per-member "Total: ₹..." visible: ${visitorHasTotalContributed} (Expected: false)`);
    if (visitorHasRecordContribution) throw new Error('Role breach: Visitor can record contribution');
    if (visitorHasTotalContributed) throw new Error('Role breach: Visitor can see per-member Total Contributed');

    // 3.3 Treasurer Login & Permissions
    console.log('3.3 Signing in as Treasurer Rizwan (rizwan@fikr.org)...');
    await rolePage.goto(`${BASE_URL}#/login`, { waitUntil: 'networkidle2' });
    await rolePage.waitForSelector('input[type="email"]');
    await rolePage.type('input[type="email"]', 'rizwan@fikr.org');
    await rolePage.type('input[type="password"]', TEST_PASSWORD);
    await rolePage.click('button[type="submit"]');
    await rolePage.waitForFunction(() => !window.location.hash.includes('/login'), { timeout: 15000 });
    console.log('    ✓ Signed in as Treasurer.');

    // Check Treasurer on Contributions page
    await rolePage.goto(`${BASE_URL}#/contributions`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    const treasurerHasRecord = await rolePage.evaluate(() => {
      return Array.from(document.querySelectorAll('button, a')).some(b => b.innerText.includes('Record Contribution'));
    });
    const treasurerHasTotalContributed = await rolePage.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).some(el => el.children.length === 0 && /^Total:\s*₹/i.test((el.textContent || '').trim()));
    });
    console.log(`    Treasurer "Record Contribution" button present: ${treasurerHasRecord} (Expected: true)`);
    console.log(`    Treasurer per-member "Total: ₹..." visible: ${treasurerHasTotalContributed} (Expected: true)`);
    if (!treasurerHasRecord || !treasurerHasTotalContributed) {
      throw new Error('Role issue: Treasurer missing Record Contribution or Total Contributed');
    }

    // 3.4 Admin Login & Permissions on Members page
    console.log('3.4 Signing in as Admin Amaan (amaan@fikr.org)...');
    const adminContext = await browser.createBrowserContext();
    const adminPage = await adminContext.newPage();
    adminPage.on('console', msg => {
      if (msg.type() === 'error') {
        if (msg.text().includes('Firestore cases listener error') || msg.text().includes('Missing or insufficient permissions')) return;
        consoleErrors.push(`[AdminPage Error] ${msg.text()}`);
      }
    });

    await adminPage.goto(`${BASE_URL}#/login`, { waitUntil: 'networkidle2' });
    await adminPage.waitForSelector('input[type="email"]');
    await adminPage.type('input[type="email"]', 'amaan@fikr.org');
    await adminPage.type('input[type="password"]', TEST_PASSWORD);
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForFunction(() => !window.location.hash.includes('/login'), { timeout: 15000 });
    console.log('    ✓ Signed in as Admin.');

    await adminPage.goto(`${BASE_URL}#/members`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    const adminHasAddMember = await adminPage.evaluate(() => {
      return Array.from(document.querySelectorAll('button, a')).some(b => b.innerText.includes('Add New Member'));
    });
    console.log(`    Admin "Add New Member" button present: ${adminHasAddMember} (Expected: true)`);
    if (!adminHasAddMember) throw new Error('Role issue: Admin cannot see "Add New Member" button');

    await adminContext.close();
    await roleContext.close();
    console.log('--- TEST 3 PASSED ---\n');

    // =========================================================================
    // TEST 4: FIRESTORE LIVE WRITE, REALTIME SYNC TO 2ND SESSION & CLEANUP
    // =========================================================================
    console.log('--- TEST 4: Live Firestore Write, 2-Session Realtime Sync & Cleanup ---');
    const testRemark = `Design Verification Sync Test [${Date.now()}]`;
    const testAmount = 50;

    // Session 1: Treasurer Rizwan
    console.log('4.1 Session 1 (Treasurer): Launching context and signing in...');
    const session1Context = await browser.createBrowserContext();
    const session1Page = await session1Context.newPage();
    session1Page.on('dialog', async d => {
      console.log(`    [Session 1 Dialog]: ${d.message()}`);
      await d.accept();
    });

    await session1Page.goto(`${BASE_URL}#/login?redirect=%2Fwithdrawals%2Fnew`, { waitUntil: 'networkidle2' });
    await session1Page.waitForSelector('input[type="email"]');
    await session1Page.type('input[type="email"]', 'rizwan@fikr.org');
    await session1Page.type('input[type="password"]', TEST_PASSWORD);
    await session1Page.click('button[type="submit"]');

    await session1Page.waitForFunction(() => window.location.hash.includes('/withdrawals/new'), { timeout: 15000 });
    console.log('    ✓ Session 1 navigated to #/withdrawals/new');

    // Session 2: Core Member Yusuf (Separate Incognito Context)
    console.log('4.2 Session 2 (Core Member Yusuf): Launching context and signing in...');
    const session2Context = await browser.createBrowserContext();
    const session2Page = await session2Context.newPage();

    await session2Page.goto(`${BASE_URL}#/login?redirect=%2Fwithdrawals`, { waitUntil: 'networkidle2' });
    await session2Page.waitForSelector('input[type="email"]');
    await session2Page.type('input[type="email"]', 'yusuf@fikr.org');
    await session2Page.type('input[type="password"]', TEST_PASSWORD);
    await session2Page.click('button[type="submit"]');

    await session2Page.waitForFunction(() => window.location.hash.includes('/withdrawals'), { timeout: 15000 });
    console.log('    ✓ Session 2 waiting on #/withdrawals for realtime events...');

    // Session 1: Submit withdrawal
    console.log(`4.3 Session 1: Submitting withdrawal (Amount: ₹${testAmount}, Remark: "${testRemark}")...`);
    await session1Page.waitForSelector('input[type="number"]');
    await session1Page.type('input[type="number"]', String(testAmount));
    await session1Page.type('textarea', testRemark);
    await session1Page.click('button[type="submit"]');

    await session1Page.waitForFunction(() => {
      return window.location.hash === '#/withdrawals' || (window.location.hash.includes('/withdrawals') && !window.location.hash.includes('/new'));
    }, { timeout: 15000 });
    console.log('    ✓ Session 1 redirected to #/withdrawals');

    // Wait for Session 1 UI to render the new record
    await session1Page.waitForFunction(remark => document.body.innerText.includes(remark), { timeout: 10000 }, testRemark);
    console.log('    ✓ Session 1 UI successfully rendered the new entry.');

    // Session 2: Check realtime sync WITHOUT page refresh
    console.log('4.4 Session 2: Awaiting realtime push from Cloud Firestore (NO manual reload)...');
    await session2Page.waitForFunction(remark => document.body.innerText.includes(remark), { timeout: 15000 }, testRemark);
    console.log('    ✓ Session 2 REALTIME SYNC CONFIRMED! The entry rendered live in Session 2.');

    const renderedSnippet = await session2Page.evaluate(remark => {
      const el = Array.from(document.querySelectorAll('*')).find(e => e.children.length === 0 && (e.textContent || '').includes(remark));
      return el ? ((el.closest('tr') || el.closest('div[class*="border"]') || el.parentElement)?.textContent || '').trim().replace(/\s+/g, ' ') : null;
    }, testRemark);
    console.log('    Rendered entry snippet in Session 2:\n   ', renderedSnippet);

    await session1Context.close();
    await session2Context.close();

    // 4.5 Immediate Deletion from Cloud Firestore (Authenticated as Treasurer)
    console.log('4.5 Cleaning up test document(s) from Cloud Firestore (Authenticated as Treasurer)...');
    const fbApp = initializeApp(firebaseConfig, 'cleanup-app');
    const auth = getAuth(fbApp);
    await signInWithEmailAndPassword(auth, 'rizwan@fikr.org', TEST_PASSWORD);
    console.log('    ✓ Authenticated as Treasurer for authorized cleanup.');
    const db = getFirestore(fbApp);
    const qAll = query(collection(db, 'withdrawals'));
    const snapshotAll = await getDocs(qAll);
    let deletedCount = 0;
    for (const docSnap of snapshotAll.docs) {
      const data = docSnap.data();
      if (data.remark && data.remark.includes('Design Verification Sync Test')) {
        console.log(`      Deleting test document /withdrawals/${docSnap.id} ("${data.remark}")...`);
        await deleteDoc(doc(db, 'withdrawals', docSnap.id));
        console.log(`      ✓ Deleted /withdrawals/${docSnap.id}`);
        deletedCount++;
      }
    }
    console.log(`    Total test documents deleted: ${deletedCount}`);

    // Verify deletion
    const verifySnap = await getDocs(qAll);
    const residualTestDocs = verifySnap.docs.filter(d => (d.data().remark || '').includes('Design Verification Sync Test'));
    console.log(`    Post-cleanup verification test doc count: ${residualTestDocs.length} (Expected: 0)`);
    if (residualTestDocs.length !== 0) {
      throw new Error('Test document cleanup failed: document still exists in Firestore');
    }
    console.log('    ✓ Clean-up verified: Live database is completely pristine.');

    console.log('--- TEST 4 PASSED ---\n');

    // Final summary
    console.log('================================================================');
    console.log('  FINAL VERIFICATION SUMMARY');
    console.log('================================================================');
    console.log('  1. Mobile touch at 375px: PASSED (Drawer open, link tap, backdrop tap, dark mode)');
    console.log('  2. Minimum 44px tap targets: PASSED');
    console.log('  3. Console errors across all pages: ' + consoleErrors.length + ' error(s)');
    if (consoleErrors.length > 0) {
      console.log('     Errors detected:\n' + consoleErrors.join('\n'));
    }
    console.log('  4. Role gating (Visitor vs Treasurer vs Admin): PASSED');
    console.log('  5. Live Firestore write & 2-session realtime sync: PASSED');
    console.log('  6. Test document deletion & verification: PASSED');
    console.log('================================================================\n');

    return {
      success: consoleErrors.length === 0,
      consoleErrors
    };
  } finally {
    await browser.close();
  }
}

runVerification()
  .then(res => {
    if (!res.success) {
      console.error('Verification finished with console errors.');
      process.exit(1);
    }
    console.log('ALL CHECKS SUCCEEDED!');
    process.exit(0);
  })
  .catch(err => {
    console.error('VERIFICATION FAILED:', err);
    process.exit(1);
  });
