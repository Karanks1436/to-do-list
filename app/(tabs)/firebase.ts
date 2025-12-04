// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Replace with your Firebase Web config
const firebaseConfig = {
  apiKey: "AIzaSyA1OlJQBFugE7Xw4CJD_bRsauMlvCy5QWk",
  authDomain: "listing-7621a.firebaseapp.com",
  projectId: "listing-7621a",
  storageBucket: "listing-7621a.firebasestorage.app",
  messagingSenderId: "77944162149",
  appId: "1:77944162149:web:ca1b6b690fa3594447838c",
  measurementId: "G-CDD1996HB0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
