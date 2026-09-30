import { Ionicons } from "@expo/vector-icons";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Btn, Card, Header, Pill } from "../components/UI";
import { auth, db } from "../firebase/firebase";
import { s } from "../styles";
import { C } from "../theme";
import { publishAndroidUpdate } from "../update/updateService";

const DEFAULT_MATERIALS = [
  { id: "plastic_pet", name: "PET Plastic", rate: "12" },
  { id: "plastic_hdpe", name: "HDPE Plastic", rate: "10" },
  { id: "mixed_plastic", name: "Mixed Plastic", rate: "8" },
  { id: "paper", name: "Paper", rate: "8" },
  { id: "cardboard", name: "Cardboard", rate: "7" },
  { id: "newspaper", name: "Newspaper", rate: "9" },
  { id: "glass", name: "Glass", rate: "6" },
  { id: "metal_iron", name: "Iron", rate: "30" },
  { id: "metal_steel", name: "Steel", rate: "28" },
  { id: "metal_aluminium", name: "Aluminium", rate: "120" },
  { id: "metal_copper", name: "Copper", rate: "600" },
  { id: "ewaste", name: "E-Waste", rate: "80" },
];

export default function AdminScreen({
  pending = [],
  users = [],
  usersLoading = false,
  usersError = null,
  approve,
  setRate,
  logout,
}) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [materials, setMaterials] = useState(DEFAULT_MATERIALS);
  const [selectedMaterialId, setSelectedMaterialId] = useState(DEFAULT_MATERIALS[0].id);
  const [materialMenuOpen, setMaterialMenuOpen] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [latestVersion, setLatestVersion] = useState("1.0.1");
  const [minimumVersion, setMinimumVersion] = useState("1.0.0");
  const [updateTitle, setUpdateTitle] = useState("New Trash2Treasure update");
  const [updateMessage, setUpdateMessage] = useState("Download the latest version for improvements and fixes.");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [forceUpdate, setForceUpdate] = useState(false);
  const [publishingUpdate, setPublishingUpdate] = useState(false);

  const safePending = Array.isArray(pending) ? pending.filter(Boolean) : [];
  const safeUsers = Array.isArray(users) ? users.filter(Boolean) : [];
  const selectedMaterial =
    materials.find((item) => item.id === selectedMaterialId) || materials[0];

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return safeUsers
      .filter((user) => {
        if (!term) return true;
        return [user.name, user.email, user.phone, user.role, user.city]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      })
      .sort((first, second) =>
        String(first.name || first.email || "").localeCompare(
          String(second.name || second.email || "")
        )
      );
  }, [safeUsers, search]);

  const updateSelectedRate = (value) => {
    const clean = value.replace(/[^0-9.]/g, "");
    if ((clean.match(/\./g) || []).length > 1) return;
    setMaterials((current) =>
      current.map((item) =>
        item.id === selectedMaterialId ? { ...item, rate: clean } : item
      )
    );
  };

  const publishSelectedRate = async () => {
    const rate = Number(selectedMaterial.rate);
    if (!validMonth(month)) {
      return Alert.alert("Invalid month", "Enter the month as YYYY-MM, for example 2026-09.");
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      return Alert.alert("Invalid price", "Enter a price greater than ₹0 per kg.");
    }
    if (typeof setRate !== "function") {
      return Alert.alert("Update unavailable", "The Firebase price update action is not connected.");
    }

    try {
      setSavingRate(true);
      await setRate({
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        month,
        ratePerKg: rate,
      });
      Alert.alert(
        "Price updated",
        `${selectedMaterial.name} is now ₹${rate.toLocaleString()}/kg for ${month}.`
      );
    } catch (error) {
      Alert.alert("Price update failed", error?.message || "Please try again.");
    } finally {
      setSavingRate(false);
    }
  };

  const approveCollector = (collector) => {
    const id = collector.id || collector.uid;
    if (!id || typeof approve !== "function") {
      return Alert.alert("Approval unavailable", "This collector cannot be approved right now.");
    }
    Alert.alert(
      "Approve collector?",
      `${collector.name || collector.businessName || "This collector"} will be able to receive pickups.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              setApprovingId(id);
              await approve(id);
              Alert.alert("Approved", "The collector account is now active.");
            } catch (error) {
              Alert.alert("Approval failed", error?.message || "Please try again.");
            } finally {
              setApprovingId(null);
            }
          },
        },
      ]
    );
  };

  const changeAccountState = (user, nextState) => {
    const uid = user.id || user.uid;
    if (!uid) return Alert.alert("Invalid user", "This user has no account ID.");
    if (uid === auth.currentUser?.uid) {
      return Alert.alert("Action blocked", "You cannot change your own admin account here.");
    }

    const labels = {
      blocked: ["Block user?", "The user will be prevented from using authenticated app features."],
      removed: ["Remove user?", "The profile will be disabled and hidden from active marketplace features."],
      active: ["Resume user?", "The user will regain access to authenticated app features."],
    };
    const [title, message] = labels[nextState];

    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: nextState === "active" ? "Resume" : nextState === "blocked" ? "Block" : "Remove",
        style: nextState === "active" ? "default" : "destructive",
        onPress: async () => {
          try {
            setUpdatingUserId(uid);
            const batch = writeBatch(db);
            batch.update(doc(db, "users", uid), {
              accountStatus: nextState,
              accountStatusUpdatedAt: serverTimestamp(),
              accountStatusUpdatedBy: auth.currentUser?.uid || null,
            });

            if (user.role === "collector") {
              batch.set(
                doc(db, "collectorLocations", uid),
                {
                  active:
                    nextState === "active" &&
                    user.status === "active" &&
                    user.availableForPickups !== false,
                  accountStatus: nextState,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );
            }
            await batch.commit();
            setExpandedUserId(null);
            Alert.alert(
              nextState === "active" ? "User resumed" : nextState === "blocked" ? "User blocked" : "User removed",
              "The account status was updated successfully."
            );
          } catch (error) {
            Alert.alert("Action failed", error?.message || "Unable to update this user.");
          } finally {
            setUpdatingUserId(null);
          }
        },
      },
    ]);
  };

  const publishUpdate = async () => {
    try {
      setPublishingUpdate(true);
      const result = await publishAndroidUpdate({
        latestVersion,
        minSupportedVersion: minimumVersion,
        title: updateTitle,
        message: updateMessage,
        downloadUrl,
        force: forceUpdate,
      });
      Alert.alert(
        "Update published",
        `Version ${result.version} is live. ${result.recipientCount} user notification${result.recipientCount === 1 ? " was" : "s were"} created.`
      );
    } catch (error) {
      Alert.alert("Publish failed", error?.message || "Unable to publish the update.");
    } finally {
      setPublishingUpdate(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Header
        title="Admin Console"
        right={<Ionicons name="shield-checkmark" size={22} color={C.green} />}
      />

      <View style={styles.summary}>
        <Summary icon="people-outline" value={safeUsers.length} label="Users" />
        <Summary icon="time-outline" value={safePending.length} label="Pending" />
        <Summary icon="pricetag-outline" value={materials.length} label="Materials" />
      </View>

      <Text style={s.section}>Pending Collectors</Text>
      {!safePending.length ? (
        <Card>
          <View style={styles.emptyRow}>
            <Ionicons name="checkmark-circle-outline" size={23} color="#16874a" />
            <View style={{ flex: 1, marginLeft: 9 }}>
              <Text style={styles.cardTitle}>No pending approvals</Text>
              <Text style={styles.meta}>All collector requests have been reviewed.</Text>
            </View>
          </View>
        </Card>
      ) : (
        safePending.map((collector) => {
          const id = collector.id || collector.uid;
          return (
            <Card key={id || collector.email}>
              <View style={styles.userTop}>
                <Avatar role="collector" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{collector.name || collector.businessName || "Collector"}</Text>
                  <Text style={styles.meta}>{collector.email || "No email"}</Text>
                </View>
                <Pill text="PENDING" />
              </View>
              <Btn
                icon="checkmark-circle-outline"
                disabled={!!approvingId}
                title={approvingId === id ? "Approving…" : "Approve Collector"}
                onPress={() => approveCollector(collector)}
              />
            </Card>
          );
        })
      )}

      <Text style={s.section}>Edit Material Price</Text>
      <Card>
        <Text style={styles.label}>Publication month</Text>
        <TextInput
          style={[styles.input, !validMonth(month) && styles.inputError]}
          value={month}
          onChangeText={(value) => setMonth(value.replace(/[^0-9-]/g, "").slice(0, 7))}
          placeholder="YYYY-MM"
          placeholderTextColor="#82968f"
          maxLength={7}
        />

        <Text style={styles.label}>Select material</Text>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setMaterialMenuOpen(true)}
          style={styles.dropdown}
        >
          <View style={styles.materialIcon}>
            <Ionicons name="leaf-outline" size={19} color="#16874a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dropdownTitle}>{selectedMaterial.name}</Text>
            <Text style={styles.meta}>{selectedMaterial.id}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#78918b" />
        </TouchableOpacity>

        <Text style={styles.label}>Price per kilogram</Text>
        <View style={styles.priceInput}>
          <Text style={styles.currency}>₹</Text>
          <TextInput
            style={styles.rateField}
            value={String(selectedMaterial.rate)}
            onChangeText={updateSelectedRate}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#82968f"
          />
          <Text style={styles.perKg}>/ kg</Text>
        </View>

        <Btn
          icon="cloud-upload-outline"
          disabled={savingRate}
          title={savingRate ? "Updating Price…" : "Update Selected Price"}
          onPress={publishSelectedRate}
        />
      </Card>

      <Text style={s.section}>Publish Android Update</Text>
      <Card>
        <View style={styles.updateHeader}>
          <View style={styles.updateIcon}>
            <Ionicons name="cloud-upload-outline" size={23} color="#16874a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Realtime app update</Text>
            <Text style={styles.meta}>Save the latest APK/website link in Firebase and notify all users.</Text>
          </View>
        </View>

        <View style={styles.versionRow}>
          <View style={{ flex: 1, marginRight: 4 }}>
            <Text style={styles.label}>Latest version</Text>
            <TextInput
              style={styles.input}
              value={latestVersion}
              onChangeText={setLatestVersion}
              placeholder="1.2.0"
              placeholderTextColor="#82968f"
              autoCapitalize="none"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 4 }}>
            <Text style={styles.label}>Minimum version</Text>
            <TextInput
              style={styles.input}
              value={minimumVersion}
              onChangeText={setMinimumVersion}
              placeholder="1.0.0"
              placeholderTextColor="#82968f"
              autoCapitalize="none"
            />
          </View>
        </View>

        <Text style={styles.label}>Popup title</Text>
        <TextInput
          style={styles.input}
          value={updateTitle}
          onChangeText={setUpdateTitle}
          placeholder="New version available"
          placeholderTextColor="#82968f"
        />

        <Text style={styles.label}>Update message</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          value={updateMessage}
          onChangeText={setUpdateMessage}
          placeholder="Describe the changes"
          placeholderTextColor="#82968f"
          multiline
        />

        <Text style={styles.label}>HTTPS download link</Text>
        <TextInput
          style={styles.input}
          value={downloadUrl}
          onChangeText={setDownloadUrl}
          placeholder="https://example.com/Trash2Treasure.apk"
          placeholderTextColor="#82968f"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <TouchableOpacity
          onPress={() => setForceUpdate((value) => !value)}
          style={[styles.forceRow, forceUpdate && styles.forceRowOn]}
        >
          <Ionicons
            name={forceUpdate ? "checkbox" : "square-outline"}
            size={21}
            color={forceUpdate ? "#16874a" : "#78918b"}
          />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.forceTitle}>Required update</Text>
            <Text style={styles.meta}>Users cannot dismiss the update popup.</Text>
          </View>
        </TouchableOpacity>

        <Btn
          icon="notifications-outline"
          disabled={publishingUpdate}
          title={publishingUpdate ? "Publishing & Notifying…" : "Publish Update to All Users"}
          onPress={publishUpdate}
        />
      </Card>

      <Text style={s.section}>All Users</Text>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={C.muted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, email, role or city"
          placeholderTextColor={C.muted}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={19} color={C.muted} />
          </TouchableOpacity>
        )}
      </View>

      {!!usersError && (
        <View style={styles.errorBox}>
          <Ionicons name="cloud-offline-outline" size={18} color={C.red} />
          <Text style={styles.errorText}>{usersError}</Text>
        </View>
      )}

      {usersLoading ? (
        <Card><Text style={styles.meta}>Loading users…</Text></Card>
      ) : !filteredUsers.length ? (
        <Card><Text style={styles.meta}>No users found.</Text></Card>
      ) : (
        filteredUsers.map((user) => {
          const uid = user.id || user.uid;
          const expanded = expandedUserId === uid;
          const accountState = user.accountStatus || "active";
          const updating = updatingUserId === uid;

          return (
            <Card key={uid || user.email}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setExpandedUserId(expanded ? null : uid)}
                style={styles.userTop}
              >
                <Avatar role={user.role} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{user.name || "Unnamed user"}</Text>
                  <Text style={styles.meta}>{user.email || "No email"}</Text>
                  <Text style={styles.meta}>{user.role || "giver"} · {user.city || "City not set"}</Text>
                </View>
                <Status state={accountState} />
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color="#78918b" />
              </TouchableOpacity>

              {expanded && (
                <View style={styles.actionsArea}>
                  {!!user.phone && <Text style={styles.detail}>Mobile: {user.phone}</Text>}
                  <Text style={styles.detail}>UID: {uid}</Text>
                  {updating ? (
                    <Text style={styles.updating}>Updating account…</Text>
                  ) : accountState === "active" ? (
                    <View style={styles.actionRow}>
                      <Action
                        icon="ban-outline"
                        label="Block"
                        color="#d58b15"
                        onPress={() => changeAccountState(user, "blocked")}
                      />
                      <Action
                        icon="trash-outline"
                        label="Remove"
                        color={C.red}
                        onPress={() => changeAccountState(user, "removed")}
                      />
                    </View>
                  ) : (
                    <View style={styles.actionRow}>
                      <Action
                        icon="play-circle-outline"
                        label="Resume"
                        color="#16874a"
                        onPress={() => changeAccountState(user, "active")}
                      />
                      {accountState !== "removed" && (
                        <Action
                          icon="trash-outline"
                          label="Remove"
                          color={C.red}
                          onPress={() => changeAccountState(user, "removed")}
                        />
                      )}
                    </View>
                  )}
                </View>
              )}
            </Card>
          );
        })
      )}

      <Btn outline icon="log-out-outline" title="Logout Admin" onPress={() => logout?.()} />

      <Modal
        visible={materialMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMaterialMenuOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMaterialMenuOpen(false)}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Material</Text>
              <TouchableOpacity onPress={() => setMaterialMenuOpen(false)}>
                <Ionicons name="close" size={23} color="#173a31" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 430 }}>
              {materials.map((material) => {
                const selected = material.id === selectedMaterialId;
                return (
                  <TouchableOpacity
                    key={material.id}
                    onPress={() => {
                      setSelectedMaterialId(material.id);
                      setMaterialMenuOpen(false);
                    }}
                    style={[styles.materialOption, selected && styles.materialOptionSelected]}
                  >
                    <Text style={[styles.optionName, selected && { color: "#16874a" }]}>{material.name}</Text>
                    <Text style={styles.optionRate}>₹{material.rate}/kg</Text>
                    {selected && <Ionicons name="checkmark-circle" size={20} color="#16874a" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

function Summary({ icon, value, label }) {
  return (
    <View style={styles.summaryItem}>
      <Ionicons name={icon} size={19} color={C.green} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function Avatar({ role }) {
  return (
    <View style={styles.avatar}>
      <Ionicons
        name={role === "admin" ? "shield-outline" : role === "collector" ? "business-outline" : "person-outline"}
        size={21}
        color="#16874a"
      />
    </View>
  );
}

function Status({ state }) {
  const config = {
    active: ["ACTIVE", "#16874a", "#ddf8e6"],
    blocked: ["BLOCKED", "#a86c0f", "#fff0c7"],
    removed: ["REMOVED", C.red, "#ffe3e4"],
  }[state] || [String(state).toUpperCase(), "#627d75", "#e8efed"];
  return (
    <View style={[styles.status, { backgroundColor: config[2] }]}>
      <Text style={[styles.statusText, { color: config[1] }]}>{config[0]}</Text>
    </View>
  );
}

function Action({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.action, { borderColor: color }]}>
      <Ionicons name={icon} size={17} color={color} />
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function validMonth(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value || ""));
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

const styles = {
  summary: { flexDirection: "row", marginHorizontal: -3, marginTop: 8 },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    marginHorizontal: 3,
    borderRadius: 11,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  summaryValue: { color: C.text, fontSize: 16, fontWeight: "900", marginTop: 3 },
  summaryLabel: { color: C.muted, fontSize: 8, marginTop: 2 },
  emptyRow: { flexDirection: "row", alignItems: "center" },
  userTop: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "#ddf8e6",
  },
  cardTitle: { color: "#173a31", fontSize: 12, fontWeight: "900" },
  meta: { color: "#78918b", fontSize: 9, marginTop: 3, textTransform: "capitalize" },
  label: { color: "#42695d", fontSize: 9, fontWeight: "800", marginBottom: 6 },
  input: {
    height: 47,
    color: "#173a31",
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#c9d9d5",
    borderRadius: 9,
    backgroundColor: "#fff",
  },
  inputError: { borderColor: C.red },
  dropdown: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    padding: 9,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#c9d9d5",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  materialIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "#ddf8e6",
  },
  dropdownTitle: { color: "#173a31", fontSize: 12, fontWeight: "900" },
  priceInput: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#c9d9d5",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  currency: { color: "#16874a", fontSize: 19, fontWeight: "900" },
  rateField: { flex: 1, height: 50, color: "#173a31", fontSize: 18, fontWeight: "900", paddingHorizontal: 8 },
  perKg: { color: "#78918b", fontSize: 10 },
  updateHeader: { flexDirection: "row", alignItems: "center", marginBottom: 13 },
  updateIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "#ddf8e6",
  },
  versionRow: { flexDirection: "row" },
  messageInput: { height: 78, paddingTop: 11, textAlignVertical: "top" },
  forceRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#d8e4e0",
    backgroundColor: "#f1f6f4",
  },
  forceRowOn: { borderColor: C.green, backgroundColor: "#e4fbea" },
  forceTitle: { color: "#173a31", fontSize: 10, fontWeight: "900" },
  searchBox: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  searchInput: { flex: 1, height: 46, color: C.text, fontSize: 11, paddingHorizontal: 9 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.red,
    backgroundColor: "rgba(255,95,104,.10)",
  },
  errorText: { flex: 1, color: C.red, fontSize: 9, marginLeft: 7 },
  status: { paddingHorizontal: 6, paddingVertical: 4, marginRight: 5, borderRadius: 6 },
  statusText: { fontSize: 7, fontWeight: "900" },
  actionsArea: { paddingTop: 11, marginTop: 11, borderTopWidth: 1, borderTopColor: "#dfe9e7" },
  detail: { color: "#647d76", fontSize: 8, marginBottom: 4 },
  updating: { color: "#16874a", fontSize: 9, fontWeight: "800", paddingVertical: 9 },
  actionRow: { flexDirection: "row", marginHorizontal: -4, marginTop: 7 },
  action: {
    flex: 1,
    height: 39,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderRadius: 9,
  },
  actionText: { fontSize: 9, fontWeight: "900", marginLeft: 5 },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 22,
    backgroundColor: "rgba(0,0,0,.65)",
  },
  modalCard: { padding: 15, borderRadius: 16, backgroundColor: "#f7fbfa" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: { color: "#173a31", fontSize: 15, fontWeight: "900" },
  materialOption: {
    minHeight: 51,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#dfe9e7",
  },
  materialOptionSelected: { backgroundColor: "#e7f8ec", borderRadius: 8 },
  optionName: { flex: 1, color: "#315c50", fontSize: 11, fontWeight: "800" },
  optionRate: { color: "#78918b", fontSize: 9, marginRight: 9 },
};
