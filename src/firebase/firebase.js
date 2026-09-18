import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase client keys are identifiers, not server secrets. Access is protected by
// Firebase Authentication, Security Rules, App Check, and Android package/SHA setup.
const firebaseConfig = {
  apiKey: 'AIzaSyA1OlJQBFugE7Xw4CJD_bRsauMlvCy5QWk',
  authDomain: 'listing-7621a.firebaseapp.com',
  projectId: 'listing-7621a',
  storageBucket: 'listing-7621a.firebasestorage.app',
  messagingSenderId: '77944162149',
  appId: '1:77944162149:web:ca1b6b690fa3594447838c',
  measurementId: 'G-CDD1996HB0',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let nativeAuth;
try {
  nativeAuth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // Handles Expo Fast Refresh, where Auth may already be initialized.
  nativeAuth = getAuth(app);
}

export const auth = nativeAuth;
export const db = getFirestore(app);
