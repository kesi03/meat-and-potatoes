import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { generateId, STANDARD_ITEMS, CurrencyCode, DEFAULT_CURRENCY } from '../meat';
import { db } from '../firebase';
import { ref, set, get, onValue, update, remove, push } from 'firebase/database';
import { User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { loginWithEmail, registerWithEmail, loginWithGithub as loginWithGithubAuth, logout as firebaseLogout, observeAuth } from '../integration';
import { setSession, clearSession, hasValidSession, initActivityTracking, getSession } from '../session';
import i18n from '../i18n';

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
  image: string;
  ingredients?: string;
  allergens?: string;
  labels?: string;
  country?: string;
  nutriscore?: string;
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
  pickedItems?: string[];
}

export interface SyncStatus {
  lastSynced: Date | null;
  isSyncing: boolean;
  error: string | null;
}

export interface Profile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  alias: string;
  image: string;
  language: string;
}

export interface SharedList {
  listId: string;
  listName?: string;
  name?: string;
  ownerId: string;
  addedAt: number;
  role: 'owner' | 'member';
  members?: Record<string, { addedAt: number; role: string }>;
}

export interface Notification {
  id: string;
  type: string;
  fromUserId?: string;
  fromName?: string;
  listId?: string;
  listName?: string;
  invitationId?: string;
  status?: 'pending' | 'accepted' | 'declined';
  read: boolean;
  createdAt: number;
}

