import { initializeApp } from 'firebase/app';
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
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { doc, setDoc, getDoc, onSnapshot };
