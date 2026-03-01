import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { generateId, STANDARD_ITEMS, CurrencyCode, DEFAULT_CURRENCY } from '../meat';
import { db } from '../firebase';
import { ref, set, get } from 'firebase/database';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  databaseURL?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  translations?: Record<string, { name?: string; description?: string }>;
}

export function getCategoryName(category: Category, language: string): string {
  if (language === 'en' || !category.translations) {
    return category.name;
  }
  return category.translations[language]?.name || category.name;
}

export function getCategoryDescription(category: Category, language: string): string {
  if (language === 'en' || !category.translations) {
    return category.description;
  }
  return category.translations[language]?.description || category.description;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  cost: number;
  description: string;
  barcode: string;
  nutritionalInfo: string;
  weightSize: string;
  bestByDate: string | null;
}

export interface InventoryItem extends ShoppingItem {
  homeQuantity: number;
  dateAdded: string;
  location: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  isStandard: boolean;
  items: ShoppingItem[];
}

export interface SyncStatus {
  lastSynced: Date | null;
  isSyncing: boolean;
  error: string | null;
}

interface AppContextType {
  categories: Category[];
  shoppingLists: ShoppingList[];
  inventory: InventoryItem[];
  activeListId: string;
  currency: CurrencyCode;
  language: string;
  firebaseConfig: FirebaseConfig | null;
  syncStatus: SyncStatus;
  setActiveListId: (id: string) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setLanguage: (language: string) => void;
  setFirebaseConfig: (config: FirebaseConfig | null) => void;
  addCategory: (category: { name: string; description?: string }) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addShoppingList: (name: string, items?: ShoppingItem[]) => ShoppingList;
  updateShoppingList: (id: string, updates: Partial<ShoppingList>) => void;
  deleteShoppingList: (id: string) => void;
  addItemToList: (listId: string, item: Omit<ShoppingItem, 'id'>) => ShoppingItem;
  updateItemInList: (listId: string, itemId: string, updates: Partial<ShoppingItem>) => void;
  deleteItemFromList: (listId: string, itemId: string) => void;
  moveItemToInventory: (listId: string, itemId: string, homeQuantity?: number) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'dateAdded'>) => InventoryItem;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  clearInventory: () => void;
  getActiveList: () => ShoppingList | undefined;
  syncToFirebase: () => Promise<void>;
  loadFromFirebase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'shopping-inventory-app';
const USER_DOC_ID = 'user-data';

import i18n from '../i18n';

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Produce', description: 'Fresh fruits and vegetables' },
  { id: '2', name: 'Dairy', description: 'Milk, cheese, eggs, yogurt' },
  { id: '3', name: 'Meat & Deli', description: 'Fresh meat and deli items' },
  { id: '4', name: 'Bakery', description: 'Bread, pastries, baked goods' },
  { id: '5', name: 'Frozen Foods', description: 'Frozen meals and vegetables' },
  { id: '6', name: 'Pantry', description: 'Canned goods, pasta, rice, cereals' },
  { id: '7', name: 'Beverages', description: 'Drinks, juices, water' },
  { id: '8', name: 'Snacks', description: 'Chips, crackers, treats' },
  { id: '9', name: 'Household', description: 'Cleaning supplies, paper products' },
  { id: '10', name: 'Personal Care', description: 'Toiletries, hygiene products' },
];

