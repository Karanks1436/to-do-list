import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  PermissionsAndroid,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Application from "expo-application";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { doc, getDoc } from "firebase/firestore";

import { Card, Header, Pill, Row } from "../components/UI";
import {
  changeAccountPassword,
  updateAccountProfile,
} from "../firebase/firebaseService";
import { db } from "../firebase/firebase";
import { compareVersions } from "../update/useAppUpdate";
import { C } from "../theme";
import { s } from "../styles";

const CURRENT_VERSION = Application.nativeApplicationVersion || "1.0.0";

export default function ProfileScreen({
  go,
  profile,
  user,
  unreadCount = 0,
  syncError = null,
}) {
  const role = profile?.role || "giver";
  const isGiver = role === "giver";
  const isAdmin = role === "admin";

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [permanentLocation, setPermanentLocation] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [permissions, setPermissions] = useState({
    camera: "unknown",
    photos: "unknown",
    location: "unknown",
    notifications: "unknown",
  });
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    setName(profile?.name || user?.displayName || "");
    setPhone(profile?.phone || "");
    setPermanentLocation(
      typeof profile?.address === "string"
        ? profile.address
        : profile?.address?.addressLine || profile?.addressLine || ""
    );
    setCity(profile?.city || "");
  }, [profile?.name, profile?.phone, profile?.address, profile?.addressLine, profile?.city, user?.displayName]);

  useEffect(() => {
    if (permissionsOpen) refreshPermissions();
  }, [permissionsOpen]);

  const saveProfile = async () => {
    if (!user?.uid) {
      return Alert.alert("Login required", "Please log in before editing your profile.");
    }
    if (!name.trim()) return Alert.alert("Name required", "Enter your full name.");
    if (password && password.length < 6) {
      return Alert.alert("Invalid password", "Use at least 6 characters.");
    }
    if (password !== confirmPassword) {
      return Alert.alert("Passwords do not match", "Enter the same new password twice.");
    }

    try {
      setSaving(true);
      await updateAccountProfile({
        uid: user.uid,
        name,
        phone,
        address: permanentLocation,
        city,
      });
      if (password) await changeAccountPassword(password);
      setPassword("");
      setConfirmPassword("");
      setEditing(false);
      Alert.alert(
        "Profile updated",
        password
          ? "Your profile and password were updated."
          : "Your Firebase profile was updated."
      );
    } catch (error) {
      const message =
        error?.code === "auth/requires-recent-login"
          ? "For security, log out and log in again before changing your password. Other profile details may already be saved."
          : error?.message || "Unable to update your profile.";
      Alert.alert("Update failed", message);
    } finally {
      setSaving(false);
    }
  };

  const refreshPermissions = async () => {
    try {
      const notificationStatus =
        Platform.OS === "android" && Number(Platform.Version) >= 33
          ? (await PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            ))
            ? "granted"
            : "denied"
          : Platform.OS === "android"
          ? "granted"
          : "unknown";
      const [camera, photos, location] = await Promise.all([
        ImagePicker.getCameraPermissionsAsync(),
        ImagePicker.getMediaLibraryPermissionsAsync(),
        Location.getForegroundPermissionsAsync(),
      ]);
      setPermissions({
        camera: camera.status,
        photos: photos.status,
        location: location.status,
        notifications: notificationStatus,
      });
    } catch (error) {
      Alert.alert("Permission check failed", error?.message || "Unable to read permissions.");
    }
  };

  const requestPermission = async (type) => {
    try {
      if (type === "camera") await ImagePicker.requestCameraPermissionsAsync();
      if (type === "photos") await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (type === "location") await Location.requestForegroundPermissionsAsync();
      if (type === "notifications") {
        if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
        } else {
          await Linking.openSettings();
        }
      }
      await refreshPermissions();
    } catch (error) {
      Alert.alert("Permission failed", error?.message || "Open Android settings and allow this permission.");
    }
  };

  const checkForUpdates = async () => {
    try {
      setCheckingUpdate(true);
      const snapshot = await getDoc(doc(db, "appConfig", "android"));
      if (!snapshot.exists()) {
        return Alert.alert("No update configuration", "The admin has not published appConfig/android yet.");
      }
      const config = snapshot.data();
      const latest = String(config.latestVersion || CURRENT_VERSION);
      if (compareVersions(latest, CURRENT_VERSION) <= 0) {
        return Alert.alert("App is up to date", `You are using version ${CURRENT_VERSION}.`);
      }
      Alert.alert(
        config.title || "Update available",
        config.message || `Version ${latest} is available.`,
        [
          { text: config.force ? "Close" : "Later", style: "cancel" },
          {
            text: "Download Update",
            onPress: () => {
              const url = config.downloadUrl || config.playStoreUrl;
              if (url) Linking.openURL(url);
              else Alert.alert("Download unavailable", "No download URL is configured.");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Update check failed", error?.message || "Unable to check for updates.");
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Header title="My Profile" back={() => go("home")} />

      {!!syncError && (
        <View style={styles.syncError}>
          <Ionicons name="cloud-offline-outline" size={19} color={C.red} />
          <Text style={styles.syncErrorText}>Profile totals may be delayed: {syncError}</Text>
        </View>
      )}

      <View style={styles.profileHeader}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatar}>
            <Ionicons
              name={
                isAdmin
                  ? "shield-checkmark-outline"
                  : role === "collector"
                  ? "business-outline"
                  : "person-outline"
              }
              size={39}
              color={C.green}
            />
          </View>
          <View style={styles.onlineDot} />
        </View>
        <Text style={styles.profileName}>
          {profile?.name || user?.displayName || "Recycler"}
        </Text>
        <Text style={styles.email}>{profile?.email || user?.email || "Guest account"}</Text>
        <View style={styles.pills}>
          <Pill solid text={String(role).toUpperCase()} />
          <Pill text={String(profile?.status || "active").toUpperCase()} />
        </View>
        <TouchableOpacity
          onPress={() => {
            if (!user) return Alert.alert("Login required", "Please log in to edit your profile.");
            setEditing((value) => !value);
          }}
          style={styles.editButton}
        >
          <Ionicons name={editing ? "close-outline" : "create-outline"} size={18} color={C.bg} />
          <Text style={styles.editButtonText}>{editing ? "Cancel Editing" : "Edit Profile"}</Text>
        </TouchableOpacity>
      </View>

      {editing && (
        <Card style={styles.editCard}>
          <Text style={styles.editTitle}>Update account information</Text>
          <Field label="Full name" icon="person-outline">
            <Input value={name} onChangeText={setName} placeholder="Full name" />
          </Field>
          <Field label="Mobile number" icon="call-outline">
            <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91 98765 43210" />
          </Field>
          <Field label="Permanent location / address" icon="location-outline">
            <Input
              value={permanentLocation}
              onChangeText={setPermanentLocation}
              placeholder="House, street and area"
              multiline
              style={{ height: 74, paddingTop: 12, textAlignVertical: "top" }}
            />
          </Field>
          <Field label="City" icon="business-outline">
            <Input value={city} onChangeText={setCity} placeholder="Ludhiana" />
          </Field>

          <TouchableOpacity onPress={() => setShowPassword((value) => !value)} style={styles.passwordToggle}>
            <Ionicons name="key-outline" size={18} color="#16874a" />
            <Text style={styles.passwordToggleText}>
              {showPassword ? "Hide password fields" : "Change password"}
            </Text>
            <Ionicons
              name={showPassword ? "chevron-up" : "chevron-down"}
              size={18}
              color="#78918b"
            />
          </TouchableOpacity>

          {showPassword && (
            <>
              <Field label="New password" icon="lock-closed-outline">
                <Input
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="At least 6 characters"
                />
              </Field>
              <Field label="Confirm new password" icon="shield-checkmark-outline">
                <Input
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Repeat new password"
                />
              </Field>
            </>
          )}

          <TouchableOpacity
            disabled={saving}
            onPress={saveProfile}
            style={[styles.saveButton, saving && { opacity: 0.5 }]}
          >
            <Ionicons name="save-outline" size={19} color={C.bg} />
            <Text style={styles.saveButtonText}>{saving ? "Updating…" : "Update Profile"}</Text>
          </TouchableOpacity>
        </Card>
      )}

      {isGiver && (
        <View style={styles.statsRow}>
          <Stat value={`${Number(profile?.recycledKg || 0).toFixed(1)} kg`} label="Recycled" />
          <Stat value={`₹${Number(profile?.walletBalance || 0).toFixed(0)}`} label="Credits" />
          <Stat value={profile?.greenPoints || 0} label="Points" />
        </View>
      )}

      <Text style={s.section}>Account and activity</Text>
      <Card>
        {isGiver && (
          <>
            <Row
              icon="wallet-outline"
              title="Eco Wallet"
              value={`₹${Number(profile?.walletBalance || 0).toFixed(0)}`}
              onPress={() => go("wallet")}
            />
            <Row icon="leaf-outline" title="Environmental Impact" onPress={() => go("impact")} />
            <Row icon="time-outline" title="Transaction History" onPress={() => go("history")} />
          </>
        )}
        {isAdmin && (
          <Row icon="shield-checkmark-outline" title="Admin Console" onPress={() => go("admin")} />
        )}
        <Row
          icon="notifications-outline"
          title="Notifications"
          value={unreadCount ? `${unreadCount} new` : "All read"}
          onPress={() => go("notifications")}
        />
      </Card>

      <Text style={s.section}>Privacy and application</Text>
      <Card>
        <Row
          icon="key-outline"
          title="App Permissions"
          value={permissionsOpen ? "Hide" : "Manage"}
          onPress={() => setPermissionsOpen((value) => !value)}
        />
        <Row icon="settings-outline" title="More Settings" onPress={() => go("settings")} />
        <Row
          icon="cloud-download-outline"
          title={checkingUpdate ? "Checking for Updates…" : "Version Updates"}
          value={`v${CURRENT_VERSION}`}
          onPress={checkingUpdate ? undefined : checkForUpdates}
        />
        <Row
          icon="information-circle-outline"
          title="About Trash2Treasure"
          value={aboutOpen ? "Hide" : "View"}
          onPress={() => setAboutOpen((value) => !value)}
        />
      </Card>

      {permissionsOpen && (
        <Card style={styles.panelCard}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>Application permissions</Text>
              <Text style={styles.panelText}>Review or request access used by app features.</Text>
            </View>
            <TouchableOpacity onPress={refreshPermissions} style={styles.refreshButton}>
              <Ionicons name="refresh" size={18} color="#16874a" />
            </TouchableOpacity>
          </View>
          <PermissionRow
            icon="camera-outline"
            label="Camera"
            status={permissions.camera}
            onPress={() => requestPermission("camera")}
          />
          <PermissionRow
            icon="images-outline"
            label="Photos and media"
            status={permissions.photos}
            onPress={() => requestPermission("photos")}
          />
          <PermissionRow
            icon="location-outline"
            label="Location"
            status={permissions.location}
            onPress={() => requestPermission("location")}
          />
          <PermissionRow
            icon="notifications-outline"
            label="Notifications"
            status={permissions.notifications}
            onPress={() => requestPermission("notifications")}
            last
          />
          <TouchableOpacity onPress={() => Linking.openSettings()} style={styles.systemSettingsButton}>
            <Ionicons name="open-outline" size={17} color={C.bg} />
            <Text style={styles.systemSettingsText}>Open System App Settings</Text>
          </TouchableOpacity>
        </Card>
      )}

      {aboutOpen && (
        <Card style={styles.panelCard}>
          <View style={styles.aboutLogo}>
            <Ionicons name="leaf-outline" size={31} color={C.green} />
          </View>
          <Text style={styles.aboutTitle}>Trash2Treasure</Text>
          <Text style={styles.aboutVersion}>Version {CURRENT_VERSION}</Text>
          <Text style={styles.aboutText}>
            A Firebase-connected recycling marketplace for waste identification,
            collector discovery, verified pickup settlement and environmental impact.
          </Text>
          <View style={styles.developerBox}>
            <Ionicons name="code-slash-outline" size={20} color="#16874a" />
            <View style={{ flex: 1, marginLeft: 9 }}>
              <Text style={styles.developerLabel}>Organizer and Developer</Text>
              <Text style={styles.developerName}>karanks1436</Text>
            </View>
          </View>
          <Text style={styles.aboutFoot}>Built with React Native, Expo, Firebase Auth and Firestore.</Text>
        </Card>
      )}

      <View style={styles.firebaseBox}>
        <Ionicons name="cloud-done-outline" size={20} color={C.green} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.firebaseTitle}>Firebase account connected</Text>
          <Text style={styles.firebaseText}>
            Profile edits, settings, pickups, notifications and verified transactions are
            synchronized with Firestore.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function Input(props) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#8ba09a"
      style={[styles.input, props.style]}
    />
  );
}

function Field({ label, icon, children }) {
  return (
    <View style={{ marginTop: 11 }}>
      <View style={styles.fieldLabelRow}>
        <Ionicons name={icon} size={15} color="#16874a" />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

function PermissionRow({ icon, label, status, onPress, last }) {
  const granted = status === "granted";
  return (
    <View style={[styles.permissionRow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.permissionIcon}>
        <Ionicons name={icon} size={18} color="#16874a" />
      </View>
      <Text style={styles.permissionLabel}>{label}</Text>
      <Text style={[styles.permissionStatus, granted && { color: "#16874a" }]}> 
        {granted ? "Allowed" : status === "denied" ? "Denied" : "Not checked"}
      </Text>
      {!granted && (
        <TouchableOpacity onPress={onPress} style={styles.allowButton}>
          <Text style={styles.allowText}>Allow</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = {
  syncError: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.red,
    backgroundColor: "rgba(255,95,104,.10)",
  },
  syncErrorText: { flex: 1, color: C.red, fontSize: 9, marginLeft: 8 },
  profileHeader: { alignItems: "center", paddingVertical: 18 },
  avatarOuter: { position: "relative" },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.10)",
    borderWidth: 2,
    borderColor: C.green,
  },
  onlineDot: {
    position: "absolute",
    right: 5,
    bottom: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.green,
    borderWidth: 3,
    borderColor: C.bg,
  },
  profileName: { color: C.text, fontSize: 22, fontWeight: "900", marginTop: 12 },
  email: { color: C.muted, fontSize: 11, marginTop: 5 },
  pills: { flexDirection: "row", marginTop: 10, gap: 6 },
  editButton: {
    height: 39,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginTop: 13,
    borderRadius: 10,
    backgroundColor: C.green,
  },
  editButtonText: { color: C.bg, fontSize: 11, fontWeight: "900", marginLeft: 6 },
  editCard: { borderWidth: 1, borderColor: C.green },
  editTitle: { color: "#173a31", fontSize: 14, fontWeight: "900" },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  fieldLabel: { color: "#42695d", fontSize: 10, fontWeight: "800", marginLeft: 5 },
  input: {
    height: 48,
    color: "#173a31",
    borderWidth: 1,
    borderColor: "#cbdad6",
    borderRadius: 9,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  passwordToggle: {
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: "#edf8f1",
  },
  passwordToggleText: { flex: 1, color: "#315c50", fontSize: 10, fontWeight: "800", marginLeft: 7 },
  saveButton: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    borderRadius: 10,
    backgroundColor: C.green,
  },
  saveButtonText: { color: C.bg, fontSize: 12, fontWeight: "900", marginLeft: 7 },
  statsRow: { flexDirection: "row", marginHorizontal: -3 },
  stat: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 3,
    padding: 12,
    borderRadius: 11,
    backgroundColor: C.panel2,
    borderWidth: 1,
    borderColor: C.line,
  },
  statValue: { color: C.green, fontSize: 14, fontWeight: "900" },
  statLabel: { color: C.muted, fontSize: 8, marginTop: 3 },
  panelCard: { marginTop: 10 },
  panelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 7 },
  panelTitle: { color: "#173a31", fontSize: 13, fontWeight: "900" },
  panelText: { color: "#78918b", fontSize: 9, marginTop: 3 },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5f7eb",
  },
  permissionRow: {
    minHeight: 51,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#dfe9e7",
  },
  permissionIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5f7eb",
  },
  permissionLabel: { flex: 1, color: "#315c50", fontSize: 10, fontWeight: "700", marginLeft: 8 },
  permissionStatus: { color: "#a05e48", fontSize: 9, fontWeight: "800" },
  allowButton: { paddingHorizontal: 9, paddingVertical: 6, marginLeft: 6, borderRadius: 7, backgroundColor: C.green },
  allowText: { color: C.bg, fontSize: 8, fontWeight: "900" },
  systemSettingsButton: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderRadius: 9,
    backgroundColor: C.green,
  },
  systemSettingsText: { color: C.bg, fontSize: 10, fontWeight: "900", marginLeft: 6 },
  aboutLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ddf8e6",
  },
  aboutTitle: { color: "#173a31", fontSize: 19, fontWeight: "900", textAlign: "center", marginTop: 10 },
  aboutVersion: { color: "#78918b", fontSize: 9, textAlign: "center", marginTop: 3 },
  aboutText: { color: "#54736c", fontSize: 10, lineHeight: 16, textAlign: "center", marginTop: 12 },
  developerBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginTop: 13,
    borderRadius: 10,
    backgroundColor: "#edf8f1",
  },
  developerLabel: { color: "#78918b", fontSize: 8, textTransform: "uppercase" },
  developerName: { color: "#16874a", fontSize: 13, fontWeight: "900", marginTop: 2 },
  aboutFoot: { color: "#78918b", fontSize: 8, textAlign: "center", marginTop: 11 },
  firebaseBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 13,
    marginTop: 10,
    borderRadius: 11,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  firebaseTitle: { color: C.text, fontSize: 10, fontWeight: "800" },
  firebaseText: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 3 },
};
