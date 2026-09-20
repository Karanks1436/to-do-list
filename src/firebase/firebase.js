import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase client keys are identifiers, not server secrets. Access is protected by
// Firebase Authentication, Security Rules, App Check, and Android package/SHA setup.
const firebaseConfig = {
  apiKey: "AIzaSyChKKzm-2tvuiJnco5QQ0hlQ8MM6GWEHXg",
  authDomain: "trash-2treasure.firebaseapp.com",
  projectId: "trash-2treasure",
  storageBucket: "trash-2treasure.firebasestorage.app",
  messagingSenderId: "842983261450",
  appId: "1:842983261450:web:a67cbc653b4f03e8a6a6f3",
  measurementId: "G-0GDKX5BD71"
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
