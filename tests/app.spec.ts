import { test, expect } from '@playwright/test';

test.describe('Shopping List App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should load the main page', async ({ page }) => {
    await expect(page.getByTestId('lists-overview')).toBeVisible();
  });

  test('should create a new list copying from standard', async ({ page }) => {
    await page.getByTestId('add-list-button').click();
    
    await page.locator('[data-testid="list-name-input"] input').fill('Weekly Shop');
    
    await expect(page.getByTestId('copy-from-standard-checkbox')).toBeChecked();
    
    await page.getByTestId('create-button').click();
    
    await expect(page.getByText('Weekly Shop')).toBeVisible();
    
    await page.getByTestId(/open-list-/).first().click();
    
    await expect(page.getByText('Milk')).toBeVisible();
    await expect(page.getByText('Bread')).toBeVisible();
    await expect(page.getByText('Butter')).toBeVisible();
  });

  test('should create a new list without copying from standard', async ({ page }) => {
    await page.getByTestId('add-list-button').click();
    
    await page.locator('[data-testid="list-name-input"] input').fill('Empty List');
    
    await page.getByTestId('copy-from-standard-checkbox').uncheck();
    
    await page.getByTestId('create-button').click();
    
    await page.getByTestId(/open-list-/).first().click();
    
    await expect(page.getByTestId('no-items-message')).toBeVisible();
  });

  test('should add item to a list', async ({ page }) => {
    await page.getByTestId('add-list-button').click();
    await page.locator('[data-testid="list-name-input"] input').fill('Test List');
    await page.getByTestId('create-button').click();
    await page.getByTestId(/open-list-/).first().click();

    await page.getByTestId('add-item-button').click();
    await page.locator('[data-testid="item-name-input"] input').fill('Test Item');
    await page.getByTestId('category-select').click();
    await page.getByRole('option').first().click();
    await page.getByTestId('save-button').click();

    await expect(page.getByText('Test Item')).toBeVisible();
  });

  test('should edit item in a list', async ({ page }) => {
    await page.getByTestId('add-list-button').click();
    await page.locator('[data-testid="list-name-input"] input').fill('Test List');
    await page.getByTestId('create-button').click();
    await page.getByTestId(/open-list-/).first().click();

    await page.getByTestId('add-item-button').click();
    await page.locator('[data-testid="item-name-input"] input').fill('Test Item');
    await page.getByTestId('category-select').click();
    await page.getByRole('option').first().click();
    await page.getByTestId('save-button').click();

    await page.getByText('Test Item').click();

    await page.locator('[data-testid="item-name-input"] input').fill('Updated Item');
    await page.getByTestId('save-button').click();

    await expect(page.getByText('Updated Item')).toBeVisible();
  });

  test('should delete item from a list', async ({ page }) => {
    await page.getByTestId('add-list-button').click();
    await page.locator('[data-testid="list-name-input"] input').fill('Test List');
    await page.getByTestId('create-button').click();
    await page.getByTestId(/open-list-/).first().click();

    await page.getByTestId('add-item-button').click();
    await page.locator('[data-testid="item-name-input"] input').fill('Item To Delete');
    await page.getByTestId('category-select').click();
    await page.getByRole('option').first().click();
    await page.getByTestId('save-button').click();

    await expect(page.getByText('Item To Delete')).toBeVisible();

    await page.getByText('Item To Delete').click();
    await page.getByTestId('delete-item-button').click();
    await page.getByTestId('delete-button').click();

    await expect(page.getByTestId('no-items-message')).toBeVisible();
  });

  test('should delete a shopping list', async ({ page }) => {
    await page.getByTestId('add-list-button').click();
    await page.locator('[data-testid="list-name-input"] input').fill('List To Delete');
    await page.getByTestId('create-button').click();

    await expect(page.getByText('List To Delete')).toBeVisible();

    await page.getByTestId(/open-list-/).first().click();
    await page.getByTestId('back-button').click();

    await page.getByTestId(/delete-list-/).click();

    await expect(page.getByText('List To Delete')).not.toBeVisible();
  });

  test('should switch between views using navigation', async ({ page }) => {
    await expect(page.getByTestId('lists-overview')).toBeVisible();
    
    await page.getByTestId('nav-inventory').click();
    await expect(page.getByTestId('inventory-view')).toBeVisible();
    
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-tabs')).toBeVisible();
    
    await page.getByTestId('nav-lists').click();
    await expect(page.getByTestId('lists-overview')).toBeVisible();
  });

  test('should add item to inventory', async ({ page }) => {
    await page.getByTestId('nav-inventory').click();

    await page.getByTestId('add-item-button').click();
    await page.locator('[data-testid="item-name-input"] input').fill('Test Item');
    await page.getByTestId('category-select').click();
    await page.getByRole('option').first().click();
    await page.getByTestId('save-button').click();

    await expect(page.getByText('Test Item')).toBeVisible();
  });

  test('should edit item in inventory', async ({ page }) => {
    await page.getByTestId('nav-inventory').click();

    await page.getByTestId('add-item-button').click();
    await page.locator('[data-testid="item-name-input"] input').fill('Test Item');
    await page.getByTestId('category-select').click();
    await page.getByRole('option').first().click();
    await page.getByTestId('save-button').click();

    await page.getByTestId('edit-item-button').click();

    await page.locator('[data-testid="item-name-input"] input').fill('Updated Item');
    await page.getByTestId('save-button').click();

    await expect(page.getByText('Updated Item')).toBeVisible();
  });

  test('should delete item from inventory', async ({ page }) => {
    await page.getByTestId('nav-inventory').click();

    await page.getByTestId('add-item-button').click();
    await page.locator('[data-testid="item-name-input"] input').fill('Item To Delete');
    await page.getByTestId('category-select').click();
    await page.getByRole('option').first().click();
    await page.getByTestId('save-button').click();

    await expect(page.getByText('Item To Delete')).toBeVisible();

    await page.getByTestId('delete-item-button').click();
    await page.getByTestId('delete-button').click();

    await expect(page.getByText('Item To Delete')).not.toBeVisible();
  });

  test('should clear inventory using remove all button', async ({ page }) => {
    await page.getByTestId('nav-inventory').click();

    await page.getByTestId('add-item-button').click();
    await page.locator('[data-testid="item-name-input"] input').fill('Test Item');
    await page.getByTestId('category-select').click();
    await page.getByRole('option').first().click();
    await page.getByTestId('save-button').click();

    await expect(page.getByText('Test Item')).toBeVisible();

    await page.evaluate(() => window.confirm = () => true);
    await page.getByTestId('clear-all-inventory-button').click();

    await expect(page.getByText('is empty')).toBeVisible();
  });

  test('should filter inventory by expiration status', async ({ page }) => {
    await page.getByTestId('nav-inventory').click();

    await page.getByTestId('add-item-button').click();
    await page.locator('[data-testid="item-name-input"] input').fill('Fresh Item');
    await page.locator('[data-testid="best-by-date-input"] input').fill('2099-12-31');
    await page.getByTestId('save-button').click();

    await expect(page.getByText('Fresh Item')).toBeVisible();
    await expect(page.getByText('Fresh: 1')).toBeVisible();
  });

  test('should create a new category', async ({ page }) => {
    await page.getByTestId('nav-admin').click();
    
    await page.getByTestId('tab-category').click();
    
    await page.getByTestId('add-category-button').click();
    
    await page.locator('[data-testid="category-name-input"] input').fill('Pet Supplies');
    
    await page.locator('[data-testid="category-description-input"] textarea').fill('Food and accessories for pets');
    
    await page.getByTestId('category-save-button').click();
    
    await expect(page.getByText('Pet Supplies')).toBeVisible();
  });

  test('should edit a category', async ({ page }) => {
    await page.getByTestId('nav-admin').click();
    await page.getByTestId('tab-category').click();

    await page.getByTestId('edit-category-button').first().click();
    
    await page.locator('[data-testid="category-name-input"] input').fill('Updated Category');
    await page.getByTestId('category-save-button').click();
    
    await expect(page.getByText('Updated Category')).toBeVisible();
  });

  test('should delete a category', async ({ page }) => {
    await page.getByTestId('nav-admin').click();
    await page.getByTestId('tab-category').click();

    const initialCount = await page.getByRole('listitem').count();
    
    await page.getByTestId('delete-category-button').first().click();
    
    await expect(page.getByRole('listitem')).toHaveCount(initialCount - 1);
  });

  test('should select currency', async ({ page }) => {
    await page.getByTestId('nav-admin').click();
    
    await expect(page.getByTestId('tab-locale')).toBeVisible();
    
    await page.getByTestId('currency-select').click();
    await page.getByRole('option', { name: /us dollar/i }).click();
    
    const selected = await page.getByTestId('currency-select').inputValue();
    await expect(selected).toContain('USD');
  });

  test('should select language', async ({ page }) => {
    await page.getByTestId('nav-admin').click();
    
    await page.getByTestId('language-select').click();
    await page.getByRole('option', { name: /swedish/i }).click();
    
    await page.getByTestId('nav-lists').click();
    await expect(page.getByText('Inköpslista')).toBeVisible();
  });

  test('should view standard list items in admin', async ({ page }) => {
    await page.getByTestId('nav-admin').click();
    
    await page.getByTestId('tab-standard-list').click();
    
    await expect(page.getByText('Milk')).toBeVisible();
    await expect(page.getByText('Bread')).toBeVisible();
  });

  test('should add item to standard list', async ({ page }) => {
    await page.getByTestId('nav-admin').click();
    await page.getByTestId('tab-standard-list').click();
    
    await page.getByTestId('add-standard-item-button').click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('[data-testid="item-name-input"] input')).toBeVisible();
  });

  test('should edit item in standard list', async ({ page }) => {
    await page.getByTestId('nav-admin').click();
    await page.getByTestId('tab-standard-list').click();
    
    await page.getByTestId('edit-standard-item-button').first().click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('[data-testid="item-name-input"] input')).toBeVisible();
    await expect(page.getByTestId('category-select')).toBeVisible();
  });

  test('should configure firebase settings', async ({ page }) => {
    await page.getByTestId('nav-admin').click();
    
    await page.getByTestId('tab-firebase').click();
    
    await expect(page.getByTestId('firebase-api-key')).toBeVisible();
    await expect(page.getByTestId('firebase-auth-domain')).toBeVisible();
    await expect(page.getByTestId('firebase-project-id')).toBeVisible();
  });

  test('should toggle pick mode', async ({ page }) => {
    await page.getByTestId('add-list-button').click();
    await page.locator('[data-testid="list-name-input"] input').fill('Test List');
    await page.getByTestId('create-button').click();
    await page.getByTestId(/open-list-/).first().click();

    await expect(page.getByTestId('browse-button')).toBeVisible();
    await expect(page.getByTestId('pick-button')).toBeVisible();

    await page.getByTestId('pick-button').click();
    
    await expect(page.getByTestId('picking-progress')).toBeVisible();
  });

  test('should use category filter in browse mode', async ({ page }) => {
    await page.getByTestId('add-list-button').click();
    await page.locator('[data-testid="list-name-input"] input').fill('Test List');
    await page.getByTestId('create-button').click();
    await page.getByTestId(/open-list-/).first().click();

    await expect(page.getByTestId('filter-all')).toBeVisible();
    await page.getByTestId(/filter-/).first().click();
    
    await expect(page.getByTestId(/filter-/)).toBeVisible();
  });

  test('should show total cost', async ({ page }) => {
    await page.getByTestId('add-list-button').click();
    await page.locator('[data-testid="list-name-input"] input').fill('Test List');
    await page.getByTestId('create-button').click();
    await page.getByTestId(/open-list-/).first().click();

    await page.getByTestId('add-item-button').click();
    await page.locator('[data-testid="item-name-input"] input').fill('Priced Item');
    await page.locator('[data-testid="cost-input"] input').fill('10.99');
    await page.getByTestId('category-select').click();
    await page.getByRole('option').first().click();
    await page.getByTestId('save-button').click();

    await expect(page.getByTestId('total-cost')).toBeVisible();
  });
});
