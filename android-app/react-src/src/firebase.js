import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyClcy7YWLnvH05hx4GBMoxab17QyUolnmI",
  authDomain: "hakdog-91862.firebaseapp.com",
  projectId: "hakdog-91862",
  storageBucket: "hakdog-91862.firebasestorage.app",
  messagingSenderId: "525522947265",
  appId: "1:525522947265:web:7d3b73972816b82c7fd840",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ─── Collection helpers ──────────────────────────────────────────────────────

/** Care Jar document: stores leaves count + streak */
export const careJarRef = () => doc(db, 'care_jar', 'shared');

/** Mailbox notes collection-level doc (we store array in single doc) */
export const mailboxRef = () => doc(db, 'mailbox_notes', 'feed');

/** Kiro pet state document */
export const kiroRef = () => doc(db, 'pet_world', 'kiro_state');

// ─── Generic subscribe util ──────────────────────────────────────────────────
export { onSnapshot, setDoc, getDoc, updateDoc, serverTimestamp };
