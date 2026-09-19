import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ImageAnnotatorClient } from '@google-cloud/vision';

initializeApp();
const db = getFirestore();
const visionClient = new ImageAnnotatorClient();
const ADMIN_EMAIL = 'karank2s6266@gmail.com';
const REGION = 'asia-south1';

// All values are INR per kilogram. Admin Firestore rates override these fallbacks.
const FALLBACK_RATES: Record<string, number> = {
  plastic_pet: 12, plastic_hdpe: 20, plastic_ldpe: 10, mixed_plastic: 8,
  cardboard: 10, paper: 14, newspaper: 16, glass: 4,
  metal_aluminium: 110, metal_steel: 32, metal_iron: 28,
  metal_copper: 650, metal_brass: 400, ewaste: 50,
  organic: 2, textile: 8,
};

// Used only to estimate kilograms when the user enters a number of pieces.
// The collector always enters the verified final weight in kilograms.
const PIECE_WEIGHT_KG: Record<string, number> = {
  plastic_pet: 0.025, plastic_hdpe: 0.05, plastic_ldpe: 0.01,
  mixed_plastic: 0.03, cardboard: 0.25, paper: 0.01,
  newspaper: 0.15, glass: 0.30, metal_aluminium: 0.015,
  metal_steel: 0.10, metal_iron: 0.15, metal_copper: 0.10,
  metal_brass: 0.10, ewaste: 0.50, organic: 0.10, textile: 0.25,
};

type QuantityUnit = 'kg' | 'g' | 'pieces';
type RecognitionItem = { name: string; score: number };

function signedIn(request: any): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in.');
  return request.auth.uid as string;
}
function validRole(role: unknown): role is 'giver' | 'collector' {
  return role === 'giver' || role === 'collector';
}
function validUnit(unit: unknown): unit is QuantityUnit {
  return unit === 'kg' || unit === 'g' || unit === 'pieces';
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
function quantityToKg(value: number, unit: QuantityUnit, materialId: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new HttpsError('invalid-argument', 'Quantity must be greater than zero.');
  }
  if (unit === 'g') return value / 1000;
  if (unit === 'pieces') {
    if (!Number.isInteger(value)) throw new HttpsError('invalid-argument', 'Pieces must be a whole number.');
    return value * (PIECE_WEIGHT_KG[materialId] || 0.10);
  }
  return value;
}

