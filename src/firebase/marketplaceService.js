import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "./firebase";

export const ADMIN_EMAIL = "karank2s6266@gmail.com";

const FALLBACK_RATES = {
  plastic_pet: 12,
  plastic_hdpe: 20,
  plastic_ldpe: 10,
  mixed_plastic: 8,
  cardboard: 10,
  paper: 14,
  newspaper: 16,
  glass: 4,
  metal_aluminium: 110,
  metal_steel: 32,
  metal_iron: 28,
  metal_copper: 650,
  metal_brass: 400,
  ewaste: 50,
  organic: 2,
  textile: 8,
};

const PIECE_WEIGHT_KG = {
  plastic_pet: 0.025,
  plastic_hdpe: 0.05,
  plastic_ldpe: 0.01,
  mixed_plastic: 0.03,
  cardboard: 0.25,
  paper: 0.01,
  newspaper: 0.15,
  glass: 0.3,
  metal_aluminium: 0.015,
  metal_steel: 0.1,
  metal_iron: 0.15,
  metal_copper: 0.1,
  metal_brass: 0.1,
  ewaste: 0.5,
  organic: 0.1,
  textile: 0.25,
};

function currentUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Please sign in.");
  return uid;
}

function isAdmin() {
  return auth.currentUser?.email?.toLowerCase() === ADMIN_EMAIL;
}

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

function toMillis(value) {
  return value?.toMillis?.() || value?.toDate?.()?.getTime?.() || 0;
}

function snapshotList(snapshot) {
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort(
      (first, second) =>
        toMillis(second.updatedAt || second.createdAt) -
        toMillis(first.updatedAt || first.createdAt)
    );
}

function listen(reference, callback, errorCallback, filter) {
  return onSnapshot(
    reference,
    (snapshot) => {
      const items = snapshotList(snapshot);
      callback(filter ? items.filter(filter) : items);
    },
    errorCallback
  );
}

function toKg(value, unit, materialId) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }
  if (unit === "g") return number / 1000;
  if (unit === "pieces") {
    if (!Number.isInteger(number)) throw new Error("Pieces must be a whole number.");
    return number * (PIECE_WEIGHT_KG[materialId] || 0.1);
  }
  return number;
}

