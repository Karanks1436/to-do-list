import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { C } from "../theme";
import { s } from "../styles";

export default function SplashScreen({
  onStart,
  authReady = false,
  hasSession = false,
}) {
  const autoOpened = useRef(false);
  const onStartRef = useRef(onStart);

  useEffect(() => {
    onStartRef.current = onStart;
  }, [onStart]);

  // A restored Firebase session should not make the user log in or press an
  // extra button. Give the status message a moment to render, then continue.
  useEffect(() => {
    if (!authReady || !hasSession || autoOpened.current) return undefined;
    autoOpened.current = true;
    const timer = setTimeout(() => onStartRef.current?.(), 850);
    return () => clearTimeout(timer);
  }, [authReady, hasSession]);

  return (
    <LinearGradient
      colors={["#032c31", "#031c21", "#021417"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.fill, styles.container]}
    >
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <View style={styles.dotOne} />
      <View style={styles.dotTwo} />
      <View style={styles.dotThree} />

      <View style={styles.topBadge}>
        <Ionicons name="leaf-outline" size={15} color={C.green} />
        <Text style={styles.topBadgeText}>SMART RECYCLING MARKETPLACE</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.logoOuter}>
          <View style={styles.logoMiddle}>
            <LinearGradient
              colors={["rgba(32,211,90,.30)", "rgba(32,211,90,.08)"]}
              style={styles.logoCircle}
            >
              <MaterialCommunityIcons name="recycle" size={76} color={C.lime} />
            </LinearGradient>
          </View>
          <View style={styles.logoLeaf}>
            <Ionicons name="leaf" size={17} color={C.bg} />
          </View>
        </View>

        <Text style={styles.brand}>
          Trash<Text style={styles.brandGreen}>2Treasure</Text>
        </Text>
        <Text style={styles.subtitle}>
          Turn recyclable waste into value through verified local collection.
        </Text>

        <View style={styles.impactCard}>
          <View style={styles.impactGlobe}>
            <Ionicons name="earth-outline" size={45} color={C.green} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.impactEyebrow}>TOGETHER FOR A CLEANER PLANET</Text>
            <Text style={styles.slogan}>Small actions. Big impact.</Text>
            <Text style={styles.impactText}>
              Scan, schedule and recycle with nearby approved collectors.
            </Text>
          </View>
        </View>

        <View style={styles.features}>
          <Feature icon="scan-outline" title="Identify" text="Choose material" />
          <View style={styles.featureDivider} />
          <Feature icon="location-outline" title="Connect" text="Nearby collectors" />
          <View style={styles.featureDivider} />
          <Feature icon="wallet-outline" title="Earn" text="Verified credits" />
        </View>
      </View>

      <View style={styles.bottomArea}>
        <View style={styles.statusBox}>
          {!authReady ? (
            <>
              <View style={styles.statusIcon}>
                <ActivityIndicator size="small" color={C.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>Restoring your session</Text>
                <Text style={styles.statusText}>Checking secure Firebase login…</Text>
              </View>
            </>
          ) : hasSession ? (
            <>
              <View style={styles.statusIcon}>
                <Ionicons name="shield-checkmark" size={21} color={C.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>Welcome back</Text>
                <Text style={styles.statusText}>Saved login found. Opening your dashboard…</Text>
              </View>
              <ActivityIndicator size="small" color={C.green} />
            </>
          ) : (
            <>
              <View style={styles.statusIcon}>
                <Ionicons name="sparkles-outline" size={21} color={C.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>Ready to recycle?</Text>
                <Text style={styles.statusText}>Start with an account or continue as a guest.</Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          disabled={!authReady}
          activeOpacity={0.82}
          onPress={onStart}
          style={[styles.button, !authReady && styles.buttonDisabled]}
        >
          <LinearGradient
            colors={authReady ? [C.green, "#13af59"] : ["#315348", "#29463e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {!authReady
                ? "Preparing App…"
                : hasSession
                ? "Open Dashboard"
                : "Get Started"}
            </Text>
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={17} color={C.green} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.secureRow}>
          <Ionicons name="lock-closed-outline" size={12} color={C.muted} />
          <Text style={styles.secureText}>Secure Firebase authentication · Verified collection workflow</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function Feature({ icon, title, text }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={20} color={C.green} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = {
  container: { alignItems: "center", paddingHorizontal: 22, paddingTop: 48, paddingBottom: 26, overflow: "hidden" },
  glowTop: {
    position: "absolute",
    width: 310,
    height: 310,
    borderRadius: 155,
    top: -180,
    right: -135,
    backgroundColor: "rgba(32,211,90,.10)",
  },
  glowBottom: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: 135,
    left: -165,
    bottom: -135,
    backgroundColor: "rgba(32,211,90,.06)",
  },
  dotOne: { position: "absolute", width: 5, height: 5, borderRadius: 3, top: "17%", left: "13%", backgroundColor: "rgba(114,239,69,.42)" },
  dotTwo: { position: "absolute", width: 8, height: 8, borderRadius: 4, top: "29%", right: "9%", backgroundColor: "rgba(32,211,90,.20)" },
  dotThree: { position: "absolute", width: 4, height: 4, borderRadius: 2, bottom: "29%", right: "17%", backgroundColor: "rgba(114,239,69,.34)" },
  topBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: "rgba(32,211,90,.08)",
    borderWidth: 1,
    borderColor: "rgba(32,211,90,.20)",
  },
  topBadgeText: { color: C.green, fontSize: 7, fontWeight: "900", letterSpacing: 1, marginLeft: 5 },
  content: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center" },
  logoOuter: { width: 148, height: 148, alignItems: "center", justifyContent: "center" },
  logoMiddle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.05)",
    borderWidth: 1,
    borderColor: "rgba(114,239,69,.16)",
  },
  logoCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(114,239,69,.30)",
  },
  logoLeaf: {
    position: "absolute",
    right: 8,
    bottom: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.green,
    borderWidth: 3,
    borderColor: C.bg,
  },
  brand: { color: C.text, fontSize: 33, fontWeight: "900", letterSpacing: -1, marginTop: 10 },
  brandGreen: { color: C.green },
  subtitle: { maxWidth: 300, color: C.muted, fontSize: 10, lineHeight: 16, textAlign: "center", marginTop: 7 },
  impactCard: {
    width: "100%",
    minHeight: 91,
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    marginTop: 22,
    borderRadius: 16,
    backgroundColor: "rgba(7,38,43,.78)",
    borderWidth: 1,
    borderColor: "rgba(32,211,90,.20)",
  },
  impactGlobe: {
    width: 61,
    height: 61,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.10)",
  },
  impactEyebrow: { color: C.green, fontSize: 6, fontWeight: "900", letterSpacing: 0.8 },
  slogan: { color: C.text, fontSize: 14, fontWeight: "900", marginTop: 4 },
  impactText: { color: C.muted, fontSize: 8, lineHeight: 12, marginTop: 3 },
  features: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 19,
  },
  feature: { flex: 1, alignItems: "center" },
  featureIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.09)",
  },
  featureTitle: { color: C.text, fontSize: 9, fontWeight: "900", marginTop: 6 },
  featureText: { color: C.muted, fontSize: 6, marginTop: 2 },
  featureDivider: { width: 1, height: 37, backgroundColor: C.line },
  bottomArea: { width: "100%" },
  statusBox: {
    minHeight: 57,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 13,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  statusIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "rgba(32,211,90,.10)",
  },
  statusTitle: { color: C.text, fontSize: 9, fontWeight: "900" },
  statusText: { color: C.muted, fontSize: 7, marginTop: 3 },
  button: { width: "100%", height: 55, marginTop: 11, borderRadius: 13, overflow: "hidden" },
  buttonDisabled: { opacity: 0.58 },
  buttonGradient: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  buttonText: { color: C.bg, fontSize: 12, fontWeight: "900" },
  arrowCircle: {
    position: "absolute",
    right: 8,
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  secureRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10 },
  secureText: { color: C.muted, fontSize: 6, marginLeft: 4 },
};
