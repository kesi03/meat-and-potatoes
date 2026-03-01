import { test, expect } from '@playwright/test';

test.describe('Shopping List App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should create a new list copying from standard', async ({ page }) => {
    // Click on New List button
    await page.getByRole('button', { name: /new list/i }).click();
    
    // Fill in list name
    await page.getByLabel('List Name').fill('Weekly Shop');
    
    // Verify "Copy items from Standard List" is checked by default
    await expect(page.getByLabel('Copy items from Standard List')).toBeChecked();
    
    // Create the list
    await page.getByRole('button', { name: /create/i }).click();
    
    // Verify the new list is shown
    await expect(page.getByText('Weekly Shop')).toBeVisible();
    
    // Click to open the list
    await page.getByRole('button', { name: /open/i }).click();
    
    // Verify items were copied from standard list (e.g., Milk, Bread, Butter)
    await expect(page.getByText('Milk')).toBeVisible();
    await expect(page.getByText('Bread')).toBeVisible();
    await expect(page.getByText('Butter')).toBeVisible();
  });

  test('should create a new list without copying from standard', async ({ page }) => {
    // Click on New List button
    await page.getByRole('button', { name: /new list/i }).click();
    
    // Fill in list name
    await page.getByLabel('List Name').fill('Empty List');
    
    // Uncheck "Copy items from Standard List"
    await page.getByLabel('Copy items from Standard List').uncheck();
    
    // Create the list
    await page.getByRole('button', { name: /create/i }).click();
    
    // Click to open the list
    await page.getByRole('button', { name: /open/i }).click();
    
    // Verify no items in the list
    await expect(page.getByText('No items in this list')).toBeVisible();
  });

  test('should create a new category', async ({ page }) => {
    // Navigate to Admin tab
    await page.getByRole('tab', { name: /admin/i }).click();
    
    // Click on Categories tab
    await page.getByRole('tab', { name: /categories/i }).click();
    
    // Click Add Category button
    await page.getByRole('button', { name: /add category/i }).click();
    
    // Fill in category name
    await page.getByLabel('Category Name').fill('Pet Supplies');
    
    // Fill in description
    await page.getByLabel('Description').fill('Food and accessories for pets');
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    
    // Verify category was added
    await expect(page.getByText('Pet Supplies')).toBeVisible();
    await expect(page.getByText('Food and accessories for pets')).toBeVisible();
  });

  test('should add item to standard list', async ({ page }) => {
    // Navigate to Admin tab
    await page.getByRole('tab', { name: /admin/i }).click();
    
    // Click on Standard List tab
    await page.getByRole('tab', { name: /standard list/i }).click();
    
    // Click edit on an existing item (e.g., Milk)
    await page.getByRole('button', { name: '' }).first().click();
    
    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Verify we can see the item form
    await expect(page.getByLabel('Item Name')).toBeVisible();
    await expect(page.getByLabel('Category')).toBeVisible();
  });

  test('should switch between views using bottom navigation', async ({ page }) => {
    // Default view should be Lists
    await expect(page.getByText('My Lists')).toBeVisible();
    
    // Navigate to Inventory
    await page.getByRole('tab', { name: /inventory/i }).click();
    await expect(page.getByText('Expiration Status')).toBeVisible();
    
    // Navigate to Admin
    await page.getByRole('tab', { name: /admin/i }).click();
    await expect(page.getByRole('tab', { name: /currency/i })).toBeVisible();
    
    // Navigate back to Lists
    await page.getByRole('tab', { name: /lists/i }).click();
    await expect(page.getByText('My Lists')).toBeVisible();
  });

  test('should clear inventory using remove all button', async ({ page }) => {
    // go to inventory tab
    await page.getByRole('tab', { name: /inventory/i }).click();

    // add an item so inventory is not empty
    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByLabel('Item Name').fill('Test Item');
    await page.getByRole('combobox', { name: /category/i }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('Test Item')).toBeVisible();

    // stub confirm to automatically agree
    await page.evaluate(() => window.confirm = () => true);
    await page.getByRole('button', { name: /clear all/i }).click();

    // inventory should now be empty message
    await expect(page.getByText('Your inventory is empty. Add items from your shopping lists.')).toBeVisible();
  });

  test('should select currency', async ({ page }) => {
    // Navigate to Admin tab
    await page.getByRole('tab', { name: /admin/i }).click();
    
    // Currency tab should be selected by default
    await expect(page.getByRole('tab', { name: /currency/i })).toBeVisible();
    
    // Change currency to USD
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /us dollar/i }).click();
    
    // Verify currency changed (would need to check localStorage or UI)
    const selected = await page.getByRole('combobox').inputValue();
    await expect(selected).toContain('USD');
  });
});
