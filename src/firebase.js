import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAiXhc7B3nup_T1yrZef0zemiT5_t4_8hQ",
  authDomain: "mi-agenda-app-v2.firebaseapp.com",
  projectId: "mi-agenda-app-v2",
  storageBucket: "mi-agenda-app-v2.firebasestorage.app",
  messagingSenderId: "301078194068",
  appId: "1:301078194068:web:587f5d8f4a71e34c6e9181"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
