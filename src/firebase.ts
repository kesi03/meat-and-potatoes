import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getDatabase, Database } from "firebase/database";
import { getAuth, Auth } from "firebase/auth";

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
let db: Database;
let auth: Auth | null;

if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.storageBucket && firebaseConfig.messagingSenderId && firebaseConfig.appId && firebaseConfig.databaseURL) {
  try {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    db = getDatabase(app, firebaseConfig.databaseURL);
    auth = getAuth(app);
    console.log('Firebase initialized successfully');
    console.log('Firebase config:', firebaseConfig);
    console.log('Firebase app name:', app.name);
    console.log('Firebase analytics:', analytics);
    console.log('Firebase Realtime Database:', db);
    console.log('Firebase Auth:', auth);
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    app = initializeApp({});
    analytics = {} as Analytics;
    db = {} as Database;
    auth = null;
  }
} else {
  console.warn('Firebase config not found in localStorage. Realtime Database syncing will not work until config is provided.');
  app = initializeApp({});
  analytics = {} as Analytics;
  db = {} as Database;
  auth = null;
}

export { app, analytics, db, auth };
