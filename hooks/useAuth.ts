import { useEffect, useState } from "react";
import { auth, db } from "@/app/(tabs)/firebase"; // db = Firestore instance
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface ExtraUserData {
  name?: string;
  contact?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [extraData, setExtraData] = useState<ExtraUserData>({});
  const [loading, setLoading] = useState(true);

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch extra data from Firestore
        const docRef = doc(db, "Appusers", u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setExtraData(docSnap.data() as ExtraUserData);
        } else {
          setExtraData({});
        }
      } else {
        setExtraData({});
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const u = await signInWithEmailAndPassword(auth, email, password);
    setUser(u.user);

    // fetch extra data
    const docRef = doc(db, "Appusers", u.user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) setExtraData(docSnap.data() as ExtraUserData);

    return u.user;
  };

  const signup = async (
    email: string,
    password: string,
    data: { name: string; contact: string }
  ) => {
    const u = await createUserWithEmailAndPassword(auth, email, password);
    setUser(u.user);

    // Save extra data to Firestore
    await setDoc(doc(db, "Appusers", u.user.uid), data);

    setExtraData(data);
    return u.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setExtraData({});
  };

  return { user, extraData, loading, login, signup, logout };
}