export const completeRegistration = onCall({ region: REGION }, async request => {
  const uid = signedIn(request);
  const authUser = await getAuth().getUser(uid);
  const requestedRole = request.data?.role;
  if (!validRole(requestedRole)) throw new HttpsError('invalid-argument', 'Choose trash giver or collector.');
  const ref = db.doc(`users/${uid}`);
  const existing = await ref.get();
  const isAdmin = authUser.email?.toLowerCase() === ADMIN_EMAIL;
  const role = isAdmin ? 'admin' : (existing.data()?.role || requestedRole);
  const status = role === 'collector' ? (existing.data()?.status || 'pending') : 'active';
  const profile: Record<string, any> = {
    uid, role, status,
    name: String(request.data?.name || authUser.displayName || existing.data()?.name || 'Recycler').trim(),
    email: authUser.email || existing.data()?.email || '',
    phone: String(request.data?.phone || existing.data()?.phone || ''),
    address: request.data?.address || existing.data()?.address || null,
    serviceRadiusKm: role === 'collector' ? Number(request.data?.serviceRadiusKm || existing.data()?.serviceRadiusKm || 10) : null,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (!existing.exists) Object.assign(profile, {
    recycledKg: 0, walletBalance: 0, greenPoints: 0,
    completedPickups: 0, createdAt: FieldValue.serverTimestamp(),
  });
  await ref.set(profile, { merge: true });
  await getAuth().setCustomUserClaims(uid, { role, status });
  return { role, status };
});

export const approveCollector = onCall({ region: REGION }, async request => {
  const adminUid = signedIn(request); await requireRole(adminUid, ['admin']);
  const collectorId = String(request.data?.collectorId || '');
  if (!collectorId) throw new HttpsError('invalid-argument', 'collectorId is required.');
  const ref = db.doc(`users/${collectorId}`);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.role !== 'collector') throw new HttpsError('not-found', 'Collector profile was not found.');
  await ref.update({ status: 'active', approvedBy: adminUid, approvedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
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
  const data = { materialId, month, ratePerKg, unit: 'kg', currency: 'INR', setBy: adminUid, updatedAt: FieldValue.serverTimestamp() };
  await Promise.all([
    db.doc(`monthlyRates/${month}/items/${materialId}`).set(data),
    db.doc(`currentRates/${materialId}`).set(data),
  ]);
  return { materialId, month, ratePerKg, unit: 'kg' };
});

export const createPickupRequest = onCall({ region: REGION }, async request => {
  const uid = signedIn(request); await requireRole(uid, ['giver']);
  const materialId = String(request.data?.materialId || '');
  if (!materialId) throw new HttpsError('invalid-argument', 'Material is required.');

  const originalQuantity = Number(request.data?.originalQuantity ?? request.data?.estimatedKg);
  const originalUnit: QuantityUnit = validUnit(request.data?.originalUnit) ? request.data.originalUnit : 'kg';
  const estimatedKg = quantityToKg(originalQuantity, originalUnit, materialId);

  const rateSnap = await db.doc(`currentRates/${materialId}`).get();
  const adminRate = rateSnap.exists ? Number(rateSnap.data()?.ratePerKg || 0) : 0;
  const fallbackRate = FALLBACK_RATES[materialId] || 5;
  const ratePerKg = adminRate > 0 ? adminRate : fallbackRate;
  const rateSource = adminRate > 0 ? 'admin' : 'average_fallback';

  const collectorId = request.data?.collectorId ? String(request.data.collectorId) : null;
  if (collectorId) {
    const collector = await db.doc(`users/${collectorId}`).get();
    if (!collector.exists || collector.data()?.role !== 'collector' || collector.data()?.status !== 'active')
      throw new HttpsError('failed-precondition', 'The selected collector is not active.');
  }

  const estimatedValue = Number((estimatedKg * ratePerKg).toFixed(2));
  const ref = await db.collection('pickupRequests').add({
    giverId: uid, collectorId,
    collectorName: request.data?.collectorName || null,
    materialId,
    originalQuantity, originalUnit,
    estimatedKg,
    pieceWeightKg: originalUnit === 'pieces' ? (PIECE_WEIGHT_KG[materialId] || 0.10) : null,
    ratePerKg, rateSource, estimatedValue,
    imageId: request.data?.imageId || null,
    address: request.data?.address || null,
    giverLocation: request.data?.location || null,
    status: collectorId ? 'requested' : 'open',
    timeline: [{ status: 'requested', at: new Date().toISOString(), by: uid }],
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  return { id: ref.id, originalQuantity, originalUnit, estimatedKg, ratePerKg, rateSource, estimatedValue };
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
  const pickupId = String(request.data?.pickupId || '');
  const finalKg = Number(request.data?.finalKg);
  if (!Number.isFinite(finalKg) || finalKg <= 0) throw new HttpsError('invalid-argument', 'Verified weight in kilograms must be positive.');
  const pickupRef = db.doc(`pickupRequests/${pickupId}`);
  let response: any = null;
  await db.runTransaction(async tx => {
    const pickupSnap = await tx.get(pickupRef); if (!pickupSnap.exists) throw new HttpsError('not-found', 'Pickup not found.');
    const p = pickupSnap.data()!;
    if (p.collectorId !== collectorId || p.status === 'completed') throw new HttpsError('permission-denied', 'Cannot complete this pickup.');
    const finalAmount = Number((finalKg * Number(p.ratePerKg)).toFixed(2));
    const points = Math.round(finalKg * 10);
    const giverRef = db.doc(`users/${p.giverId}`); const collectorRef = db.doc(`users/${collectorId}`);
    tx.update(pickupRef, { status: 'completed', finalKg, finalAmount, completedAt: FieldValue.serverTimestamp(), timeline: FieldValue.arrayUnion({ status: 'completed', at: new Date().toISOString(), by: collectorId }), updatedAt: FieldValue.serverTimestamp() });
    tx.set(giverRef, { recycledKg: FieldValue.increment(finalKg), walletBalance: FieldValue.increment(finalAmount), greenPoints: FieldValue.increment(points), completedPickups: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.set(collectorRef, { collectedKg: FieldValue.increment(finalKg), completedPickups: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.set(db.collection('transactions').doc(), { pickupId, giverId: p.giverId, collectorId, materialId: p.materialId, originalQuantity: p.originalQuantity || null, originalUnit: p.originalUnit || 'kg', weightKg: finalKg, ratePerKg: p.ratePerKg, rateSource: p.rateSource || 'admin', amount: finalAmount, type: 'pickup_credit', createdAt: FieldValue.serverTimestamp() });
    tx.set(db.collection('notifications').doc(), { userId: p.giverId, title: 'Pickup completed', body: `₹${finalAmount.toFixed(0)} was added to your wallet.`, read: false, createdAt: FieldValue.serverTimestamp() });
    response = { ok: true, finalKg, ratePerKg: p.ratePerKg, finalAmount, points };
  });
  return response;
});

const MATERIAL_RULES = [
  { materialId: 'plastic_pet', materialName: 'Plastic (PET)', category: 'plastic', keywords: ['plastic bottle', 'water bottle', 'pet bottle', 'plastic'] },
  { materialId: 'plastic_hdpe', materialName: 'Hard Plastic', category: 'plastic', keywords: ['plastic container', 'detergent bottle', 'milk jug'] },
  { materialId: 'metal_aluminium', materialName: 'Aluminium / Can', category: 'metal', keywords: ['aluminum can', 'aluminium can', 'beverage can', 'tin can', 'soda can'] },
  { materialId: 'metal_steel', materialName: 'Steel / Iron', category: 'metal', keywords: ['steel', 'iron', 'scrap metal', 'metal object'] },
  { materialId: 'cardboard', materialName: 'Cardboard', category: 'cardboard', keywords: ['cardboard', 'cardboard box', 'carton', 'corrugated box'] },
  { materialId: 'paper', materialName: 'Paper', category: 'paper', keywords: ['paper', 'newspaper', 'magazine', 'document'] },
  { materialId: 'glass', materialName: 'Glass', category: 'glass', keywords: ['glass', 'glass bottle', 'glass jar'] },
  { materialId: 'ewaste', materialName: 'Electronic Waste', category: 'ewaste', keywords: ['electronic device', 'mobile phone', 'computer', 'keyboard', 'circuit board', 'cable', 'charger', 'battery'] },
  { materialId: 'organic', materialName: 'Organic Waste', category: 'organic', keywords: ['food waste', 'fruit', 'vegetable', 'leaf', 'plant'] },
  { materialId: 'textile', materialName: 'Textile / Clothes', category: 'textile', keywords: ['clothing', 'shirt', 'fabric', 'textile', 'clothes', 'shoe'] },
];

function identifyMaterial(items: RecognitionItem[]) {
  const normalized = items.map(item => ({ name: item.name.trim().toLowerCase(), score: item.score }));
  const scored = MATERIAL_RULES.map(rule => {
    let score = 0;
    for (const item of normalized) for (const keyword of rule.keywords) {
      if (item.name === keyword) score += item.score * 2;
      else if (item.name.includes(keyword) || keyword.includes(item.name)) score += item.score;
    }
    return { ...rule, score };
  }).sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score <= 0) return { materialId: null, materialName: 'Unknown Material', category: 'other', confidence: 0 };
  return { materialId: best.materialId, materialName: best.materialName, category: best.category, confidence: Math.min(best.score, 0.99) };
}

export const identifyWaste = onCall({ region: REGION, timeoutSeconds: 60, memory: '512MiB' }, async request => {
  signedIn(request);
  const cleanBase64 = String(request.data?.base64 || '').split(',').pop() || '';
  if (!cleanBase64) throw new HttpsError('invalid-argument', 'Image data is required.');
  const imageBuffer = Buffer.from(cleanBase64, 'base64');
  if (imageBuffer.length > 700 * 1024) throw new HttpsError('invalid-argument', 'Image is larger than 700 KB.');

  const [result] = await visionClient.annotateImage({
    image: { content: imageBuffer },
    features: [
      { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
      { type: 'LABEL_DETECTION', maxResults: 15 },
    ],
  });
  const objects: RecognitionItem[] = (result.localizedObjectAnnotations || [])
    .filter(x => x.name && x.score)
    .map(x => ({ name: x.name!, score: x.score! }));
  const labels: RecognitionItem[] = (result.labelAnnotations || [])
    .filter(x => x.description && x.score)
    .map(x => ({ name: x.description!, score: x.score! }));
  const all = [...objects, ...labels];
  const material = identifyMaterial(all);
  return {
    ...material,
    objectName: objects[0]?.name || labels[0]?.name || 'Unknown object',
    labels: all.sort((a, b) => b.score - a.score).slice(0, 8).map(x => x.name),
    requiresVerification: true,
  };
});
