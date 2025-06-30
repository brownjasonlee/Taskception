import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Todo,
  TodoOperation,
  AddOperation,
  DeleteOperation,
  UpdateOperation,
  MoveOperation,
  ToggleCompletionOperation,
  ToggleExpansionOperation
} from '../types/todo';

const initialTodos: Todo[] = [
  {
    id: '1',
    title: 'Plan vacation',
    completed: false,
    expanded: true,
    createdAt: new Date('2024-01-01T10:00:00'),
    updatedAt: new Date('2024-01-01T10:00:00'),
    children: [
      {
        id: '2',
        title: 'Book flights',
        completed: false,
        expanded: false,
        createdAt: new Date('2024-01-01T10:30:00'),
        updatedAt: new Date('2024-01-02T14:20:00'),
        children: []
      },
      {
        id: '3',
        title: 'Find accommodation',
        completed: false,
        expanded: true,
        createdAt: new Date('2024-01-01T11:00:00'),
        updatedAt: new Date('2024-01-01T11:00:00'),
        children: [
          {
            id: '4',
            title: 'Research hotels',
            completed: false,
            expanded: false,
            createdAt: new Date('2024-01-01T11:15:00'),
            updatedAt: new Date('2024-01-03T09:45:00'),
            children: []
          },
          {
            id: '5',
            title: 'Compare prices',
            completed: false,
            expanded: false,
            createdAt: new Date('2024-01-01T11:30:00'),
            updatedAt: new Date('2024-01-01T11:30:00'),
            children: []
          }
        ]
      }
    ]
  },
  {
    id: '6',
    title: 'Complete project',
    completed: false,
    expanded: false,
    createdAt: new Date('2024-01-02T09:00:00'),
    updatedAt: new Date('2024-01-02T09:00:00'),
    children: [
      {
        id: '7',
        title: 'Write documentation',
        completed: false,
        expanded: false,
        createdAt: new Date('2024-01-02T09:15:00'),
        updatedAt: new Date('2024-01-02T09:15:00'),
        children: []
      }
    ]
  },
  {
    id: '8',
    title: 'Setup development environment',
    completed: true,
    expanded: false,
    createdAt: new Date('2023-12-15T09:00:00'),
    updatedAt: new Date('2023-12-15T17:30:00'),
    endDate: new Date('2023-12-15T17:30:00'),
    children: []
  }
];

