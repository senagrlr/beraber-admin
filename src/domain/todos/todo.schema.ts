// src/domain/todos/todo.schema.ts

// Firestore dokümanı (id hariç)
export interface TodoDoc {
  text: string;
  done: boolean;
  createdAt?: any; // Firestore Timestamp | Date
  updatedAt?: any;
}

// Domain / UI tarafında kullanılan Todo tipi
export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt?: any;
  updatedAt?: any;
}
