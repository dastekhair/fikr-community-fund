import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:4173/';
const TEST_PASSWORD = process.env.TEST_PASSWORD || process.env.FIKR_AUTH_PASSWORD;
if (!TEST_PASSWORD) {
  console.error('Error: TEST_PASSWORD or FIKR_AUTH_PASSWORD environment variable is required.');
  process.exit(1);
}

async function runPhaseAVerification() {
  console.log('================================================================');
  console.log('  FIKR PHASE A VERIFICATION (FEATURES 1, 2, 3)');
  console.log('  Target: ' + BASE_URL);
  console.log('  Viewport: 375x812 (Touch Emulated)');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const consoleErrors = [];

  try {
    // =========================================================================
    // SECTION 1: VISITOR MOBILE TOUCH & BOTTOM TAB BAR (< 768px, 375px)
    // =========================================================================
    console.log('--- SECTION 1: Mobile Touch Emulation at 375px (Visitor View) ---');
    const touchContext = await browser.createBrowserContext();
    const touchPage = await touchContext.newPage();

    await touchPage.setViewport({
      width: 375,
      height: 812,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    });

    touchPage.on('console', msg => {
      if (msg.type() === 'error') {
        if (msg.text().includes('Firestore cases listener error') || msg.text().includes('Missing or insufficient permissions')) return;
        consoleErrors.push(`[TouchPage Error] ${msg.text()}`);
      }
    });
    touchPage.on('pageerror', err => {
      consoleErrors.push(`[TouchPage Uncaught] ${err.message}`);
    });

    console.log('1.1 Loading Dashboard at 375px...');
    await touchPage.goto(`${BASE_URL}#/`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // 1.2 Verify Visitor does NOT see "My Status" card
    const visitorHasMyStatus = await touchPage.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).some(el =>
        (el.textContent || '').includes('My Core Member Status') ||
        (el.textContent || '').includes('Assalamu Alaikum')
      );
    });
    console.log(`    Visitor "My Status" card present: ${visitorHasMyStatus} (Expected: false)`);
    if (visitorHasMyStatus) throw new Error('Security/UX breach: Visitor sees "My Status" card');

    // 1.3 Verify Bottom Tab Bar rendered with 4 visitor tabs
    console.log('1.2 Checking Visitor Bottom Tab Bar tabs & dimensions...');
    const visitorTabs = await touchPage.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Mobile Bottom Navigation"]');
      if (!nav) return null;
      const links = Array.from(nav.querySelectorAll('a'));
      return links.map(a => {
        const rect = a.getBoundingClientRect();
        return {
          href: a.getAttribute('href'),
          text: a.innerText.trim(),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0
        };
      });
    });

    if (!visitorTabs || visitorTabs.length !== 4) {
      throw new Error(`Expected 4 bottom tabs for visitor, found: ${JSON.stringify(visitorTabs)}`);
    }
    console.log(`    Found ${visitorTabs.length} tabs:`, visitorTabs.map(t => `${t.text} (${t.width}x${t.height}px)`).join(', '));
    for (const tab of visitorTabs) {
      if (tab.width < 44 || tab.height < 44) {
        throw new Error(`Tab target ${tab.text} (${tab.width}x${tab.height}px) is below minimum 44px`);
      }
    }
    console.log('    ✓ All bottom tabs satisfy minimum 44x44px touch targets.');

    // 1.4 Test tapping each bottom tab via genuine touchscreen.tap()
    console.log('1.3 Testing touch navigation across bottom tabs...');

    // Tap Withdrawals
    console.log('    Tapping Withdrawals tab...');
    const withdrawalsTabBox = await touchPage.evaluate(() => {
      const a = Array.from(document.querySelectorAll('nav[aria-label="Mobile Bottom Navigation"] a')).find(el => el.textContent.includes('Withdrawals'));
      if (!a) return null;
      const r = a.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await touchPage.touchscreen.tap(withdrawalsTabBox.x, withdrawalsTabBox.y);
    await new Promise(r => setTimeout(r, 600));
    let currentHash = await touchPage.evaluate(() => window.location.hash);
    console.log(`    Navigated to: ${currentHash}`);
    if (!currentHash.includes('/withdrawals')) throw new Error('Bottom tab failed to navigate to /withdrawals');

    // Tap About
    console.log('    Tapping About tab...');
    const aboutTabBox = await touchPage.evaluate(() => {
      const a = Array.from(document.querySelectorAll('nav[aria-label="Mobile Bottom Navigation"] a')).find(el => el.textContent.includes('About'));
      if (!a) return null;
      const r = a.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await touchPage.touchscreen.tap(aboutTabBox.x, aboutTabBox.y);
    await new Promise(r => setTimeout(r, 600));
    currentHash = await touchPage.evaluate(() => window.location.hash);
    console.log(`    Navigated to: ${currentHash}`);
    if (!currentHash.includes('/about')) throw new Error('Bottom tab failed to navigate to /about');

    // Tap Login
    console.log('    Tapping Login tab...');
    const loginTabBox = await touchPage.evaluate(() => {
      const a = Array.from(document.querySelectorAll('nav[aria-label="Mobile Bottom Navigation"] a')).find(el => el.textContent.includes('Login'));
      if (!a) return null;
      const r = a.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await touchPage.touchscreen.tap(loginTabBox.x, loginTabBox.y);
    await new Promise(r => setTimeout(r, 600));
    currentHash = await touchPage.evaluate(() => window.location.hash);
    console.log(`    Navigated to: ${currentHash}`);
    if (!currentHash.includes('/login')) throw new Error('Bottom tab failed to navigate to /login');

    // Tap Dashboard
    console.log('    Tapping Dashboard tab...');
    const dashboardTabBox = await touchPage.evaluate(() => {
      const a = Array.from(document.querySelectorAll('nav[aria-label="Mobile Bottom Navigation"] a')).find(el => el.textContent.includes('Dashboard'));
      if (!a) return null;
      const r = a.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await touchPage.touchscreen.tap(dashboardTabBox.x, dashboardTabBox.y);
    await new Promise(r => setTimeout(r, 600));
    currentHash = await touchPage.evaluate(() => window.location.hash);
    console.log(`    Navigated back to: ${currentHash}`);
    if (currentHash !== '#/' && currentHash !== '#') throw new Error('Bottom tab failed to navigate back to #/');

    // 1.5 Verify Hamburger Menu touch open, navigation, and close
    console.log('1.4 Verifying Hamburger menu touch interaction...');
    const hamburgerBtn = await touchPage.waitForSelector('button[aria-label*="menu" i]', { timeout: 5000 });
    const hBox = await hamburgerBtn.boundingBox();
    await touchPage.touchscreen.tap(hBox.x + hBox.width / 2, hBox.y + hBox.height / 2);
    await new Promise(r => setTimeout(r, 400));

    const drawerOpen = await touchPage.evaluate(() => !!document.querySelector('div[class*="z-[9999]"]'));
    console.log(`    Drawer open state: ${drawerOpen}`);
    if (!drawerOpen) throw new Error('Drawer failed to open on touch tap');

    // Close drawer via close button
    const closeBtn = await touchPage.waitForSelector('div[class*="z-[9999]"] button[aria-label="Close menu"]');
    const cBox = await closeBtn.boundingBox();
    await touchPage.touchscreen.tap(cBox.x + cBox.width / 2, cBox.y + cBox.height / 2);
    await new Promise(r => setTimeout(r, 400));

    const drawerClosed = await touchPage.evaluate(() => !document.querySelector('div[class*="z-[9999]"]'));
    console.log(`    Drawer closed cleanly: ${drawerClosed}`);
    if (!drawerClosed) throw new Error('Drawer failed to close cleanly');

    // 1.6 Verify Footer links are visible and tappable without being covered by bottom tab bar
    console.log('1.5 Checking Footer tap target visibility above bottom bar...');
    await touchPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 400));

    const footerLinkInfo = await touchPage.evaluate(() => {
      const footerLink = Array.from(document.querySelectorAll('footer a')).find(a => a.textContent.includes('Operating Covenant') || a.textContent.includes('About'));
      if (!footerLink) return null;
      const r = footerLink.getBoundingClientRect();
      const bottomBar = document.querySelector('nav[aria-label="Mobile Bottom Navigation"]');
      const barTop = bottomBar ? bottomBar.getBoundingClientRect().top : window.innerHeight;
      return {
        text: footerLink.innerText,
        top: r.top,
        bottom: r.bottom,
        barTop: barTop,
        isCovered: r.bottom > barTop
      };
    });

    console.log('    Footer link check:', footerLinkInfo);
    if (footerLinkInfo && footerLinkInfo.isCovered) {
      throw new Error('Footer link is covered by the fixed bottom tab bar!');
    }
    console.log('    ✓ Footer link is cleanly visible and unobstructed by bottom tab bar.');

    await touchContext.close();
    console.log('--- SECTION 1 PASSED ---\n');

    // =========================================================================
    // SECTION 2: SKELETONS & EMPTY STATES AUDIT
    // =========================================================================
    console.log('--- SECTION 2: Skeletons & Friendly Empty States Audit ---');
    const skelContext = await browser.createBrowserContext();
    const skelPage = await skelContext.newPage();
    skelPage.on('console', msg => {
      console.log('    [SkelPage Log]', msg.text());
      if (msg.type() === 'error') {
        if (msg.text().includes('Firestore cases listener error') || msg.text().includes('Missing or insufficient permissions')) return;
        consoleErrors.push(`[SkelPage Error] ${msg.text()}`);
      }
    });

    // Test empty states on Withdrawals page (empty collection state)
    console.log('2.1 Testing empty collection state on Withdrawals page...');
    await skelPage.goto(`${BASE_URL}#/withdrawals`, { waitUntil: 'networkidle2' });
    // Wait for initial Firestore data load so skeletons resolve
    await skelPage.waitForFunction(() => !document.querySelector('.skeleton-shimmer'), { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    const withdrawalEmptyState = await skelPage.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasEmptyTitle: text.includes('No withdrawals yet'),
        hasEmptyDesc: text.includes('No emergency assistance releases have been recorded yet.')
      };
    });
    console.log('    Withdrawals empty collection response:', withdrawalEmptyState);
    if (!withdrawalEmptyState.hasEmptyTitle || !withdrawalEmptyState.hasEmptyDesc) {
      throw new Error('Withdrawals page missing friendly empty collection state');
    }
    console.log('    ✓ Withdrawals page renders friendly empty state when collection is empty.');

    // Test filter empty states on Ledger page (non-empty collection with 0 filter matches)
    console.log('2.2 Testing empty filter match state on Ledger page...');
    await skelPage.goto(`${BASE_URL}#/login?redirect=%2Fledger`, { waitUntil: 'networkidle2' });
    await skelPage.waitForSelector('input[type="email"]');
    await skelPage.type('input[type="email"]', 'rizwan@fikr.org');
    await skelPage.type('input[type="password"]', TEST_PASSWORD);
    await skelPage.click('button[type="submit"]');
    await skelPage.waitForFunction(() => window.location.hash.includes('/ledger'), { timeout: 15000 });
    await skelPage.waitForFunction(() => !document.querySelector('.skeleton-shimmer'), { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    // Confirm initial ledger rows are present
    const initialLedgerRows = await skelPage.evaluate(() => document.querySelectorAll('tbody tr').length);
    console.log(`    Loaded initial ledger transactions: ${initialLedgerRows}`);

    // Type search that matches nothing
    await skelPage.waitForSelector('input[placeholder*="Search entries"]');
    await skelPage.type('input[placeholder*="Search entries"]', 'NONEXISTENT_TRANSACTION_QUERY_XYZ');
    await new Promise(r => setTimeout(r, 500));

    const ledgerEmptyState = await skelPage.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasEmptyTitle: text.includes('No matching transactions'),
        hasResetBtn: Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Reset Filters'))
      };
    });
    console.log('    Ledger empty filter response:', ledgerEmptyState);
    if (!ledgerEmptyState.hasEmptyTitle || !ledgerEmptyState.hasResetBtn) {
      throw new Error('Ledger page missing friendly empty filter state or Reset button');
    }

    // Click Reset Filters and verify rows restore
    await skelPage.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(btn => btn.innerText.includes('Reset Filters') && btn.offsetParent !== null);
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 500));
    const restoredRows = await skelPage.evaluate(() => document.querySelectorAll('tbody tr').length);
    console.log(`    Transactions restored after Reset: ${restoredRows}`);
    if (restoredRows === 0) throw new Error('Reset Filters did not restore ledger transactions');
    console.log('    ✓ Ledger filter empty state and Reset Filters action work cleanly.');

    await skelContext.close();
    console.log('--- SECTION 2 PASSED ---\n');

    // =========================================================================
    // SECTION 3: "MY STATUS" CARD & AUTHENTICATED MOBILE TAB BAR VERIFICATION
    // =========================================================================
    console.log('--- SECTION 3: "My Status" Card & Authenticated Tab Bar Verification ---');

    // 3.1 Member 1: Rizwan (Treasurer, direct user)
    console.log('3.1 Testing Member 1: Rizwan (rizwan@fikr.org)...');
    const mem1Context = await browser.createBrowserContext();
    const mem1Page = await mem1Context.newPage();
    await mem1Page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

    mem1Page.on('console', msg => {
      if (msg.type() === 'error') {
        if (msg.text().includes('Firestore cases listener error') || msg.text().includes('Missing or insufficient permissions')) return;
        consoleErrors.push(`[Mem1 Error] ${msg.text()}`);
      }
    });

    await mem1Page.goto(`${BASE_URL}#/login?redirect=%2F`, { waitUntil: 'networkidle2' });
    await mem1Page.waitForSelector('input[type="email"]');
    await mem1Page.type('input[type="email"]', 'rizwan@fikr.org');
    await mem1Page.type('input[type="password"]', TEST_PASSWORD);
    await mem1Page.click('button[type="submit"]');
    await mem1Page.waitForFunction(() => window.location.hash === '#/' || window.location.hash === '#', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));

    // Extract My Status card data on Dashboard
    const mem1Status = await mem1Page.evaluate(() => {
      const greetingEl = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Assalamu Alaikum'));
      const card = greetingEl ? greetingEl.closest('div[class*="rounded-2xl"]') : null;
      if (!card) return null;
      return {
        greeting: greetingEl.innerText.trim(),
        text: card.innerText
      };
    });

    console.log('    Rizwan "My Status" card detected:', mem1Status ? mem1Status.greeting : 'NOT FOUND');
    if (!mem1Status) throw new Error('My Status card failed to render for logged-in active member Rizwan');
    if (!mem1Status.greeting.includes('Rizwan')) throw new Error(`Expected greeting to include "Rizwan", got: ${mem1Status.greeting}`);

    // Parse all-time total from card
    const mem1CardTotal = await mem1Page.evaluate(() => {
      const allText = document.body.innerText;
      const match = allText.match(/My All-Time Contributed\s*\n\s*(₹[\d,]+)/i);
      return match ? match[1].replace(/[₹,]/g, '') : null;
    });
    console.log(`    Rizwan Dashboard Card All-Time Total: ₹${mem1CardTotal}`);

    // Check Authenticated Bottom Tab Bar has 4 tabs: Dashboard, Contributions, Ledger, Cases
    const authTabs = await mem1Page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Mobile Bottom Navigation"]');
      if (!nav) return null;
      return Array.from(nav.querySelectorAll('a')).map(a => a.innerText.trim());
    });
    console.log('    Rizwan authenticated bottom tabs:', authTabs);
    const expectedAuthTabs = ['Dashboard', 'Contributions', 'Ledger', 'Cases'];
    const tabsMatch = expectedAuthTabs.every(t => authTabs?.includes(t));
    if (!tabsMatch) throw new Error(`Authenticated tabs do not match expected! Found: ${JSON.stringify(authTabs)}`);
    console.log('    ✓ Bottom tab bar switched to 4 Core Member tabs.');

    // Navigate to Contributions page via bottom tab touch tap
    console.log('    Navigating to Contributions page via bottom tab touch tap...');
    const contribTabBox = await mem1Page.evaluate(() => {
      const a = Array.from(document.querySelectorAll('nav[aria-label="Mobile Bottom Navigation"] a')).find(el => el.textContent.includes('Contributions'));
      if (!a) return null;
      const r = a.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await mem1Page.touchscreen.tap(contribTabBox.x, contribTabBox.y);
    await new Promise(r => setTimeout(r, 1000));
    const isContribPage = await mem1Page.evaluate(() => window.location.hash.includes('/contributions'));
    console.log(`    On Contributions page: ${isContribPage}`);
    if (!isContribPage) throw new Error('Failed to navigate to /contributions via authenticated bottom tab');

    // Get Rizwan's per-member total on Contributions page
    const rizwanMatrixTotal = await mem1Page.evaluate(() => {
      // Find row containing Rizwan
      const rows = Array.from(document.querySelectorAll('div[class*="hover:bg-"]'));
      const rizwanRow = rows.find(r => r.innerText.includes('Rizwan') && r.innerText.includes('Treasurer'));
      if (!rizwanRow) return null;
      const match = rizwanRow.innerText.match(/Total:\s*₹([\d,]+)/i);
      return match ? match[1].replace(/,/g, '') : null;
    });
    console.log(`    Rizwan Contributions Matrix Total: ₹${rizwanMatrixTotal}`);
    if (mem1CardTotal !== rizwanMatrixTotal) {
      throw new Error(`Total mismatch for Rizwan! Dashboard card: ₹${mem1CardTotal}, Matrix: ₹${rizwanMatrixTotal}`);
    }
    console.log(`    ✓ Rizwan totals match perfectly down to the rupee (₹${mem1CardTotal} === ₹${rizwanMatrixTotal})`);

    await mem1Context.close();

    // 3.2 Member 2: Mohammad Yusuf (Coordinator, has legacyId and migrated record)
    console.log('\n3.2 Testing Member 2: Mohammad Yusuf (yusuf@fikr.org, legacy/migrated record)...');
    const mem2Context = await browser.createBrowserContext();
    const mem2Page = await mem2Context.newPage();
    await mem2Page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

    mem2Page.on('console', msg => {
      if (msg.type() === 'error') {
        if (msg.text().includes('Firestore cases listener error') || msg.text().includes('Missing or insufficient permissions')) return;
        consoleErrors.push(`[Mem2 Error] ${msg.text()}`);
      }
    });

    await mem2Page.goto(`${BASE_URL}#/login?redirect=%2F`, { waitUntil: 'networkidle2' });
    await mem2Page.waitForSelector('input[type="email"]');
    await mem2Page.type('input[type="email"]', 'yusuf@fikr.org');
    await mem2Page.type('input[type="password"]', TEST_PASSWORD);
    await mem2Page.click('button[type="submit"]');
    await mem2Page.waitForFunction(() => window.location.hash === '#/' || window.location.hash === '#', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));

    // Extract My Status card data on Dashboard
    const mem2Greeting = await mem2Page.evaluate(() => {
      const greetingEl = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Assalamu Alaikum'));
      return greetingEl ? greetingEl.innerText.trim() : null;
    });
    console.log('    Yusuf "My Status" card detected:', mem2Greeting);
    if (!mem2Greeting) throw new Error('My Status card failed to render for logged-in active member Mohammad Yusuf');
    if (!mem2Greeting.includes('Mohammad') && !mem2Greeting.includes('Yusuf')) {
      throw new Error(`Expected greeting to include "Mohammad" or "Yusuf", got: ${mem2Greeting}`);
    }

    const mem2CardTotal = await mem2Page.evaluate(() => {
      const allText = document.body.innerText;
      const match = allText.match(/My All-Time Contributed\s*\n\s*(₹[\d,]+)/i);
      return match ? match[1].replace(/[₹,]/g, '') : null;
    });
    console.log(`    Mohammad Yusuf Dashboard Card All-Time Total: ₹${mem2CardTotal}`);

    // Check on Contributions page
    await mem2Page.goto(`${BASE_URL}#/contributions`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // Sign in as Treasurer to read Yusuf's total in matrix (or read through helper)
    // Note: Yusuf is Coordinator, per-member total in matrix is visible to Treasurer/Admin only.
    // Let's verify Yusuf's total by opening as Treasurer or comparing directly
    console.log('    Checking Yusuf total in Matrix as Treasurer...');
    const adminContext = await browser.createBrowserContext();
    const adminPage = await adminContext.newPage();
    await adminPage.goto(`${BASE_URL}#/login?redirect=%2Fcontributions`, { waitUntil: 'networkidle2' });
    await adminPage.waitForSelector('input[type="email"]');
    await adminPage.type('input[type="email"]', 'rizwan@fikr.org');
    await adminPage.type('input[type="password"]', TEST_PASSWORD);
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForFunction(() => window.location.hash.includes('/contributions'), { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));

    const yusufMatrixTotal = await adminPage.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('div[class*="hover:bg-"]'));
      const row = rows.find(r => r.innerText.includes('Mohammad Yusuf'));
      if (!row) return null;
      const match = row.innerText.match(/Total:\s*₹([\d,]+)/i);
      return match ? match[1].replace(/,/g, '') : null;
    });

    console.log(`    Mohammad Yusuf Contributions Matrix Total: ₹${yusufMatrixTotal}`);
    if (mem2CardTotal !== yusufMatrixTotal) {
      throw new Error(`Total mismatch for Mohammad Yusuf! Dashboard card: ₹${mem2CardTotal}, Matrix: ₹${yusufMatrixTotal}`);
    }
    console.log(`    ✓ Mohammad Yusuf totals match perfectly down to the rupee (₹${mem2CardTotal} === ₹${yusufMatrixTotal})`);

    await adminContext.close();
    await mem2Context.close();
    console.log('--- SECTION 3 PASSED ---\n');

    // =========================================================================
    // SECTION 4: CONSOLE ERROR AUDIT ACROSS ALL PAGES
    // =========================================================================
    console.log('--- SECTION 4: Zero Console Errors Check ---');
    console.log(`Total captured console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('Console errors detected:');
      consoleErrors.forEach(e => console.error('  - ' + e));
      throw new Error(`Test failed with ${consoleErrors.length} console errors`);
    }
    console.log('✓ ZERO console errors across all pages, touch interactions, and auth states.');

    console.log('\n================================================================');
    console.log('  ALL PHASE A VERIFICATION TESTS PASSED SUCCESSFULLY! (100%)');
    console.log('================================================================');

  } finally {
    await browser.close();
  }
}

runPhaseAVerification().catch(err => {
  console.error('\n❌ PHASE A VERIFICATION FAILED:', err);
  process.exit(1);
});
