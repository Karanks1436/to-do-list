
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet } from "react-native";
import { useTodos } from "@/hooks/useTodos";
import { useAuth } from "@/hooks/useAuth";
import TodoItem from "@/components/TodoItem";
// import { registerForPushNotificationsAsync, scheduleHourlyReminder } from "@/utils/notifications";
import { registerForPushNotificationsAsync, scheduleHourlyReminder } from "@/utils/notifications";


export default function TodoList() {
  const { user } = useAuth();
  const { todos, addTodo } = useTodos();
  const [task, setTask] = useState("");

  // Request notification access once
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  // Auto schedule reminder when tasks list updates
  useEffect(() => {
    const pendingCount = todos.filter(t => !t.completed).length;
    scheduleHourlyReminder();
  }, [todos]);

useEffect(() => {
  (async () => {
    const token = await registerForPushNotificationsAsync();
    console.log("Expo Push Token:", token);

    // TEST: schedule reminder only once
    await scheduleHourlyReminder("Stay productive! 🚀");

  })();
}, []);



  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Please sign in to manage your tasks</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Tasks</Text>

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
            if (!task.trim()) return;
            await addTodo(task);
            setTask("");
          }}
        />
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TodoItem text={item.text} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F5F5F5" },
  header: { fontSize: 22, fontWeight: "600", marginBottom: 12, textAlign: "center" },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 10, backgroundColor: "#fff" },
});
