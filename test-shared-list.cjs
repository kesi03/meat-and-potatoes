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
  // Find the first checkbox and check its state before clicking
  const checkbox = await page.$('input[type="checkbox"]');
  if (checkbox) {
    console.log('Found checkbox, checking initial state...');
    const initialChecked = await checkbox.isChecked();
    console.log('Initial checkbox checked:', initialChecked);
    
    console.log('Clicking checkbox...');
    await checkbox.click();
    await page.waitForTimeout(500);
    
    const afterClickChecked = await checkbox.isChecked();
    console.log('After click checkbox checked:', afterClickChecked);
    console.log('Checkbox toggled correctly:', initialChecked !== afterClickChecked);
  } else {
    console.log('No checkbox found, checking for clickable list items...');
    const listItemButton = await page.$('[role="checkbox"]');
    if (listItemButton) {
      console.log('Found role="checkbox", clicking...');
      await listItemButton.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('No clickable item found');
    }
  }
  
  await browser.close();
}

test().catch(console.error);