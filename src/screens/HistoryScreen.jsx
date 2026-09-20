// import React from'react';import{ScrollView,Text,View}from'react-native';import{Card,Header,Pill}from'../components/UI';import{s}from'../styles';
// export default function HistoryScreen({go,transactions=[]}){return <ScrollView contentContainerStyle={s.page}><Header title="Transaction History" back={()=>go('home')}/>{!transactions.length&&<Card><Text style={s.whiteTitle}>No transactions yet</Text></Card>}{transactions.map(t=><Card key={t.id}><View style={s.between}><View><Text style={s.whiteTitle}>{t.materialId}</Text><Text style={s.small}>{t.weightKg} kg · ₹{t.ratePerKg}/kg</Text></View><Pill text={`₹${Number(t.amount||0).toFixed(0)}`}/></View></Card>)}</ScrollView>}

import React, { useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Card, Header, Pill } from "../components/UI";
import { C } from "../theme";
import { s } from "../styles";

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

export default function HistoryScreen({
  go,
  transactions = [],
  profile,
  user,
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort(
        (first, second) => timestamp(second.createdAt) - timestamp(first.createdAt)
      ),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const query = search.trim().toLowerCase();

    return sortedTransactions.filter((transaction) => {
      const date = toDate(transaction.createdAt);
      const isThisMonth =
        date &&
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth();
      const isThisYear = date && date.getFullYear() === now.getFullYear();

      if (filter === "month" && !isThisMonth) return false;
      if (filter === "year" && !isThisYear) return false;

      if (query) {
        const searchable = [
          transaction.materialId,
          transaction.claimedMaterialId,
          materialName(transaction.materialId),
          transaction.pickupId,
          transaction.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(query)) return false;
      }

      return true;
    });
  }, [sortedTransactions, filter, search]);

  const totals = useMemo(
    () =>
      filteredTransactions.reduce(
        (result, transaction) => ({
          amount: result.amount + Number(transaction.amount || 0),
          weight: result.weight + Number(transaction.weightKg || 0),
          count: result.count + 1,
        }),
        { amount: 0, weight: 0, count: 0 }
      ),
    [filteredTransactions]
  );

  const role = profile?.role || "giver";
  const amountLabel = role === "collector" ? "Processed value" : "Total credited";

  return (
    <ScrollView
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Header title="Transaction History" back={() => go("home")} />

      <View style={styles.summary}>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryLabel}>{amountLabel}</Text>
          <Text style={styles.summaryAmount}>₹{totals.amount.toFixed(0)}</Text>
          <Text style={styles.summarySub}>
            {totals.weight.toFixed(2)} kg across {totals.count} transaction
            {totals.count === 1 ? "" : "s"}
          </Text>
        </View>
        <View style={styles.summaryIcon}>
          <Ionicons name="receipt-outline" size={27} color={C.bg} />
        </View>
      </View>

      <View style={styles.filters}>
        {[
          ["all", "All"],
          ["month", "This month"],
          ["year", "This year"],
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

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={19} color={C.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search material or pickup ID"
          placeholderTextColor={C.muted}
          autoCapitalize="none"
          style={styles.searchInput}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={19} color={C.muted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={s.section}>Completed settlements</Text>
        <Text style={styles.liveText}>LIVE FIRESTORE DATA</Text>
      </View>

      {!filteredTransactions.length ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="receipt-outline" size={31} color={C.green} />
          </View>
          <Text style={styles.emptyTitle}>
            {transactions.length ? "No matching transactions" : "No transactions yet"}
          </Text>
          <Text style={styles.emptyText}>
            {transactions.length
              ? "Change the date filter or search term."
              : role === "collector"
              ? "Completed and verified pickups will appear here."
              : "Your completed pickup credits will appear here."}
          </Text>
        </View>
      ) : (
        filteredTransactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            role={role}
            currentUid={user?.uid}
          />
        ))
      )}

      <Text style={styles.footerNote}>
        Amounts are generated from collector-verified weight and the rate saved on
        each completed pickup. Transaction records cannot be edited by users.
      </Text>
    </ScrollView>
  );
}

