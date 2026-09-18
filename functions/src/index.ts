import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();
const db = getFirestore();
const ADMIN_EMAIL = 'karank2s6266@gmail.com';
const REGION = 'asia-south1';

function signedIn(request: any) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in.');
  return request.auth.uid as string;
}
function validRole(role: unknown): role is 'giver' | 'collector' {
  return role === 'giver' || role === 'collector';
}
async function user(uid: string) {
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists) throw new HttpsError('failed-precondition', 'Profile is incomplete.');
  return snap.data()!;
}
async function requireRole(uid: string, roles: string[]) {
  const data = await user(uid);
  if (!roles.includes(data.role)) throw new HttpsError('permission-denied', 'This action is not allowed.');
  return data;
}
function monthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export const completeRegistration = onCall({ region: REGION }, async request => {
  const uid = signedIn(request);
  const authUser = await getAuth().getUser(uid);
  const requestedRole = request.data?.role;
  if (!validRole(requestedRole)) throw new HttpsError('invalid-argument', 'Choose trash giver or collector.');
  const isAdmin = authUser.email?.toLowerCase() === ADMIN_EMAIL;
  const role = isAdmin ? 'admin' : requestedRole;
  const status = role === 'collector' ? 'pending' : 'active';
  const profile = {
    uid, role, status,
    name: String(request.data?.name || authUser.displayName || 'Recycler').trim(),
    email: authUser.email || '',
    phone: String(request.data?.phone || ''),
    address: request.data?.address || null,
    serviceRadiusKm: role === 'collector' ? Number(request.data?.serviceRadiusKm || 10) : null,
    recycledKg: 0, walletBalance: 0, greenPoints: 0, completedPickups: 0,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  };
  await db.doc(`users/${uid}`).set(profile, { merge: true });
  await getAuth().setCustomUserClaims(uid, { role, status });
  return { role, status };
});

export const approveCollector = onCall({ region: REGION }, async request => {
  const adminUid = signedIn(request); await requireRole(adminUid, ['admin']);
  const collectorId = String(request.data?.collectorId || '');
  if (!collectorId) throw new HttpsError('invalid-argument', 'collectorId is required.');
  await db.doc(`users/${collectorId}`).update({ status: 'active', approvedBy: adminUid, approvedAt: FieldValue.serverTimestamp() });
  await getAuth().setCustomUserClaims(collectorId, { role: 'collector', status: 'active' });
  return { ok: true };
});

export const setMonthlyRate = onCall({ region: REGION }, async request => {
  const adminUid = signedIn(request); await requireRole(adminUid, ['admin']);
  const materialId = String(request.data?.materialId || '');
  const ratePerKg = Number(request.data?.ratePerKg);
  const month = String(request.data?.month || monthKey());
  if (!materialId || !Number.isFinite(ratePerKg) || ratePerKg <= 0 || !/^\d{4}-\d{2}$/.test(month))
    throw new HttpsError('invalid-argument', 'Valid material, month, and positive rate are required.');
  await db.doc(`monthlyRates/${month}/items/${materialId}`).set({
    materialId, month, ratePerKg, currency: 'INR', setBy: adminUid, updatedAt: FieldValue.serverTimestamp(),
  });
  await db.doc(`currentRates/${materialId}`).set({
    materialId, month, ratePerKg, currency: 'INR', updatedAt: FieldValue.serverTimestamp(),
  });
  return { materialId, month, ratePerKg };
});

