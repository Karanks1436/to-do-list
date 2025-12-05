import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "../hooks/useAuth";

export default function LoginButton() {
  const { user, extraData, login, signup, logout, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSignup, setIsSignup] = useState(false);

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
    if (!name || !contact) {
      setError("Please enter name and contact");
      return;
    }
    try {
      await signup(email, password, { name, contact });
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.welcome}>Welcome, {extraData.name || user.email}</Text>
          <Text style={styles.subText}>Contact: {extraData.contact || "N/A"}</Text>
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
        <Text style={styles.header}>{isSignup ? "Signup" : "Login"}</Text>

        {isSignup && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Contact"
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordWrapper}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
            <Text style={styles.showText}>{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.buttonWrapper}>
          {isSignup ? (
            <Button title="Signup" onPress={handleSignup} color="#34A853" />
          ) : (
            <Button title="Login" onPress={handleLogin} color="#4285F4" />
          )}
        </View>

        <TouchableOpacity onPress={() => setIsSignup(prev => !prev)}>
          <Text style={styles.toggleText}>
            {isSignup ? "Already have an account? Login" : "Don't have an account? Signup"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
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
    marginBottom: 5,
    textAlign: "center",
    color: "#333",
  },
  subText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#555",
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
  toggleText: { textAlign: "center", color: "#4285F4", marginTop: 10, fontWeight: "600" },
});
