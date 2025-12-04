// app/index.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import TodoItem from "@/components/TodoItem"; 
import { useAuth } from "@/hooks/useAuth"; 
import { useTodos } from "@/hooks/useTodos";
import LoginButton from "@/components/LoginButton"; 

export default function Index() {
  const { user } = useAuth();
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodos();

  const [task, setTask] = useState("");

  if (!user) {
    // Show login UI + optional demo info
    return (
      <View style={styles.container}>
        <Text style={styles.header}>To-Do List (Sign in required)</Text>
        <LoginButton />
        <Text style={{ marginTop: 10, color: "#666" }}>
          Sign in with Google to persist your tasks to the cloud.
        </Text>
      </View>
    );
  }

 return (
  <View style={styles.container}>
    <Text style={styles.header}>Your To-Dos</Text>

    <LoginButton />

    <View style={styles.inputRow}>
      <TextInput
        placeholder="Enter task..."
        value={task}
        onChangeText={setTask}
        style={styles.input}
      />
      <Button title="Add" onPress={async () => {
        await addTodo(task);
        setTask("");
      }} />
    </View>

    <FlatList
      data={todos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TodoItem
          text={item.text}
          completed={item.completed}
          onToggle={() => toggleTodo(item.id)}
          onDelete={() => deleteTodo(item.id)}
        />
      )}
    />
  </View>
);

}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F5F5F5" },
  header: { fontSize: 24, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  input: {
    flex: 1,
    borderWidth: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
});
