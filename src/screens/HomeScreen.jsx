import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { Card, Pill } from "../components/UI";
import { C } from "../theme";
import { s } from "../styles";

const ACTIVE_STATUSES = ["open", "requested", "accepted", "on_the_way", "arrived"];

export default function HomeScreen({
  go,
  profile,
  pickups = [],
  unreadCount = 0,
  syncError = null,
}) {
  const safePickups = Array.isArray(pickups) ? pickups : [];
  const firstName = String(profile?.name || "Recycler").trim().split(/\s+/)[0];
  const recycledKg = Number(profile?.recycledKg || 0);
  const walletBalance = Number(profile?.walletBalance || 0);
  const greenPoints = Number(profile?.greenPoints || Math.round(recycledKg * 10));

  const recentPickups = useMemo(
    () =>
      [...safePickups]
        .sort(
          (first, second) =>
            time(second.updatedAt || second.createdAt) -
            time(first.updatedAt || first.createdAt)
        )
        .slice(0, 3),
    [safePickups]
  );

  const activePickup = recentPickups.find((pickup) =>
    ACTIVE_STATUSES.includes(pickup.status)
  );

  return (
    <ScrollView
      contentContainerStyle={s.page}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => go("profile")}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initials(profile?.name)}</Text>
          <View style={styles.onlineDot} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 11 }}>
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.name}>Hello, {firstName} 👋</Text>
        </View>

        <TouchableOpacity
          accessibilityLabel="Open notifications"
          activeOpacity={0.75}
          onPress={() => go("notifications")}
          style={styles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={22} color={C.text} />
          {!!unreadCount && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {!!syncError && (
        <View style={styles.errorBanner}>
          <Ionicons name="cloud-offline-outline" size={19} color={C.red} />
          <Text style={styles.errorText}>Some live information may be delayed: {syncError}</Text>
        </View>
      )}

      <LinearGradient
        colors={["#20d35a", "#0a9b55", "#087a4b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroCircleOne} />
        <View style={styles.heroCircleTwo} />
        <View style={{ flex: 1, zIndex: 2 }}>
          <Text style={styles.heroEyebrow}>YOUR GREEN IMPACT</Text>
          <Text style={styles.heroValue}>{recycledKg.toFixed(1)} kg</Text>
          <Text style={styles.heroLabel}>Total recyclable material recovered</Text>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => go("impact")}
            style={styles.impactButton}
          >
            <Text style={styles.impactButtonText}>View Impact</Text>
            <Ionicons name="arrow-forward" size={14} color="#087346" />
          </TouchableOpacity>
        </View>
        <View style={styles.recycleIcon}>
          <Ionicons name="leaf" size={37} color="#fff" />
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <Stat
          icon="wallet-outline"
          label="Wallet"
          value={`₹${walletBalance.toFixed(0)}`}
          onPress={() => go("wallet")}
        />
        <Stat
          icon="sparkles-outline"
          label="Green Points"
          value={greenPoints.toLocaleString()}
          onPress={() => go("impact")}
        />
        <Stat
          icon="checkmark-done-outline"
          label="Pickups"
          value={profile?.completedPickups || safePickups.filter((item) => item.status === "completed").length}
          onPress={() => go("history")}
        />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <Text style={styles.sectionSubtitle}>What would you like to do?</Text>
        </View>
      </View>

      <View style={styles.actionGrid}>
        <Quick
          icon="scan-outline"
          label="Scan Waste"
          description="Identify material"
          onPress={() => go("scan")}
          featured
        />
        <Quick
          icon="location-outline"
          label="Collectors"
          description="Find nearby"
          onPress={() => go("collectors")}
        />
        <Quick
          icon="navigate-outline"
          label="Track Pickup"
          description="Live status"
          onPress={() => go("tracking")}
        />
        <Quick
          icon="time-outline"
          label="History"
          description="Past recycling"
          onPress={() => go("history")}
        />
      </View>

      {!!activePickup && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => go("tracking")}
          style={styles.activeCard}
        >
          <View style={styles.activeIcon}>
            <Ionicons name={statusInfo(activePickup.status).icon} size={23} color={C.bg} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.activeTitleRow}>
              <Text style={styles.activeTitle}>Active pickup</Text>
              <Pill solid text={statusInfo(activePickup.status).label} />
            </View>
            <Text style={styles.activeMaterial}>{materialName(activePickup.materialId)}</Text>
            <Text style={styles.activeText}>{statusInfo(activePickup.status).description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.green} />
        </TouchableOpacity>
      )}

      {!!unreadCount && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => go("notifications")}
          style={styles.messageBanner}
        >
          <View style={styles.messageIcon}>
            <Ionicons name="mail-unread-outline" size={20} color={C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.messageTitle}>
              {unreadCount} unread update{unreadCount === 1 ? "" : "s"}
            </Text>
            <Text style={styles.messageText}>Pickup and account messages are waiting</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.green} />
        </TouchableOpacity>
      )}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <Text style={styles.sectionSubtitle}>Your latest recycling requests</Text>
        </View>
        {!!recentPickups.length && (
          <TouchableOpacity onPress={() => go("history")}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        )}
      </View>

      {!recentPickups.length ? (
        <Card>
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="leaf-outline" size={31} color="#16874a" />
            </View>
            <Text style={styles.emptyTitle}>Start your recycling journey</Text>
            <Text style={styles.emptyText}>
              Scan recyclable waste and request a verified collector pickup.
            </Text>
            <TouchableOpacity onPress={() => go("scan")} style={styles.emptyButton}>
              <Ionicons name="scan-outline" size={17} color={C.bg} />
              <Text style={styles.emptyButtonText}>Scan Waste</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ) : (
        <Card>
          {recentPickups.map((pickup, index) => (
            <ActivityRow
              key={pickup.id || `${pickup.materialId}-${index}`}
              pickup={pickup}
              last={index === recentPickups.length - 1}
              onPress={() => go("tracking")}
            />
          ))}
        </Card>
      )}

      <View style={styles.tipCard}>
        <View style={styles.tipIcon}>
          <Ionicons name="bulb-outline" size={22} color="#d59c20" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitle}>Recycling tip</Text>
          <Text style={styles.tipText}>
            Keep materials clean and separated so the collector can verify them quickly and accurately.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function Stat({ icon, label, value, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={C.green} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function Quick({ icon, label, description, onPress, featured }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.quickCard, featured && styles.quickCardFeatured]}
    >
      <View style={[styles.quickIcon, featured && styles.quickIconFeatured]}>
        <Ionicons name={icon} size={24} color={featured ? C.bg : C.green} />
      </View>
      <Text style={styles.quickTitle}>{label}</Text>
      <Text style={styles.quickText}>{description}</Text>
      <Ionicons name="arrow-forward" size={15} color={C.green} style={styles.quickArrow} />
    </TouchableOpacity>
  );
}

