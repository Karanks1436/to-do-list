import React, { useState,useEffect, useMemo } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import TodoItem from "@/components/TodoItem"; 
import { useAuth } from "@/hooks/useAuth"; 
import { useTodos } from "@/hooks/useTodos";
import LoginButton from "@/components/LoginButton"; 
import AppBar from "@/components/AppBar";
import Profile from "@/app/(tabs)/Profile";
import TodoList from "@/app/(tabs)/TodoList";
import { setupNotificationPermissions } from "@/utils/notifications";
import { registerBackgroundTask } from "@/utils/backgroundTask";

const LogoutScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>🚪 You are logged out</Text>
  </View>
);

export default function Home() {
  const { user, logout } = useAuth();
  const { todos, toggleTodo, deleteTodo } = useTodos();
  const [activeTab, setActiveTab] = useState<"list" | "profile" | "todo" | "logout">("list");

  useEffect(() => {
  (async () => {
    await setupNotificationPermissions();
    await registerBackgroundTask();
  })();
}, []);


  const handleLogout = async () => {
    await logout();
    setActiveTab("logout");
  };

  // 👇 SORT TASKS: pending first, completed below
  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => Number(a.completed) - Number(b.completed));
  }, [todos]);

  const renderContent = () => {
    if (!user && activeTab !== "logout") {
      return (
        <View style={styles.screen}>
          <LoginButton />
          <Text style={{ marginTop: 10, color: "#666" }}>
            Please log in to view your tasks.
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case "list":
        return (
          <View style={{ flex: 1 }}>
            <Text style={styles.header}>Your Tasks</Text>

            {todos.length === 0 ? (
              <Text style={styles.noTasks}>No tasks available</Text>
            ) : (
              <FlatList
                data={sortedTodos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TodoItem
                    text={item.text}
                    completed={item.completed}
                    statusColor={item.completed ? "#4CAF50" : "#FF4B4B"} // green if done, red if pending
                    onToggle={() => toggleTodo(item.id)}
                    onDelete={() => deleteTodo(item.id)}
                  />
                )}
              />
            )}
          </View>
        );

      case "profile":
        return <Profile />;
      case "todo":
        return <TodoList />;
      case "logout":
        return <LogoutScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <AppBar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      <View style={{ flex: 1, marginTop: 20 }}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: { fontSize: 24, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  noTasks: { textAlign: "center", marginTop: 20, color: "#777", fontSize: 16 },
  screen: { flex: 1, justifyContent: "center", alignItems: "center" },
  screenText: { fontSize: 26, fontWeight: "600", color: "#333" },
});