const DEFAULT_LISTS: ShoppingList[] = [
  {
    id: 'standard',
    name: 'Standard List',
    isStandard: true,
    items: STANDARD_ITEMS.map(item => ({
      ...item,
      id: generateId(),
      description: '',
      barcode: '',
      nutritionalInfo: '',
      weightSize: '',
      bestByDate: null,
    })),
  },
];

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [categories, setCategories] = useState<Category[]>(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}-categories`);
    return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
  });

  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}-lists`);
    return stored ? JSON.parse(stored) : DEFAULT_LISTS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}-inventory`);
    return stored ? JSON.parse(stored) : [];
  });

  const [activeListId, setActiveListId] = useState<string>(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}-activeListId`);
    return stored || 'standard';
  });

  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}-currency`);
    return (stored as CurrencyCode) || DEFAULT_CURRENCY;
  });

  const [language, setLanguage] = useState<string>(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}-language`);
    const lang = stored || 'en';
    i18n.changeLanguage(lang);
    return lang;
  });

  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}-firebaseConfig`);
    return stored ? JSON.parse(stored) : null;
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSynced: null,
    isSyncing: false,
    error: null,
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-categories`, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-lists`, JSON.stringify(shoppingLists));
  }, [shoppingLists]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-inventory`, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-activeListId`, activeListId);
  }, [activeListId]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-currency`, currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-language`, language);
    i18n.changeLanguage(language);
  }, [language]);

  useEffect(() => {
    if (firebaseConfig) {
      localStorage.setItem(`${STORAGE_KEY}-firebaseConfig`, JSON.stringify(firebaseConfig));
    }
  }, [firebaseConfig]);

  // Auto-sync to Firebase Realtime Database with debounce
  useEffect(() => {
    // Only sync if Firebase is configured and db is initialized
    if (!firebaseConfig?.apiKey || !db || typeof db === 'object' && Object.keys(db).length === 0) {
      return;
    }

    // Set a debounce timeout to avoid excessive writes
    const timeout = setTimeout(async () => {
      setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
      try {
        await set(ref(db, 'userData'), {
          categories,
          shoppingLists,
          inventory,
          activeListId,
          currency,
          lastUpdated: new Date().toISOString(),
        });
        setSyncStatus({ lastSynced: new Date(), isSyncing: false, error: null });
        console.log('Auto-synced to Firebase Realtime Database');
      } catch (error) {
        const errorMsg = (error as Error).message;
        setSyncStatus(prev => ({ ...prev, isSyncing: false, error: errorMsg }));
        console.error('Auto-sync error:', error);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeout);
  }, [categories, shoppingLists, inventory, activeListId, currency, firebaseConfig?.apiKey]);

  // Sync to Firebase Realtime Database
  const syncToFirebase = useCallback(async () => {
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false, error: 'Firebase not initialized. Please configure Firebase settings.' }));
      return;
    }
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      await set(ref(db, 'userData'), {
        categories,
        shoppingLists,
        inventory,
        activeListId,
        currency,
        lastUpdated: new Date().toISOString(),
      });
      setSyncStatus({ lastSynced: new Date(), isSyncing: false, error: null });
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false, error: (error as Error).message }));
    }
  }, [categories, shoppingLists, inventory, activeListId, currency]);

  // Load from Firebase Realtime Database
  const loadFromFirebase = useCallback(async () => {
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false, error: 'Firebase not initialized. Please configure Firebase settings.' }));
      return;
    }
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      const snapshot = await get(ref(db, 'userData'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.categories) setCategories(data.categories);
        if (data.shoppingLists) setShoppingLists(data.shoppingLists);
        if (data.inventory) setInventory(data.inventory);
        if (data.activeListId) setActiveListId(data.activeListId);
        if (data.currency) setCurrency(data.currency);
      }
      setSyncStatus({ lastSynced: new Date(), isSyncing: false, error: null });
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false, error: (error as Error).message }));
    }
  }, []);

  // Auto-load from Firebase on app startup
  useEffect(() => {
    if (firebaseConfig?.apiKey && db && typeof db === 'object' && Object.keys(db).length > 0) {
      // Only load if we haven't loaded yet (no last sync time)
      if (!syncStatus.lastSynced) {
        loadFromFirebase();
      }
    }
  }, [firebaseConfig?.apiKey]);

  const addCategory = useCallback((category: { name: string; description?: string }): Category => {
    const newCategory: Category = {
      id: generateId(),
      name: category.name,
      description: category.description || '',
    };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    ));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  }, []);

  const addShoppingList = useCallback((name: string, items?: ShoppingItem[]): ShoppingList => {
    const newList: ShoppingList = {
      id: generateId(),
      name,
      isStandard: false,
      items: items || [],
    };
    setShoppingLists(prev => [...prev, newList]);
    setActiveListId(newList.id);
    return newList;
  }, []);

  const updateShoppingList = useCallback((id: string, updates: Partial<ShoppingList>) => {
    setShoppingLists(prev => prev.map(list => 
      list.id === id ? { ...list, ...updates } : list
    ));
  }, []);

  const deleteShoppingList = useCallback((id: string) => {
    setShoppingLists(prev => {
      const filtered = prev.filter(list => list.id !== id);
      if (id === activeListId && filtered.length > 0) {
        setActiveListId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeListId]);

  const addItemToList = useCallback((listId: string, item: Omit<ShoppingItem, 'id'>): ShoppingItem => {
    const newItem: ShoppingItem = {
      ...item,
      id: generateId(),
    };
    setShoppingLists(prev => prev.map(list => 
      list.id === listId 
        ? { ...list, items: [...list.items, newItem] }
        : list
    ));
    return newItem;
  }, []);

  const updateItemInList = useCallback((listId: string, itemId: string, updates: Partial<ShoppingItem>) => {
    setShoppingLists(prev => prev.map(list => 
      list.id === listId 
        ? { ...list, items: list.items.map(item => 
            item.id === itemId ? { ...item, ...updates } : item
          )}
        : list
    ));
  }, []);

  const deleteItemFromList = useCallback((listId: string, itemId: string) => {
    setShoppingLists(prev => prev.map(list => 
      list.id === listId 
        ? { ...list, items: list.items.filter(item => item.id !== itemId)}
        : list
    ));
  }, []);

  const moveItemToInventory = useCallback((listId: string, itemId: string, homeQuantity = 1) => {
    const list = shoppingLists.find(l => l.id === listId);
    const item = list?.items.find(i => i.id === itemId);
    if (!item) return;

    const inventoryItem: InventoryItem = {
      ...item,
      id: generateId(),
      homeQuantity,
      dateAdded: new Date().toISOString(),
      location: 'Fridge',
    };

    setInventory(prev => [...prev, inventoryItem]);
  }, [shoppingLists]);

  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id' | 'dateAdded'>): InventoryItem => {
    const newItem: InventoryItem = {
      ...item,
      id: generateId(),
      homeQuantity: item.homeQuantity || 1,
      dateAdded: new Date().toISOString(),
    };
    setInventory(prev => [...prev, newItem]);
    return newItem;
  }, []);

  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const deleteInventoryItem = useCallback((id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearInventory = useCallback(() => {
    setInventory([]);
  }, []);

  const getActiveList = useCallback(() => {
    return shoppingLists.find(list => list.id === activeListId) || shoppingLists[0];
  }, [shoppingLists, activeListId]);

  const value: AppContextType = useMemo(() => ({
    categories,
    shoppingLists,
    inventory,
    activeListId,
    currency,
    language,
    firebaseConfig,
    syncStatus,
    setActiveListId,
    setCurrency,
    setLanguage,
    setFirebaseConfig,
    addCategory,
    updateCategory,
    deleteCategory,
    addShoppingList,
    updateShoppingList,
    deleteShoppingList,
    addItemToList,
    updateItemInList,
    deleteItemFromList,
    moveItemToInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    clearInventory,
    getActiveList,
    syncToFirebase,
    loadFromFirebase,
  }), [categories, shoppingLists, inventory, activeListId, currency, language, firebaseConfig, syncStatus, addCategory, updateCategory, deleteCategory, addShoppingList, updateShoppingList, deleteShoppingList, addItemToList, updateItemInList, deleteItemFromList, moveItemToInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, getActiveList, syncToFirebase, loadFromFirebase]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
