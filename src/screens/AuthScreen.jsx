import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";

import { Btn } from "../components/UI";
import { auth } from "../firebase/firebase";
import {
  loginUser,
  registerUser,
  resetPassword,
} from "../firebase/firebaseService";
import { C } from "../theme";
import { s } from "../styles";

export default function AuthScreen({ onSuccess, onSkip }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("giver");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const redirectedUserId = useRef(null);

  // Firebase Auth restores its persisted AsyncStorage session automatically.
  // If a user is already authenticated, skip this form and let the parent route
  // them to the correct giver, collector or admin home experience.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setCheckingSession(false);
      if (currentUser && redirectedUserId.current !== currentUser.uid) {
        redirectedUserId.current = currentUser.uid;
        onSuccess?.(currentUser);
      }
    });
    return unsubscribe;
  }, [onSuccess]);

  const changeMode = (nextMode) => {
    if (busy) return;
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail) {
      return Alert.alert("Email required", "Enter the email linked to your account.");
    }
    if (!isValidEmail(cleanEmail)) {
      return Alert.alert("Invalid email", "Enter a valid email address, such as name@example.com.");
    }
    if (password.length < 6) {
      return Alert.alert("Invalid password", "Your password must contain at least 6 characters.");
    }
    if (mode === "signup" && !cleanName) {
      return Alert.alert("Name required", "Enter your full name.");
    }
    if (mode === "signup" && cleanName.length < 2) {
      return Alert.alert("Invalid name", "Enter at least 2 characters for your name.");
    }
    if (mode === "signup" && password !== confirmPassword) {
      return Alert.alert("Passwords do not match", "Enter the same password in both password fields.");
    }

    try {
      setBusy(true);
      const user =
        mode === "login"
          ? await loginUser(cleanEmail, password)
          : await registerUser({
              name: cleanName,
              email: cleanEmail,
              password,
              role,
            });

      redirectedUserId.current = user.uid;
      onSuccess?.(user);
    } catch (error) {
      Alert.alert(
        mode === "login" ? "Login failed" : "Account creation failed",
        friendly(error)
      );
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return Alert.alert("Enter your email", "Type your account email first, then select Forgot password.");
    }
    if (!isValidEmail(cleanEmail)) {
      return Alert.alert("Invalid email", "Enter a valid email address before requesting a reset link.");
    }

    try {
      setBusy(true);
      await resetPassword(cleanEmail);
      Alert.alert(
        "Reset email sent",
        "Check your inbox and spam folder for the Firebase password-reset link."
      );
    } catch (error) {
      Alert.alert("Reset failed", friendly(error));
    } finally {
      setBusy(false);
    }
  };

  if (checkingSession) {
    return (
      <View style={styles.sessionScreen}>
        <View style={styles.logoCircle}>
          <Ionicons name="leaf" size={42} color={C.green} />
        </View>
        <ActivityIndicator size="large" color={C.green} style={{ marginTop: 22 }} />
        <Text style={styles.sessionTitle}>Restoring your session</Text>
        <Text style={styles.sessionText}>Checking your secure Firebase login…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={s.fill}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.page}
      >
        <View style={styles.brandRow}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={34} color={C.green} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.brand}>Trash2Treasure</Text>
            <Text style={styles.brandSub}>Smart recycling marketplace</Text>
          </View>
          <View style={styles.secureBadge}>
            <Ionicons name="shield-checkmark" size={14} color={C.green} />
            <Text style={styles.secureText}>Secure</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>
            {mode === "login" ? "WELCOME BACK" : "JOIN THE GREEN MOVEMENT"}
          </Text>
          <Text style={styles.title}>
            {mode === "login" ? "Continue recycling" : "Create your account"}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "login"
              ? "Log in to manage pickups, credits and your environmental impact."
              : "Choose your role and start giving or collecting recyclable material."}
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.modeTabs}>
            <ModeTab
              icon="log-in-outline"
              title="Login"
              selected={mode === "login"}
              onPress={() => changeMode("login")}
            />
            <ModeTab
              icon="person-add-outline"
              title="Sign Up"
              selected={mode === "signup"}
              onPress={() => changeMode("signup")}
            />
          </View>

          {mode === "signup" && (
            <>
              <Text style={styles.groupLabel}>I want to use the app as</Text>
              <View style={styles.roleRow}>
                <RoleCard
                  icon="person-outline"
                  title="Trash Giver"
                  subtitle="Schedule recyclable pickups"
                  selected={role === "giver"}
                  onPress={() => setRole("giver")}
                />
                <RoleCard
                  icon="bicycle-outline"
                  title="Collector"
                  subtitle="Collect verified material"
                  selected={role === "collector"}
                  onPress={() => setRole("collector")}
                />
              </View>

              {role === "collector" && (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={18} color="#d2a52d" />
                  <Text style={styles.infoText}>
                    Collector accounts require administrator approval before accepting pickups.
                  </Text>
                </View>
              )}

              <AuthInput
                icon="person-outline"
                label="Full name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!busy}
                returnKeyType="next"
              />
            </>
          )}

          <AuthInput
            icon="mail-outline"
            label="Email address"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!busy}
            returnKeyType="next"
          />

          <AuthInput
            icon="lock-closed-outline"
            label="Password"
            placeholder={mode === "signup" ? "Minimum 6 characters" : "Enter your password"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            textContentType={mode === "login" ? "password" : "newPassword"}
            editable={!busy}
            right={
              <TouchableOpacity
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                onPress={() => setShowPassword((current) => !current)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={C.muted}
                />
              </TouchableOpacity>
            }
            onSubmitEditing={mode === "login" ? submit : undefined}
            returnKeyType={mode === "login" ? "done" : "next"}
          />

          {mode === "signup" && (
            <AuthInput
              icon="shield-checkmark-outline"
              label="Confirm password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              editable={!busy}
              onSubmitEditing={submit}
              returnKeyType="done"
            />
          )}

          {mode === "login" && (
            <TouchableOpacity disabled={busy} onPress={forgot} style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <Btn
            disabled={busy}
            title={
              busy
                ? mode === "login"
                  ? "Logging in…"
                  : "Creating account…"
                : mode === "login"
                ? "Login Securely"
                : "Create Account"
            }
            onPress={submit}
          />

          {mode === "signup" && (
            <Text style={styles.termsText}>
              By creating an account, you agree to use Trash2Treasure responsibly and provide accurate pickup information.
            </Text>
          )}
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          disabled={busy}
          activeOpacity={0.75}
          onPress={() => onSkip?.()}
          style={[styles.skipButton, busy && { opacity: 0.5 }]}
        >
          <View style={styles.skipIcon}>
            <Ionicons name="home-outline" size={20} color={C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.skipTitle}>Continue as Guest</Text>
            <Text style={styles.skipText}>Explore Home without signing in</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.green} />
        </TouchableOpacity>

        <View style={styles.securityNote}>
          <Ionicons name="lock-closed-outline" size={15} color={C.muted} />
          <Text style={styles.securityText}>
            Passwords are managed securely by Firebase Authentication and are never stored in Firestore.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ModeTab({ icon, title, selected, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.modeTab, selected && styles.modeTabSelected]}
    >
      <Ionicons name={icon} size={17} color={selected ? C.bg : C.muted} />
      <Text style={[styles.modeTabText, selected && styles.modeTabTextSelected]}>{title}</Text>
    </TouchableOpacity>
  );
}

function RoleCard({ icon, title, subtitle, selected, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.roleCard, selected && styles.roleCardSelected]}
    >
      <View style={[styles.roleIcon, selected && styles.roleIconSelected]}>
        <Ionicons name={icon} size={21} color={selected ? C.bg : C.green} />
      </View>
      <Text style={styles.roleTitle}>{title}</Text>
      <Text style={styles.roleText}>{subtitle}</Text>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  );
}

