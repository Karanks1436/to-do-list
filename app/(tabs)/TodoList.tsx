import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet } from "react-native";
import { useTodos } from "@/hooks/useTodos";
import { useAuth } from "@/hooks/useAuth";

export default function TodoList() {
  const { user } = useAuth();
  const { todos, addTodo } = useTodos(); // Only keep addTodo
  const [task, setTask] = useState("");

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Sign in to see your tasks</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your To-Dos</Text>

      {/* Input Row */}
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Enter task..."
          value={task}
          onChangeText={setTask}
          style={styles.input}
        />
        <Button
          title="Add"
          onPress={async () => {
            if (task.trim()) {
              await addTodo(task.trim());
              setTask("");
            }
          }}
        />
      </View>

      {/* Show all tasks */}
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Text style={styles.taskText}>{item.text}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F5F5F5" },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  inputRow: { flexDirection: "row", marginBottom: 20 },
  input: {
    flex: 1,
    borderWidth: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10, // spacing between input and button
  },
  taskItem: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
  },
  taskText: {
    fontSize: 16,
    color: "#333",
  },
});
