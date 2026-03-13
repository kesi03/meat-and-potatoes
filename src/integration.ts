import { resources } from "./i18n"
import { db, app, auth } from "./firebase";
import { ref, set, update } from "firebase/database";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GithubAuthProvider, signOut } from "firebase/auth";

const getAuthInstance = () => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  return auth;
};

export const isAuthInitialized = () => auth !== null;

export const loginWithEmail = (email: string, password: string) => signInWithEmailAndPassword(getAuthInstance(), email, password);
export const registerWithEmail = (email: string, password: string) => createUserWithEmailAndPassword(getAuthInstance(), email, password);
export const loginWithGithub = () => signInWithPopup(getAuthInstance(), new GithubAuthProvider());
export const logout = () => signOut(getAuthInstance());
export const observeAuth = (callback: (user: any) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};



type LanguageBlock = {
  translation: Record<string, string>;
};

type Resources = Record<string, LanguageBlock>;

interface CategoryTranslation {
  name: string;
  description: string;
}

interface CategoryEntry {
  id: string;
  name: string;
  description: string;
  translations: Record<string, CategoryTranslation>;
}

export function buildCategoryList(resources: Resources): CategoryEntry[] {
  const baseLang = "en";
  const base = resources[baseLang]?.translation;

  if (!base) {
    throw new Error(`Base language "${baseLang}" not found in resources`);
  }

  // 1. Extract all categoryXXX keys
  const categoryKeys = Object.keys(base)
    .filter(k => k.startsWith("category"))
    .filter(k => {
      const suffix = k.replace("category", "");

      // 1. Must have a suffix
      if (!suffix) return false;

      // 2. Suffix must start with uppercase (Produce, Dairy, MeatDeli)
      if (!/^[A-Z]/.test(suffix)) return false;

      // 3. Must have matching desc key
      return base[`desc${suffix}`];
    });


  // 2. Build entries
  const categories: CategoryEntry[] = categoryKeys.map((catKey, index) => {
    const suffix = catKey.replace("category", "");
    const descKey = `desc${suffix}`;

    const name = base[catKey];
    const description = base[descKey];

    const translations: Record<string, CategoryTranslation> = {};

    // 3. For each language, extract translations if present
    for (const lang of Object.keys(resources)) {
      if (lang === baseLang) continue;

      const t = resources[lang]?.translation;
      if (!t) continue;

      const translatedName = t[catKey];
      const translatedDesc = t[descKey];

      if (translatedName || translatedDesc) {
        translations[lang] = {
          name: translatedName ?? name,
          description: translatedDesc ?? description,
        };
      }
    }

    return {
      id: String(index + 1),
      name,
      description,
      translations,
    };
  });

  return categories;
}

export async function saveCategories(): Promise<void> {
  const categories = buildCategoryList(resources);
  // Placeholder for saving logic, e.g., writing to a file or database
  console.log("Saving categories:", JSON.stringify(categories, null, 2));
  // save to localSessionStorage("categories", categories);
  localStorage.setItem("shopping-inventory-app-categories", JSON.stringify(categories));

  const shoppingLists = localStorage.getItem("shopping-inventory-app-lists");

  const inventory = localStorage.getItem("shopping-inventory-app-inventory");

  const activeListId = localStorage.getItem("shopping-inventory-app-activeListId");

  const currentUser = auth?.currentUser;

  if (!currentUser?.uid) {
    console.error('User not authenticated');
    return;
  }

  await set(ref(db, `userData/${currentUser.uid}`), {
    categories,
    activeListId: activeListId || '',
    shoppingLists: shoppingLists ? JSON.parse(shoppingLists) : [],
    inventory: inventory ? JSON.parse(inventory) : [],
    currency:"GBP",
    lastUpdated: new Date().toISOString(),
  });

}

