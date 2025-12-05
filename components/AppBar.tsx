import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AppBarProps {
  activeTab: "list" | "todo" | "profile" | "logout";
  setActiveTab: (tab: "list" | "todo" | "profile" | "logout") => void;
  onLogout: () => void;
}

export default function AppBar({ activeTab, setActiveTab, onLogout }: AppBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>KS14 ToDo</Text>
      <View style={styles.menu}>
        <TouchableOpacity style={styles.item} onPress={() => setActiveTab("list")}>
          <Ionicons
            name="list-outline"
            size={22}
            color={activeTab === "list" ? "#FFD700" : "#fff"}
          />
          <Text style={[styles.text, activeTab === "list" && { color: "#FFD700" }]}>
            Tasks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => setActiveTab("todo")}>
          <Ionicons
            name="checkbox-outline"
            size={22}
            color={activeTab === "todo" ? "#FFD700" : "#fff"}
          />
          <Text style={[styles.text, activeTab === "todo" && { color: "#FFD700" }]}>
            Todo List
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => setActiveTab("profile")}>
          <Ionicons
            name="person-outline"
            size={22}
            color={activeTab === "profile" ? "#FFD700" : "#fff"}
          />
          <Text style={[styles.text, activeTab === "profile" && { color: "#FFD700" }]}>
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FFB4B4" />
          <Text style={[styles.text, { color: "#FFB4B4" }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E88E5",
    paddingTop: 45,
    paddingBottom: 12,
    paddingHorizontal: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 6,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  menu: {
    flexDirection: "row",
    alignItems: "center",
  },
  item: {
    alignItems: "center",
    marginRight: 20, // spacing between items
  },
  text: {
    color: "#fff",
    fontSize: 12,
    marginTop: 2,
  },
});