interface AppContextType {
  user: User | null;
  authLoading: boolean;
  offlineMode: boolean;
  setOfflineMode: (offline: boolean) => void;
  categories: Category[];
  shoppingLists: ShoppingList[];
  inventory: InventoryItem[];
  activeListId: string;
  sharedLists: SharedList[];
  sharedListItems: ShoppingItem[];
  sharedListPickedItems: string[];
  memberPickedItems: string[];
  notifications: Notification[];
  unreadCount: number;
  currency: CurrencyCode;
  language: string;
  firebaseConfig: FirebaseConfig | null;
  syncStatus: SyncStatus;
  profile: Profile;
  setActiveListId: (id: string) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setLanguage: (language: string) => void;
  setFirebaseConfig: (config: FirebaseConfig | null) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  shareList: (listId: string, listName: string, email: string, message: string) => Promise<void>;
  acceptInvitation: (invitationId: string, notificationId?: string) => Promise<void>;
  declineInvitation: (invitationId: string, notificationId?: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  addCategory: (category: { name: string; description?: string }) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addShoppingList: (name: string, items?: ShoppingItem[]) => ShoppingList;
  updateShoppingList: (id: string, updates: Partial<ShoppingList>) => void;
  deleteShoppingList: (id: string) => void;
  addItemToList: (listId: string, item: Omit<ShoppingItem, 'id'>, ownerId?: string) => ShoppingItem;
  updateItemInList: (listId: string, itemId: string, updates: Partial<ShoppingItem>) => void;
  deleteItemFromList: (listId: string, itemId: string) => void;
  togglePickedItem: (listId: string, itemId: string) => void;
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
      image: '',
    })),
  },
];

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [offlineMode, setOfflineMode] = useState<boolean>(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}-offline`);
    return stored === 'true';
  });
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>(DEFAULT_LISTS);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeListId, setActiveListId] = useState<string>('standard');
  const [sharedLists, setSharedLists] = useState<SharedList[]>([]);
  const [sharedListItems, setSharedListItems] = useState<ShoppingItem[]>([]);
  const [sharedListPickedItems, setSharedListPickedItems] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [language, setLanguage] = useState<string>('en');
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(null);
  const [profile, setProfile] = useState<Profile>(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}-profile`);
    return stored ? JSON.parse(stored) : {
      userId: '',
      firstName: '',
      lastName: '',
      email: '',
      alias: '',
      image: '',
      language: 'en',
    };
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-profile`, JSON.stringify(profile));
  }, [profile]);

  // Load shared list items when activeListId is a shared list - use real-time listener
  console.log('[SharedList] ===== NEW CODE RUNNING ===== activeListId:', activeListId, 'sharedLists:', sharedLists.map(l => l.listId), 'user:', !!user?.uid);
  useEffect(() => {
    console.log('[SharedList] ===== USE EFFECT FIRED ===== activeListId:', activeListId);
    
    const sharedList = sharedLists.find(l => l.listId === activeListId);
    if (!sharedList || !user?.uid) {
      console.log('[SharedList] No sharedList or user, clearing items');
      setSharedListItems([]);
      return;
    }

    // shoppingLists is an array, not an object - query the whole array and filter by listName
    console.log('[SharedList] NEW LISTENER: Fetching all shoppingLists from:', `userData/${sharedList.ownerId}/shoppingLists`, 'looking for listName:', sharedList.listName);
    const listsRef = ref(db, `userData/${sharedList.ownerId}/shoppingLists`);
    
    const unsubscribe = onValue(listsRef, (snapshot) => {
      console.log('[SharedList] NEW LISTENER: triggered, exists:', snapshot.exists());
      if (snapshot.exists()) {
        const lists = snapshot.val();
        console.log('[SharedList] NEW LISTENER: lists found, type:', Array.isArray(lists) ? 'array' : typeof lists, 'length:', Array.isArray(lists) ? lists.length : 'N/A');
        if (Array.isArray(lists)) {
          console.log('[SharedList] NEW LISTENER: list names:', lists.map((l: any) => l.name));
        }
        // Find the list by NAME (not ID) - this handles case where list was re-created with new ID
        let foundList = Array.isArray(lists) ? lists.find((l: any) => l.name?.toLowerCase() === sharedList.listName?.toLowerCase()) : null;
        
        // Fallback: if name doesn't match, find the first non-standard list (common case when list was re-created)
        if (!foundList && Array.isArray(lists)) {
          const nonStandardLists = lists.filter((l: any) => !l.isStandard);
          if (nonStandardLists.length === 1) {
            foundList = nonStandardLists[0];
            console.log('[SharedList] NEW LISTENER: using fallback - first non-standard list:', foundList?.name);
          }
        }
        
        console.log('[SharedList] NEW LISTENER: found list by name:', foundList ? foundList.name : 'not found');
        setSharedListItems(foundList?.items || []);
      } else {
        setSharedListItems([]);
      }
    }, (error) => {
      console.error('[SharedList] NEW LISTENER: error:', error);
      setSharedListItems([]);
    });

    return () => unsubscribe();
  }, [activeListId, sharedLists, user?.uid]);

  // Real-time listener for shared list picked items (member's own picks)
  useEffect(() => {
    if (!user?.uid || !activeListId) {
      setSharedListPickedItems([]);
      return;
    }

    const pickedItemsRef = ref(db, `userData/${user.uid}/sharedListPickedItems/${activeListId}`);
    const unsubscribe = onValue(pickedItemsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const pickedItems = Object.keys(data).filter(key => data[key] === true);
        setSharedListPickedItems(pickedItems);
      } else {
        setSharedListPickedItems([]);
      }
    }, (error) => {
      console.error('[SharedList] pickedItems listener error:', error);
      setSharedListPickedItems([]);
    });

    return () => unsubscribe();
  }, [activeListId, user?.uid, db]);

  // Real-time listener for shared picked items from other members (for owner)
  const [memberPickedItems, setMemberPickedItems] = useState<string[]>([]);
  useEffect(() => {
    if (!user?.uid || !activeListId) {
      setMemberPickedItems([]);
      return;
    }

    const isOwner = sharedLists.some(l => l.listId === activeListId && l.role === 'owner');
    if (!isOwner) {
      setMemberPickedItems([]);
      return;
    }

    const sharedPickedRef = ref(db, `sharedPickedItems/${activeListId}`);
    const unsubscribe = onValue(sharedPickedRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const pickedItems = Object.keys(data);
        setMemberPickedItems(pickedItems);
      } else {
        setMemberPickedItems([]);
      }
    }, (error) => {
      console.error('[SharedList] memberPickedItems listener error:', error);
      setMemberPickedItems([]);
    });

    return () => unsubscribe();
  }, [activeListId, sharedLists, user?.uid, db]);

  // Real-time listener for notifications
  useEffect(() => {
    if (!user?.uid) return;

    const notificationsRef = ref(db, `userData/${user.uid}/notifications`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const notifs = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: Notification) => !n.read && n.status !== 'accepted').length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Real-time listener for shared lists
  useEffect(() => {
    if (!user?.uid) return;

    const sharedListsRef = ref(db, `userData/${user.uid}/sharedLists`);
    const unsubscribe = onValue(sharedListsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const lists = Object.entries(data).map(([id, value]: [string, any]) => ({
          listId: id,
          ...value,
        }));
        setSharedLists(lists);
      } else {
        setSharedLists([]);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const updateProfile = useCallback((updates: Partial<Profile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  // Clear all state on logout
  const clearState = useCallback(() => {
    setDataLoaded(false);
    setCategories(DEFAULT_CATEGORIES);
    setShoppingLists(DEFAULT_LISTS);
    setInventory([]);
    setActiveListId('standard');
    setProfile({
      userId: '',
      firstName: '',
      lastName: '',
      email: '',
      alias: '',
      image: '',
      language: 'en',
    });
  }, []);

  // Set language when it changes
  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem(`${STORAGE_KEY}-language`, language);
  }, [language]);

  const login = useCallback(async (email: string, password: string) => {
    await loginWithEmail(email, password);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    await registerWithEmail(email, password);
  }, []);

  const loginWithGithub = useCallback(async () => {
    await loginWithGithubAuth();
  }, []);

  const logout = useCallback(async () => {
    await firebaseLogout();
    clearSession();
    clearState();
    setUser(null);
  }, [clearState]);

  // Initialize activity tracking
  useEffect(() => {
    const cleanup = initActivityTracking(() => {
      logout();
    });
    return cleanup;
  }, [logout]);

  // Auth observer
  useEffect(() => {
    const unsubscribe = observeAuth((u) => {
      // Clear old session if user changed
      const currentSession = getSession();
      if (currentSession && u && currentSession.userId !== u.uid) {
        clearSession();
      }
      
      if (u) {
        setSession(u.uid, u.email || undefined);
      }
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Check session on mount
  useEffect(() => {
    if (hasValidSession()) {
      setAuthLoading(false);
    }
  }, []);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSynced: null,
    isSyncing: false,
    error: null,
  });

  // Sync to Firebase - only sync user-controlled data, NOT notifications/sharedLists
  const syncToFirebase = useCallback(async () => {
    if (!db) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false, error: 'Firebase not initialized' }));
      return;
    }
    if (!user?.uid) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false, error: 'User not authenticated' }));
      return;
    }
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      // Only sync data that user controls - don't overwrite notifications/sharedLists
      await set(ref(db, `userData/${user.uid}/profile`), profile);
      await set(ref(db, `userData/${user.uid}/categories`), categories);
      await set(ref(db, `userData/${user.uid}/shoppingLists`), shoppingLists);
      await set(ref(db, `userData/${user.uid}/inventory`), inventory);
      await set(ref(db, `userData/${user.uid}/activeListId`), activeListId);
      await set(ref(db, `userData/${user.uid}/currency`), currency);
      await set(ref(db, `userData/${user.uid}/lastUpdated`), new Date().toISOString());
      setSyncStatus({ lastSynced: new Date(), isSyncing: false, error: null });
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false, error: (error as Error).message }));
    }
  }, [categories, shoppingLists, inventory, activeListId, currency, user?.uid, profile]);

  // Handle offline mode toggle
  const handleSetOfflineMode = useCallback(async (offline: boolean) => {
    const userId = user?.uid;
    if (!userId) return;

    if (offline) {
      // Save current state to localStorage (skip if quota exceeded)
      try {
        localStorage.setItem(`${STORAGE_KEY}-${userId}-offline-categories`, JSON.stringify(categories));
        localStorage.setItem(`${STORAGE_KEY}-${userId}-offline-shoppingLists`, JSON.stringify(shoppingLists));
        localStorage.setItem(`${STORAGE_KEY}-${userId}-offline-inventory`, JSON.stringify(inventory));
        localStorage.setItem(`${STORAGE_KEY}-${userId}-offline-activeListId`, activeListId);
        localStorage.setItem(`${STORAGE_KEY}-${userId}-offline-currency`, currency);
        localStorage.setItem(`${STORAGE_KEY}-${userId}-offline-profile`, JSON.stringify(profile));
      } catch (e) {
        console.error('LocalStorage quota exceeded:', e);
        setSyncStatus(prev => ({ ...prev, error: 'LocalStorage full. Cannot enable offline mode.' }));
        return;
      }
    } else {
      // Load from localStorage (local wins)
      const localCategories = localStorage.getItem(`${STORAGE_KEY}-${userId}-offline-categories`);
      const localLists = localStorage.getItem(`${STORAGE_KEY}-${userId}-offline-shoppingLists`);
      const localInventory = localStorage.getItem(`${STORAGE_KEY}-${userId}-offline-inventory`);
      const localActiveListId = localStorage.getItem(`${STORAGE_KEY}-${userId}-offline-activeListId`);
      const localCurrency = localStorage.getItem(`${STORAGE_KEY}-${userId}-offline-currency`);
      const localProfile = localStorage.getItem(`${STORAGE_KEY}-${userId}-offline-profile`);

      if (localCategories) setCategories(JSON.parse(localCategories));
      if (localLists) {
        const lists = JSON.parse(localLists);
        setShoppingLists(lists.map((list: ShoppingList) => ({ ...list, items: list.items || [] })));
      }
      if (localInventory) setInventory(JSON.parse(localInventory));
      if (localActiveListId) setActiveListId(localActiveListId);
      if (localCurrency) setCurrency(localCurrency as CurrencyCode);
      if (localProfile) setProfile(JSON.parse(localProfile));

      // Sync merged data to Firebase
      await syncToFirebase();
    }

    setOfflineMode(offline);
    localStorage.setItem(`${STORAGE_KEY}-offline`, offline.toString());
  }, [user?.uid, categories, shoppingLists, inventory, activeListId, currency, profile, syncToFirebase]);

  // Share a list with another user
  const shareList = useCallback(async (listId: string, listName: string, email: string, message: string) => {
    if (!user?.uid) return;
    
    try {
      const shareListFn = httpsCallable(functions, 'sendInvitation');
      await shareListFn({
        listId,
        listName,
        ownerId: user.uid,
        ownerName: profile.alias || profile.firstName || profile.email,
        email,
        message,
      });
    } catch (error) {
      console.error('Error sharing list:', error);
      throw error;
    }
  }, [user?.uid, profile]);

  // Accept an invitation
  const acceptInvitation = useCallback(async (invitationId: string, notificationId?: string) => {
    if (!user?.uid) return;
    
    try {
      const acceptFn = httpsCallable(functions, 'acceptInvitation');
      await acceptFn({ invitationId, userId: user.uid });
      
      // Update notification status if notificationId provided
      if (notificationId) {
        await set(ref(db, `userData/${user.uid}/notifications/${notificationId}/status`), 'accepted');
        setUnreadCount(notifications.filter((n: Notification) => !n.read && n.status !== 'accepted').length);
      }
      
      // Refresh shared lists
      const sharedSnapshot = await get(ref(db, `userData/${user.uid}/sharedLists`));
      if (sharedSnapshot.exists()) {
        const data = sharedSnapshot.val();
        const lists = Object.entries(data).map(([id, value]: [string, any]) => ({
          listId: id,
          ...value,
        }));
        setSharedLists(lists);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }, [user?.uid]);

  // Decline an invitation
  const declineInvitation = useCallback(async (invitationId: string, notificationId?: string) => {
    if (!user?.uid) return;
    
    try {
      const declineFn = httpsCallable(functions, 'declineInvitation');
      await declineFn({ invitationId, userId: user.uid });
      
      // Update notification status if notificationId provided
      if (notificationId) {
        await set(ref(db, `userData/${user.uid}/notifications/${notificationId}/status`), 'declined');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  }, [user?.uid]);

  // Mark notification as read
  const markNotificationRead = useCallback((notificationId: string) => {
    if (!user?.uid) return;
    
    setNotifications(prev => {
      const updated = prev.map(n => n.id === notificationId ? { ...n, read: true } : n);
      setUnreadCount(updated.filter((n: Notification) => !n.read && n.status !== 'accepted').length);
      return updated;
    });
    
    // Update in Firebase
    if (db && user?.uid) {
      set(ref(db, `userData/${user.uid}/notifications/${notificationId}/read`), true);
    }
  }, [user?.uid]);

  // Load from Firebase
  const loadFromFirebase = useCallback(async () => {
    if (!db) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false, error: 'Firebase not initialized' }));
      return;
    }
    if (!user?.uid) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false, error: 'User not authenticated' }));
      return;
    }
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      const snapshot = await get(ref(db, `userData/${user.uid}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.profile) {
          setProfile({ ...data.profile, userId: user.uid });
          localStorage.setItem(`${STORAGE_KEY}-profile`, JSON.stringify({ ...data.profile, userId: user.uid }));
        }
        if (data.categories) setCategories(data.categories);
        if (data.shoppingLists) {
          setShoppingLists(data.shoppingLists.map((list: ShoppingList) => ({
            ...list,
            items: list.items || [],
          })));
        }
        if (data.inventory) setInventory(data.inventory);
        if (data.activeListId) setActiveListId(data.activeListId);
        if (data.currency) setCurrency(data.currency);
        
        // Load shared lists
        if (data.sharedLists) {
          const lists = Object.entries(data.sharedLists).map(([id, value]: [string, any]) => ({
            listId: id,
            ...value,
          }));
          setSharedLists(lists);
        }
        
        // Load notifications
        if (data.notifications) {
          const notifs = Object.entries(data.notifications).map(([id, value]: [string, any]) => ({
            id,
            ...value,
          })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setNotifications(notifs);
          setUnreadCount(notifs.filter((n: Notification) => !n.read && n.status !== 'accepted').length);
        }
      } else {
        // First login - create profile from user data
        const newProfile: Profile = {
          userId: user.uid,
          firstName: '',
          lastName: '',
          email: user.email || '',
          alias: '',
          image: '',
          language: 'en',
        };
        setProfile(newProfile);
        localStorage.setItem(`${STORAGE_KEY}-profile`, JSON.stringify(newProfile));
      }
      setDataLoaded(true);
      setSyncStatus({ lastSynced: new Date(), isSyncing: false, error: null });
    } catch (error) {
      setDataLoaded(true);
      setSyncStatus(prev => ({ ...prev, isSyncing: false, error: (error as Error).message }));
    }
  }, [user?.uid, syncToFirebase]);

  // Auto-load from Firebase when user logs in
  useEffect(() => {
    if (!user?.uid) return;
    loadFromFirebase();
  }, [user?.uid]);

  // Auto-sync on changes (debounced) - only after data is loaded from Firebase and not in offline mode
  useEffect(() => {
    if (!user?.uid || !dataLoaded || offlineMode) return;
    const timeout = setTimeout(() => {
      syncToFirebase();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [categories, shoppingLists, inventory, activeListId, currency, profile, user?.uid, dataLoaded, offlineMode]);

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
    return newList;
  }, []);

  const updateShoppingList = useCallback((id: string, updates: Partial<ShoppingList>) => {
    const list = shoppingLists.find(l => l.id === id);
    const oldName = list?.name;
    
    setShoppingLists(prev => prev.map(list => 
      list.id === id ? { ...list, ...updates } : list
    ));

    // If name changed, update the list in Firebase and sync to shared list members
    if (updates.name && updates.name !== oldName && user?.uid) {
      const listRef = ref(db, `userData/${user.uid}/shoppingLists/${id}`);
      update(listRef, { name: updates.name });

      // Also update shared list entries for all members who have this list shared
      const sharedListRef = ref(db, `userData/${user.uid}/sharedLists`);
      get(sharedListRef).then(snapshot => {
        if (snapshot.exists()) {
          const sharedListsData = snapshot.val();
      Object.entries(sharedListsData).forEach(([memberId, memberData]: [string, any]) => {
        if (memberData.members) {
          Object.keys(memberData.members).forEach(memberUserId => {
            const memberSharedListRef = ref(db, `userData/${memberUserId}/sharedLists/${id}/listName`);
            update(memberSharedListRef, { name: updates.name });
          });
        }
      });
        }
      });
    }
  }, []);

  const deleteShoppingList = useCallback((id: string) => {
    setShoppingLists(prev => prev.filter(list => list.id !== id));
  }, []);

  const addItemToList = useCallback((listId: string, item: Omit<ShoppingItem, 'id'>, ownerId?: string): ShoppingItem => {
    const newItem: ShoppingItem = { ...item, id: generateId() };
    
    // If ownerId is provided, this is a shared list - update local state and sync to owner
    if (ownerId && user?.uid) {
      // Update local shared list items
      setSharedListItems(prev => [...prev, newItem]);
      
      // Sync to owner's list in Firebase
      const targetOwnerId = ownerId === 'self' ? user.uid : ownerId;
      set(ref(db, `userData/${targetOwnerId}/shoppingLists/${listId}/items/${newItem.id}`), newItem);
    } else {
      // Regular list update
      setShoppingLists(prev => prev.map(list => 
        list.id === listId 
          ? { ...list, items: [...list.items, newItem] }
          : list
      ));
    }
    return newItem;
  }, [user?.uid]);

  const updateItemInList = useCallback((listId: string, itemId: string, updates: Partial<ShoppingItem>) => {
    setShoppingLists(prev => prev.map(list => 
      list.id === listId 
        ? { 
            ...list, 
            items: list.items.map(item => 
              item.id === itemId ? { ...item, ...updates } : item
            ) 
          }
        : list
    ));
  }, []);

  const deleteItemFromList = useCallback((listId: string, itemId: string) => {
    setShoppingLists(prev => prev.map(list => 
      list.id === listId 
        ? { ...list, items: list.items.filter(item => item.id !== itemId) }
        : list
    ));
  }, []);

  const togglePickedItem = useCallback((listId: string, itemId: string) => {
    const sharedList = sharedLists.find(l => l.listId === listId);
    const isShared = !!sharedList;
    console.log('[ListsPage] togglePickedItem listId:', listId, 'itemId:', itemId, 'isShared:', isShared, 'sharedLists:', sharedLists.map(l => l.listId));
    if (isShared) {
      // Determine new state first
      const isCurrentlyPicked = sharedListPickedItems.includes(itemId);
      const willBePicked = !isCurrentlyPicked;

      setSharedListPickedItems(prev => {
        const newPickedItems = prev.includes(itemId)
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId];
        return newPickedItems;
      });

      // Sync to Firebase separately to avoid race condition with listener
      if (user?.uid) {
        const pickedItemsRef = ref(db, `userData/${user.uid}/sharedListPickedItems/${listId}/${itemId}`);
        if (willBePicked) {
          console.log('[ListsPage] togglePickedItem Saving to Firebase (now picked)');
          set(pickedItemsRef, true).catch(err => console.error('[ListsPage] togglePickedItem Firebase set error:', err));
        } else {
          console.log('[ListsPage] togglePickedItem Removing from Firebase (was picked)');
          remove(pickedItemsRef).catch(err => console.error('[ListsPage] togglePickedItem Firebase remove error:', err));
        }

        // If current user is a member (not owner), also write to shared path and notify owner
        if (sharedList && sharedList.role === 'member' && sharedList.ownerId) {
          // Write to shared path so owner can see member picks
          const sharedPickedRef = ref(db, `sharedPickedItems/${listId}/${itemId}`);
          if (willBePicked) {
            set(sharedPickedRef, {
              pickedBy: user.uid,
              pickedByName: user.displayName || 'Someone',
              timestamp: Date.now()
            }).catch(err => console.error('[SharedList] sharedPickedItems error:', err));
          } else {
            remove(sharedPickedRef).catch(err => console.error('[SharedList] sharedPickedItems remove error:', err));
          }
          // Notify owner when item is picked
          if (willBePicked) {
            const notificationRef = ref(db, `userData/${sharedList.ownerId}/notifications`);
            push(notificationRef, {
              type: 'item_picked',
              fromUserId: user.uid,
              fromName: user.displayName || 'Someone',
              listId,
              listName: sharedList.listName || sharedList.name || 'Shared List',
              itemId,
              read: false,
              createdAt: Date.now(),
            }).catch(err => console.error('[SharedList] Notification error:', err));
          }
        }
      }
    } else {
      setShoppingLists(prev => prev.map(list => {
        if (list.id !== listId) return list;
        const pickedItems = list.pickedItems || [];
        if (pickedItems.includes(itemId)) {
          return { ...list, pickedItems: pickedItems.filter(id => id !== itemId) };
        } else {
          return { ...list, pickedItems: [...pickedItems, itemId] };
        }
      }));
    }
  }, [sharedLists, sharedListPickedItems, user, db]);

  const moveItemToInventory = useCallback((listId: string, itemId: string, homeQuantity?: number) => {
    const list = shoppingLists.find(l => l.id === listId);
    const item = list?.items.find(i => i.id === itemId);
    if (item) {
      const inventoryItem: InventoryItem = {
        ...item,
        homeQuantity: homeQuantity || item.quantity,
        dateAdded: new Date().toISOString(),
        location: '',
      };
      setInventory(prev => [...prev, inventoryItem]);
      deleteItemFromList(listId, itemId);
    }
  }, [shoppingLists, deleteItemFromList]);

  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id' | 'dateAdded'>): InventoryItem => {
    const newItem: InventoryItem = {
      ...item,
      id: generateId(),
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
    // First check user's own lists
    const list = shoppingLists.find(list => list.id === activeListId);
    if (list) return list;
    
    // Then check shared lists
    const shared = sharedLists.find(list => list.listId === activeListId);
    if (shared) {
      return {
        id: shared.listId,
        name: shared.listName || shared.name || '',
        isStandard: false,
        items: [],
        ownerId: shared.ownerId,
        isShared: true,
        pickedItems: sharedListPickedItems,
      };
    }
    
    return undefined;
  }, [shoppingLists, sharedLists, activeListId]);

  const value = useMemo(() => ({
    user,
    authLoading,
    offlineMode,
    setOfflineMode: handleSetOfflineMode,
    categories,
    shoppingLists,
    inventory,
    activeListId,
    sharedLists,
    sharedListItems,
    sharedListPickedItems,
    memberPickedItems,
    notifications,
    unreadCount,
    currency,
    language,
    firebaseConfig,
    syncStatus,
    profile,
    setActiveListId,
    setCurrency,
    setLanguage,
    setFirebaseConfig,
    updateProfile,
    shareList,
    acceptInvitation,
    declineInvitation,
    markNotificationRead,
    login,
    register,
    loginWithGithub,
    logout,
    addCategory,
    updateCategory,
    deleteCategory,
    addShoppingList,
    updateShoppingList,
    deleteShoppingList,
    addItemToList,
    updateItemInList,
    deleteItemFromList,
    togglePickedItem,
    moveItemToInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    clearInventory,
    getActiveList,
    syncToFirebase,
    loadFromFirebase,
  }), [categories, shoppingLists, inventory, activeListId, sharedListPickedItems, memberPickedItems, currency, language, firebaseConfig, syncStatus, profile, addCategory, updateCategory, deleteCategory, addShoppingList, updateShoppingList, deleteShoppingList, addItemToList, updateItemInList, deleteItemFromList, togglePickedItem, moveItemToInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, getActiveList, syncToFirebase, loadFromFirebase]);

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
