import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACkAMSoQ_-iABpAxwKWdKN8ttGY2uXRRc",
  authDomain: "mi-agenda-app-3d047.firebaseapp.com",
  projectId: "mi-agenda-app-3d047",
  storageBucket: "mi-agenda-app-3d047.firebasestorage.app",
  messagingSenderId: "659150244676",
  appId: "1:659150244676:web:0fa29ed15ce046bd296511"
};
      


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
