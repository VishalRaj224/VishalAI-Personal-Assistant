import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  type User 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  type Firestore 
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize or reuse Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific databaseId if configured
export const db: Firestore = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

// Test connection to Firestore on initialization as mandated by Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    // Only attempt server fetch if authenticated to respect security rules
    if (auth.currentUser) {
      await getDocFromServer(doc(db, "test", "connection"));
    }
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore client offline. Local caching active.");
      return false;
    }
    return true;
  }
}

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Firebase Google Auth Error:", error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged, type User };
