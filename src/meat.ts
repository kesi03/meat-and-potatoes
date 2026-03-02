export type ExpirationStatus = 'expired' | 'expiring-soon' | 'fresh' | 'unknown';

export type CurrencyCode = 'GBP' | 'USD' | 'EUR' | 'SEK' | 'NOK' | 'DKK' | 'ISK';

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
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'ISK', symbol: 'kr', name: 'Icelandic Króna' },
];


export const DEFAULT_CURRENCY: CurrencyCode = 'GBP';

const currencyLocales: Record<CurrencyCode, string> = {
  GBP: 'en-GB',
  USD: 'en-US',
  EUR: 'de-DE',
  SEK: 'sv-SE',
  NOK: 'nb-NO',
  DKK: 'da-DK',
  ISK: 'is-IS',
};

export function formatCurrency(amount: number, currencyCode: CurrencyCode = 'GBP'): string {
  const locale = currencyLocales[currencyCode] || 'en-GB';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
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

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Produce': 'Fresh fruits and vegetables',
  'Dairy': 'Milk, cheese, yogurt, and other dairy products',
  'Meat & Deli': 'Fresh meat, poultry, seafood, and deli items',
  'Bakery': 'Bread, pastries, and other baked goods',
  'Frozen Foods': 'Frozen meals, vegetables, and desserts',
  'Pantry': 'Canned goods, pasta, rice, and other non-perishable items',
  'Beverages': 'Sodas, juices, water, and other drinks',
  'Snacks': 'Chips, cookies, nuts, and other snack foods',
  'Household': 'Cleaning supplies, paper products, and other household items',
  'Personal Care': 'Toiletries, beauty products, and other personal care items',
};

export const STANDARD_CATEGORY_I18N_KEYS: Record<string, string> = {
  'Produce': 'categoryProduce',
  'Dairy': 'categoryDairy',
  'Meat & Deli': 'categoryMeatDeli',
  'Bakery': 'categoryBakery',
  'Frozen Foods': 'categoryFrozenFoods',
  'Pantry': 'categoryPantry',
  'Beverages': 'categoryBeverages',
  'Snacks': 'categorySnacks',
  'Household': 'categoryHousehold',
  'Personal Care': 'categoryPersonalCare',
};

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

// Map of standard item names to i18n keys for translation
export const STANDARD_ITEM_I18N_KEYS: Record<string, string> = {
  'Milk': 'itemMilk',
  'Bread': 'itemBread',
  'Butter': 'itemButter',
  'Eggs': 'itemEggs',
  'Cheese': 'itemCheese',
  'Chicken Breast': 'itemChickenBreast',
  'Rice': 'itemRice',
  'Pasta': 'itemPasta',
  'Cereal': 'itemCereal',
  'Orange Juice': 'itemOrangeJuice',
  'Apples': 'itemApples',
  'Bananas': 'itemBananas',
  'Lettuce': 'itemLettuce',
  'Tomatoes': 'itemTomatoes',
  'Ground Beef': 'itemGroundBeef',
  'Bacon': 'itemBacon',
  'Yogurt': 'itemYogurt',
  'Ice Cream': 'itemIceCream',
  'Frozen Pizza': 'itemFrozenPizza',
  'Paper Towels': 'itemPaperTowels',
  'Dish Soap': 'itemDishSoap',
  'Toothpaste': 'itemToothpaste',
  'Shampoo': 'itemShampoo',
};

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

export function getTranslationKeyForItem(itemName: string): string | null {
  return STANDARD_ITEM_I18N_KEYS[itemName] || null;
}

export function getTranslatedItemName(itemName: string, t: (key: string) => string): string {
  const i18nKey = getTranslationKeyForItem(itemName);
  return i18nKey ? t(i18nKey) : itemName;
}

export function getDeviceInfo() {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';

  const isAndroid = /android/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;

  const isMobile = isAndroid || isIOS;

  return { isAndroid, isIOS, isMobile };
}

export async function lookupProduct(barcode: string) {
  const apis = [
    {
      name: 'Open Food Facts',
      url: `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      transform: (data: any) => data.product ? {
        name: data.product.product_name,
        brand: data.product.brands,
        image: data.product.image_front_small_url,
        quantity: data.product.quantity,
        categories: data.product.categories,
      } : null
    },
    {
      name: 'Open Beauty Facts',
      url: `https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`,
      transform: (data: any) => data.product ? {
        name: data.product.product_name,
        brand: data.product.brands,
        image: data.product.image_front_small_url,
        quantity: data.product.quantity,
        categories: data.product.categories,
      } : null
    },
    {
      name: 'RapidAPI Barcodes',
      url: `https://barcodes1.p.rapidapi.com/?query=${barcode}`,
      headers: {
        'x-rapidapi-host': 'barcodes1.p.rapidapi.com',
        'x-rapidapi-key': '6a25632df2mshd241dcfe7b1cbcdp183bbdjsn4f5102bad2ce'
      },
      transform: (data: any) => data?.product?.description ? {
        name: data.product.description,
        brand: data.product.brand || data.product.manufacturer,
        image: data.product.image || data.product.thumbnail,
        quantity: data.product.size || data.product.quantity,
        categories: data.product.category || '',
      } : null
    }
  ];

  for (const api of apis) {
    try {
      const options: RequestInit = {};
      if (api.headers) {
        options.headers = api.headers;
      }
      const res = await fetch(api.url, options);
      const data = await res.json();
      const result = api.transform(data);
      if (result) {
        return result;
      }
    } catch (error) {
      console.error(`Error fetching from ${api.name}:`, error);
    }
  }

  return null;
}


export function getTranslationKeyForCategory(categoryName: string): string | null {
  const key = STANDARD_CATEGORY_I18N_KEYS[categoryName];
  return key || null;
}

export function getTranslatedCategoryName(categoryName: string, t: (key: string) => string): string {
  const i18nKey = getTranslationKeyForCategory(categoryName);
  return i18nKey ? t(i18nKey) : categoryName;
}

export function getCurrencyByCode(code: CurrencyCode): Currency | null {
  return CURRENCIES.find(c => c.code === code) || null;
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
