import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../src/firebase/firebase";
import {
  createPickup,
  logoutUser,
  saveWasteScan,
  subscribeUser,
} from "../src/firebase/firebaseService";
import {
  acceptPickup,
  approveCollector,
  completePickup,
  declinePickup,
  distanceKm,
  markNotificationRead,
  reassignPickup,
  setMonthlyRate,
  updatePickupStatus,
  watchAdminNotifications,
  watchAllTransactions,
  watchAllUsers,
  watchApprovedCollectors,
  watchCollectorPickups,
  watchCollectorTransactions,
  watchCurrentRates,
  watchDeclinedPickups,
  watchGiverPickups,
  watchNotifications,
  watchOpenPickups,
  watchPendingCollectors,
  watchTransactions,
} from "../src/firebase/marketplaceService";
import AdminScreen from "../src/screens/AdminScreen";
import AuthScreen from "../src/screens/AuthScreen";
import CollectorDashboardScreen from "../src/screens/CollectorDashboardScreen";
import CollectorsScreen from "../src/screens/CollectorsScreen";
import DocumentsScreen from "../src/screens/DocumentsScreen";
import HistoryScreen from "../src/screens/HistoryScreen";
import HomeScreen from "../src/screens/HomeScreen";
import ImpactScreen from "../src/screens/ImpactScreen";
import NotificationsScreen from "../src/screens/NotificationsScreen";
import ProfileScreen from "../src/screens/ProfileScreen";
import ResultScreen from "../src/screens/ResultScreen";
import ScanScreen from "../src/screens/ScanScreen";
import SettingsScreen from "../src/screens/SettingsScreen";
import SplashScreen from "../src/screens/SplashScreen";
import TrackingScreen from "../src/screens/TrackingScreen";
import WalletScreen from "../src/screens/WalletScreen";
import QuantityScreen, {
  convertQuantityToKg,
} from "../src/screens/QuantityScreen";
import { useAppUpdate } from "../src/update/useAppUpdate";
import UpdateModal from "../src/update/UpdateModal";
import { C } from "../src/theme";
import { s } from "../src/styles";

const TAB_ROUTES = {
  home: "home",
  scan: "scan",
  map: "collectors",
  history: "history",
  profile: "profile",
};

const ROUTE_TABS = {
  home: "home",
  scan: "scan",
  result: "scan",
  quantity: "scan",
  collectors: "map",
  tracking: "map",
  history: "history",
  profile: "profile",
  wallet: "profile",
  impact: "home",
  settings: "profile",
  documents: "profile",
  notifications: "profile",
};


const GUEST_PROFILE = {
  name: "Guest",
  role: "giver",
  status: "guest",
  recycledKg: 0,
  walletBalance: 0,
  greenPoints: 0,
  completedPickups: 0,
};