function ActivityRow({ pickup, last, onPress }) {
  const state = statusInfo(pickup.status);
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.activityRow, last && { borderBottomWidth: 0 }]}
    >
      <View style={[styles.activityIcon, { backgroundColor: state.background }]}>
        <Ionicons name={state.icon} size={19} color={state.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.activityTitle}>{materialName(pickup.materialId)}</Text>
        <Text style={styles.activityText}>
          {state.label} · {quantityText(pickup)}
        </Text>
      </View>
      <Text style={styles.activityDate}>{dateLabel(pickup.updatedAt || pickup.createdAt)}</Text>
      <Ionicons name="chevron-forward" size={17} color="#91a39e" />
    </TouchableOpacity>
  );
}

function statusInfo(status) {
  const states = {
    open: {
      label: "OPEN",
      description: "Waiting for an available collector",
      icon: "radio-outline",
      color: "#a9770c",
      background: "#fff1c8",
    },
    requested: {
      label: "REQUESTED",
      description: "Waiting for the selected collector",
      icon: "time-outline",
      color: "#a9770c",
      background: "#fff1c8",
    },
    accepted: {
      label: "ACCEPTED",
      description: "Your collector accepted the request",
      icon: "checkmark-circle-outline",
      color: "#16874a",
      background: "#ddf8e6",
    },
    on_the_way: {
      label: "ON THE WAY",
      description: "The collector is travelling to you",
      icon: "bicycle-outline",
      color: "#16874a",
      background: "#ddf8e6",
    },
    arrived: {
      label: "ARRIVED",
      description: "Material verification can now begin",
      icon: "location-outline",
      color: "#16874a",
      background: "#ddf8e6",
    },
    completed: {
      label: "COMPLETED",
      description: "Pickup and settlement completed",
      icon: "checkmark-done-outline",
      color: "#16874a",
      background: "#ddf8e6",
    },
    declined: {
      label: "DECLINED",
      description: "Choose another available collector",
      icon: "close-circle-outline",
      color: C.red,
      background: "#ffe3e4",
    },
  };
  return states[status] || {
    label: String(status || "PENDING").replace(/_/g, " ").toUpperCase(),
    description: "Pickup information updated",
    icon: "ellipse-outline",
    color: "#647d76",
    background: "#e8efed",
  };
}

function initials(name) {
  const parts = String(name || "Recycler").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "R";
}

function quantityText(pickup) {
  if (pickup.originalQuantity != null) {
    return `${Number(pickup.originalQuantity).toFixed(2)} ${pickup.originalUnit || "kg"}`;
  }
  return `${Number(pickup.estimatedKg || pickup.weightKg || 0).toFixed(2)} kg`;
}

