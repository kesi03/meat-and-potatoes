import { test, expect } from '@playwright/test';

test.describe('Shopping List App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should load the main page', async ({ page }) => {
    await expect(page.getByText('My Lists')).toBeVisible();
  });

  test('should create a new list copying from standard', async ({ page }) => {
    await page.getByRole('button', { name: /add list/i }).click();
    
    await page.getByLabel('List Name').fill('Weekly Shop');
    
    await expect(page.getByLabel('Copy from Standard List')).toBeChecked();
    
    await page.getByRole('button', { name: /create/i }).click();
    
    await expect(page.getByText('Weekly Shop')).toBeVisible();
    
    await page.getByRole('button', { name: /open/i }).click();
    
    await expect(page.getByText('Milk')).toBeVisible();
    await expect(page.getByText('Bread')).toBeVisible();
    await expect(page.getByText('Butter')).toBeVisible();
  });

  test('should create a new list without copying from standard', async ({ page }) => {
    await page.getByRole('button', { name: /add list/i }).click();
    
    await page.getByLabel('List Name').fill('Empty List');
    
    await page.getByLabel('Copy from Standard List').uncheck();
    
    await page.getByRole('button', { name: /create/i }).click();
    
    await page.getByRole('button', { name: /open/i }).click();
    
    await expect(page.getByText('No items in this list')).toBeVisible();
  });

  test('should add item to a list', async ({ page }) => {
    await page.getByRole('button', { name: /add list/i }).click();
    await page.getByLabel('List Name').fill('Test List');
    await page.getByRole('button', { name: /create/i }).click();
    await page.getByRole('button', { name: /open/i }).click();

    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByLabel('Item Name').fill('Test Item');
    await page.getByRole('combobox', { name: /category/i }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('Test Item')).toBeVisible();
  });

  test('should edit item in a list', async ({ page }) => {
    await page.getByRole('button', { name: /add list/i }).click();
    await page.getByLabel('List Name').fill('Test List');
    await page.getByRole('button', { name: /create/i }).click();
    await page.getByRole('button', { name: /open/i }).click();

    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByLabel('Item Name').fill('Test Item');
    await page.getByRole('combobox', { name: /category/i }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /save/i }).click();

    await page.getByText('Test Item').click();

    await page.getByLabel('Item Name').fill('Updated Item');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('Updated Item')).toBeVisible();
  });

  test('should delete item from a list', async ({ page }) => {
    await page.getByRole('button', { name: /add list/i }).click();
    await page.getByLabel('List Name').fill('Test List');
    await page.getByRole('button', { name: /create/i }).click();
    await page.getByRole('button', { name: /open/i }).click();

    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByLabel('Item Name').fill('Item To Delete');
    await page.getByRole('combobox', { name: /category/i }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('Item To Delete')).toBeVisible();

    await page.getByText('Item To Delete').click();
    await page.getByRole('button', { name: /delete/i }).last().click();
    await page.getByRole('button', { name: /^delete$/i }).click();

    await expect(page.getByText('No items in this list')).toBeVisible();
  });

  test('should delete a shopping list', async ({ page }) => {
    await page.getByRole('button', { name: /add list/i }).click();
    await page.getByLabel('List Name').fill('List To Delete');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText('List To Delete')).toBeVisible();

    await page.getByRole('button', { name: /open/i }).click();
    await page.getByRole('button', { name: /back/i }).click();

    await page.getByRole('button', { name: /delete/i }).last().click();

    await expect(page.getByText('List To Delete')).not.toBeVisible();
  });

  test('should switch between views using bottom navigation', async ({ page }) => {
    await expect(page.getByText('My Lists')).toBeVisible();
    
    await page.getByRole('tab', { name: /inventory/i }).click();
    await expect(page.getByText('Expiration Status')).toBeVisible();
    
    await page.getByRole('tab', { name: /admin/i }).click();
    await expect(page.getByRole('tab', { name: /currency/i })).toBeVisible();
    
    await page.getByRole('tab', { name: /lists/i }).click();
    await expect(page.getByText('My Lists')).toBeVisible();
  });

  test('should add item to inventory', async ({ page }) => {
    await page.getByRole('tab', { name: /inventory/i }).click();

    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByLabel('Item Name').fill('Test Item');
    await page.getByRole('combobox', { name: /category/i }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('Test Item')).toBeVisible();
  });

  test('should edit item in inventory', async ({ page }) => {
    await page.getByRole('tab', { name: /inventory/i }).click();

    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByLabel('Item Name').fill('Test Item');
    await page.getByRole('combobox', { name: /category/i }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /save/i }).click();

    await page.getByRole('button').filter({ has: page.locator('svg[data-testid="EditIcon"]') }).click();

    await page.getByLabel('Item Name').fill('Updated Item');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('Updated Item')).toBeVisible();
  });

  test('should delete item from inventory', async ({ page }) => {
    await page.getByRole('tab', { name: /inventory/i }).click();

    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByLabel('Item Name').fill('Item To Delete');
    await page.getByRole('combobox', { name: /category/i }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('Item To Delete')).toBeVisible();

    await page.getByRole('button').filter({ has: page.locator('svg[data-testid="DeleteIcon"]') }).click();
    await page.getByRole('button', { name: /^delete$/i }).click();

    await expect(page.getByText('Item To Delete')).not.toBeVisible();
  });

  test('should clear inventory using remove all button', async ({ page }) => {
    await page.getByRole('tab', { name: /inventory/i }).click();

    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByLabel('Item Name').fill('Test Item');
    await page.getByRole('combobox', { name: /category/i }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('Test Item')).toBeVisible();

    await page.evaluate(() => window.confirm = () => true);
    await page.getByRole('button', { name: /clear all inventory/i }).click();

    await expect(page.getByText('Inventory is empty')).toBeVisible();
  });

  test('should filter inventory by expiration status', async ({ page }) => {
    await page.getByRole('tab', { name: /inventory/i }).click();

    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByLabel('Item Name').fill('Fresh Item');
    await page.getByLabel('Best By Date').fill('2099-12-31');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('Fresh Item')).toBeVisible();
    await expect(page.getByText('Fresh: 1')).toBeVisible();
  });

  test('should create a new category', async ({ page }) => {
    await page.getByRole('tab', { name: /admin/i }).click();
    
    await page.getByRole('tab', { name: /category/i }).click();
    
    await page.getByRole('button', { name: /add category/i }).click();
    
    await page.getByLabel('Category Name').fill('Pet Supplies');
    
    await page.getByLabel('Description').fill('Food and accessories for pets');
    
    await page.getByRole('button', { name: /save/i }).click();
    
    await expect(page.getByText('Pet Supplies')).toBeVisible();
  });

  test('should edit a category', async ({ page }) => {
    await page.getByRole('tab', { name: /admin/i }).click();
    await page.getByRole('tab', { name: /category/i }).click();

    await page.getByRole('button').filter({ has: page.locator('svg[data-testid="EditIcon"]') }).first().click();
    
    await page.getByLabel('Category Name').fill('Updated Category');
    await page.getByRole('button', { name: /save/i }).click();
    
    await expect(page.getByText('Updated Category')).toBeVisible();
  });

  test('should delete a category', async ({ page }) => {
    await page.getByRole('tab', { name: /admin/i }).click();
    await page.getByRole('tab', { name: /category/i }).click();

    const initialCount = await page.getByRole('listitem').count();
    
    await page.getByRole('button').filter({ has: page.locator('svg[data-testid="DeleteIcon"]') }).first().click();
    
    await expect(page.getByRole('listitem')).toHaveCount(initialCount - 1);
  });

  test('should select currency', async ({ page }) => {
    await page.getByRole('tab', { name: /admin/i }).click();
    
    await expect(page.getByRole('tab', { name: /currency/i })).toBeVisible();
    
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /us dollar/i }).click();
    
    const selected = await page.getByRole('combobox').inputValue();
    await expect(selected).toContain('USD');
  });

  test('should select language', async ({ page }) => {
    await page.getByRole('tab', { name: /admin/i }).click();
    
    const languageCombobox = page.locator('.MuiSelect-select').nth(1);
    await languageCombobox.click();
    await page.getByRole('option', { name: /swedish/i }).click();
    
    await page.getByRole('tab', { name: /lists/i }).click();
    await expect(page.getByText('Inköpslista')).toBeVisible();
  });

  test('should view standard list items in admin', async ({ page }) => {
    await page.getByRole('tab', { name: /admin/i }).click();
    
    await page.getByRole('tab', { name: /standard list/i }).click();
    
    await expect(page.getByText('Milk')).toBeVisible();
    await expect(page.getByText('Bread')).toBeVisible();
  });

  test('should add item to standard list', async ({ page }) => {
    await page.getByRole('tab', { name: /admin/i }).click();
    await page.getByRole('tab', { name: /standard list/i }).click();
    
    await page.getByRole('button', { name: /add item/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('Item Name')).toBeVisible();
  });

  test('should edit item in standard list', async ({ page }) => {
    await page.getByRole('tab', { name: /admin/i }).click();
    await page.getByRole('tab', { name: /standard list/i }).click();
    
    await page.getByRole('button').filter({ has: page.locator('svg[data-testid="EditIcon"]') }).first().click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('Item Name')).toBeVisible();
    await expect(page.getByLabel('Category')).toBeVisible();
  });

  test('should configure firebase settings', async ({ page }) => {
    await page.getByRole('tab', { name: /admin/i }).click();
    
    await page.getByRole('tab', { name: /firebase/i }).click();
    
    await expect(page.getByLabel('API Key')).toBeVisible();
    await expect(page.getByLabel('Auth Domain')).toBeVisible();
    await expect(page.getByLabel('Project ID')).toBeVisible();
  });

  test('should toggle pick mode', async ({ page }) => {
    await page.getByRole('button', { name: /add list/i }).click();
    await page.getByLabel('List Name').fill('Test List');
    await page.getByRole('button', { name: /create/i }).click();
    await page.getByRole('button', { name: /open/i }).click();

    await expect(page.getByRole('button', { name: /browse/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /pick/i })).toBeVisible();

    await page.getByRole('button', { name: /pick/i }).click();
    
    await expect(page.getByText(/0 \/ \d+/)).toBeVisible();
  });

  test('should use category filter in browse mode', async ({ page }) => {
    await page.getByRole('button', { name: /add list/i }).click();
    await page.getByLabel('List Name').fill('Test List');
    await page.getByRole('button', { name: /create/i }).click();
    await page.getByRole('button', { name: /open/i }).click();

    await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible();
    await page.getByRole('button', { name: /dairy/i }).click();
    
    await expect(page.getByText('Dairy')).toBeVisible();
  });

  test('should show total cost', async ({ page }) => {
    await page.getByRole('button', { name: /add list/i }).click();
    await page.getByLabel('List Name').fill('Test List');
    await page.getByRole('button', { name: /create/i }).click();
    await page.getByRole('button', { name: /open/i }).click();

    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByLabel('Item Name').fill('Priced Item');
    await page.getByLabel('Cost').fill('10.99');
    await page.getByRole('combobox', { name: /category/i }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText(/total:.*10/i)).toBeVisible();
  });
});