function TransactionCard({ transaction, role, currentUid }) {
  const materialId = transaction.materialId || transaction.claimedMaterialId;
  const claimedChanged =
    transaction.claimedMaterialId &&
    transaction.materialId &&
    transaction.claimedMaterialId !== transaction.materialId;
  const amount = Number(transaction.amount || 0);
  const weight = Number(transaction.weightKg || 0);
  const rate = Number(transaction.ratePerKg || 0);
  const isGiver = role === "giver" || transaction.giverId === currentUid;

  return (
    <Card style={styles.card}>
      <View style={s.between}>
        <View style={styles.materialRow}>
          <View style={styles.materialIcon}>
            <Ionicons name={materialIcon(materialId)} size={21} color="#16874a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.whiteTitle}>{materialName(materialId)}</Text>
            <Text style={styles.dateText}>{formatDate(transaction.createdAt)}</Text>
          </View>
        </View>
        <Pill text="COMPLETED" solid />
      </View>

      <View style={styles.valueRow}>
        <View>
          <Text style={styles.valueLabel}>Verified weight</Text>
          <Text style={styles.value}>{weight.toFixed(2)} kg</Text>
        </View>
        <View style={styles.valueDivider} />
        <View>
          <Text style={styles.valueLabel}>Rate</Text>
          <Text style={styles.value}>₹{rate.toFixed(2)}/kg</Text>
        </View>
        <View style={styles.valueDivider} />
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.valueLabel}>{isGiver ? "Credit" : "Value"}</Text>
          <Text style={styles.amount}>₹{amount.toFixed(2)}</Text>
        </View>
      </View>

      {claimedChanged && (
        <View style={styles.verificationBox}>
          <Ionicons name="checkmark-circle-outline" size={17} color="#16874a" />
          <Text style={styles.verificationText}>
            Collector changed the claimed material from {materialName(transaction.claimedMaterialId)}
            {" "}to {materialName(transaction.materialId)}.
          </Text>
        </View>
      )}

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {transaction.rateSource === "admin" ? "Admin rate" : "Average fallback rate"}
        </Text>
        {!!transaction.pickupId && (
          <Text style={styles.metaText}>Pickup: {shortId(transaction.pickupId)}</Text>
        )}
      </View>
    </Card>
  );
}

function materialName(id) {
  return (
    MATERIAL_LABELS[id] ||
    String(id || "Recyclable material")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function materialIcon(id) {
  if (String(id).includes("metal")) return "construct-outline";
  if (String(id).includes("paper") || id === "cardboard") return "newspaper-outline";
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
  if (!date) return "Date unavailable";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(value) {
  const id = String(value || "");
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

const styles = {
  summary: {
    minHeight: 128,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    padding: 20,
    borderRadius: 17,
    backgroundColor: C.panel2,
    borderWidth: 1,
    borderColor: C.line,
  },
  summaryLabel: { color: C.muted, fontSize: 11, fontWeight: "700" },
  summaryAmount: { color: C.green, fontSize: 32, fontWeight: "900", marginTop: 4 },
  summarySub: { color: C.muted, fontSize: 10, marginTop: 5 },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
  filters: {
    flexDirection: "row",
    marginTop: 16,
    padding: 3,
    borderRadius: 11,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  filter: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  filterActive: { backgroundColor: C.green },
  filterText: { color: C.muted, fontSize: 10, fontWeight: "800" },
  searchBox: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 13,
    borderRadius: 11,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 12, marginHorizontal: 9 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  liveText: { color: C.green, fontSize: 8, fontWeight: "900" },
  card: { padding: 14 },
  materialRow: { flex: 1, flexDirection: "row", alignItems: "center", paddingRight: 8 },
  materialIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "#ddf8e6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  dateText: { color: "#718b84", fontSize: 9, marginTop: 3 },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#dfe9e7",
  },
  valueDivider: { width: 1, height: 27, backgroundColor: "#dfe9e7" },
  valueLabel: { color: "#78918b", fontSize: 8, textTransform: "uppercase" },
  value: { color: "#173a31", fontSize: 12, fontWeight: "800", marginTop: 3 },
  amount: { color: "#16874a", fontSize: 14, fontWeight: "900", marginTop: 3 },
  verificationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 11,
    padding: 9,
    borderRadius: 8,
    backgroundColor: "#eaf9ef",
  },
  verificationText: { flex: 1, color: "#477064", fontSize: 9, lineHeight: 14, marginLeft: 6 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  metaText: { color: "#78918b", fontSize: 8 },
  empty: {
    alignItems: "center",
    padding: 30,
    borderRadius: 15,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.10)",
  },
  emptyTitle: { color: C.text, fontSize: 14, fontWeight: "800", marginTop: 12 },
  emptyText: { color: C.muted, fontSize: 10, textAlign: "center", marginTop: 5 },
  footerNote: {
    color: C.muted,
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
    paddingHorizontal: 14,
    marginTop: 12,
  },
};
