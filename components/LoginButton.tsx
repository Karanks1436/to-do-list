import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../hooks/useAuth";

export default function LoginButton() {
  const { user, login, signup, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ✅ new state
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignup = async () => {
    setError("");
    try {
      await signup(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (user) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.welcome}>Welcome, {user.email}</Text>
          <View style={styles.buttonWrapper}>
            <Button title="Logout" color="#FF5252" onPress={logout} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.header}>Login / Signup</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password field with show/hide */}
        <View style={styles.passwordWrapper}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword} // toggle secureTextEntry
          />
          <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
            <Text style={styles.showText}>{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.buttonWrapper}>
          <Button title="Login" onPress={handleLogin} color="#4285F4" />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Signup" onPress={handleSignup} color="#34A853" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  welcome: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    marginBottom: 15,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  showText: {
    marginLeft: 10,
    color: "#4285F4",
    fontWeight: "600",
  },
  error: { color: "#FF5252", marginBottom: 15, textAlign: "center" },
  buttonWrapper: { marginBottom: 10 },
});
