import{createUserWithEmailAndPassword,GoogleAuthProvider,sendPasswordResetEmail,signInWithCredential,signInWithEmailAndPassword,signOut,updateProfile}from'firebase/auth';import{addDoc,collection,doc,onSnapshot,serverTimestamp,updateDoc}from'firebase/firestore';import{auth,db}from'./firebase';import{completeRegistration,createPickupRequest,watchApprovedCollectors,watchGiverPickups}from'./marketplaceService';
export const MAX_BASE64_BYTES=700*1024;const size=b=>Math.ceil((((b||'').split(',').pop()||'').length*3)/4);const clean=b=>{if(!b)throw Error('File encoding failed.');if(size(b)>MAX_BASE64_BYTES)throw Error('File exceeds 700 KB.');return b.split(',').pop()};
export async function registerUser({name,email,password,role='giver'}){const r=await createUserWithEmailAndPassword(auth,email.trim(),password);await updateProfile(r.user,{displayName:name.trim()});await completeRegistration({name,role});return r.user}
export const loginUser=(email,password)=>signInWithEmailAndPassword(auth,email.trim(),password).then(x=>x.user);
export async function loginWithGoogleIdToken(token,role='giver'){const r=await signInWithCredential(auth,GoogleAuthProvider.credential(token));await completeRegistration({name:r.user.displayName||'Recycler',role});return r.user}
export const resetPassword=email=>sendPasswordResetEmail(auth,email.trim());
export const logoutUser=()=>signOut(auth);
export const subscribeUser=(uid,cb,error)=>onSnapshot(doc(db,'users',uid),s=>cb(s.exists()?s.data():null),error);
export const subscribeCollectors=watchApprovedCollectors;
export const subscribeUserPickups=watchGiverPickups;
export async function saveWasteScan({uid,base64,mimeType='image/jpeg',analysis={verification:'collector_required'}}){return addDoc(collection(db,'wasteImages'),{userId:uid,base64:clean(base64),mimeType,bytes:size(base64),analysis,createdAt:serverTimestamp()})}
export async function createPickup(data){return createPickupRequest({materialId:data.materialId,originalQuantity:Number(data.originalQuantity??data.quantityKg),originalUnit:data.originalUnit||'kg',estimatedKg:Number(data.quantityKg),collectorId:data.collector?.id||null,collectorName:data.collector?.name||null,imageId:data.scanId||null,location:data.location||null,address:data.address||null})}
export const updateUserSettings=(uid,settings)=>updateDoc(doc(db,'users',uid),{settings,updatedAt:serverTimestamp()});
export async function uploadBase64Document({uid,name,mimeType,base64}){return addDoc(collection(db,'collectorDocuments',uid,'files'),{userId:uid,name,mimeType,base64:clean(base64),bytes:size(base64),createdAt:serverTimestamp()})}
