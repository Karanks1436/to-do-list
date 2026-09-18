import { httpsCallable, getFunctions } from 'firebase/functions';
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { app, db } from './firebase';

const functions = getFunctions(app, 'asia-south1');
const call = name => httpsCallable(functions, name);

export const completeRegistration = data => call('completeRegistration')(data).then(x => x.data);
export const approveCollector = collectorId => call('approveCollector')({ collectorId }).then(x => x.data);
export const setMonthlyRate = data => call('setMonthlyRate')(data).then(x => x.data);
export const createPickupRequest = data => call('createPickupRequest')(data).then(x => x.data);
export const acceptPickup = pickupId => call('acceptPickup')({ pickupId }).then(x => x.data);
export const updatePickupStatus = (pickupId, status) => call('updatePickupStatus')({ pickupId, status }).then(x => x.data);
export const completePickup = (pickupId, finalKg) => call('completePickup')({ pickupId, finalKg }).then(x => x.data);

const list = callback => snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));

export const watchProfile = (uid, callback, error) => onSnapshot(doc(db, 'users', uid), s => callback(s.exists() ? s.data() : null), error);
export const watchCurrentRates = (callback, error) => onSnapshot(collection(db, 'currentRates'), list(callback), error);
export const watchMaterials = (callback, error) => onSnapshot(query(collection(db, 'materials'), where('active', '==', true), orderBy('sortOrder')), list(callback), error);
export const watchApprovedCollectors = (callback, error) => onSnapshot(query(collection(db, 'users'), where('role', '==', 'collector'), where('status', '==', 'active'), limit(50)), list(callback), error);
export const watchGiverPickups = (uid, callback, error) => onSnapshot(query(collection(db, 'pickupRequests'), where('giverId', '==', uid), orderBy('createdAt', 'desc'), limit(50)), list(callback), error);
export const watchCollectorPickups = (uid, callback, error) => onSnapshot(query(collection(db, 'pickupRequests'), where('collectorId', '==', uid), orderBy('createdAt', 'desc'), limit(50)), list(callback), error);
export const watchOpenPickups = (callback, error) => onSnapshot(query(collection(db, 'pickupRequests'), where('status', '==', 'open'), orderBy('createdAt', 'desc'), limit(50)), list(callback), error);
export const watchTransactions = (uid, callback, error) => onSnapshot(query(collection(db, 'transactions'), where('giverId', '==', uid), orderBy('createdAt', 'desc'), limit(50)), list(callback), error);
export const watchNotifications = (uid, callback, error) => onSnapshot(query(collection(db, 'notifications'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(50)), list(callback), error);
export const watchPendingCollectors = (callback, error) => onSnapshot(query(collection(db, 'users'), where('role', '==', 'collector'), where('status', '==', 'pending'), limit(50)), list(callback), error);

export function distanceKm(a, b) {
  if (!a?.latitude || !b?.latitude) return null;
  const rad = n => n * Math.PI / 180, earth = 6371;
  const dLat = rad(b.latitude-a.latitude), dLng = rad(b.longitude-a.longitude);
  const x = Math.sin(dLat/2)**2 + Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dLng/2)**2;
  return 2*earth*Math.asin(Math.sqrt(x));
}