const MAX_HISTORY_SIZE = 50; // Keep a reasonable history size

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [undoStack, setUndoStack] = useState<TodoOperation[]>([]);
  const [redoStack, setRedoStack] = useState<TodoOperation[]>([]);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);

  const recordOperation = useCallback((operation: TodoOperation) => {
    setUndoStack(prev => {
      const newStack = [...prev, operation];
      if (newStack.length > MAX_HISTORY_SIZE) {
        newStack.shift(); // Remove oldest operation if stack exceeds size
      }
      return newStack;
    });
    setRedoStack([]); // Clear redo stack on new operation
  }, []);

  const findTodoById = useCallback((todos: Todo[], id: string): Todo | null => {
    for (const todo of todos) {
      if (todo.id === id) return todo;
      const found = findTodoById(todo.children, id);
      if (found) return found;
    }
    return null;
  }, []);

  // Helper to find a todo and its parent by ID
  const findTodoAndParentById = useCallback((todos: Todo[], id: string, parentId: string | undefined = undefined, _index: number = -1, rootTodos: Todo[]): { todo: Todo | null, parent: Todo | null, index: number, parentId: string | undefined } => {
    for (let i = 0; i < todos.length; i++) {
      const todo = todos[i];
      if (todo.id === id) {
        const parent = parentId ? findTodoById(rootTodos, parentId) : null;
        return { todo, parent, index: i, parentId };
      }
      const found = findTodoAndParentById(todo.children, id, todo.id, i, rootTodos);
      if (found.todo) return found;
    }
    return { todo: null, parent: null, index: -1, parentId: undefined };
  }, [findTodoById]);

  const updateTodoInTree = useCallback((todos: Todo[], id: string, updater: (todo: Todo) => Todo): Todo[] => {
    return todos.map(todo => {
      if (todo.id === id) {
        return updater(todo);
      }
      return {
        ...todo,
        children: updateTodoInTree(todo.children, id, updater)
      };
    });
  }, []);

  const removeTodoFromTree = useCallback((todos: Todo[], id: string): Todo[] => {
    return todos.filter(todo => todo.id !== id).map(todo => ({
      ...todo,
      children: removeTodoFromTree(todo.children, id)
    }));
  }, []);

  const addTodoToTree = useCallback((todos: Todo[], parentId: string | undefined, newTodo: Todo): Todo[] => {
    if (!parentId) {
      return [newTodo, ...todos];
    }

    return todos.map(todo => {
      if (todo.id === parentId) {
        return {
          ...todo,
          children: [newTodo, ...todo.children],
          expanded: true
        };
      }
      return {
        ...todo,
        children: addTodoToTree(todo.children, parentId, newTodo)
      };
    });
  }, []);

  const isAllChildrenCompleted = useCallback((todo: Todo): boolean => {
    if (todo.children.length === 0) return true;
    return todo.children.every(child => child.completed && isAllChildrenCompleted(child));
  }, []);

  const sortTodos = useCallback((todos: Todo[]): Todo[] => {
    const incomplete = todos.filter(todo => !todo.completed);
    const completed = todos.filter(todo => todo.completed);
    
    return [
      ...incomplete.map(todo => ({
        ...todo,
        children: sortTodos(todo.children)
      })),
      ...completed.map(todo => ({
        ...todo,
        children: sortTodos(todo.children)
      }))
    ];
  }, []);

  // Undo/Redo functions
  const applyOperation = useCallback((currentTodos: Todo[], operation: TodoOperation, isRedo: boolean): Todo[] => {
    let newTodos = JSON.parse(JSON.stringify(currentTodos)); // Deep copy to avoid mutation issues

    switch (operation.type) {
      case 'add': {
        const op = operation as AddOperation;
        return removeTodoFromTree(newTodos, op.todo.id);
      }
      case 'delete': {
        const op = operation as DeleteOperation;
        if (op.todo) {
          return addTodoToTree(newTodos, op.parentId ?? undefined, op.todo);
        }
        return newTodos;
      }
      case 'update': {
        const op = operation as UpdateOperation;
        return updateTodoInTree(newTodos, op.id, (_todo) => isRedo ? op.newTodo : op.oldTodo);
      }
      case 'move': {
        const op = operation as MoveOperation;
        // For move, undo means moving it back to old position, redo means moving to new position
        const draggedTodo = findTodoById(newTodos, op.draggedId);
        if (!draggedTodo) return currentTodos; // Should not happen

        const tempTodosWithoutDragged = removeTodoFromTree(newTodos, op.draggedId);
        if (isRedo) {
            return addTodoToTree(tempTodosWithoutDragged, op.newTargetId ?? undefined, draggedTodo);
        } else {
            return addTodoToTree(tempTodosWithoutDragged, op.oldTargetId ?? undefined, draggedTodo);
        }
      }
      case 'toggleCompletion': {
        const op = operation as ToggleCompletionOperation;
        return updateTodoInTree(newTodos, op.id, (todo) => ({
          ...todo,
          completed: isRedo ? !op.oldCompleted : op.oldCompleted,
          endDate: isRedo ? (op.oldCompleted ? undefined : new Date()) : op.oldEndDate
        }));
      }
      case 'toggleExpansion': {
        const op = operation as ToggleExpansionOperation;
        return updateTodoInTree(newTodos, op.id, (todo) => ({
          ...todo,
          expanded: isRedo ? !op.oldExpanded : op.oldExpanded
        }));
      }
      default: return currentTodos;
    }
  }, [findTodoById, removeTodoFromTree, addTodoToTree, updateTodoInTree]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const lastOperation = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, prev.length - 1));

    const nextTodos = applyOperation(todos, lastOperation, false); // Apply undo
    setTodos(sortTodos(nextTodos));
    setRedoStack(prev => [...prev, lastOperation]); // Push to redo stack
  }, [undoStack, todos, applyOperation, sortTodos]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const nextOperation = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, prev.length - 1));

    const nextTodos = applyOperation(todos, nextOperation, true); // Apply redo
    setTodos(sortTodos(nextTodos));
    setUndoStack(prev => [...prev, nextOperation]); // Push to undo stack
  }, [redoStack, todos, applyOperation, sortTodos]);

  // Actions
  const addTodo = useCallback((title: string, parentId?: string) => {
    setTodos(prevTodos => {
      const newTodo: Todo = {
        id: uuidv4(),
        title,
        completed: false,
        expanded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        children: []
      };

      const newTodos = addTodoToTree(prevTodos, parentId, newTodo);
      recordOperation({
        type: 'add',
        todo: newTodo,
        parentId: parentId,
        timestamp: new Date(),
      });

      if (title === "") {
        setEditingTodoId(newTodo.id);
      }

      return sortTodos(newTodos);
    });
  }, [addTodoToTree, recordOperation, sortTodos]);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prevTodos => {
      const oldTodo = findTodoById(prevTodos, id);
      if (!oldTodo) return prevTodos;

      const canToggle = oldTodo.children.length === 0 || isAllChildrenCompleted(oldTodo);
      if (!canToggle) return prevTodos;

      const now = new Date();
      const newCompleted = !oldTodo.completed;
      const newEndDate = newCompleted ? now : undefined;

      recordOperation({
        type: 'toggleCompletion',
        timestamp: now,
        id: oldTodo.id,
        oldCompleted: oldTodo.completed,
        oldEndDate: oldTodo.endDate
      } as ToggleCompletionOperation);

      const updated = updateTodoInTree(prevTodos, id, (todo) => ({
        ...todo,
        completed: newCompleted,
        updatedAt: now,
        endDate: newEndDate
      }));
      return sortTodos(updated);
    });
  }, [updateTodoInTree, isAllChildrenCompleted, sortTodos, recordOperation, findTodoById]);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prevTodos => {
      const { todo: deletedTodo, parent: _parent, index, parentId } = findTodoAndParentById(prevTodos, id, undefined, undefined, prevTodos);
      if (!deletedTodo) return prevTodos;

      recordOperation({
        type: 'delete',
        timestamp: new Date(),
        todo: deletedTodo,
        parentId,
        previousIndex: index
      } as DeleteOperation);
      return sortTodos(removeTodoFromTree(prevTodos, id));
    });
  }, [removeTodoFromTree, sortTodos, recordOperation, findTodoAndParentById]);

  const updateTodo = useCallback((id: string, newTitle: string) => {
    setTodos(prevTodos => {
      const oldTodo = findTodoById(prevTodos, id);
      if (!oldTodo) return prevTodos;

      const now = new Date();
      const newTodo = { ...oldTodo, title: newTitle, updatedAt: now };

      recordOperation({
        type: 'update',
        timestamp: now,
        id: oldTodo.id,
        oldTodo: oldTodo,
        newTodo: newTodo
      } as UpdateOperation);

      const updated = updateTodoInTree(prevTodos, id, (todo) => ({
        ...todo,
        title: newTitle,
        updatedAt: now
      }));
      return sortTodos(updated);
    });
  }, [updateTodoInTree, sortTodos, recordOperation, findTodoById]);

  const toggleExpanded = useCallback((id: string) => {
    setTodos(prevTodos => {
      const oldTodo = findTodoById(prevTodos, id);
      if (!oldTodo) return prevTodos;

      recordOperation({
        type: 'toggleExpansion',
        timestamp: new Date(),
        id: oldTodo.id,
        oldExpanded: oldTodo.expanded
      } as ToggleExpansionOperation);

      return updateTodoInTree(prevTodos, id, (todo) => ({
        ...todo,
        expanded: !todo.expanded,
        updatedAt: new Date()
      }));
    });
  }, [updateTodoInTree, recordOperation, findTodoById]);

  const moveTodo = useCallback((draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => {
    setTodos(prevTodos => {
      const draggedTodo = findTodoById(prevTodos, draggedId);
      if (!draggedTodo) return prevTodos;

      // Capture old position for undo
      const { parent: oldParent, index: oldIndex, parentId: oldParentId } = findTodoAndParentById(prevTodos, draggedId, undefined, undefined, prevTodos);
      const oldTargetId = oldParentId; 
      let oldPosition: 'before' | 'after' | 'inside' = 'after'; 

      if (oldParent && oldIndex !== -1) {
        if (oldIndex === 0) {
          oldPosition = 'before'; 
        } else {
          oldPosition = 'after'; 
        }
      }

      const todosWithoutDragged = removeTodoFromTree(prevTodos, draggedId);

      let finalTodos: Todo[];

      if (targetId === null) {
        // Dropping at the root level
        finalTodos = [...todosWithoutDragged, draggedTodo];
      } else {
        const targetResult = findTodoAndParentById(prevTodos, targetId, undefined, undefined, prevTodos);
        const targetTodo = targetResult.todo;
        const targetParent = targetResult.parent;

        if (!targetTodo) {
          return prevTodos; // Should not happen if targetId is valid
        }

        // Prevent dropping uncompleted task directly inside a completed task
        if (position === 'inside' && targetTodo.completed && !draggedTodo.completed) {
          return prevTodos; // Do not allow the move
        }

        // Prevent dropping uncompleted task as a sibling of a task whose parent is completed
        if (targetParent && targetParent.completed && !draggedTodo.completed) {
          return prevTodos; // Do not allow the move
        }

        const insertTodo = (todos: Todo[], targetId: string, draggedTodo: Todo, position: 'before' | 'after' | 'inside'): Todo[] => {
          for (let i = 0; i < todos.length; i++) {
            const todo = todos[i];
            
            if (todo.id === targetId) {
              if (position === 'inside') {
                return todos.map(t => 
                  t.id === targetId 
                    ? { ...t, children: [...t.children, draggedTodo], expanded: true }
                    : t
                );
              } else if (position === 'before') {
                const newTodos = [...todos];
                newTodos.splice(i, 0, draggedTodo);
                return newTodos;
              } else {
                const newTodos = [...todos];
                newTodos.splice(i + 1, 0, draggedTodo);
                return newTodos;
              }
            }
            
            const updatedChildren = insertTodo(todo.children, targetId, draggedTodo, position);
            if (updatedChildren !== todo.children) {
              return todos.map(t => 
                t.id === todo.id 
                  ? { ...t, children: updatedChildren }
                  : t
              );
            }
          }
          return todos;
        };
        finalTodos = insertTodo(todosWithoutDragged, targetId!, draggedTodo, position);
      }

      recordOperation({
        type: 'move',
        timestamp: new Date(),
        draggedId: draggedId,
        oldTargetId: oldTargetId,
        oldPosition: oldPosition,
        newTargetId: targetId,
        newPosition: position
      } as MoveOperation);

      return finalTodos;
    });
  }, [findTodoById, removeTodoFromTree, recordOperation, findTodoAndParentById]);

  // This reorderTodos is currently unused but might be used if dnd-kit changes its API
  // const _reorderTodos = useCallback((newTodos: Todo[]) => {
  //   setTodos((_prevTodos) => {
  //     // This function would need to capture a 'move' operation if it were actively used
  //     return newTodos;
  //   });
  // }, []);

  const removeTodoIfEmpty = useCallback((id: string, currentTitle: string) => {
    if (currentTitle.trim() === "") {
      setTodos(prevTodos => {
        const newTodos = removeTodoFromTree(prevTodos, id);
        recordOperation({
          type: 'delete',
          todoId: id,
          timestamp: new Date(),
          // This is a simplified undo. For a full undo, you'd need to store the todo content and its original position.
          // This is acceptable for a newly created empty todo.
        } as DeleteOperation);
        return newTodos;
      });
    }
    setEditingTodoId(null);
  }, [removeTodoFromTree]);

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    toggleExpanded,
    isAllChildrenCompleted,
    moveTodo,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    editingTodoId,
    removeTodoIfEmpty
  };
};