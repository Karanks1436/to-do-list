import { useEffect, useState } from "react";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { doc, onSnapshot } from "firebase/firestore";

import { db } from "../firebase/firebase";

const parts = (value) =>
  String(value || "0")
    .split(".")
    .map((part) => parseInt(part, 10) || 0);

export function compareVersions(first, second) {
  const a = parts(first);
  const b = parts(second);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) > (b[index] || 0)) return 1;
    if ((a[index] || 0) < (b[index] || 0)) return -1;
  }
  return 0;
}

export function useAppUpdate() {
  const [update, setUpdate] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(
    () =>
      onSnapshot(
        doc(db, "appConfig", "android"),
        (snapshot) => {
          setChecking(false);
          if (!snapshot.exists()) return setUpdate(null);

          const config = snapshot.data();
          // expoConfig.version is correct in Expo Go; nativeApplicationVersion
          // is the installed APK version in development/release builds.
          const currentVersion =
            Constants.expoConfig?.version ||
            Application.nativeApplicationVersion ||
            "0.0.0";

          if (compareVersions(config.latestVersion, currentVersion) <= 0) {
            return setUpdate(null);
          }

          setUpdate({
            title: config.title || "New version available",
            message:
              config.message ||
              `Trash2Treasure version ${config.latestVersion} is available.`,
            latestVersion: config.latestVersion,
            currentVersion,
            required:
              config.force === true ||
              compareVersions(config.minSupportedVersion, currentVersion) > 0,
            url: config.downloadUrl || config.playStoreUrl,
            publishedAt: config.publishedAt || null,
          });
        },
        (error) => {
          setChecking(false);
          console.warn("Update check failed:", error?.message);
        }
      ),
    []
  );

  return {
    update,
    checking,
    dismiss: () => setUpdate(null),
  };
}
