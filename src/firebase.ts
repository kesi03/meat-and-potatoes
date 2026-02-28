import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCWL78tVJcYfHoaz4cCu3_Eo_6PO1vW2fw",
  authDomain: "meat-and-potatoes-86149.firebaseapp.com",
  projectId: "meat-and-potatoes-86149",
  storageBucket: "meat-and-potatoes-86149.firebasestorage.app",
  messagingSenderId: "807562708584",
  appId: "1:807562708584:web:1e668778003a083260dddd",
  measurementId: "G-D53SRDFZFJ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
export const COLLECTIONS = {
  SHOPPING_LISTS: 'shoppingLists',
  INVENTORY: 'inventory',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
};
