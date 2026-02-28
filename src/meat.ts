export type ExpirationStatus = 'expired' | 'expiring-soon' | 'fresh' | 'unknown';

export type CurrencyCode = 'GBP' | 'USD' | 'EUR' | 'SEK' | 'NOK';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
];

export const DEFAULT_CURRENCY: CurrencyCode = 'GBP';

export function formatCurrency(amount: number, currencyCode: CurrencyCode = 'GBP'): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  return `${currency.symbol}${amount.toFixed(2)}`;
}

export const CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat & Deli',
  'Bakery',
  'Frozen Foods',
  'Pantry',
  'Beverages',
  'Snacks',
  'Household',
  'Personal Care',
];

export const LOCATIONS = [
  'Fridge',
  'Freezer',
  'Pantry',
  'Cabinet',
  'Bathroom',
  'Laundry Room',
  'Garage',
];

export interface StandardItem {
  name: string;
  category: string;
  quantity: number;
  cost: number;
}

export const STANDARD_ITEMS: StandardItem[] = [
  { name: 'Milk', category: 'Dairy', quantity: 1, cost: 3.99 },
  { name: 'Bread', category: 'Bakery', quantity: 1, cost: 2.99 },
  { name: 'Butter', category: 'Dairy', quantity: 1, cost: 4.49 },
  { name: 'Eggs', category: 'Dairy', quantity: 1, cost: 3.49 },
  { name: 'Cheese', category: 'Dairy', quantity: 1, cost: 5.99 },
  { name: 'Chicken Breast', category: 'Meat & Deli', quantity: 1, cost: 8.99 },
  { name: 'Rice', category: 'Pantry', quantity: 1, cost: 2.49 },
  { name: 'Pasta', category: 'Pantry', quantity: 1, cost: 1.99 },
  { name: 'Cereal', category: 'Pantry', quantity: 1, cost: 4.99 },
  { name: 'Orange Juice', category: 'Beverages', quantity: 1, cost: 3.99 },
  { name: 'Apples', category: 'Produce', quantity: 4, cost: 2.99 },
  { name: 'Bananas', category: 'Produce', quantity: 6, cost: 1.49 },
  { name: 'Lettuce', category: 'Produce', quantity: 1, cost: 2.49 },
  { name: 'Tomatoes', category: 'Produce', quantity: 4, cost: 2.99 },
  { name: 'Ground Beef', category: 'Meat & Deli', quantity: 1, cost: 7.99 },
  { name: 'Bacon', category: 'Meat & Deli', quantity: 1, cost: 6.99 },
  { name: 'Yogurt', category: 'Dairy', quantity: 1, cost: 4.49 },
  { name: 'Ice Cream', category: 'Frozen Foods', quantity: 1, cost: 5.99 },
  { name: 'Frozen Pizza', category: 'Frozen Foods', quantity: 1, cost: 7.99 },
  { name: 'Paper Towels', category: 'Household', quantity: 1, cost: 8.99 },
  { name: 'Dish Soap', category: 'Household', quantity: 1, cost: 3.99 },
  { name: 'Toothpaste', category: 'Personal Care', quantity: 1, cost: 4.99 },
  { name: 'Shampoo', category: 'Personal Care', quantity: 1, cost: 6.99 },
];

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function getExpirationStatus(bestByDate: string | null): ExpirationStatus {
  if (!bestByDate) return 'unknown';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const bestBy = new Date(bestByDate);
  bestBy.setHours(0, 0, 0, 0);
  
  const diffTime = bestBy.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays <= 3) return 'expiring-soon';
  return 'fresh';
}

export function getDaysUntilExpiration(bestByDate: string | null): number | null {
  if (!bestByDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const bestBy = new Date(bestByDate);
  bestBy.setHours(0, 0, 0, 0);
  
  const diffTime = bestBy.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
