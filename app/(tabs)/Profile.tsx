// app/Profile.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Button } from "react-native";
import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const { user, extraData, logout } = useAuth(); // <-- extraData for name/contact
  const [showPassword, setShowPassword] = useState(false);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>No user is logged in.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>

      <View style={styles.card}>
        {/* Email */}
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user.email}</Text>

        {/* Name */}
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{extraData.name || "N/A"}</Text>

        {/* Contact */}
        <Text style={styles.label}>Contact:</Text>
        <Text style={styles.value}>{extraData.contact || "N/A"}</Text>

        {/* Password */}
        <Text style={styles.label}>Password:</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            style={[styles.value, { flex: 1 }]}
            value={"********"} // masked
            editable={false}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
            <Text style={styles.showText}>{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutButton}>
          <Button title="Logout" color="#FF5252" onPress={logout} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F3F4F6",
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginTop: 4,
    color: "#333",
    backgroundColor: "#f3f3f3",
    padding: 10,
    borderRadius: 8,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  showText: {
    marginLeft: 10,
    color: "#4285F4",
    fontWeight: "600",
  },
  infoText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
    color: "#777",
  },
  logoutButton: {
    marginTop: 20,
  },
});
