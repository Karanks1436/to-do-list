import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import {
  onAuthStateChanged,
  signInAnonymously,
} from "firebase/auth";

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
  completeRegistration,
  distanceKm,
  setMonthlyRate,
  updatePickupStatus,
  watchApprovedCollectors,
  watchCollectorPickups,
  watchCurrentRates,
  watchGiverPickups,
  watchNotifications,
  watchOpenPickups,
  watchPendingCollectors,
  watchTransactions,
} from "../src/firebase/marketplaceService";

import {
  AdminScreen,
  CollectorDashboardScreen,
  CollectorsScreen,
  DocumentsScreen,
  HistoryScreen,
  HomeScreen,
  ImpactScreen,
  NotificationsScreen,
  ProfileScreen,
  QuantityScreen,
  ResultScreen,
  ScanScreen,
  SettingsScreen,
  SplashScreen,
  TrackingScreen,
  WalletScreen,
} from "../src/screens";

import {
  useAppUpdate,
} from "../src/update/useAppUpdate";
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

const DEFAULT_PROFILE = {
  name: "Guest Recycler",
  role: "giver",
  status: "active",
  recycledKg: 0,
  walletBalance: 0,
  greenPoints: 0,
  completedPickups: 0,
};

export default function Trash2TreasureApp() {
  const [route, setRoute] = useState("splash");

  const [user, setUser] = useState(null);
  const [profile, setProfile] =
    useState(DEFAULT_PROFILE);
  const [authReady, setAuthReady] =
    useState(false);

  const profileCreationStarted = useRef(false);

  const [image, setImage] = useState(null);
  const [base64, setBase64] = useState(null);
  const [mime, setMime] =
    useState("image/jpeg");
  const [scanId, setScanId] = useState(null);

  const [quantity, setQuantity] =
    useState("2");
  const [activeTab, setActiveTab] =
    useState("home");

  const [rates, setRates] = useState([]);
  const [collectors, setCollectors] =
    useState([]);
  const [pickups, setPickups] =
    useState([]);
  const [transactions, setTransactions] =
    useState([]);
  const [notices, setNotices] =
    useState([]);
  const [openPickups, setOpenPickups] =
    useState([]);
  const [pending, setPending] =
    useState([]);
  const [busy, setBusy] = useState(null);

  const {
    update,
    dismiss,
  } = useAppUpdate();

  /*
   * No visible authentication screen.
   * Firebase anonymous authentication happens
   * automatically in the background.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          setAuthReady(true);
          return;
        }

        try {
          setAuthReady(false);

          const credential =
            await signInAnonymously(auth);

          setUser(credential.user);
          setAuthReady(true);
        } catch (error) {
          setAuthReady(true);

          Alert.alert(
            "Firebase setup required",
            "Enable Anonymous authentication in Firebase Console. " +
              (error?.message || "")
          );
        }
      }
    );

    return unsubscribe;
  }, []);

  /*
   * Load the anonymous profile.
   * If it does not exist, create a giver profile
   * through the trusted Cloud Function.
   */
  useEffect(() => {
    if (!user) {
      return undefined;
    }

    return subscribeUser(
      user.uid,
      async (userProfile) => {
        if (userProfile) {
          setProfile(userProfile);
          profileCreationStarted.current = false;
          return;
        }

        setProfile({
          ...DEFAULT_PROFILE,
          uid: user.uid,
        });

        if (profileCreationStarted.current) {
          return;
        }

        profileCreationStarted.current = true;

        try {
          await completeRegistration({
            name: "Guest Recycler",
            role: "giver",
          });

          await user.getIdToken(true);
        } catch (error) {
          profileCreationStarted.current = false;

          console.warn(
            "Profile creation failed:",
            error?.message
          );
        }
      },
      (error) => {
        console.warn(
          "Profile subscription failed:",
          error?.message
        );
      }
    );
  }, [user?.uid]);

  /*
   * Subscribe to shared data only after Firebase
   * anonymous authentication is ready.
   */
  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const unsubscribeRates =
      watchCurrentRates(
        setRates,
        (error) =>
          console.warn(
            "Rate subscription:",
            error?.message
          )
      );

    const unsubscribeCollectors =
      watchApprovedCollectors(
        setCollectors,
        (error) =>
          console.warn(
            "Collector subscription:",
            error?.message
          )
      );

    return () => {
      unsubscribeRates?.();
      unsubscribeCollectors?.();
    };
  }, [user?.uid]);

  /*
   * Role-specific subscriptions.
   */
  useEffect(() => {
    if (!user || !profile?.role) {
      return undefined;
    }

    const subscriptions = [];

    subscriptions.push(
      watchNotifications(
        user.uid,
        setNotices,
        console.warn
      )
    );

    if (profile.role === "giver") {
      subscriptions.push(
        watchGiverPickups(
          user.uid,
          setPickups,
          console.warn
        )
      );

      subscriptions.push(
        watchTransactions(
          user.uid,
          setTransactions,
          console.warn
        )
      );
    }

    if (profile.role === "collector") {
      subscriptions.push(
        watchCollectorPickups(
          user.uid,
          setPickups,
          console.warn
        )
      );

      subscriptions.push(
        watchOpenPickups(
          setOpenPickups,
          console.warn
        )
      );
    }

    if (profile.role === "admin") {
      subscriptions.push(
        watchPendingCollectors(
          setPending,
          console.warn
        )
      );
    }

    return () => {
      subscriptions.forEach(
        (unsubscribe) => unsubscribe?.()
      );
    };
  }, [user?.uid, profile?.role]);

  const go = (nextRoute) => {
    setRoute(nextRoute);

    const relatedTab =
      ROUTE_TABS[nextRoute];

    if (relatedTab) {
      setActiveTab(relatedTab);
    }
  };

  const switchTab = (tab) => {
    const nextRoute = TAB_ROUTES[tab];

    if (!nextRoute) {
      return;
    }

    setActiveTab(tab);
    setRoute(nextRoute);
  };

  const pick = async (camera = false) => {
    try {
      const permission = camera
        ? await ImagePicker
            .requestCameraPermissionsAsync()
        : await ImagePicker
            .requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          `Please allow ${
            camera
              ? "camera"
              : "photo library"
          } access.`
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
        ? await ImagePicker
            .launchCameraAsync(options)
        : await ImagePicker
            .launchImageLibraryAsync(options);

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset.base64) {
        Alert.alert(
          "Encoding failed",
          "The image could not be converted to Base64."
        );

        return;
      }

      const imageBytes = Math.ceil(
        (asset.base64.length * 3) / 4
      );

      if (imageBytes > 700 * 1024) {
        Alert.alert(
          "Image too large",
          "Choose a smaller image. Maximum size is 700 KB."
        );

        return;
      }

      setImage(asset.uri);
      setBase64(asset.base64);
      setMime(
        asset.mimeType || "image/jpeg"
      );
      setScanId(null);

      go("scan");
    } catch (error) {
      Alert.alert(
        "Image selection failed",
        error?.message ||
          "Unable to select the image."
      );
    }
  };

  const material = {
    id: "plastic_pet",
    name: "Plastic (PET)",
  };

  const rate = Number(
    rates.find(
      (item) =>
        item.materialId === material.id
    )?.ratePerKg || 0
  );

  const nearbyCollectors = useMemo(() => {
    return collectors
      .map((collector) => {
        const giverLocation =
          profile?.location ||
          profile?.address;

        const collectorLocation =
          collector.location ||
          collector.address;

        return {
          ...collector,
          distanceKm: distanceKm(
            giverLocation,
            collectorLocation
          ),
        };
      })
      .sort(
        (first, second) =>
          (first.distanceKm || 999) -
          (second.distanceKm || 999)
      );
  }, [collectors, profile]);

  const requestPickup = async (
    collector
  ) => {
    if (!user) {
      Alert.alert(
        "Please wait",
        "Firebase is still preparing your guest account."
      );

      return;
    }

    if (!rate) {
      Alert.alert(
        "Rate unavailable",
        "The administrator has not published a current rate for this material."
      );

      return;
    }

    try {
      setBusy(collector.id);

      const result = await createPickup({
        uid: user.uid,
        scanId,
        collector: {
          id: collector.id,
          name: collector.name,
        },
        quantityKg: quantity,
        materialId: material.id,
      });

      Alert.alert(
        "Pickup requested",
        `Estimated value: ₹${Number(
          result.estimatedValue || 0
        ).toFixed(0)}`
      );

      go("tracking");
    } catch (error) {
      Alert.alert(
        "Pickup request failed",
        error?.message ||
          "Unable to create the request."
      );
    } finally {
      setBusy(null);
    }
  };

  const saveCurrentScan = async () => {
    if (scanId) {
      return scanId;
    }

    if (!user) {
      throw new Error(
        "Firebase guest account is not ready."
      );
    }

    if (!base64) {
      throw new Error(
        "Choose or capture an image first."
      );
    }

    const reference =
      await saveWasteScan({
        uid: user.uid,
        base64,
        mimeType: mime,
        analysis: {
          verification:
            "collector_required",
          materialId: material.id,
        },
      });

    setScanId(reference.id);

    return reference.id;
  };

  let screen;

  if (route === "splash") {
    screen = (
      <SplashScreen
        onStart={() => go("home")}
      />
    );
  } else if (!authReady) {
    screen = (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: C.text }}>
          Preparing app…
        </Text>
      </View>
    );
  } else if (
    profile?.role === "admin"
  ) {
    screen = (
      <AdminScreen
        pending={pending}
        approve={approveCollector}
        setRate={setMonthlyRate}
        logout={logoutUser}
      />
    );
  } else if (
    profile?.role === "collector"
  ) {
    screen = (
      <CollectorDashboardScreen
        profile={profile}
        pickups={pickups}
        openPickups={openPickups}
        accept={acceptPickup}
        status={updatePickupStatus}
        complete={completePickup}
        logout={logoutUser}
      />
    );
  } else if (route === "home") {
    screen = (
      <HomeScreen
        go={go}
        profile={profile}
        pickups={pickups}
      />
    );
  } else if (route === "scan") {
    screen = (
      <ScanScreen
        go={go}
        image={image}
        pick={pick}
      />
    );
  } else if (route === "result") {
    screen = (
      <ResultScreen
        go={go}
        image={image}
        material={material}
        saveScan={saveCurrentScan}
      />
    );
  } else if (route === "quantity") {
    screen = (
      <QuantityScreen
        go={go}
        quantity={quantity}
        setQuantity={setQuantity}
        rate={rate}
        material={material}
      />
    );
  } else if (route === "collectors") {
    screen = (
      <CollectorsScreen
        go={go}
        collectors={
          nearbyCollectors
        }
        requestPickup={
          requestPickup
        }
        busy={busy}
      />
    );
  } else if (route === "tracking") {
    screen = (
      <TrackingScreen
        go={go}
        pickups={pickups}
      />
    );
  } else if (route === "history") {
    screen = (
      <HistoryScreen
        go={go}
        transactions={
          transactions
        }
      />
    );
  } else if (route === "profile") {
    screen = (
      <ProfileScreen
        go={go}
        profile={profile}
        user={user}
      />
    );
  } else if (route === "wallet") {
    screen = (
      <WalletScreen
        go={go}
        profile={profile}
      />
    );
  } else if (route === "impact") {
    screen = (
      <ImpactScreen
        go={go}
        profile={profile}
      />
    );
  } else if (route === "settings") {
    screen = (
      <SettingsScreen
        go={go}
        user={user}
        initial={
          profile?.settings
        }
      />
    );
  } else if (route === "documents") {
    screen = (
      <DocumentsScreen
        go={go}
        user={user}
      />
    );
  } else {
    screen = (
      <NotificationsScreen
        go={go}
        items={notices}
      />
    );
  }

  const hideTabs =
    route === "splash" ||
    profile?.role === "admin" ||
    profile?.role === "collector" ||
    [
      "result",
      "quantity",
      "wallet",
      "settings",
      "documents",
      "notifications",
    ].includes(route);

  return (
    <SafeAreaView
      style={s.safe}
      edges={[
        "top",
        "left",
        "right",
        "bottom",
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={C.bg}
      />

      <View style={{ flex: 1 }}>
        {screen}
      </View>

      {!hideTabs && (
        <BottomNav
          active={activeTab}
          onPress={switchTab}
        />
      )}

      <UpdateModal
        update={update}
        onDismiss={dismiss}
      />
    </SafeAreaView>
  );
}

function BottomNav({
  active,
  onPress,
}) {
  const tabs = [
    [
      "home",
      "home-outline",
      "home",
      "Home",
    ],
    [
      "scan",
      "scan-outline",
      "scan",
      "Scan",
    ],
    [
      "map",
      "location-outline",
      "location",
      "Map",
    ],
    [
      "history",
      "time-outline",
      "time",
      "History",
    ],
    [
      "profile",
      "person-outline",
      "person",
      "Profile",
    ],
  ];

  return (
    <View style={s.bottomNav}>
      {tabs.map((tab) => {
        const [
          key,
          inactiveIcon,
          activeIcon,
          label,
        ] = tab;

        const selected =
          active === key;

        return (
          <TouchableOpacity
            key={key}
            activeOpacity={0.7}
            style={s.tab}
            onPress={() =>
              onPress(key)
            }
          >
            <Ionicons
              name={
                selected
                  ? activeIcon
                  : inactiveIcon
              }
              color={
                selected
                  ? C.green
                  : C.muted
              }
              size={22}
            />

            <Text
              style={[
                s.tabText,
                selected && {
                  color: C.green,
                  fontWeight: "700",
                },
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