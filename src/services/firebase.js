import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { CLOUD_SYNC_ENABLED } from '../config';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBm75cUtXr_fil1G_ebcpP1W4tp4mznCXU",
  authDomain: "committee-app-92a77.firebaseapp.com",
  projectId: "committee-app-92a77",
  storageBucket: "committee-app-92a77.firebasestorage.app",
  messagingSenderId: "695115957454",
  appId: "1:695115957454:web:8b222b915649614dd37c9f"
};

// Initialize Firebase
const app = CLOUD_SYNC_ENABLED ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
export { doc, setDoc, getDoc, onSnapshot };
