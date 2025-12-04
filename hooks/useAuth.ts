// import { useEffect, useState } from "react";
// import * as Google from "expo-auth-session/providers/google";
// import * as WebBrowser from "expo-web-browser";
// import { GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut } from "firebase/auth";
// import { auth } from "@/app/(tabs)/firebase"; 

// WebBrowser.maybeCompleteAuthSession();

// export function useAuth() {
//   const [user, setUser] = useState<any>(null);

//   // Google auth request
//   const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
//     clientId: "221918419834-af1aedla1nd7q1uohgo54u8eub4ns8d3.apps.googleusercontent.com",
//     androidClientId: "<YOUR_ANDROID_CLIENT_ID>",
//     iosClientId: "<YOUR_IOS_CLIENT_ID>",
//     webClientId: "221918419834-af1aedla1nd7q1uohgo54u8eub4ns8d3.apps.googleusercontent.com",
//   });

//   // When sign-in response comes back
//   useEffect(() => {
//     if (response?.type === "success") {
//       const { id_token } = response.params;
//       const credential = GoogleAuthProvider.credential(id_token);
//       signInWithCredential(auth, credential).catch(console.error);
//     }
//   }, [response]);

//   // Track logged in user
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => setUser(user));
//     return unsubscribe;
//   }, []);

//   return {
//     user,
//     login: () => promptAsync(), // 👈 FIXED
//     logout: () => signOut(auth),
//     request,
//   };
// }

import { useEffect, useState } from "react";
import { auth } from "@/app/(tabs)/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  // Track logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Signup error:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return { user, login, signup, logout };
}
