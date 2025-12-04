import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch } from "react-native";

interface Props {
  text: string;
  completed: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export default function TodoItem({ text, completed, onToggle, onDelete }: Props) {
  return (
    <View style={[styles.row, completed && styles.completedRow]}>
      <Switch
        value={completed}
        onValueChange={onToggle}
        trackColor={{ false: "#ccc", true: "#4CAF50" }}
        thumbColor={completed ? "#fff" : "#fff"}
      />
      <Text style={[styles.text, completed && styles.completedText]}>{text}</Text>
      <TouchableOpacity onPress={onDelete}>
        <Text style={styles.delete}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  completedRow: {
    backgroundColor: "#E8F5E9", // soft green for completed tasks
  },
  text: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    color: "#333",
  },
  completedText: {
    textDecorationLine: "line-through",
    opacity: 0.6,
    color: "#777",
  },
  delete: {
    fontSize: 22,
    color: "#FF5252",
    marginLeft: 12,
  },
});
