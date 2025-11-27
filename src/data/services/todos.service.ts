// src/data/services/todos.service.ts
import type { ITodosRepo } from "@/data/repositories/todos.repo";
import type { Todo } from "@/domain/todos/todo.schema";


export class TodosService {
  constructor(private repo: ITodosRepo) {}

  // UI’dan kullanılan metotlar
  listenActive(cb: (rows: Todo[]) => void) {
    return this.repo.listenActive(cb);
  }

  listenAll(cb: (rows: Todo[]) => void) {
    return this.repo.listenAll(cb);
  }

  add(text: string) {
    return this.repo.add(text);
  }

  toggle(todo: Todo) {
    return this.repo.toggle(todo);
  }
}
