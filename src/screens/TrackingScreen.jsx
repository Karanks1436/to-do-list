// import React from'react';import{ScrollView,Text,View}from'react-native';import{Card,Header,Pill}from'../components/UI';import{s}from'../styles';
// export default function TrackingScreen({go,pickups=[]}){return <ScrollView contentContainerStyle={s.page}><Header title="Track Pickups" back={()=>go('home')}/>{!pickups.length&&<Card><Text style={s.whiteTitle}>No active pickup</Text></Card>}{pickups.map(p=><Card key={p.id}><View style={s.between}><View><Text style={s.whiteTitle}>{p.materialId}</Text><Text style={s.small}>{p.estimatedKg} kg · ₹{p.estimatedValue}</Text></View><Pill text={String(p.status).replaceAll('_',' ')}/></View>{p.timeline?.map((x,i)=><Text key={i} style={s.small}>● {x.status} · {new Date(x.at).toLocaleString()}</Text>)}</Card>)}</ScrollView>}

import React, { useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Card, Header, Pill } from "../components/UI";
import { C } from "../theme";
import { s } from "../styles";

const STATUS_STEPS = [
  { id: "requested", label: "Requested", icon: "receipt-outline" },
  { id: "accepted", label: "Accepted", icon: "checkmark-circle-outline" },
  { id: "on_the_way", label: "On the way", icon: "bicycle-outline" },
  { id: "arrived", label: "Arrived", icon: "location-outline" },
  { id: "completed", label: "Completed", icon: "leaf-outline" },
];

const MATERIAL_LABELS = {
  plastic_pet: "PET Plastic",
  plastic_hdpe: "HDPE Plastic",
  plastic_ldpe: "LDPE Plastic",
  mixed_plastic: "Mixed Plastic",
  cardboard: "Cardboard",
  paper: "Mixed Paper",
  newspaper: "Newspaper",
  glass: "Glass",
  metal_aluminium: "Aluminium",
  metal_steel: "Steel",
  metal_iron: "Iron",
  metal_copper: "Copper",
  metal_brass: "Brass",
  ewaste: "Electronic Waste",
  organic: "Organic Waste",
  textile: "Textile",
};

