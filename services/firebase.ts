import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import * as _firestore from 'firebase/firestore';

// Workaround for TypeScript error: Module 'firebase/firestore' has no exported member...
const {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  limit,
  orderBy,
  onSnapshot,
  serverTimestamp
} = _firestore as any;

// NOTE: In a real production environment, these would be populated via process.env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD-YOUR-API-KEY-HERE",
  authDomain: "sportpulse-demo.firebaseapp.com",
  projectId: "sportpulse-demo",
  storageBucket: "sportpulse-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  limit,
  orderBy,
  onSnapshot,
  serverTimestamp
};