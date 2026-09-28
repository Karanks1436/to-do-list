import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "../components/UI";
import { C } from "../theme";
import { s } from "../styles";

export default function HomeScreen({
  go,
  profile,
  pickups = [],
  unreadCount = 0,
}) {
  const recent = [...pickups].sort(
    (first, second) => time(second.updatedAt || second.createdAt) - time(first.updatedAt || first.createdAt)
  )[0];

  return (
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
      <View style={s.between}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>
            Hello, {(profile?.name || "Recycler").split(" ")[0]} 👋
          </Text>
          <Text style={s.sub}>Let's make the world cleaner!</Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Open notifications"
          onPress={() => go("notifications")}
          style={styles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={24} color={C.text} />
          {!!unreadCount && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => go("profile")} style={{ marginLeft: 10 }}>
          <Text style={{ fontSize: 34 }}>👨🏻</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient colors={[C.green, "#0e9b58"]} style={s.hero}>
        <View>
          <Text style={styles.heroLabel}>Total Recycled</Text>
          <Text style={styles.heroValue}>{Number(profile?.recycledKg || 0).toFixed(1)} kg</Text>
          <Text style={styles.heroLabel}>₹{Number(profile?.walletBalance || 0).toFixed(0)} earned</Text>
        </View>
        <Text style={{ fontSize: 62 }}>♻️</Text>
      </LinearGradient>

      <View style={s.quickGrid}>
        <Quick icon="scan-outline" label="Scan Waste" onPress={() => go("scan")} />
        <Quick icon="location-outline" label="Collectors" onPress={() => go("collectors")} />
        <Quick icon="bag-outline" label="Track" onPress={() => go("tracking")} />
        <Quick icon="wallet-outline" label="Wallet" onPress={() => go("wallet")} />
      </View>

      {!!unreadCount && (
        <TouchableOpacity onPress={() => go("notifications")} style={styles.messageBanner}>
          <Ionicons name="mail-unread-outline" size={21} color={C.green} />
          <View style={{ flex: 1, marginLeft: 9 }}>
            <Text style={styles.messageTitle}>You have {unreadCount} new message{unreadCount === 1 ? "" : "s"}</Text>
            <Text style={styles.messageText}>View pickup and account updates</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.green} />
        </TouchableOpacity>
      )}

      <Text style={s.section}>Recent Activity</Text>
      <TouchableOpacity activeOpacity={recent ? 0.8 : 1} onPress={() => recent && go("tracking")}>
        <Card>
          <View style={s.between}>
            <View style={{ flex: 1 }}>
              <Text style={s.whiteTitle}>{recent ? materialName(recent.materialId) : "No pickups yet"}</Text>
              <Text style={[s.small, { marginTop: 4 }]}>
                {recent
                  ? `${String(recent.status).replace(/_/g, " ")} · ${Number(recent.estimatedKg || 0).toFixed(2)} kg`
                  : "Your recent pickup appears here."}
              </Text>
            </View>
            {recent && <Ionicons name="chevron-forward" size={20} color="#78918b" />}
          </View>
        </Card>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Quick({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={s.quick} onPress={onPress}>
      <View style={s.quickIcon}>
        <Ionicons name={icon} size={25} color={C.green} />
      </View>
      <Text style={s.quickText}>{label}</Text>
    </TouchableOpacity>
  );
}

function time(value) {
  return value?.toMillis?.() || (value ? new Date(value).getTime() : 0);
}

function materialName(id) {
  return String(id || "Recyclable material")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = {
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  badge: {
    position: "absolute",
    right: -2,
    top: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    backgroundColor: C.red,
  },
  badgeText: { color: "#fff", fontSize: 8, fontWeight: "900" },
  heroLabel: { color: "#e9fff0", fontSize: 11 },
  heroValue: { fontSize: 28, fontWeight: "900", color: "#fff", marginVertical: 3 },
  messageBanner: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.green,
  },
  messageTitle: { color: C.text, fontSize: 11, fontWeight: "800" },
  messageText: { color: C.muted, fontSize: 9, marginTop: 2 },
};