export default function TrackingScreen({ go, pickups = [] }) {
  const [filter, setFilter] = useState("active");
  const [expanded, setExpanded] = useState({});

  const sortedPickups = useMemo(
    () =>
      [...pickups].sort(
        (first, second) =>
          timestamp(second.updatedAt || second.createdAt) -
          timestamp(first.updatedAt || first.createdAt)
      ),
    [pickups]
  );

  const filteredPickups = useMemo(
    () =>
      sortedPickups.filter((pickup) => {
        if (filter === "active") {
          return !["completed", "cancelled"].includes(pickup.status);
        }
        if (filter === "completed") return pickup.status === "completed";
        return true;
      }),
    [sortedPickups, filter]
  );

  const activeCount = pickups.filter(
    (pickup) => !["completed", "cancelled"].includes(pickup.status)
  ).length;
  const completedCount = pickups.filter(
    (pickup) => pickup.status === "completed"
  ).length;

  const toggleExpanded = (id) => {
    setExpanded((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <ScrollView
      contentContainerStyle={s.page}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Track Pickups" back={() => go("home")} />

      <View style={styles.liveBanner}>
        <View style={styles.liveDot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.liveTitle}>Live pickup tracking</Text>
          <Text style={styles.liveText}>
            Status changes appear automatically from Firestore
          </Text>
        </View>
        <Ionicons name="sync-outline" size={21} color={C.green} />
      </View>

      <View style={styles.summaryRow}>
        <Summary value={activeCount} label="Active" icon="navigate-outline" />
        <Summary value={completedCount} label="Completed" icon="checkmark-done-outline" />
        <Summary value={pickups.length} label="Total" icon="cube-outline" />
      </View>

      <View style={styles.filters}>
        {[
          ["active", `Active (${activeCount})`],
          ["completed", `Completed (${completedCount})`],
          ["all", "All"],
        ].map(([id, label]) => (
          <TouchableOpacity
            key={id}
            onPress={() => setFilter(id)}
            style={[styles.filter, filter === id && styles.filterActive]}
          >
            <Text
              style={[
                styles.filterText,
                filter === id && { color: C.bg },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.section}>
        {filter === "active"
          ? "Current pickups"
          : filter === "completed"
          ? "Completed pickups"
          : "All pickups"}
      </Text>

      {!filteredPickups.length ? (
        <EmptyState filter={filter} go={go} />
      ) : (
        filteredPickups.map((pickup) => (
          <PickupTrackingCard
            key={pickup.id}
            pickup={pickup}
            expanded={!!expanded[pickup.id]}
            toggleExpanded={() => toggleExpanded(pickup.id)}
          />
        ))
      )}
    </ScrollView>
  );
}

function PickupTrackingCard({ pickup, expanded, toggleExpanded }) {
  const normalizedStatus = pickup.status === "open" ? "requested" : pickup.status;
  const statusIndex = Math.max(
    0,
    STATUS_STEPS.findIndex((step) => step.id === normalizedStatus)
  );
  const completed = pickup.status === "completed";
  const cancelled = pickup.status === "cancelled";
  const timeline = normalizeTimeline(pickup);
  const displayedTimeline = expanded ? timeline : timeline.slice(-2);
  const estimatedKg = Number(pickup.estimatedKg || 0);
  const finalKg = Number(pickup.finalKg || 0);
  const estimatedValue = Number(pickup.estimatedValue || 0);
  const finalAmount = Number(pickup.finalAmount || 0);

  return (
    <Card style={styles.card}>
      <View style={s.between}>
        <View style={styles.materialHeading}>
          <View style={styles.materialIcon}>
            <Ionicons
              name={materialIcon(pickup.materialId)}
              size={21}
              color="#16874a"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.whiteTitle}>
              {materialName(pickup.verifiedMaterialId || pickup.materialId)}
            </Text>
            <Text style={styles.reference}>#{shortId(pickup.id)}</Text>
          </View>
        </View>
        <Pill
          solid={completed}
          text={statusLabel(pickup.status).toUpperCase()}
        />
      </View>

      {!cancelled && (
        <View style={styles.stepper}>
          {STATUS_STEPS.map((step, index) => {
            const reached = index <= statusIndex;
            const current = index === statusIndex;
            return (
              <React.Fragment key={step.id}>
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      reached && styles.stepReached,
                      current && styles.stepCurrent,
                    ]}
                  >
                    <Ionicons
                      name={reached ? "checkmark" : step.icon}
                      size={reached ? 14 : 12}
                      color={reached ? C.bg : "#78918b"}
                    />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.stepLabel,
                      reached && { color: "#16874a", fontWeight: "800" },
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
                {index < STATUS_STEPS.length - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      index < statusIndex && { backgroundColor: C.green },
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      )}

      <View style={styles.messageBox}>
        <Ionicons
          name={statusMessage(pickup.status).icon}
          size={20}
          color={completed ? "#16874a" : "#416b61"}
        />
        <View style={{ flex: 1, marginLeft: 9 }}>
          <Text style={styles.messageTitle}>
            {statusMessage(pickup.status).title}
          </Text>
          <Text style={styles.messageText}>
            {statusMessage(pickup.status).text}
          </Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <Detail
          label={completed ? "Final weight" : "Estimated weight"}
          value={`${(completed && finalKg ? finalKg : estimatedKg).toFixed(2)} kg`}
        />
        <Detail
          label="Rate"
          value={`₹${Number(pickup.ratePerKg || 0).toFixed(2)}/kg`}
        />
        <Detail
          label={completed ? "Final amount" : "Estimated value"}
          value={`₹${(completed && finalAmount ? finalAmount : estimatedValue).toFixed(2)}`}
          highlight
        />
      </View>

      {!!pickup.collectorName && (
        <View style={styles.collectorRow}>
          <View style={styles.collectorAvatar}>
            <Ionicons name="business-outline" size={18} color="#16874a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.collectorLabel}>Assigned collector</Text>
            <Text style={styles.collectorName}>{pickup.collectorName}</Text>
          </View>
          <Ionicons name="shield-checkmark-outline" size={20} color={C.green} />
        </View>
      )}

      {pickup.verifiedMaterialId &&
        pickup.verifiedMaterialId !== pickup.materialId && (
          <View style={styles.verificationBox}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#16874a" />
            <Text style={styles.verificationText}>
              Collector verified this as {materialName(pickup.verifiedMaterialId)};
              originally claimed as {materialName(pickup.materialId)}.
            </Text>
          </View>
        )}

      <View style={styles.timelineHeader}>
        <Text style={styles.timelineTitle}>Status timeline</Text>
        {timeline.length > 2 && (
          <TouchableOpacity onPress={toggleExpanded}>
            <Text style={styles.expandText}>
              {expanded ? "Show less" : `Show all (${timeline.length})`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.timelineBox}>
        {displayedTimeline.map((event, index) => {
          const isLast = index === displayedTimeline.length - 1;
          return (
            <View key={`${event.status}-${event.at}-${index}`} style={styles.timelineRow}>
              <View style={styles.timelineMarkerColumn}>
                <View
                  style={[
                    styles.timelineDot,
                    isLast && { backgroundColor: C.green },
                  ]}
                />
                {!isLast && <View style={styles.timelineLine} />}
              </View>
              <View style={[styles.timelineContent, !isLast && { paddingBottom: 13 }]}>
                <Text style={styles.timelineStatus}>{statusLabel(event.status)}</Text>
                <Text style={styles.timelineDate}>{formatDate(event.at)}</Text>
                {!!event.reason && (
                  <Text style={styles.timelineReason}>{event.reason}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.updatedText}>
          Last updated {formatRelativeDate(pickup.updatedAt || timeline.at(-1)?.at)}
        </Text>
        <View style={styles.liveTag}>
          <View style={styles.smallLiveDot} />
          <Text style={styles.liveTagText}>LIVE</Text>
        </View>
      </View>
    </Card>
  );
}

function Detail({ label, value, highlight }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && { color: "#16874a" }]}>
        {value}
      </Text>
    </View>
  );
}

function Summary({ value, label, icon }) {
  return (
    <View style={styles.summaryCard}>
      <Ionicons name={icon} size={18} color={C.green} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ filter, go }) {
  const active = filter === "active";
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name={active ? "navigate-outline" : "checkmark-done-outline"}
          size={32}
          color={C.green}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {active ? "No active pickup" : "No pickups in this section"}
      </Text>
      <Text style={styles.emptyText}>
        {active
          ? "Scan recyclable material and request a nearby collector to begin."
          : "Completed pickups will appear here after collector verification."}
      </Text>
      {active && (
        <TouchableOpacity onPress={() => go("scan")} style={styles.scanButton}>
          <Ionicons name="scan-outline" size={18} color={C.bg} />
          <Text style={styles.scanButtonText}>Start a new scan</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function normalizeTimeline(pickup) {
  const events = Array.isArray(pickup.timeline) ? [...pickup.timeline] : [];
  if (!events.length) {
    events.push({ status: pickup.status || "requested", at: pickup.createdAt });
  }
  return events.sort((first, second) => timestamp(first.at) - timestamp(second.at));
}

function statusLabel(status) {
  const labels = {
    open: "Requested",
    requested: "Requested",
    accepted: "Accepted",
    on_the_way: "On the way",
    arrived: "Collector arrived",
    completed: "Completed",
    cancelled: "Cancelled",
    declined: "Declined by collector",
  };
  return labels[status] || String(status || "Requested").replace(/_/g, " ");
}

function statusMessage(status) {
  const messages = {
    open: {
      icon: "search-outline",
      title: "Finding a collector",
      text: "Approved collectors in your area can review this request.",
    },
    requested: {
      icon: "hourglass-outline",
      title: "Waiting for collector response",
      text: "The selected collector can accept or decline your request.",
    },
    accepted: {
      icon: "checkmark-circle-outline",
      title: "Pickup accepted",
      text: "Your collector accepted the request and will begin the trip soon.",
    },
    on_the_way: {
      icon: "bicycle-outline",
      title: "Collector is on the way",
      text: "Keep the recyclable material ready for pickup and verification.",
    },
    arrived: {
      icon: "location-outline",
      title: "Collector has arrived",
      text: "The collector will verify the material category, quality and weight.",
    },
    completed: {
      icon: "checkmark-done-circle-outline",
      title: "Pickup completed",
      text: "The verified settlement has been recorded in your transaction history.",
    },
    cancelled: {
      icon: "close-circle-outline",
      title: "Pickup cancelled",
      text: "This pickup is no longer active.",
    },
  };
  return messages[status] || messages.requested;
}

function materialName(id) {
  return (
    MATERIAL_LABELS[id] ||
    String(id || "Recyclable Material")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function materialIcon(id) {
  if (String(id).startsWith("metal")) return "construct-outline";
  if (id === "paper" || id === "newspaper" || id === "cardboard") {
    return "newspaper-outline";
  }
  if (id === "glass") return "wine-outline";
  if (id === "ewaste") return "phone-portrait-outline";
  if (id === "organic") return "leaf-outline";
  if (id === "textile") return "shirt-outline";
  return "cube-outline";
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
  if (!date) return "Time unavailable";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeDate(value) {
  const date = toDate(value);
  if (!date) return "recently";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return formatDate(date);
}

function shortId(value) {
  const id = String(value || "");
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

const styles = {
  liveBanner: {
    minHeight: 65,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  liveDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: C.green,
  },
  liveTitle: { color: C.text, fontSize: 13, fontWeight: "800" },
  liveText: { color: C.muted, fontSize: 9, marginTop: 3 },
  summaryRow: { flexDirection: "row", marginHorizontal: -4, marginTop: 12 },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.panel2,
    borderWidth: 1,
    borderColor: C.line,
  },
  summaryValue: { color: C.text, fontSize: 17, fontWeight: "900", marginTop: 3 },
  summaryLabel: { color: C.muted, fontSize: 9, marginTop: 2 },
  filters: {
    flexDirection: "row",
    marginTop: 14,
    padding: 3,
    borderRadius: 11,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  filter: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  filterActive: { backgroundColor: C.green },
  filterText: { color: C.muted, fontSize: 9, fontWeight: "800" },
  card: { padding: 14 },
  materialHeading: { flex: 1, flexDirection: "row", alignItems: "center", paddingRight: 8 },
  materialIcon: {
    width: 41,
    height: 41,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#ddf8e6",
  },
  reference: { color: "#78918b", fontSize: 9, marginTop: 2 },
  stepper: { flexDirection: "row", alignItems: "flex-start", marginTop: 20 },
  stepItem: { width: 45, alignItems: "center" },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#edf2f0",
    borderWidth: 1,
    borderColor: "#d4e1dd",
  },
  stepReached: { backgroundColor: C.green, borderColor: C.green },
  stepCurrent: { borderWidth: 3, borderColor: "#9cf1b8" },
  stepLabel: { color: "#81958f", fontSize: 7, textAlign: "center", marginTop: 5 },
  stepLine: { flex: 1, height: 2, marginTop: 12, backgroundColor: "#dfe9e7" },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 17,
    padding: 11,
    borderRadius: 10,
    backgroundColor: "#eef8f2",
  },
  messageTitle: { color: "#244f43", fontSize: 11, fontWeight: "800" },
  messageText: { color: "#658078", fontSize: 9, lineHeight: 13, marginTop: 2 },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 13,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#dfe9e7",
  },
  detail: { flex: 1 },
  detailLabel: { color: "#78918b", fontSize: 8, textTransform: "uppercase" },
  detailValue: { color: "#173a31", fontSize: 11, fontWeight: "800", marginTop: 4 },
  collectorRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  collectorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ddf8e6",
    marginRight: 9,
  },
  collectorLabel: { color: "#78918b", fontSize: 8 },
  collectorName: { color: "#173a31", fontSize: 11, fontWeight: "800", marginTop: 2 },
  verificationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 11,
    padding: 9,
    borderRadius: 8,
    backgroundColor: "#eaf9ef",
  },
  verificationText: { flex: 1, color: "#477064", fontSize: 9, lineHeight: 14, marginLeft: 6 },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  timelineTitle: { color: "#173a31", fontSize: 11, fontWeight: "800" },
  expandText: { color: "#16874a", fontSize: 9, fontWeight: "800" },
  timelineBox: { marginTop: 10 },
  timelineRow: { flexDirection: "row" },
  timelineMarkerColumn: { width: 18, alignItems: "center" },
  timelineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#aac0ba" },
  timelineLine: { width: 1, flex: 1, minHeight: 28, backgroundColor: "#cddbd7" },
  timelineContent: { flex: 1, paddingLeft: 7 },
  timelineStatus: { color: "#315c50", fontSize: 10, fontWeight: "800" },
  timelineDate: { color: "#78918b", fontSize: 8, marginTop: 2 },
  timelineReason: { color: "#9b5d38", fontSize: 8, marginTop: 2 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  updatedText: { color: "#78918b", fontSize: 8 },
  liveTag: { flexDirection: "row", alignItems: "center" },
  smallLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  liveTagText: { color: "#16874a", fontSize: 7, fontWeight: "900", marginLeft: 3 },
  empty: {
    alignItems: "center",
    padding: 30,
    borderRadius: 15,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.10)",
  },
  emptyTitle: { color: C.text, fontSize: 14, fontWeight: "800", marginTop: 13 },
  emptyText: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 5,
  },
  scanButton: {
    height: 43,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: C.green,
  },
  scanButtonText: { color: C.bg, fontSize: 11, fontWeight: "900", marginLeft: 7 },
};
