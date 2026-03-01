import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

function getFirebaseConfig(): FirebaseConfig | null {
  const stored = localStorage.getItem('shopping-inventory-app-firebaseConfig');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

const firebaseConfig = getFirebaseConfig();

let app: FirebaseApp;
let analytics: Analytics;
let db: Firestore;

if (firebaseConfig && firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    db = getFirestore(app);
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    app = initializeApp({});
    analytics = {} as Analytics;
    db = {} as Firestore;
  }
} else {
  app = initializeApp({});
  analytics = {} as Analytics;
  db = {} as Firestore;
}

export { app, analytics, db };
export const COLLECTIONS = {
  SHOPPING_LISTS: 'shoppingLists',
  INVENTORY: 'inventory',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
};
