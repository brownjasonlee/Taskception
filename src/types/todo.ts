export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  children: Todo[];
  expanded: boolean;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoContextType {
  todos: Todo[];
  addTodo: (title: string, parentId?: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateTodo: (id: string, title: string) => void;
  toggleExpanded: (id: string) => void;
  reorderTodos: (todos: Todo[]) => void;
}