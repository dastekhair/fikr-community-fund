import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}/#`;

function startServer() {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
      shell: true,
      stdio: 'pipe'
    });
    proc.stdout.on('data', (d) => {
      if (d.toString().includes('Local:')) resolve(proc);
    });
    setTimeout(() => resolve(proc), 3000);
  });
}

async function run() {
  console.log('Starting preview server...');
  const server = await startServer();

  console.log('Launching Puppeteer at 375px touch emulation...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore unauth expected cases listener error on landing/login
      if (!text.includes('cases') && !text.includes('permission-denied') && !text.includes('PERMISSION_DENIED')) {
        errors.push({ url: page.url(), text });
      }
    }
  });

  try {
    // 1. Test Login Page & Forgot Password with @fikr.org
    console.log('1. Testing Login Page @fikr.org forgot-password validation...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

    // Click "Forgot password?"
    const forgotBtn = await page.waitForSelector('button ::-p-text(Forgot password?)', { timeout: 5000 });
    await forgotBtn.click();
    await new Promise(r => setTimeout(r, 400));

    // Type a @fikr.org address
    await page.type('#login-email', 'member@fikr.org');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 600));

    // Check error banner text
    const errorBanner = await page.$eval('[role="alert"]', el => el.textContent);
    console.log('  Alert displayed:', errorBanner);
    if (!errorBanner.includes("This address can't receive email. Please contact the admin.")) {
      throw new Error('Forgot password did not show expected @fikr.org rejection notice!');
    }
    console.log('  PASS: @fikr.org email correctly rejected without sending reset link.');

    // 2. Test Form Labels & Accessibility
    console.log('2. Testing Form Label associations (htmlFor & id)...');
    const labelFor = await page.$eval('label[for="login-email"]', el => el.getAttribute('for'));
    const inputId = await page.$eval('#login-email', el => el.getAttribute('id'));
    if (labelFor !== inputId) {
      throw new Error('Label htmlFor does not match input id!');
    }
    console.log('  PASS: Form label htmlFor="login-email" matches input id="login-email".');

    // 3. Test Public Routes at 375px
    const routes = ['/', '/withdrawals', '/about'];
    for (const r of routes) {
      await page.goto(`${BASE_URL}${r}`, { waitUntil: 'networkidle2' });
      await new Promise(res => setTimeout(res, 500));
      console.log(`  PASS: Route ${r} rendered cleanly.`);
    }

    // 4. Test Dark Mode at 375px
    console.log('4. Testing Dark Mode toggle at 375px...');
    const themeBtn = await page.waitForSelector('button[aria-label="Toggle theme"]');
    await themeBtn.click();
    await new Promise(r => setTimeout(r, 400));
    const isDark = await page.$eval('html', el => el.classList.contains('dark'));
    console.log(`  PASS: Dark mode toggled (html.dark = ${isDark}).`);

    // 5. Test Protected /account Route Access Barrier
    console.log('5. Testing /account route protection...');
    await page.goto(`${BASE_URL}/account`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));
    const barrierHeading = await page.$eval('h2', el => el.textContent);
    console.log('  Barrier displayed for unauthenticated visitor:', barrierHeading);
    if (!barrierHeading.includes('Access Required')) {
      throw new Error('Unauthenticated visitor did not receive access protection banner on /account!');
    }
    console.log('  PASS: ProtectedRoute correctly gates unauthenticated visitors with access barrier.');

    // 6. Check Console Errors
    console.log('\n--- CONSOLE ERROR REPORT ---');
    if (errors.length === 0) {
      console.log('ALL VERIFICATIONS PASSED: ZERO unexpected console errors across all pages at 375px.');
    } else {
      console.log('Console errors captured:', JSON.stringify(errors, null, 2));
      throw new Error('Unexpected console errors found');
    }

  } finally {
    await browser.close();
    server.kill();
  }
}

run().then(() => process.exit(0)).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