export const createPickupRequest = onCall({ region: REGION }, async request => {
  const uid = signedIn(request); await requireRole(uid, ['giver']);
  const materialId = String(request.data?.materialId || '');
  const estimatedKg = Number(request.data?.estimatedKg);
  if (!materialId || !Number.isFinite(estimatedKg) || estimatedKg <= 0)
    throw new HttpsError('invalid-argument', 'Material and estimated weight are required.');
  const rateSnap = await db.doc(`currentRates/${materialId}`).get();
  if (!rateSnap.exists) throw new HttpsError('failed-precondition', 'No current rate has been published for this material.');
  const rate = Number(rateSnap.data()!.ratePerKg);
  const ref = await db.collection('pickupRequests').add({
    giverId: uid, collectorId: request.data?.collectorId || null,
    materialId, estimatedKg, ratePerKg: rate, estimatedValue: estimatedKg * rate,
    imageId: request.data?.imageId || null, address: request.data?.address || null,
    giverLocation: request.data?.location || null, status: request.data?.collectorId ? 'requested' : 'open',
    timeline: [{ status: 'requested', at: new Date().toISOString(), by: uid }],
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  return { id: ref.id, ratePerKg: rate, estimatedValue: estimatedKg * rate };
});

export const acceptPickup = onCall({ region: REGION }, async request => {
  const uid = signedIn(request); const profile = await requireRole(uid, ['collector']);
  if (profile.status !== 'active') throw new HttpsError('permission-denied', 'Collector approval is pending.');
  const pickupId = String(request.data?.pickupId || '');
  const ref = db.doc(`pickupRequests/${pickupId}`);
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref); if (!snap.exists) throw new HttpsError('not-found', 'Pickup not found.');
    const data = snap.data()!;
    if (!['open', 'requested'].includes(data.status)) throw new HttpsError('failed-precondition', 'Pickup is no longer available.');
    if (data.collectorId && data.collectorId !== uid) throw new HttpsError('permission-denied', 'Pickup belongs to another collector.');
    tx.update(ref, { collectorId: uid, status: 'accepted', timeline: FieldValue.arrayUnion({ status: 'accepted', at: new Date().toISOString(), by: uid }), updatedAt: FieldValue.serverTimestamp() });
  });
  return { ok: true };
});

export const updatePickupStatus = onCall({ region: REGION }, async request => {
  const uid = signedIn(request); await requireRole(uid, ['collector']);
  const pickupId = String(request.data?.pickupId || '');
  const status = String(request.data?.status || '');
  if (!['assigned', 'on_the_way', 'arrived'].includes(status)) throw new HttpsError('invalid-argument', 'Invalid status.');
  const ref = db.doc(`pickupRequests/${pickupId}`); const snap = await ref.get();
  if (!snap.exists || snap.data()!.collectorId !== uid) throw new HttpsError('permission-denied', 'Pickup is not assigned to you.');
  await ref.update({ status, timeline: FieldValue.arrayUnion({ status, at: new Date().toISOString(), by: uid }), updatedAt: FieldValue.serverTimestamp() });
  return { ok: true };
});

export const completePickup = onCall({ region: REGION }, async request => {
  const collectorId = signedIn(request); await requireRole(collectorId, ['collector']);
  const pickupId = String(request.data?.pickupId || ''); const finalKg = Number(request.data?.finalKg);
  if (!Number.isFinite(finalKg) || finalKg <= 0) throw new HttpsError('invalid-argument', 'Verified weight must be positive.');
  const pickupRef = db.doc(`pickupRequests/${pickupId}`);
  await db.runTransaction(async tx => {
    const pickupSnap = await tx.get(pickupRef); if (!pickupSnap.exists) throw new HttpsError('not-found', 'Pickup not found.');
    const p = pickupSnap.data()!;
    if (p.collectorId !== collectorId || p.status === 'completed') throw new HttpsError('permission-denied', 'Cannot complete this pickup.');
    const finalAmount = finalKg * Number(p.ratePerKg); const points = Math.round(finalKg * 10);
    const giverRef = db.doc(`users/${p.giverId}`); const collectorRef = db.doc(`users/${collectorId}`);
    tx.update(pickupRef, { status: 'completed', finalKg, finalAmount, completedAt: FieldValue.serverTimestamp(), timeline: FieldValue.arrayUnion({ status: 'completed', at: new Date().toISOString(), by: collectorId }), updatedAt: FieldValue.serverTimestamp() });
    tx.set(giverRef, { recycledKg: FieldValue.increment(finalKg), walletBalance: FieldValue.increment(finalAmount), greenPoints: FieldValue.increment(points), completedPickups: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.set(collectorRef, { collectedKg: FieldValue.increment(finalKg), completedPickups: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.set(db.collection('transactions').doc(), { pickupId, giverId: p.giverId, collectorId, materialId: p.materialId, weightKg: finalKg, ratePerKg: p.ratePerKg, amount: finalAmount, type: 'pickup_credit', createdAt: FieldValue.serverTimestamp() });
    tx.set(db.collection('notifications').doc(), { userId: p.giverId, title: 'Pickup completed', body: `₹${finalAmount.toFixed(0)} was added to your wallet.`, read: false, createdAt: FieldValue.serverTimestamp() });
  });
  return { ok: true };
});
