import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Btn } from "../components/UI";
import { loginUser, registerUser, resetPassword } from "../firebase/firebaseService";
import { C } from "../theme";
import { s } from "../styles";

export default function AuthScreen({ onSuccess, onSkip }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("giver");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim()) return Alert.alert("Email required", "Enter your email address.");
    if (password.length < 6) {
      return Alert.alert("Invalid password", "Use at least 6 characters.");
    }
    if (mode === "signup" && !name.trim()) {
      return Alert.alert("Name required", "Enter your full name.");
    }

    try {
      setBusy(true);
      const user =
        mode === "login"
          ? await loginUser(email, password)
          : await registerUser({ name, email, password, role });
      onSuccess?.(user);
    } catch (error) {
      Alert.alert("Authentication failed", friendly(error));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      return Alert.alert("Enter email", "Type your email address first.");
    }
    try {
      await resetPassword(email);
      Alert.alert("Email sent", "Check your inbox for the password reset link.");
    } catch (error) {
      Alert.alert("Reset failed", friendly(error));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={s.fill}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 24, paddingTop: 45, paddingBottom: 40 }}
      >
        <Text style={{ fontSize: 42 }}>♻️</Text>
        <Text style={[s.title, { marginTop: 10 }]}>
          {mode === "login" ? "Welcome Back!" : "Create Account"}
        </Text>
        <Text style={s.sub}>Recycle today for a better tomorrow</Text>

        <View style={s.segment}>
          {["login", "signup"].map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setMode(item)}
              style={[s.segmentItem, mode === item && s.segmentOn]}
            >
              <Text style={s.segmentText}>
                {item === "login" ? "Login" : "Sign Up"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === "signup" && (
          <>
            <Text style={{ color: C.text, fontSize: 12, fontWeight: "700" }}>
              Choose account type
            </Text>
            <View style={[s.segment, { marginTop: 8 }]}>
              {["giver", "collector"].map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setRole(item)}
                  style={[s.segmentItem, role === item && s.segmentOn]}
                >
                  <Text style={s.segmentText}>
                    {item === "giver" ? "Trash Giver" : "Collector"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={s.input}
              placeholder="Full name"
              placeholderTextColor={C.muted}
              value={name}
              onChangeText={setName}
            />
          </>
        )}

        <TextInput
          style={s.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={C.muted}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={s.input}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor={C.muted}
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
        />

        {mode === "login" && (
          <TouchableOpacity onPress={forgot}>
            <Text
              style={{
                color: C.green,
                textAlign: "right",
                fontSize: 12,
                marginBottom: 14,
              }}
            >
              Forgot password?
            </Text>
          </TouchableOpacity>
        )}

        <Btn
          disabled={busy}
          title={busy ? "Please wait…" : mode === "login" ? "Login" : "Create Account"}
          onPress={submit}
        />

        <TouchableOpacity
          disabled={busy}
          onPress={() => onSkip?.()}
          style={{
            height: 50,
            borderRadius: 11,
            marginTop: 14,
            backgroundColor: "rgba(32,211,90,.09)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: C.green, fontWeight: "800" }}>Skip for now</Text>
          <Text style={{ color: C.muted, fontSize: 9, marginTop: 2 }}>
            Continue to Home as guest
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function friendly(error) {
  const code = error?.code;
  if (["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password"].includes(code)) {
    return "Incorrect email or password.";
  }
  if (code === "auth/email-already-in-use") {
    return "An account already exists with this email.";
  }
  if (code === "auth/network-request-failed") {
    return "Check your internet connection.";
  }
  if (code === "auth/operation-not-allowed" || /CONFIGURATION_NOT_FOUND/i.test(error?.message || "")) {
    return "Enable Email/Password in Firebase Console → Authentication → Sign-in method, then try again.";
  }
  return error?.message || "Please try again.";
}
