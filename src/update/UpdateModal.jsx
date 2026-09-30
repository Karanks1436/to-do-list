import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { C } from "../theme";

export default function UpdateModal({ update, onDismiss }) {
  const [busy, setBusy] = useState(false);
  if (!update) return null;

  const download = async () => {
    const url = String(update.url || "").trim();
    if (!/^https:\/\//i.test(url)) {
      return Alert.alert(
        "Download unavailable",
        "The administrator has not configured a valid HTTPS download link."
      );
    }

    try {
      setBusy(true);
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        "Unable to open update",
        error?.message || "The update website could not be opened."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible
      statusBarTranslucent
      onRequestClose={() => !update.required && onDismiss?.()}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <LinearGradient
            colors={["rgba(32,211,90,.25)", "rgba(32,211,90,.04)"]}
            style={styles.hero}
          >
            <View style={styles.iconOuter}>
              <View style={styles.iconInner}>
                <Ionicons name="cloud-download-outline" size={39} color={C.green} />
              </View>
              <View style={styles.sparkle}>
                <Ionicons name="sparkles" size={13} color={C.bg} />
              </View>
            </View>

            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>FIREBASE LIVE UPDATE</Text>
            </View>
          </LinearGradient>

          <View style={styles.content}>
            <Text style={styles.title}>{update.title || "New version available"}</Text>
            {!!update.latestVersion && (
              <View style={styles.versionBadge}>
                <Ionicons name="logo-android" size={14} color={C.green} />
                <Text style={styles.versionText}>Version {update.latestVersion}</Text>
              </View>
            )}
            <Text style={styles.message}>
              {update.message || "Download the latest Trash2Treasure update."}
            </Text>

            <View style={styles.featureBox}>
              <Feature icon="shield-checkmark-outline" text="Published by the Trash2Treasure administrator" />
              <Feature icon="link-outline" text="Opens the latest configured secure download link" />
              <Feature icon="refresh-outline" text="Your Firebase account and saved data remain available" last />
            </View>

            {update.required && (
              <View style={styles.requiredBox}>
                <Ionicons name="alert-circle-outline" size={18} color="#b77b12" />
                <Text style={styles.requiredText}>
                  This update is required to continue using the app.
                </Text>
              </View>
            )}

            <TouchableOpacity
              disabled={busy}
              activeOpacity={0.82}
              onPress={download}
              style={[styles.downloadButton, busy && { opacity: 0.6 }]}
            >
              {busy ? (
                <ActivityIndicator size="small" color={C.bg} />
              ) : (
                <Ionicons name="download-outline" size={20} color={C.bg} />
              )}
              <Text style={styles.downloadText}>
                {busy ? "Opening Download…" : "Download Latest Update"}
              </Text>
              {!busy && <Ionicons name="arrow-forward" size={18} color={C.bg} />}
            </TouchableOpacity>

            {!update.required && (
              <TouchableOpacity
                disabled={busy}
                onPress={() => onDismiss?.()}
                style={styles.laterButton}
              >
                <Text style={styles.laterText}>Maybe Later</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Feature({ icon, text, last }) {
  return (
    <View style={[styles.feature, last && { borderBottomWidth: 0 }]}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={16} color={C.green} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = {
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    backgroundColor: "rgba(0,0,0,.78)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: C.panel2,
    borderWidth: 1,
    borderColor: C.line,
  },
  hero: { height: 145, alignItems: "center", justifyContent: "center" },
  iconOuter: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.08)",
    borderWidth: 1,
    borderColor: "rgba(32,211,90,.25)",
  },
  iconInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.panel,
  },
  sparkle: {
    position: "absolute",
    right: 0,
    bottom: 7,
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.green,
    borderWidth: 3,
    borderColor: C.panel2,
  },
  liveBadge: {
    position: "absolute",
    bottom: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(3,25,29,.72)",
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  liveText: { color: C.green, fontSize: 6, fontWeight: "900", letterSpacing: 0.8, marginLeft: 5 },
  content: { padding: 19, paddingTop: 14 },
  title: { color: C.text, fontSize: 21, fontWeight: "900", textAlign: "center" },
  versionBadge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginTop: 8,
    borderRadius: 9,
    backgroundColor: "rgba(32,211,90,.10)",
  },
  versionText: { color: C.green, fontSize: 8, fontWeight: "900", marginLeft: 5 },
  message: { color: C.muted, fontSize: 10, lineHeight: 16, textAlign: "center", marginTop: 11 },
  featureBox: { paddingHorizontal: 11, marginTop: 14, borderRadius: 12, backgroundColor: C.panel },
  feature: { minHeight: 43, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: C.line },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "rgba(32,211,90,.09)",
  },
  featureText: { flex: 1, color: C.muted, fontSize: 8, lineHeight: 12 },
  requiredBox: { flexDirection: "row", alignItems: "center", padding: 9, marginTop: 11, borderRadius: 9, backgroundColor: "#fff0c9" },
  requiredText: { flex: 1, color: "#805b18", fontSize: 8, fontWeight: "800", marginLeft: 7 },
  downloadButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginTop: 14,
    borderRadius: 11,
    backgroundColor: C.green,
  },
  downloadText: { flex: 1, color: C.bg, fontSize: 11, fontWeight: "900", textAlign: "center", marginHorizontal: 7 },
  laterButton: { height: 42, alignItems: "center", justifyContent: "center", marginTop: 4 },
  laterText: { color: C.muted, fontSize: 9, fontWeight: "800" },
};