async function sendNotification(data) {
  try {
    await addDoc(collection(db, "notifications"), {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // A notification must never roll back the pickup itself. The live pickup
    // listener remains the source of truth even if notification rules/network fail.
    console.warn("Notification could not be sent:", error?.message);
  }
}

export async function completeRegistration({
  name,
  role = "giver",
  phone = "",
  address = null,
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in.");

  const reference = doc(db, "users", user.uid);
  const existing = await getDoc(reference);
  if (existing.exists()) return existing.data();

  const finalRole =
    user.email?.toLowerCase() === ADMIN_EMAIL ? "admin" : role;
  const profile = {
    uid: user.uid,
    name: name || user.displayName || "Recycler",
    email: user.email || "",
    phone,
    address,
    role: finalRole,
    status: finalRole === "collector" ? "pending" : "active",
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(reference, profile);

  if (finalRole === "collector") {
    await sendNotification({
      userId: "admin",
      recipientRole: "admin",
      senderId: user.uid,
      type: "collector_pending",
      title: "Collector approval required",
      body: `${profile.name} registered as a collector and is waiting for approval.`,
    });
  }

  return profile;
}

export async function approveCollector(collectorId) {
  if (!isAdmin()) throw new Error("Admin access required.");

  const locationReference = doc(db, "collectorLocations", collectorId);
  const locationSnapshot = await getDoc(locationReference);
  const savedLocation = locationSnapshot.data() || {};

  await updateDoc(doc(db, "users", collectorId), {
    status: "active",
    approvedBy: currentUid(),
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(
    locationReference,
    {
      collectorId,
      role: "collector",
      status: "active",
      approved: true,
      active:
        locationSnapshot.exists() &&
        savedLocation.availableForPickups !== false,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await sendNotification({
    userId: collectorId,
    senderId: currentUid(),
    type: "collector_approved",
    title: "Collector account approved",
    body: "Your collector account is active. You can now accept pickup requests.",
  });
}

export async function setMonthlyRate({
  materialId,
  ratePerKg,
  month = monthKey(),
}) {
  if (!isAdmin()) throw new Error("Admin access required.");
  const rate = Number(ratePerKg);
  if (!materialId || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("Valid material and rate are required.");
  }

  const data = {
    materialId,
    ratePerKg: rate,
    month,
    currency: "INR",
    unit: "kg",
    setBy: currentUid(),
    updatedAt: serverTimestamp(),
  };

  await Promise.all([
    setDoc(doc(db, "currentRates", materialId), data),
    setDoc(doc(db, "monthlyRates", month, "items", materialId), data),
  ]);
  return data;
}

export async function createPickupRequest(data) {
  const giverId = currentUid();
  const materialId = String(data.materialId || "");
  const originalUnit = data.originalUnit || "kg";
  const originalQuantity = Number(
    data.originalQuantity ?? data.estimatedKg
  );
  const estimatedKg = toKg(originalQuantity, originalUnit, materialId);

  const rateSnapshot = await getDoc(doc(db, "currentRates", materialId));
  const publishedRate = rateSnapshot.exists()
    ? Number(rateSnapshot.data().ratePerKg || 0)
    : 0;
  const ratePerKg =
    publishedRate > 0 ? publishedRate : FALLBACK_RATES[materialId] || 5;
  const rateSource =
    publishedRate > 0 ? "admin" : "average_fallback";
  const estimatedValue = Number((estimatedKg * ratePerKg).toFixed(2));
  const collectorId = data.collectorId || null;
  const reference = doc(collection(db, "pickupRequests"));

  const pickup = {
    giverId,
    giverName:
      data.giverName || auth.currentUser?.displayName || "Trash giver",
    giverPhone: data.giverPhone || null,
    collectorId,
    requestedCollectorId: collectorId,
    collectorName: data.collectorName || null,
    materialId,
    originalQuantity,
    originalUnit,
    estimatedKg,
    pieceWeightKg:
      originalUnit === "pieces"
        ? PIECE_WEIGHT_KG[materialId] || 0.1
        : null,
    ratePerKg,
    rateSource,
    estimatedValue,
    imageId: data.imageId || null,
    address: data.address || null,
    giverLocation: data.location || null,
    status: collectorId ? "requested" : "open",
    declinedCollectorIds: [],
    timeline: [
      {
        status: "requested",
        at: new Date().toISOString(),
        by: giverId,
      },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Save the request first. Collector delivery uses a direct live query on
  // collectorId, so this works even if the optional message write fails.
  await setDoc(reference, pickup);

  if (collectorId) {
    await sendNotification({
      userId: collectorId,
      senderId: giverId,
      pickupId: reference.id,
      type: "pickup_request",
      title: "New pickup request",
      body: `${pickup.giverName} requested pickup of ${estimatedKg.toFixed(
        2
      )} kg ${materialId.replace(/_/g, " ")}.`,
    });
  }

  return {
    id: reference.id,
    estimatedKg,
    ratePerKg,
    rateSource,
    estimatedValue,
    status: pickup.status,
  };
}

export async function reassignPickup(pickupId, collector) {
  const giverId = currentUid();
  if (!collector?.id) throw new Error("Select a collector.");
  let estimatedValue = 0;

  await runTransaction(db, async (transaction) => {
    const reference = doc(db, "pickupRequests", pickupId);
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error("Pickup not found.");
    const pickup = snapshot.data();
    if (pickup.giverId !== giverId) throw new Error("This is not your pickup.");
    if (pickup.status !== "open") {
      throw new Error("Only an open request can be sent to another collector.");
    }
    if ((pickup.declinedCollectorIds || []).includes(collector.id)) {
      throw new Error("This collector already declined this request.");
    }

    estimatedValue = Number(pickup.estimatedValue || 0);
    transaction.update(reference, {
      collectorId: collector.id,
      requestedCollectorId: collector.id,
      collectorName: collector.name || "Collector",
      status: "requested",
      timeline: [
        ...(pickup.timeline || []),
        {
          status: "requested",
          at: new Date().toISOString(),
          by: giverId,
          collectorId: collector.id,
        },
      ],
      updatedAt: serverTimestamp(),
    });
  });

  await sendNotification({
    userId: collector.id,
    senderId: giverId,
    pickupId,
    type: "pickup_request",
    title: "New pickup request",
    body: "A nearby giver sent you an open pickup request.",
  });

  return { id: pickupId, status: "requested", estimatedValue };
}

export async function acceptPickup(pickupId) {
  const collectorId = currentUid();
  const collectorSnapshot = await getDoc(doc(db, "users", collectorId));
  const collector = collectorSnapshot.data();
  if (collector?.role !== "collector" || collector?.status !== "active") {
    throw new Error("Approved collector access required.");
  }

  let giverId;
  let collectorName;

  await runTransaction(db, async (transaction) => {
    const reference = doc(db, "pickupRequests", pickupId);
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error("Pickup not found.");

    const pickup = snapshot.data();
    if (!["open", "requested"].includes(pickup.status)) {
      throw new Error("Pickup is no longer available.");
    }
    if (pickup.collectorId && pickup.collectorId !== collectorId) {
      throw new Error("This request is assigned to another collector.");
    }
    if ((pickup.declinedCollectorIds || []).includes(collectorId)) {
      throw new Error("You already declined this request.");
    }

    giverId = pickup.giverId;
    collectorName =
      collector.businessName || collector.name || "Collector";

    transaction.update(reference, {
      collectorId,
      collectorName,
      status: "accepted",
      acceptedAt: serverTimestamp(),
      timeline: [
        ...(pickup.timeline || []),
        {
          status: "accepted",
          at: new Date().toISOString(),
          by: collectorId,
        },
      ],
      updatedAt: serverTimestamp(),
    });
  });

  await sendNotification({
    userId: giverId,
    senderId: collectorId,
    pickupId,
    type: "pickup_accepted",
    title: "Pickup accepted",
    body: `${collectorName} accepted your pickup request.`,
  });

  return { id: pickupId, status: "accepted" };
}

export async function declinePickup(
  pickupId,
  reason = "Collector unavailable"
) {
  const collectorId = currentUid();
  let giverId;
  const cleanReason = String(reason || "Collector unavailable").slice(0, 160);

  await runTransaction(db, async (transaction) => {
    const reference = doc(db, "pickupRequests", pickupId);
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error("Pickup not found.");

    const pickup = snapshot.data();
    if (!["open", "requested"].includes(pickup.status)) {
      throw new Error("Only new requests can be declined.");
    }
    if (pickup.collectorId && pickup.collectorId !== collectorId) {
      throw new Error("This request belongs to another collector.");
    }

    giverId = pickup.giverId;
    const declinedCollectorIds = [
      ...new Set([...(pickup.declinedCollectorIds || []), collectorId]),
    ];
    const now = new Date().toISOString();

    transaction.update(reference, {
      collectorId: null,
      collectorName: null,
      status: "open",
      declinedCollectorIds,
      lastDeclinedCollectorId: collectorId,
      lastDeclineReason: cleanReason,
      timeline: [
        ...(pickup.timeline || []),
        {
          status: "declined",
          at: now,
          by: collectorId,
          reason: cleanReason,
        },
        { status: "open", at: now, by: collectorId },
      ],
      updatedAt: serverTimestamp(),
    });
  });

  await sendNotification({
    userId: giverId,
    senderId: collectorId,
    pickupId,
    type: "pickup_declined",
    title: "Collector unavailable",
    body: "Your request was released to other nearby collectors.",
  });

  return { id: pickupId, status: "open", declined: true };
}

export async function updatePickupStatus(pickupId, nextStatus) {
  const allowedPreviousStatus = {
    on_the_way: "accepted",
    arrived: "on_the_way",
  };
  if (!allowedPreviousStatus[nextStatus]) {
    throw new Error("Invalid pickup status.");
  }

  const collectorId = currentUid();
  let giverId;

  await runTransaction(db, async (transaction) => {
    const reference = doc(db, "pickupRequests", pickupId);
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error("Pickup not found.");

    const pickup = snapshot.data();
    if (pickup.collectorId !== collectorId) {
      throw new Error("Pickup is not assigned to you.");
    }
    if (pickup.status !== allowedPreviousStatus[nextStatus]) {
      throw new Error(
        `Pickup must be ${allowedPreviousStatus[nextStatus].replace(
          /_/g,
          " "
        )} first.`
      );
    }

    giverId = pickup.giverId;
    transaction.update(reference, {
      status: nextStatus,
      timeline: [
        ...(pickup.timeline || []),
        {
          status: nextStatus,
          at: new Date().toISOString(),
          by: collectorId,
        },
      ],
      updatedAt: serverTimestamp(),
    });
  });

  await sendNotification({
    userId: giverId,
    senderId: collectorId,
    pickupId,
    type: `pickup_${nextStatus}`,
    title:
      nextStatus === "on_the_way"
        ? "Collector is on the way"
        : "Collector has arrived",
    body:
      nextStatus === "on_the_way"
        ? "Keep your recyclable material ready for pickup."
        : "The collector is ready to verify material and weight.",
  });

  return { id: pickupId, status: nextStatus };
}

export async function completePickup(pickupId, verification) {
  const collectorId = currentUid();
  const input =
    typeof verification === "object"
      ? verification
      : { finalKg: verification };
  const finalKg = Number(input.finalKg);
  const verifiedMaterialId = String(
    input.verifiedMaterialId || ""
  ).trim();
  const collectorNotes = String(input.collectorNotes || "")
    .trim()
    .slice(0, 500);

  if (!Number.isFinite(finalKg) || finalKg <= 0) {
    throw new Error("Verified weight must be positive.");
  }
  if (!verifiedMaterialId) {
    throw new Error("Verify the material before completing the pickup.");
  }

  // Final settlement follows the collector-verified material, not only the
  // giver's original claim.
  const rateSnapshot = await getDoc(
    doc(db, "currentRates", verifiedMaterialId)
  );
  const adminRate = rateSnapshot.exists()
    ? Number(rateSnapshot.data().ratePerKg || 0)
    : 0;
  const finalRatePerKg =
    adminRate > 0
      ? adminRate
      : FALLBACK_RATES[verifiedMaterialId] || 5;
  const finalRateSource =
    adminRate > 0 ? "admin" : "average_fallback";

  let result;
  let giverId;

  await runTransaction(db, async (transaction) => {
    const pickupReference = doc(db, "pickupRequests", pickupId);
    const pickupSnapshot = await transaction.get(pickupReference);
    if (!pickupSnapshot.exists()) throw new Error("Pickup not found.");

    const pickup = pickupSnapshot.data();
    if (pickup.collectorId !== collectorId) {
      throw new Error("Pickup is not assigned to you.");
    }
    if (pickup.status !== "arrived") {
      throw new Error("Mark the pickup as arrived before completing it.");
    }

    giverId = pickup.giverId;
    const finalAmount = Number(
      (finalKg * finalRatePerKg).toFixed(2)
    );
    const transactionReference = doc(collection(db, "transactions"));

    transaction.update(pickupReference, {
      status: "completed",
      verifiedMaterialId,
      collectorNotes,
      finalKg,
      ratePerKg: finalRatePerKg,
      rateSource: finalRateSource,
      finalAmount,
      completedAt: serverTimestamp(),
      timeline: [
        ...(pickup.timeline || []),
        {
          status: "completed",
          at: new Date().toISOString(),
          by: collectorId,
        },
      ],
      updatedAt: serverTimestamp(),
    });

    transaction.set(transactionReference, {
      pickupId,
      giverId: pickup.giverId,
      giverName: pickup.giverName || "Trash giver",
      collectorId,
      collectorName: pickup.collectorName || "Collector",
      materialId: verifiedMaterialId,
      claimedMaterialId: pickup.materialId,
      originalQuantity: pickup.originalQuantity,
      originalUnit: pickup.originalUnit || "kg",
      weightKg: finalKg,
      ratePerKg: finalRatePerKg,
      rateSource: finalRateSource,
      amount: finalAmount,
      type: "pickup_credit",
      createdAt: serverTimestamp(),
    });

    result = {
      finalKg,
      finalAmount,
      verifiedMaterialId,
      ratePerKg: finalRatePerKg,
      rateSource: finalRateSource,
    };
  });

  await sendNotification({
    userId: giverId,
    senderId: collectorId,
    pickupId,
    type: "pickup_completed",
    title: "Pickup completed",
    body: `₹${result.finalAmount.toFixed(
      0
    )} was credited for ${result.finalKg.toFixed(2)} kg of verified material.`,
  });

  return result;
}

export async function saveCollectorDetails(uid, details) {
  if (uid !== currentUid()) throw new Error("Not allowed.");
  const profileSnapshot = await getDoc(doc(db, "users", uid));
  const currentProfile = profileSnapshot.data() || {};

  const data = {
    businessName: details.businessName.trim(),
    ownerName: details.ownerName.trim(),
    phone: details.phone.trim(),
    addressLine: details.addressLine.trim(),
    city: details.city.trim(),
    state: details.state.trim(),
    postalCode: details.postalCode.trim(),
    serviceRadiusKm: Number(details.serviceRadiusKm || 10),
    acceptedMaterials: details.acceptedMaterials || [],
    availableForPickups: details.availableForPickups !== false,
    location: {
      latitude: Number(details.location.latitude),
      longitude: Number(details.location.longitude),
      accuracy: details.location.accuracy || null,
    },
    detailsCompleted: true,
    locationUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, "users", uid), data);
  await setDoc(
    doc(db, "collectorLocations", uid),
    {
      collectorId: uid,
      role: "collector",
      status: currentProfile.status || "pending",
      approved: currentProfile.status === "active",
      name: currentProfile.name || data.ownerName,
      businessName: data.businessName,
      ownerName: data.ownerName,
      phone: data.phone,
      addressLine: data.addressLine,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      acceptedMaterials: data.acceptedMaterials,
      availableForPickups: data.availableForPickups,
      location: data.location,
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      accuracy: data.location.accuracy,
      serviceRadiusKm: data.serviceRadiusKm,
      active:
        currentProfile.status === "active" && data.availableForPickups,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  return data;
}

// These listeners deliberately sort client-side and avoid compound orderBy
// queries. That means request/response/tracking/history work immediately even
// before optional composite indexes finish building.
export const watchProfile = (uid, callback, error) =>
  onSnapshot(
    doc(db, "users", uid),
    (snapshot) => callback(snapshot.exists() ? snapshot.data() : null),
    error
  );

export const watchCurrentRates = (callback, error) =>
  listen(collection(db, "currentRates"), callback, error);

export function watchApprovedCollectors(callback, error) {
  // Read both the public location projection and active collector profiles.
  // This keeps older approved accounts visible even when collectorLocations
  // was never created, while newly saved projection data remains preferred.
  let projected = [];
  let profiles = [];

  const normalize = (item) => {
    const rawLocation = item.location || item.coordinates || {};
    const latitude = Number(
      rawLocation.latitude ?? rawLocation.lat ?? item.latitude
    );
    const longitude = Number(
      rawLocation.longitude ?? rawLocation.lng ?? item.longitude
    );
    const hasLocation =
      Number.isFinite(latitude) && Number.isFinite(longitude);

    return {
      ...item,
      id: item.id || item.collectorId || item.uid,
      collectorId: item.collectorId || item.uid || item.id,
      location: hasLocation
        ? { ...rawLocation, latitude, longitude }
        : null,
    };
  };

  const publish = () => {
    const merged = new Map();

    profiles.forEach((item) => {
      const collector = normalize(item);
      if (
        collector.id &&
        collector.role === "collector" &&
        collector.status === "active" &&
        !["blocked", "removed"].includes(collector.accountStatus) &&
        collector.availableForPickups !== false
      ) {
        merged.set(collector.id, collector);
      }
    });

    projected.forEach((item) => {
      const collector = normalize(item);
      if (
        collector.id &&
        collector.role === "collector" &&
        collector.status === "active" &&
        !["blocked", "removed"].includes(collector.accountStatus) &&
        collector.approved !== false &&
        collector.active !== false &&
        collector.availableForPickups !== false
      ) {
        merged.set(collector.id, {
          ...(merged.get(collector.id) || {}),
          ...collector,
        });
      }
    });

    callback([...merged.values()]);
  };

  const unsubscribeLocations = onSnapshot(
    collection(db, "collectorLocations"),
    (snapshot) => {
      projected = snapshotList(snapshot);
      publish();
    },
    (listenerError) => error?.(listenerError)
  );

  // Both constraints are important: Firestore rules can prove that every
  // possible result is an approved/active collector profile.
  const unsubscribeProfiles = onSnapshot(
    query(
      collection(db, "users"),
      where("role", "==", "collector"),
      where("status", "==", "active")
    ),
    (snapshot) => {
      profiles = snapshotList(snapshot);
      publish();
    },
    (listenerError) => error?.(listenerError)
  );

  return () => {
    unsubscribeLocations?.();
    unsubscribeProfiles?.();
  };
}

export const watchGiverPickups = (uid, callback, error) =>
  listen(
    query(collection(db, "pickupRequests"), where("giverId", "==", uid)),
    callback,
    error
  );

export const watchCollectorPickups = (uid, callback, error) =>
  listen(
    query(
      collection(db, "pickupRequests"),
      where("collectorId", "==", uid)
    ),
    callback,
    error
  );

export const watchOpenPickups = (callback, error) =>
  listen(
    query(collection(db, "pickupRequests"), where("status", "==", "open")),
    callback,
    error
  );

export const watchDeclinedPickups = (uid, callback, error) =>
  listen(
    query(
      collection(db, "pickupRequests"),
      where("declinedCollectorIds", "array-contains", uid)
    ),
    callback,
    error
  );

export const watchTransactions = (uid, callback, error) =>
  listen(
    query(collection(db, "transactions"), where("giverId", "==", uid)),
    callback,
    error
  );

export const watchCollectorTransactions = (uid, callback, error) =>
  listen(
    query(
      collection(db, "transactions"),
      where("collectorId", "==", uid)
    ),
    callback,
    error
  );

export const watchAllTransactions = (callback, error) => {
  if (!isAdmin()) return () => {};
  return listen(collection(db, "transactions"), callback, error);
};

export const watchNotifications = (uid, callback, error) =>
  listen(
    query(collection(db, "notifications"), where("userId", "==", uid)),
    callback,
    error
  );

export const watchAdminNotifications = (callback, error) => {
  if (!isAdmin()) return () => {};
  return listen(
    query(
      collection(db, "notifications"),
      where("recipientRole", "==", "admin")
    ),
    callback,
    error
  );
};

export const markNotificationRead = (notificationId) =>
  updateDoc(doc(db, "notifications", notificationId), { read: true });

export const watchPendingCollectors = (callback, error) => {
  if (!isAdmin()) return () => {};
  return listen(
    query(collection(db, "users"), where("role", "==", "collector")),
    callback,
    error,
    (item) => item.status === "pending"
  );
};

export const watchAllUsers = (callback, error) => {
  if (!isAdmin()) return () => {};
  return listen(collection(db, "users"), callback, error);
};

export function distanceKm(first, second) {
  if (
    !Number.isFinite(Number(first?.latitude)) ||
    !Number.isFinite(Number(first?.longitude)) ||
    !Number.isFinite(Number(second?.latitude)) ||
    !Number.isFinite(Number(second?.longitude))
  ) {
    return null;
  }

  const radians = (number) => (number * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDifference = radians(
    Number(second.latitude) - Number(first.latitude)
  );
  const longitudeDifference = radians(
    Number(second.longitude) - Number(first.longitude)
  );
  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(Number(first.latitude))) *
      Math.cos(radians(Number(second.latitude))) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(value));
}