// Temporary INR/kg estimates used only until an admin publishes a current rate.
// Keep the same fallback table in the createPickupRequest Cloud Function.
const AVERAGE_RATES = {
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

const CATEGORY_AVERAGE_RATES = {
  plastic: 10,
  paper: 12,
  cardboard: 10,
  glass: 4,
  metal: 30,
  ewaste: 50,
  electronic: 50,
  organic: 2,
  textile: 8,
  other: 5,
};

function getFallbackRate(material) {
  const materialId = material?.id || material?.materialId || "";
  const category = String(material?.category || "other").toLowerCase();
  return (
    AVERAGE_RATES[materialId] ??
    CATEGORY_AVERAGE_RATES[category] ??
    CATEGORY_AVERAGE_RATES.other
  );
}

export default function Trash2TreasureApp() {
  const [route, setRoute] = useState("splash");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileSyncError, setProfileSyncError] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [guestMode, setGuestMode] = useState(false);

  const [image, setImage] = useState(null);
  const [base64, setBase64] = useState(null);
  const [mime, setMime] = useState("image/jpeg");
  const [scanId, setScanId] = useState(null);
  const [material, setMaterial] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [quantity, setQuantity] = useState("2");
  const [quantityUnit, setQuantityUnit] = useState("kg");
  const [activeTab, setActiveTab] = useState("home");

  const [rates, setRates] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notices, setNotices] = useState([]);
  const [openPickups, setOpenPickups] = useState([]);
  const [declinedPickups, setDeclinedPickups] = useState([]);
  const [pending, setPending] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [pickupSyncError, setPickupSyncError] = useState(null);
  const [transactionSyncError, setTransactionSyncError] = useState(null);

  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const { update, dismiss } = useAppUpdate();
  const noticeSourcesRef = useRef({ personal: [], admin: [] });
  const primedNoticeSourcesRef = useRef(new Set());
  const deliveredNoticeIdsRef = useRef(new Set());

  const updateNotificationSource = (source, firebaseNotices) => {
    noticeSourcesRef.current[source] = firebaseNotices;
    const merged = [...noticeSourcesRef.current.personal, ...noticeSourcesRef.current.admin]
      .filter((item, index, list) => list.findIndex((other) => other.id === item.id) === index)
      .sort((first, second) => {
        const firstTime = first.createdAt?.toMillis?.() || 0;
        const secondTime = second.createdAt?.toMillis?.() || 0;
        return secondTime - firstTime;
      });
    setNotices(merged);

    if (!primedNoticeSourcesRef.current.has(source)) {
      firebaseNotices.forEach((item) => deliveredNoticeIdsRef.current.add(item.id));
      primedNoticeSourcesRef.current.add(source);
      return;
    }

    firebaseNotices.forEach((item) => {
      if (item.read || deliveredNoticeIdsRef.current.has(item.id)) return;
      deliveredNoticeIdsRef.current.add(item.id);
      // The Firestore notification inbox remains live in Expo Go. Native local
      // and remote notifications are intentionally not imported here because
      // Expo Go SDK 53+ does not include Android push notification support.
    });
  };

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      // Clear the previous account immediately so it can never flash after an
      // account switch. The profile listener below supplies the new profile.
      setProfile(null);
      setProfileSyncError(null);
      setUser(currentUser);
      setAuthReady(true);
      if (!currentUser) {
        setPickups([]);
        setTransactions([]);
        setOpenPickups([]);
        setDeclinedPickups([]);
        setNotices([]);
        noticeSourcesRef.current = { personal: [], admin: [] };
        primedNoticeSourcesRef.current.clear();
        deliveredNoticeIdsRef.current.clear();
        setPending([]);
        setAllUsers([]);
        setUsersLoading(false);
        setUsersError(null);
        setPickupSyncError(null);
        setTransactionSyncError(null);
      }
    });
  }, []);

  useEffect(() => {
    if (route !== "splash" || !authReady) return undefined;
    const timer = setTimeout(() => {
      setGuestMode(false);
      if (!user) {
        setRoute("auth");
      } else if (user.email?.toLowerCase() === "karank2s6266@gmail.com") {
        setRoute("admin");
      } else {
        setRoute("home");
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [route, authReady, user?.uid]);

  useEffect(() => {
    if (!user) return undefined;

    let receivedProfile = false;
    const fallbackProfile = {
      name: user.displayName || user.email?.split("@")[0] || "Recycler",
      email: user.email || "",
      role:
        user.email?.toLowerCase() === "karank2s6266@gmail.com"
          ? "admin"
          : "giver",
      status: "active",
      profilePending: true,
    };

    // Do not trap the user on “Loading profile…” when Firestore is slow or
    // temporarily offline. Continue quickly with safe Auth-derived data; the
    // live snapshot replaces it automatically as soon as Firestore responds.
    const fallbackTimer = setTimeout(() => {
      if (!receivedProfile) setProfile(fallbackProfile);
    }, 1200);

    const unsubscribe = subscribeUser(
      user.uid,
      (userProfile) => {
        receivedProfile = true;
        clearTimeout(fallbackTimer);
        setProfileSyncError(null);
        const resolvedProfile = userProfile || fallbackProfile;
        setProfile(
          user.email?.toLowerCase() === "karank2s6266@gmail.com"
            ? { ...resolvedProfile, role: "admin", status: "active" }
            : resolvedProfile
        );
      },
      (error) => {
        receivedProfile = true;
        clearTimeout(fallbackTimer);
        console.warn("Profile subscription failed:", error?.message);
        setProfileSyncError(error?.message || "Unable to synchronize profile data.");
        setProfile(fallbackProfile);
      }
    );

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe?.();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return undefined;

    const unsubscribeRates = watchCurrentRates(
      setRates,
      (error) => console.warn("Rate subscription:", error?.message)
    );
    const unsubscribeCollectors = watchApprovedCollectors(
      setCollectors,
      (error) => console.warn("Collector subscription:", error?.message)
    );

    return () => {
      unsubscribeRates?.();
      unsubscribeCollectors?.();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !profile?.role) return undefined;

    noticeSourcesRef.current = { personal: [], admin: [] };
    primedNoticeSourcesRef.current.clear();
    const subscriptions = [
      watchNotifications(
        user.uid,
        (items) => updateNotificationSource("personal", items),
        (error) => console.warn("Personal notifications:", error?.message)
      ),
    ];

    if (profile.role === "giver") {
      subscriptions.push(
        watchGiverPickups(
          user.uid,
          (items) => { setPickups(items); setPickupSyncError(null); },
          (error) => { console.warn("Giver pickups:", error?.message); setPickupSyncError(error?.message); }
        ),
        watchTransactions(
          user.uid,
          (items) => { setTransactions(items); setTransactionSyncError(null); },
          (error) => { console.warn("Giver transactions:", error?.message); setTransactionSyncError(error?.message); }
        )
      );
    }

    if (profile.role === "collector") {
      subscriptions.push(
        watchCollectorPickups(
          user.uid,
          (items) => { setPickups(items); setPickupSyncError(null); },
          (error) => { console.warn("Collector pickups:", error?.message); setPickupSyncError(error?.message); }
        ),
        watchCollectorTransactions(
          user.uid,
          (items) => { setTransactions(items); setTransactionSyncError(null); },
          (error) => { console.warn("Collector transactions:", error?.message); setTransactionSyncError(error?.message); }
        ),
        watchOpenPickups(
          setOpenPickups,
          (error) => { console.warn("Open pickups:", error?.message); setPickupSyncError(error?.message); }
        ),
        watchDeclinedPickups(
          user.uid,
          setDeclinedPickups,
          (error) => { console.warn("Declined pickups:", error?.message); setPickupSyncError(error?.message); }
        )
      );
    }

    if (profile.role === "admin") {
      setUsersLoading(true);
      setUsersError(null);
      subscriptions.push(
        watchPendingCollectors(setPending, console.warn),
        watchAdminNotifications(
          (items) => updateNotificationSource("admin", items),
          (error) => console.warn("Admin notifications:", error?.message)
        ),
        watchAllTransactions(
          (items) => { setTransactions(items); setTransactionSyncError(null); },
          (error) => { console.warn("Admin transactions:", error?.message); setTransactionSyncError(error?.message); }
        ),
        watchAllUsers(
          (firebaseUsers) => {
            setAllUsers(firebaseUsers);
            setUsersLoading(false);
            setUsersError(null);
          },
          (error) => {
            console.warn("Users collection subscription failed:", error?.message);
            setUsersLoading(false);
            setUsersError(error?.message || "Unable to fetch the users collection.");
          }
        )
      );
    }

    return () => subscriptions.forEach((unsubscribe) => unsubscribe?.());
  }, [user?.uid, profile?.role]);

  useEffect(() => {
    if (route !== "collectors" || profile?.role !== "giver") return;
    loadCurrentUserLocation(false);
  }, [route, profile?.role]);

  const go = (nextRoute) => {
    if (guestMode && ["documents", "settings"].includes(nextRoute)) {
      Alert.alert("Login required", "Please log in to use this feature.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => { setGuestMode(false); setRoute("auth"); } },
      ]);
      return;
    }
    setRoute(nextRoute);
    const relatedTab = ROUTE_TABS[nextRoute];
    if (relatedTab) setActiveTab(relatedTab);
  };

  const switchTab = (tab) => {
    const nextRoute = TAB_ROUTES[tab];
    if (!nextRoute) return;
    setActiveTab(tab);
    setRoute(nextRoute);
  };

  const loadCurrentUserLocation = async (showErrors = true) => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        const message = "Location permission is required to find nearby collectors.";
        setLocationError(message);
        if (showErrors) Alert.alert("Location permission required", message);
        return null;
      }

      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown?.coords) {
        setCurrentUserLocation({
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          accuracy: lastKnown.coords.accuracy,
        });
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coordinates = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy,
      };
      setCurrentUserLocation(coordinates);
      return coordinates;
    } catch (error) {
      const message = error?.message || "Unable to get your current location.";
      setLocationError(message);
      if (showErrors) Alert.alert("Location unavailable", message);
      return null;
    } finally {
      setLocationLoading(false);
    }
  };

  const pick = async (camera = false) => {
    try {
      const permission = camera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          `Please allow ${camera ? "camera" : "photo library"} access.`
        );
        return;
      }

      const options = {
        mediaTypes: ["images"],
        quality: 0.3,
        base64: true,
        allowsEditing: true,
        aspect: [4, 5],
      };
      const result = camera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert("Encoding failed", "The image could not be converted to Base64.");
        return;
      }

      const imageBytes = Math.ceil((asset.base64.length * 3) / 4);
      if (imageBytes > 700 * 1024) {
        Alert.alert("Image too large", "Choose a smaller image. Maximum size is 700 KB.");
        return;
      }

      setImage(asset.uri);
      setBase64(asset.base64);
      setMime(asset.mimeType || "image/jpeg");
      setScanId(null);
      setMaterial(null);
      setAnalysis(null);
      go("scan");
    } catch (error) {
      Alert.alert("Image selection failed", error?.message || "Unable to select the image.");
    }
  };

  const selectedMaterialId = material?.id || material?.materialId || null;
  const selectedRateRecord = useMemo(() => {
    if (!selectedMaterialId) return null;
    return rates.find((item) => item.materialId === selectedMaterialId) || null;
  }, [rates, selectedMaterialId]);
  const adminRate = Number(selectedRateRecord?.ratePerKg || 0);
  const fallbackRate = material ? getFallbackRate(material) : 0;
  const effectiveRate = adminRate > 0 ? adminRate : fallbackRate;
  const rateSource = adminRate > 0 ? "admin" : "average_fallback";

  const displayProfile = useMemo(() => {
    if (!profile) return guestMode ? GUEST_PROFILE : null;
    if (profile.role !== "giver") return profile;
    const completed = transactions.filter((item) => item.type === "pickup_credit");
    const walletBalance = completed.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const recycledKg = completed.reduce((sum, item) => sum + Number(item.weightKg || 0), 0);
    return {
      ...profile,
      walletBalance,
      recycledKg,
      greenPoints: Math.round(recycledKg * 10),
      completedPickups: completed.length,
    };
  }, [profile, transactions, guestMode]);

  const nearbyCollectors = useMemo(() => {
    const giverLocation = currentUserLocation || profile?.location;

    return collectors
      .filter((collector) => {
        const approved =
          collector.role === "collector" &&
          collector.status === "active" &&
          collector.availableForPickups !== false;
        return approved;
      })
      .map((collector) => {
        const hasCollectorLocation =
          Number.isFinite(Number(collector.location?.latitude)) &&
          Number.isFinite(Number(collector.location?.longitude));
        const collectorLocation = hasCollectorLocation
          ? {
              latitude: Number(collector.location.latitude),
              longitude: Number(collector.location.longitude),
            }
          : null;
        return {
          ...collector,
          displayName:
            collector.businessName || collector.name || "Collector",
          distanceKm:
            giverLocation && collectorLocation
              ? distanceKm(giverLocation, collectorLocation)
              : null,
        };
      })
      .filter((collector) => {
        if (collector.distanceKm == null) return true;
        return collector.distanceKm <= Number(collector.serviceRadiusKm || 10);
      })
      .sort(
        (first, second) =>
          (first.distanceKm ?? 999999) - (second.distanceKm ?? 999999)
      );
  }, [collectors, currentUserLocation, profile?.location]);

  const requestPickup = async (collector) => {
    if (!material?.id) {
      Alert.alert("Material required", "Identify or select the material first.");
      return;
    }
    if (!user) {
      Alert.alert("Login required", "Please log in before requesting a pickup.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => { setGuestMode(false); setRoute("auth"); } },
      ]);
      return;
    }
    if (!effectiveRate) {
      Alert.alert("Rate unavailable", "No price estimate is available for this material.");
      return;
    }

    const estimatedKg = convertQuantityToKg(
      quantity,
      quantityUnit,
      material
    );
    if (!estimatedKg) {
      Alert.alert("Invalid quantity", "Enter a quantity greater than zero.");
      return;
    }

    const existingOpenPickup = pickups.find(
      (item) => item.materialId === material.id && item.status === "open"
    );
    const existingInProgress = pickups.find(
      (item) =>
        item.materialId === material.id &&
        ["requested", "accepted", "on_the_way", "arrived"].includes(item.status)
    );
    if (existingInProgress) {
      Alert.alert(
        "Pickup already active",
        "This material already has an active request. Open tracking to see the collector response.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Track", onPress: () => go("tracking") },
        ]
      );
      return;
    }

    try {
      setBusy(collector.id);
      const result = existingOpenPickup
        ? await reassignPickup(existingOpenPickup.id, {
            id: collector.id,
            name: collector.businessName || collector.name || "Collector",
          })
        : await createPickup({
        uid: user.uid,
        scanId,
        collector: {
          id: collector.id,
          name:
            collector.businessName || collector.name || "Collector",
        },
        quantityKg: estimatedKg,
        originalQuantity: Number(quantity),
        originalUnit: quantityUnit,
        materialId: material.id,
        giverName: profile?.name || user.displayName || "Trash giver",
        giverPhone: profile?.phone || null,
        // Informational only: Firestore chooses the saved request rate below.
        displayedRate: effectiveRate,
        rateSource,
        location: currentUserLocation || profile?.location || null,
        address: profile?.address || null,
      });
      Alert.alert(
        existingOpenPickup ? "Request sent again" : "Pickup requested",
        `Estimated value: ₹${Number(result.estimatedValue || 0).toFixed(0)}`
      );
      go("tracking");
    } catch (error) {
      Alert.alert("Pickup request failed", error?.message || "Unable to create request.");
    } finally {
      setBusy(null);
    }
  };

  const saveCurrentScan = async (selectedMaterial = material) => {
    if (scanId) return scanId;
    if (!base64) throw new Error("Choose or capture an image first.");
    if (!selectedMaterial?.id) throw new Error("Select a material first.");

    if (!user) {
      setMaterial(selectedMaterial);
      const localId = `guest-${Date.now()}`;
      setScanId(localId);
      return localId;
    }

    const reference = await saveWasteScan({
      uid: user.uid,
      base64,
      mimeType: mime,
      analysis: {
        ...analysis,
        selectedMaterialId: selectedMaterial.id,
        selectedMaterialName: selectedMaterial.name,
        selectedCategory: selectedMaterial.category,
        verification: "collector_required",
      },
    });
    setMaterial(selectedMaterial);
    setScanId(reference.id);
    return reference.id;
  };

  let screen;

  if (route === "splash") {
    screen = (
      <SplashScreen
        authReady={authReady}
        hasSession={!!user}
        onStart={() => {
          if (!authReady) return;
          setGuestMode(false);
          if (!user) return go("auth");
          go(user.email?.toLowerCase() === "karank2s6266@gmail.com" ? "admin" : "home");
        }}
      />
    );
  } else if (route === "auth" && !guestMode) {
    screen = (
      <AuthScreen
        onSuccess={(signedInUser) => {
          setGuestMode(false);
          go(signedInUser?.email?.toLowerCase() === "karank2s6266@gmail.com" ? "admin" : "home");
        }}
        onSkip={() => { setGuestMode(true); go("home"); }}
      />
    );
  } else if (!authReady) {
    screen = (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: C.text }}>Preparing app…</Text>
      </View>
    );
  } else if (!user && !guestMode) {
    screen = (
      <AuthScreen
        onSuccess={(signedInUser) => {
          setGuestMode(false);
          go(signedInUser?.email?.toLowerCase() === "karank2s6266@gmail.com" ? "admin" : "home");
        }}
        onSkip={() => { setGuestMode(true); go("home"); }}
      />
    );
  } else if (user && !profile) {
    screen = (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: C.text }}>Loading profile…</Text>
      </View>
    );
  } else if (["blocked", "removed"].includes(profile?.accountStatus)) {
    const removed = profile.accountStatus === "removed";
    screen = (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 28 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,95,104,.12)" }}>
          <Ionicons name={removed ? "trash-outline" : "ban-outline"} size={34} color={C.red} />
        </View>
        <Text style={{ color: C.text, fontSize: 20, fontWeight: "900", marginTop: 17 }}>
          {removed ? "Account removed" : "Account blocked"}
        </Text>
        <Text style={{ color: C.muted, fontSize: 11, lineHeight: 18, textAlign: "center", marginTop: 8 }}>
          This account is not currently allowed to use authenticated marketplace features. Contact the Trash2Treasure administrator for assistance.
        </Text>
        <TouchableOpacity onPress={() => logoutUser()} style={{ height: 46, minWidth: 150, alignItems: "center", justifyContent: "center", marginTop: 20, borderRadius: 10, backgroundColor: C.green }}>
          <Text style={{ color: C.bg, fontWeight: "900" }}>Return to Login</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (profile?.role === "admin" && route === "admin") {
    screen = (
      <AdminScreen
        pending={pending}
        rates={rates}
        users={allUsers}
        usersLoading={usersLoading}
        usersError={usersError}
        unreadCount={notices.filter((item) => !item.read).length}
        go={go}
        approve={approveCollector}
        setRate={setMonthlyRate}
        logout={logoutUser}
      />
    );
  } else if (profile?.role === "collector" && route === "notifications") {
    screen = (
      <NotificationsScreen
        go={go}
        items={notices}
        markRead={(id) => markNotificationRead(id).catch((error) => Alert.alert("Update failed", error?.message))}
        backRoute="home"
      />
    );
  } else if (profile?.role === "collector") {
    screen = (
      <CollectorDashboardScreen
        user={user}
        profile={profile}
        pickups={pickups}
        openPickups={openPickups}
        declinedPickups={declinedPickups}
        transactions={transactions}
        unreadCount={notices.filter((item) => !item.read).length}
        syncError={pickupSyncError || transactionSyncError}
        go={go}
        accept={acceptPickup}
        decline={declinePickup}
        status={updatePickupStatus}
        complete={completePickup}
        logout={logoutUser}
      />
    );
  } else if (route === "home") {
    screen = (
      <HomeScreen
        go={go}
        profile={displayProfile}
        pickups={pickups}
        unreadCount={notices.filter((item) => !item.read).length}
      />
    );
  } else if (route === "scan") {
    screen = <ScanScreen go={go} image={image} pick={pick} />;
  } else if (route === "result") {
    screen = (
      <ResultScreen
        go={go}
        image={image}
        material={material}
        setMaterial={setMaterial}
        analysis={analysis}
        saveScan={saveCurrentScan}
      />
    );
  } else if (route === "quantity") {
    screen = (
      <QuantityScreen
        go={go}
        quantity={quantity}
        setQuantity={setQuantity}
        unit={quantityUnit}
        setUnit={setQuantityUnit}
        // QuantityScreen receives only the admin rate. When it is zero,
        // that screen clearly labels and uses its own average fallback.
        rate={adminRate}
        rateMonth={selectedRateRecord?.month || null}
        rateSource={rateSource}
        material={material}
      />
    );
  } else if (route === "collectors") {
    screen = (
      <CollectorsScreen
        go={go}
        collectors={nearbyCollectors}
        pickups={pickups}
        syncError={pickupSyncError}
        requestPickup={requestPickup}
        busy={busy}
        locationLoading={locationLoading}
        locationError={locationError}
        currentLocation={currentUserLocation}
        refreshLocation={() => loadCurrentUserLocation(true)}
      />
    );
  } else if (route === "tracking") {
    screen = (
      <TrackingScreen go={go} pickups={pickups} syncError={pickupSyncError} />
    );
  } else if (route === "history") {
    screen = (
      <HistoryScreen
        go={go}
        transactions={transactions}
        profile={displayProfile}
        user={user}
        syncError={transactionSyncError}
      />
    );
  } else if (route === "profile") {
    screen = (
      <ProfileScreen
        go={go}
        profile={displayProfile}
        user={user}
        unreadCount={notices.filter((item) => !item.read).length}
        syncError={profileSyncError}
      />
    );
  } else if (route === "wallet") {
    screen = (
      <WalletScreen
        go={go}
        profile={displayProfile}
        transactions={transactions}
        syncError={transactionSyncError}
      />
    );
  } else if (route === "impact") {
    screen = (
      <ImpactScreen
        go={go}
        profile={displayProfile}
        transactions={transactions}
        syncError={transactionSyncError}
      />
    );
  } else if (route === "settings") {
    screen = (
      <SettingsScreen
        go={go}
        user={user}
        profile={displayProfile}
        initial={profile?.settings}
      />
    );
  } else if (route === "documents") {
    screen = (
      <DocumentsScreen go={go} user={user} profile={displayProfile} />
    );
  } else {
    screen = (
      <NotificationsScreen
        go={go}
        items={notices}
        markRead={(id) => markNotificationRead(id).catch((error) => Alert.alert("Update failed", error?.message))}
        backRoute={profile?.role === "admin" ? "admin" : "profile"}
      />
    );
  }

  const hideTabs =
    (!user && !guestMode) ||
    route === "splash" ||
    route === "auth" ||
    profile?.role === "collector" ||
    ["result", "quantity", "wallet", "settings", "documents", "notifications"].includes(route);

  return (
    <SafeAreaView
      style={s.safe}
      edges={["top", "left", "right", "bottom"]}
    >
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={{ flex: 1 }}>{screen}</View>
      {profile?.role === "admin" && route !== "admin" && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Return to Admin Console"
          activeOpacity={0.85}
          onPress={() => go("admin")}
          style={{
            position: "absolute",
            right: 18,
            bottom: hideTabs ? 22 : 82,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: C.green,
            alignItems: "center",
            justifyContent: "center",
            elevation: 10,
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 7,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Ionicons name="shield-checkmark" size={27} color={C.bg} />
        </TouchableOpacity>
      )}
      {!hideTabs && (
        <BottomNav active={route === "admin" ? null : activeTab} onPress={switchTab} />
      )}
      <UpdateModal update={update} onDismiss={dismiss} />
    </SafeAreaView>
  );
}

function BottomNav({ active, onPress }) {
  const tabs = [
    ["home", "home-outline", "home", "Home"],
    ["scan", "scan-outline", "scan", "Scan"],
    ["map", "location-outline", "location", "Map"],
    ["history", "time-outline", "time", "History"],
    ["profile", "person-outline", "person", "Profile"],
  ];

  return (
    <View style={s.bottomNav}>
      {tabs.map(([key, inactiveIcon, activeIcon, label]) => {
        const selected = active === key;
        return (
          <TouchableOpacity
            key={key}
            activeOpacity={0.7}
            style={s.tab}
            onPress={() => onPress(key)}
          >
            <Ionicons
              name={selected ? activeIcon : inactiveIcon}
              color={selected ? C.green : C.muted}
              size={22}
            />
            <Text
              style={[
                s.tabText,
                selected && { color: C.green, fontWeight: "700" },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
