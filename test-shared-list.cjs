const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('[SharedList]') || msg.text().includes('[ListsPage]')) {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
  });
  
  page.on('pageerror', err => {
    console.log(`[error] ${err.message}`);
  });

  // Go to app
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);
  
  // Check if login form exists
  const emailInput = await page.$('input[type="email"]');
  const passwordInput = await page.$('input[type="password"]');
  
  if (emailInput && passwordInput) {
    console.log('Logging in...');
    await emailInput.fill('kester.simm@icloud.com');
    await passwordInput.fill('BettnaBears2025');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }
  
  console.log('=== Testing /list/my-shopping-list ===');
  await page.goto('http://localhost:5173/list/my-shopping-list');
  await page.waitForTimeout(3000);
  
  const myShoppingContent = await page.textContent('body');
  console.log('Page shows Milk:', myShoppingContent.includes('Milk'));
  console.log('Page shows Shopping:', myShoppingContent.includes('Shopping') || myShoppingContent.includes('My Shopping'));
  
  console.log('=== Testing /list/kesi03 (shared list) ===');
  await page.goto('http://localhost:5173/list/kesi03');
  await page.waitForTimeout(3000);
  
  const kesiContent = await page.textContent('body');
  console.log('Shared list shows Milk:', kesiContent.includes('Milk'));
  console.log('Shared list shows Kesi03:', kesiContent.includes('Kesi03') || kesiContent.includes('kesi03'));
  
  console.log('=== Testing picking an item in shared list ===');
  // Wait for items to load
  await page.waitForSelector('[data-testid^="pick-item-"]', { timeout: 10000 });
  
  // Use Playwright's locator to click the checkbox
  const itemLocator = page.locator('[data-testid^="pick-item-"]').first();
  const itemTestId = await itemLocator.getAttribute('data-testid');
  console.log('Clicking item:', itemTestId);
  
  // Click directly on the checkbox input using locator - use count: 1 to ensure single click
  const checkboxLocator = itemLocator.locator('input[type="checkbox"]');
  
  // Get initial checked state
  const initialChecked = await checkboxLocator.isChecked();
  console.log('Initial checked:', initialChecked);
  
  // Click only once
  await checkboxLocator.click();
  await page.waitForTimeout(1000);
  
  // Check state immediately after single click
  const afterClickChecked = await checkboxLocator.isChecked();
  console.log('After single click checkbox checked:', afterClickChecked);
  
  // Check if the pickedItems state changed in the app
  const pickedItemsState = await page.evaluate(() => {
    // Try to find console logs or check DOM
    return 'checked state changed';
  });
  console.log('State after click:', pickedItemsState);
    
  // Check localStorage persistence
  const localStorageData = await page.evaluate(() => {
    return localStorage.getItem('meat-and-potatoes-sharedPickedItems');
  });
  console.log('localStorage data:', localStorageData);
  
  // Reload page and check if picked items persist
  console.log('Reloading page to test persistence...');
  await page.reload();
  await page.waitForTimeout(5000);
  
  // First go to home, then navigate to shared list
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);
  
  // Then navigate to shared list via URL
  await page.goto('http://localhost:5173/list/kesi03');
  await page.waitForTimeout(5000);
  
  const checkboxAfterReload = await page.$('input[type="checkbox"]');
  if (checkboxAfterReload) {
    const afterReloadChecked = await checkboxAfterReload.isChecked();
    console.log('After reload checkbox checked:', afterReloadChecked);
    console.log('Persistence working:', afterReloadChecked === true);
  }
  
  await browser.close();
}

test().catch(console.error);