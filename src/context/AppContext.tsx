import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { generateId, STANDARD_ITEMS, CurrencyCode, DEFAULT_CURRENCY } from '../meat';
import { db, COLLECTIONS } from '../firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
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
  getActiveList: () => ShoppingList | undefined;
  syncToFirebase: () => Promise<void>;
  loadFromFirebase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'shopping-inventory-app';
const USER_DOC_ID = 'user-data';

import i18n from '../i18n';

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Produce', description: 'Fresh fruits and vegetables', translations: { 
    cy: { name: 'Toraidhean', description: 'Ffrwythau a llysiau ffres' },
    gd: { name: 'Toraidhean', description: 'Fionnarais isealbh' },
    sv: { name: 'Frukt & Grönt', description: 'Frukt och grönsaker' },
    fi: { name: 'Tuoretuotteet', description: 'Tuoreet hedelmät ja vihannekset' },
    ga: { name: 'Torthaí', description: 'Torthaí agus glasraí úra' },
    da: { name: 'Frugt & Grønt', description: 'Frugt og grøntsager' },
    no: { name: 'Frukt & Grønnsaker', description: 'Frukt og grønnsaker' },
    fo: { name: 'Frukt & Grønt', description: 'Frukt og grønir' },
    is: { name: 'Ávextir & Grænmeti', description: 'Ávextir og grænmeti' },
    gv: { name: 'Frogh as Bess', description: 'Frogh as bessyn' },
    kw: { name: 'Frug ha Lys', description: 'Frug ha lys' }
  } },
  { id: '2', name: 'Dairy', description: 'Milk, cheese, eggs, yogurt', translations: { 
    cy: { name: 'Dealan', description: 'Llaeth, caws, wyau, iogwrt' },
    gd: { name: 'Dealan', description: 'Milk, càis, ubhal, càise' },
    sv: { name: 'Mejeri', description: 'Mjölk, ost, ägg, yogurt' },
    fi: { name: 'Maitotuotteet', description: 'Maito, juusto, munat, jogurtti' },
    ga: { name: 'Déirí', description: 'Milk, cáis, ubh, iogart' },
    da: { name: 'Mejeriprodukter', description: 'Mæl, ost, æg, yoghurt' },
    no: { name: 'Meieriprodukter', description: 'Melk, ost, egg, yoghurt' },
    fo: { name: 'Mjólkurvinnul', description: 'Mjólk, ost, egg, jogurt' },
    is: { name: 'Mjólkurvörur', description: 'Mjólk, ostur, egg, jógúrt' },
    gv: { name: 'Saain', description: 'Saain, caas, ugey, iogart' },
    kw: { name: 'Tus', description: 'Moth, kés, odr, yey' }
  } },
  { id: '3', name: 'Meat & Deli', description: 'Fresh meat and deli items', translations: { 
    cy: { name: 'Feoil & Deli', description: 'Cig ffres ac eitemau deli' },
    gd: { name: 'Feoil & Deli', description: 'Feoil ùr agus bathar deli' },
    sv: { name: 'Kött & Chark', description: 'Färskt kött och charkuterier' },
    fi: { name: 'Liha & Charkuteriat', description: 'Tuore liha ja leikkeleet' },
    ga: { name: 'Feoil & Deli', description: 'Feoil úr agus miasa deli' },
    da: { name: 'Kød & Charcuteri', description: 'Frisk kød og charcuteri' },
    no: { name: 'Kjøtt & Charcuterie', description: 'Ferskt kjøtt og delikatesser' },
    fo: { name: 'Kjøt & Deli', description: 'Ferskt kjøt og deli' },
    is: { name: 'Kjöt & Vinnuvörur', description: 'Ferskt kjöt og vinnuvörur' },
    gv: { name: 'Feih as Deli', description: 'Feih as ealyn deli' },
    kw: { name: 'Kig ha Deli', description: 'Kig fres ha eyn deli' }
  } },
  { id: '4', name: 'Bakery', description: 'Bread, pastries, baked goods', translations: { 
    cy: { name: 'Bunnaich', description: 'Bara, pastai, nwydau bobi' },
    gd: { name: 'Bunnaich', description: 'Bread, pastais, bathar bèicte' },
    sv: { name: 'Bageri', description: 'Bröd, kakor, bakverk' },
    fi: { name: 'Leipomotuotteet', description: 'Leipä, leivonnaiset, leivät' },
    ga: { name: 'Bia an tsoithí', description: 'Bread, pastail, bia bácáilte' },
    da: { name: 'Bageri', description: 'Brød, kager, bagværk' },
    no: { name: 'Bakeri', description: 'Brød, kaker, bakverk' },
    fo: { name: 'Bakstur', description: 'Breið, køkur, bakstur' },
    is: { name: 'Bakarí', description: 'Brauð, kökur, bakaðar vörur' },
    gv: { name: 'Bunnyr', description: 'Arran, pastail, bwoid chiood' },
    kw: { name: 'Bryn', description: 'Bar, pastys, byllys' }
  } },
  { id: '5', name: 'Frozen Foods', description: 'Frozen meals and vegetables', translations: { 
    cy: { name: 'Biadh Dirite', description: 'Bwydydd a llysiau rhewllyd' },
    gd: { name: 'Biadh Dirite', description: 'Biadh isealbh is lùban' },
    sv: { name: 'Fryst mat', description: 'Frysta måltider och grönsaker' },
    fi: { name: 'Pakasteet', description: 'Pakasteruuat ja vihannekset' },
    ga: { name: 'Bia Reoite', description: 'Bia reoite isealbh' },
    da: { name: 'Frosne fødevarer', description: 'Frosne måltider og grøntsager' },
    no: { name: 'Frossen mat', description: 'Frosne måltider og grønnsaker' },
    fo: { name: 'Frosin føði', description: 'Frosin matur og grønir' },
    is: { name: 'Frosnar matvörur', description: 'Frosnar máltíðir og grænmeti' },
    gv: { name: 'Frogh Biadhey', description: 'Biadhey roilit as bessyn' },
    kw: { name: 'Bys', description: 'Bys ha lysow' }
  } },
  { id: '6', name: 'Pantry', description: 'Canned goods, pasta, rice, cereals', translations: { 
    cy: { name: 'Pàipear', description: 'Nwydau tun, pasta, reis, grains' },
    gd: { name: 'Pàipear', description: 'Bathar cànte, pasta, rìs, grain' },
    sv: { name: 'Skafferi', description: 'Konserver, pasta, ris, flingor' },
    fi: { name: 'Kuivatavarat', description: 'Säilykkeet, pasta, riisi, murot' },
    ga: { name: 'Piopa', description: 'Canna, pasta, ríse, grainní' },
    da: { name: 'Skafferi', description: 'Konserves, pasta, ris, kornprodukter' },
    no: { name: 'Skafferi', description: 'Konserver, pasta, ris, kornprodukter' },
    fo: { name: 'Skáp', description: 'Glasúr, pasta, rís, korn' },
    is: { name: 'Þurrkaðar vörur', description: 'Dósir, pasta, hrísgrjón, korn' },
    gv: { name: 'Pannyr', description: 'Eealyn kannit, pasta, rys, grain' },
    kw: { name: 'Sopper', description: 'Ternys, pasta, rys, greun' }
  } },
  { id: '7', name: 'Beverages', description: 'Drinks, juices, water', translations: { 
    cy: { name: 'Deoch', description: 'Diodydd, sbeirdd, dŵr' },
    gd: { name: 'Deoch', description: 'Deochan, sùghan, uisge' },
    sv: { name: 'Drycker', description: 'Drycker, juicer, vatten' },
    fi: { name: 'Juomat', description: 'Juomat, mehut, vesi' },
    ga: { name: 'Deocha', description: 'Deocha, sú, uisce' },
    da: { name: 'Drikkevarer', description: 'Drikkevarer, saft, vand' },
    no: { name: 'Drikkevarer', description: 'Drikkevarer, juice, vann' },
    fo: { name: 'Drekka', description: 'Drekka, savir, vatn' },
    is: { name: 'Drykkir', description: 'Drykkir, safar, vatn' },
    gv: { name: 'Jough', description: 'Joughyn, shugh, ushtey' },
    kw: { name: 'Dhydhyow', description: 'Dyvrow, sugyow, dowr' }
  } },
  { id: '8', name: 'Snacks', description: 'Chips, crackers, treats', translations: { 
    cy: { name: 'Biadh-bhioch', description: 'Sips, crackairs, trêt' },
    gd: { name: 'Biadh-bhioch', description: 'Craiceanan, briosgaidean, trèata' },
    sv: { name: 'Snacks', description: 'Chips, kex, godis' },
    fi: { name: 'Välipalat', description: 'Sipsit, keksit, herkut' },
    ga: { name: 'Biashasta', description: 'Siplis, craiceáin, trèatáin' },
    da: { name: 'Snacks', description: 'Chips, kiks, slik' },
    no: { name: 'Snacks', description: 'Chips, kjeks, godteri' },
    fo: { name: 'Snacks', description: 'Chips, køkur, søtmat' },
    is: { name: 'Vínarvörur', description: 'Chips, kex, nammi' },
    gv: { name: 'Snacks', description: 'Snacks, crackairs, trèats' },
    kw: { name: 'Snacks', description: 'Snacks, crackairs, treyts' }
  } },
  { id: '9', name: 'Household', description: 'Cleaning supplies, paper products', translations: { 
    cy: { name: 'Taigh', description: 'Cyflenwadau glanio, nwydau papur' },
    gd: { name: 'Taigh', description: 'Bathar glanaidh, bathar pàipeir' },
    sv: { name: 'Hushåll', description: 'Rengöringsprodukter, pappersprodukter' },
    fi: { name: 'Kotitalous', description: 'Siivoustuotteet, paperituotteet' },
    ga: { name: 'Teach', description: 'Soláthairsí glanta, táirgí páipéir' },
    da: { name: 'Husholdning', description: 'Rengøringsprodukter, papirsprodukter' },
    no: { name: 'Husholdning', description: 'Rengjøringsprodukter, papirprodukter' },
    fo: { name: 'Húsgagn', description: 'Reinsiefni, pappirsproduktir' },
    is: { name: 'Heimilisvörur', description: 'Hreinsivörur, pappavörur' },
    gv: { name: 'Thie', description: 'Eealyn glanno, eealyn pabyr' },
    kw: { name: 'Trevow', description: 'Paper, inn' }
  } },
  { id: '10', name: 'Personal Care', description: 'Toiletries, hygiene products', translations: { 
    cy: { name: 'Cùram pearsanta', description: 'Toiletries, cynhyrchion glanweiriol' },
    gd: { name: 'Cùram pearsanta', description: 'Toiletries, bathar slàinteachais' },
    sv: { name: 'Personlig vård', description: 'Toalettartiklar, hygienprodukter' },
    fi: { name: 'Henkilökohtainen hygienia', description: 'Wc-paperit, hygieniatuotteet' },
    ga: { name: 'Cúram pearsanta', description: 'Toiléirí, táirgí sláintíochta' },
    da: { name: 'Personlig pleje', description: 'Toilettartikler, hygiejneprodukter' },
    no: { name: 'Personlig pleie', description: 'Toalettartikler, hygieneprodukter' },
    fo: { name: 'Persónligr røkt', description: 'Toalettarkar, hygiejniskar vørur' },
    is: { name: 'Persónleg hygiene', description: 'Klósettpappír, hreinlætisvörur' },
    gv: { name: 'Curaid', description: 'Toiletee, eealyn glan' },
    kw: { name: 'Kensa Bersonel', description: 'Toaltres, trêjyow' }
  } },
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

  // Auto-sync to Firebase with debounce
  useEffect(() => {
    // Only sync if Firebase is configured
    if (!firebaseConfig?.apiKey) {
      return;
    }

    // Set a debounce timeout to avoid excessive writes
    const timeout = setTimeout(async () => {
      setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
      try {
        await setDoc(doc(db, COLLECTIONS.SETTINGS, USER_DOC_ID), {
          categories,
          shoppingLists,
          inventory,
          activeListId,
          currency,
          lastUpdated: new Date().toISOString(),
        });
        setSyncStatus({ lastSynced: new Date(), isSyncing: false, error: null });
        console.log('Auto-synced to Firebase');
      } catch (error) {
        setSyncStatus(prev => ({ ...prev, isSyncing: false, error: (error as Error).message }));
        console.error('Auto-sync error:', error);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeout);
  }, [categories, shoppingLists, inventory, activeListId, currency, firebaseConfig?.apiKey]);

  // Sync to Firebase
  const syncToFirebase = useCallback(async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      await setDoc(doc(db, COLLECTIONS.SETTINGS, USER_DOC_ID), {
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

  // Load from Firebase
  const loadFromFirebase = useCallback(async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, USER_DOC_ID));
      if (docSnap.exists()) {
        const data = docSnap.data();
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
    deleteItemFromList(listId, itemId);
  }, [shoppingLists, deleteItemFromList]);

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