function AuthInput({ icon, label, right, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <Ionicons name={icon} size={19} color={C.green} />
        <TextInput
          {...inputProps}
          placeholderTextColor={C.muted}
          selectionColor={C.green}
          style={styles.input}
        />
        {right}
      </View>
    </View>
  );
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function friendly(error) {
  const code = error?.code;
  if (["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password"].includes(code)) {
    return "The email or password is incorrect.";
  }
  if (code === "auth/email-already-in-use") {
    return "An account already exists with this email. Choose Login instead.";
  }
  if (code === "auth/invalid-email") {
    return "Enter a valid email address.";
  }
  if (code === "auth/weak-password") {
    return "Choose a stronger password with at least 6 characters.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts were made. Wait a few minutes and try again.";
  }
  if (code === "auth/network-request-failed") {
    return "Check your internet connection and try again.";
  }
  if (
    code === "auth/operation-not-allowed" ||
    /CONFIGURATION_NOT_FOUND/i.test(error?.message || "")
  ) {
    return "Enable Email/Password in Firebase Console → Authentication → Sign-in method, then try again.";
  }
  return error?.message || "Something went wrong. Please try again.";
}

const styles = {
  page: { padding: 22, paddingTop: 38, paddingBottom: 42 },
  sessionScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: C.bg,
  },
  sessionTitle: { color: C.text, fontSize: 17, fontWeight: "900", marginTop: 15 },
  sessionText: { color: C.muted, fontSize: 10, marginTop: 5 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.12)",
    borderWidth: 1,
    borderColor: "rgba(32,211,90,.35)",
  },
  brand: { color: C.text, fontSize: 17, fontWeight: "900" },
  brandSub: { color: C.muted, fontSize: 9, marginTop: 3 },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(32,211,90,.10)",
  },
  secureText: { color: C.green, fontSize: 8, fontWeight: "800", marginLeft: 4 },
  hero: { marginTop: 28, marginBottom: 19 },
  eyebrow: { color: C.green, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: C.text, fontSize: 27, fontWeight: "900", marginTop: 7 },
  subtitle: { color: C.muted, fontSize: 11, lineHeight: 18, marginTop: 8 },
  formCard: {
    padding: 15,
    borderRadius: 16,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  modeTabs: {
    flexDirection: "row",
    padding: 4,
    marginBottom: 16,
    borderRadius: 11,
    backgroundColor: C.panel2,
  },
  modeTab: {
    flex: 1,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  modeTabSelected: { backgroundColor: C.green },
  modeTabText: { color: C.muted, fontSize: 11, fontWeight: "800", marginLeft: 6 },
  modeTabTextSelected: { color: C.bg },
  groupLabel: { color: C.text, fontSize: 10, fontWeight: "800", marginBottom: 9 },
  roleRow: { flexDirection: "row", marginHorizontal: -4, marginBottom: 8 },
  roleCard: {
    flex: 1,
    minHeight: 125,
    padding: 11,
    marginHorizontal: 4,
    borderRadius: 11,
    backgroundColor: C.panel2,
    borderWidth: 1,
    borderColor: C.line,
  },
  roleCardSelected: { borderColor: C.green, backgroundColor: "rgba(32,211,90,.08)" },
  roleIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32,211,90,.10)",
  },
  roleIconSelected: { backgroundColor: C.green },
  roleTitle: { color: C.text, fontSize: 11, fontWeight: "900", marginTop: 9 },
  roleText: { color: C.muted, fontSize: 8, lineHeight: 12, marginTop: 3, paddingRight: 12 },
  radio: {
    position: "absolute",
    top: 11,
    right: 11,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: C.green },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    marginTop: 4,
    marginBottom: 2,
    borderRadius: 9,
    backgroundColor: "rgba(244,183,64,.10)",
    borderWidth: 1,
    borderColor: "rgba(244,183,64,.25)",
  },
  infoText: { flex: 1, color: "#d6bd75", fontSize: 9, lineHeight: 14, marginLeft: 7 },
  field: { marginTop: 12 },
  inputLabel: { color: C.text, fontSize: 10, fontWeight: "800", marginBottom: 6 },
  inputShell: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    borderRadius: 10,
    backgroundColor: C.panel2,
    borderWidth: 1,
    borderColor: C.line,
  },
  input: { flex: 1, minHeight: 48, color: C.text, fontSize: 12, paddingHorizontal: 10 },
  eyeButton: { width: 45, height: 48, alignItems: "center", justifyContent: "center" },
  forgotButton: { alignSelf: "flex-end", paddingVertical: 12, paddingLeft: 16 },
  forgotText: { color: C.green, fontSize: 10, fontWeight: "800" },
  termsText: { color: C.muted, fontSize: 8, lineHeight: 13, textAlign: "center", marginTop: 11 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 18 },
  divider: { flex: 1, height: 1, backgroundColor: C.line },
  dividerText: { color: C.muted, fontSize: 8, fontWeight: "800", marginHorizontal: 10 },
  skipButton: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 13,
    backgroundColor: "rgba(32,211,90,.07)",
    borderWidth: 1,
    borderColor: "rgba(32,211,90,.22)",
  },
  skipIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "rgba(32,211,90,.12)",
  },
  skipTitle: { color: C.green, fontSize: 11, fontWeight: "900" },
  skipText: { color: C.muted, fontSize: 8, marginTop: 3 },
  securityNote: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 8, marginTop: 16 },
  securityText: { flex: 1, color: C.muted, fontSize: 8, lineHeight: 13, marginLeft: 6 },
};
