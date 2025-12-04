
import { useState, useEffect } from "react";
import { db } from "@/app/(tabs)/firebase";
import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  where,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuth"; // our login/signup hook

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const COLLECTION_NAME = "AppCollection";

export const useTodos = () => {
  const { user } = useAuth(); // get logged-in user
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    if (!user?.email) return; // only fetch if user logged in

    const colRef = collection(db, COLLECTION_NAME);

    // query to filter todos by user's email
    const q = query(colRef, where("email", "==", user.email));

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const todosData: Todo[] = snapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        completed: doc.data().completed,
      }));
      setTodos(todosData);
    });

    return unsubscribe;
  }, [user]);

  const addTodo = async (text: string) => {
    if (!text.trim() || !user?.email) return;

    try {
      const colRef = collection(db, COLLECTION_NAME);
      await addDoc(colRef, {
        text,
        completed: false,
        email: user.email, // save user's email
      });
    } catch (err) {
      console.error("Error adding todo:", err);
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { completed: !todo.completed });
    } catch (err) {
      console.error("Error toggling todo:", err);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting todo:", err);
    }
  };

  return { todos, addTodo, toggleTodo, deleteTodo };
};
