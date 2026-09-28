import React, { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Header } from "../components/UI";
import { C } from "../theme";
import { s } from "../styles";

export default function NotificationsScreen({
  go,
  items = [],
  markRead,
  backRoute = "profile",
}) {
  const [filter, setFilter] = useState("all");
  const sorted = useMemo(
    () =>
      [...items].sort(
        (first, second) => timestamp(second.createdAt) - timestamp(first.createdAt)
      ),
    [items]
  );
  const unread = sorted.filter((item) => !item.read);
  const visible = filter === "unread" ? unread : sorted;

  const openNotification = async (item) => {
    if (!item.read) await markRead?.(item.id);
    if (item.pickupId) go("tracking");
  };

  const markAll = async () => {
    await Promise.all(unread.map((item) => markRead?.(item.id)));
  };

  return (
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
      <Header title="Notifications" back={() => go(backRoute)} />

      <View style={styles.summary}>
        <View style={styles.summaryIcon}>
          <Ionicons name="notifications" size={25} color={C.bg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryTitle}>{unread.length} unread messages</Text>
          <Text style={styles.summaryText}>
            Pickup, approval and account updates from Firestore
          </Text>
        </View>
        {!!unread.length && (
          <TouchableOpacity onPress={markAll}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filters}>
        {[
          ["all", `All (${sorted.length})`],
          ["unread", `Unread (${unread.length})`],
        ].map(([id, label]) => (
          <TouchableOpacity
            key={id}
            onPress={() => setFilter(id)}
            style={[styles.filter, filter === id && styles.filterOn]}
          >
            <Text style={[styles.filterText, filter === id && { color: C.bg }]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!visible.length ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={38} color={C.green} />
          <Text style={styles.emptyTitle}>
            {filter === "unread" ? "No unread messages" : "No notifications yet"}
          </Text>
          <Text style={styles.emptyText}>
            New pickup requests, collector responses and approval messages will appear here.
          </Text>
        </View>
      ) : (
        visible.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            onPress={() => openNotification(item)}
            style={[styles.notice, !item.read && styles.noticeUnread]}
          >
            <View style={[styles.icon, { backgroundColor: notificationColor(item.type).background }]}>
              <Ionicons
                name={notificationIcon(item.type)}
                size={21}
                color={notificationColor(item.type).foreground}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.noticeHeader}>
                <Text style={styles.noticeTitle}>{item.title || "Update"}</Text>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.noticeBody}>{item.body || "You have a new update."}</Text>
              <Text style={styles.noticeTime}>{formatDate(item.createdAt)}</Text>
            </View>
            {!!item.pickupId && (
              <Ionicons name="chevron-forward" size={18} color="#78918b" />
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

function notificationIcon(type) {
  const icons = {
    pickup_request: "cube-outline",
    pickup_accepted: "checkmark-circle-outline",
    pickup_declined: "close-circle-outline",
    pickup_on_the_way: "bicycle-outline",
    pickup_arrived: "location-outline",
    pickup_completed: "leaf-outline",
    collector_pending: "person-add-outline",
    collector_approved: "shield-checkmark-outline",
  };
  return icons[type] || "notifications-outline";
}

function notificationColor(type) {
  if (type === "pickup_declined") {
    return { background: "#fff0e5", foreground: "#a85f36" };
  }
  if (type === "collector_pending") {
    return { background: "#fff6d9", foreground: "#876c16" };
  }
  return { background: "#ddf8e6", foreground: "#16874a" };
}

function toDate(value) {
  if (!value) return null;
  const date = value?.toDate?.() || new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function timestamp(value) {
  return toDate(value)?.getTime() || 0;
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return "Just now";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = {
  summary: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 76,
    marginTop: 8,
    padding: 13,
    borderRadius: 14,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: C.green,
  },
  summaryTitle: { color: C.text, fontSize: 13, fontWeight: "800" },
  summaryText: { color: C.muted, fontSize: 9, marginTop: 3 },
  markAll: { color: C.green, fontSize: 9, fontWeight: "800" },
  filters: {
    flexDirection: "row",
    marginVertical: 14,
    padding: 3,
    borderRadius: 11,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  filter: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  filterOn: { backgroundColor: C.green },
  filterText: { color: C.muted, fontSize: 10, fontWeight: "800" },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    marginBottom: 9,
    borderRadius: 13,
    backgroundColor: "#f7fbfa",
    borderWidth: 1,
    borderColor: "#e2ece9",
  },
  noticeUnread: { borderColor: C.green, backgroundColor: "#f1fff6" },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  noticeHeader: { flexDirection: "row", alignItems: "center" },
  noticeTitle: { flex: 1, color: "#173a31", fontSize: 12, fontWeight: "800" },
  noticeBody: { color: "#5e7c74", fontSize: 10, lineHeight: 15, marginTop: 3 },
  noticeTime: { color: "#8aa09a", fontSize: 8, marginTop: 5 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green },
  empty: {
    alignItems: "center",
    padding: 34,
    borderRadius: 15,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  emptyTitle: { color: C.text, fontSize: 14, fontWeight: "800", marginTop: 12 },
  emptyText: { color: C.muted, fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 5 },
};