function time(value) {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

function dateLabel(value) {
  const timestamp = time(value);
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function materialName(id) {
  return String(id || "Recyclable material")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = {
  topBar: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.13)",
    borderWidth: 1,
    borderColor: C.green,
  },
  avatarText: { color: C.green, fontSize: 15, fontWeight: "900" },
  onlineDot: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: C.green,
    borderWidth: 3,
    borderColor: C.bg,
  },
  welcome: { color: C.muted, fontSize: 9 },
  name: { color: C.text, fontSize: 18, fontWeight: "900", marginTop: 2 },
  notificationButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  badge: {
    position: "absolute",
    right: -3,
    top: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    backgroundColor: C.red,
    borderWidth: 2,
    borderColor: C.bg,
  },
  badgeText: { color: "#fff", fontSize: 7, fontWeight: "900" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,95,104,.10)",
    borderWidth: 1,
    borderColor: C.red,
  },
  errorText: { flex: 1, color: C.red, fontSize: 9, marginLeft: 7 },
  hero: {
    minHeight: 174,
    flexDirection: "row",
    alignItems: "center",
    padding: 19,
    borderRadius: 19,
    overflow: "hidden",
  },
  heroCircleOne: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -50,
    top: -60,
    backgroundColor: "rgba(255,255,255,.09)",
  },
  heroCircleTwo: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    right: 15,
    bottom: -55,
    backgroundColor: "rgba(255,255,255,.07)",
  },
  heroEyebrow: { color: "rgba(255,255,255,.82)", fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  heroValue: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 7 },
  heroLabel: { color: "rgba(255,255,255,.84)", fontSize: 9, marginTop: 2 },
  impactButton: {
    height: 33,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    marginTop: 13,
    borderRadius: 9,
    backgroundColor: "#fff",
  },
  impactButtonText: { color: "#087346", fontSize: 9, fontWeight: "900", marginRight: 5 },
  recycleIcon: {
    width: 68,
    height: 68,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.24)",
    zIndex: 2,
  },
  statsRow: { flexDirection: "row", marginHorizontal: -3, marginTop: 9 },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    marginHorizontal: 3,
    borderRadius: 12,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  statIcon: {
    width: 31,
    height: 31,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.11)",
  },
  statValue: { color: C.text, fontSize: 13, fontWeight: "900", marginTop: 5 },
  statLabel: { color: C.muted, fontSize: 8, marginTop: 2 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 21,
    marginBottom: 11,
  },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: "900" },
  sectionSubtitle: { color: C.muted, fontSize: 8, marginTop: 3 },
  viewAll: { color: C.green, fontSize: 9, fontWeight: "900" },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginTop: -4 },
  quickCard: {
    width: "47.8%",
    minHeight: 112,
    padding: 12,
    margin: 4,
    borderRadius: 14,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  quickCardFeatured: { borderColor: C.green },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.11)",
  },
  quickIconFeatured: { backgroundColor: C.green },
  quickTitle: { color: C.text, fontSize: 11, fontWeight: "900", marginTop: 8 },
  quickText: { color: C.muted, fontSize: 8, marginTop: 2 },
  quickArrow: { position: "absolute", right: 11, top: 13 },
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.green,
  },
  activeIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: C.green,
  },
  activeTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  activeTitle: { color: C.green, fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  activeMaterial: { color: C.text, fontSize: 12, fontWeight: "900", marginTop: 4 },
  activeText: { color: C.muted, fontSize: 8, marginTop: 3 },
  messageBanner: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginTop: 10,
    borderRadius: 13,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  messageIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "rgba(32,211,90,.11)",
  },
  messageTitle: { color: C.text, fontSize: 10, fontWeight: "900" },
  messageText: { color: C.muted, fontSize: 8, marginTop: 3 },
  emptyState: { alignItems: "center", paddingVertical: 17 },
  emptyIcon: {
    width: 59,
    height: 59,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ddf8e6",
  },
  emptyTitle: { color: "#173a31", fontSize: 13, fontWeight: "900", marginTop: 10 },
  emptyText: { color: "#6b847d", fontSize: 9, lineHeight: 14, textAlign: "center", marginTop: 4 },
  emptyButton: {
    height: 39,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginTop: 12,
    borderRadius: 9,
    backgroundColor: C.green,
  },
  emptyButtonText: { color: C.bg, fontSize: 9, fontWeight: "900", marginLeft: 6 },
  activityRow: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#dfe9e7",
  },
  activityIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  activityTitle: { color: "#173a31", fontSize: 10, fontWeight: "900" },
  activityText: { color: "#78918b", fontSize: 8, marginTop: 3, textTransform: "capitalize" },
  activityDate: { color: "#78918b", fontSize: 8, marginRight: 4 },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    marginTop: 11,
    borderRadius: 12,
    backgroundColor: "rgba(244,183,64,.09)",
    borderWidth: 1,
    borderColor: "rgba(244,183,64,.22)",
  },
  tipIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "rgba(244,183,64,.12)",
  },
  tipTitle: { color: "#e1bd64", fontSize: 10, fontWeight: "900" },
  tipText: { color: C.muted, fontSize: 8, lineHeight: 13, marginTop: 3 },
};
