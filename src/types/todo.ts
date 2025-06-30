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

// Operation-based Undo/Redo types

export type OperationType = 'add' | 'delete' | 'update' | 'move' | 'toggleCompletion' | 'toggleExpansion';

export interface BaseOperation {
  type: OperationType;
  timestamp: Date;
}

export interface AddOperation extends BaseOperation {
  type: 'add';
  todo: Todo;
  parentId?: string;
}

export interface DeleteOperation extends BaseOperation {
  type: 'delete';
  todo: Todo;
  parentId?: string;
  previousIndex?: number; // To restore position
}

export interface UpdateOperation extends BaseOperation {
  type: 'update';
  id: string;
  oldTodo: Todo;
  newTodo: Todo;
}

export interface MoveOperation extends BaseOperation {
  type: 'move';
  draggedId: string;
  oldTargetId: string | null;
  oldPosition: 'before' | 'after' | 'inside';
  newTargetId: string | null;
  newPosition: 'before' | 'after' | 'inside';
}

export interface ToggleCompletionOperation extends BaseOperation {
  type: 'toggleCompletion';
  id: string;
  oldCompleted: boolean;
  oldEndDate?: Date;
}

export interface ToggleExpansionOperation extends BaseOperation {
  type: 'toggleExpansion';
  id: string;
  oldExpanded: boolean;
}

export type TodoOperation = AddOperation | DeleteOperation | UpdateOperation | MoveOperation | ToggleCompletionOperation | ToggleExpansionOperation;