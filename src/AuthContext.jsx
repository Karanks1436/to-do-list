import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from './firebase';
import { completeRegistration, watchProfile } from './marketplaceService';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user,setUser]=useState(null), [profile,setProfile]=useState(null), [loading,setLoading]=useState(true);
  useEffect(()=>onAuthStateChanged(auth,u=>{setUser(u);setLoading(false)}),[]);
  useEffect(()=>{if(!user){setProfile(null);return} return watchProfile(user.uid,setProfile,console.warn)},[user?.uid]);
  const signup=async({name,email,password,role,...details})=>{
    const credential=await createUserWithEmailAndPassword(auth,email.trim(),password);
    await updateProfile(credential.user,{displayName:name});
    const result=await completeRegistration({name,role,...details});
    await credential.user.getIdToken(true);
    return result;
  };
  const login=(email,password)=>signInWithEmailAndPassword(auth,email.trim(),password);
  const logout=()=>signOut(auth);
  return <AuthContext.Provider value={{user,profile,role:profile?.role,status:profile?.status,loading,signup,login,logout}}>{children}</AuthContext.Provider>;
}
