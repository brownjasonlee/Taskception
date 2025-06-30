import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Todo } from '../types/todo';

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

const MAX_HISTORY_SIZE = 10; // Limit history to the last 10 changes

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [history, setHistory] = useState<Todo[][]>([initialTodos]);
  const [historyPointer, setHistoryPointer] = useState(0);

  const saveState = useCallback((newTodos: Todo[]) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, historyPointer + 1); // Truncate history if we undid
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift(); // Remove the oldest state
      }
      return [...newHistory, newTodos];
    });
    setHistoryPointer(prevPointer => Math.min(prevPointer + 1, MAX_HISTORY_SIZE));
  }, [historyPointer]);

  const undo = useCallback(() => {
    setHistoryPointer(prevPointer => {
      const newPointer = Math.max(0, prevPointer - 1);
      setTodos(history[newPointer]);
      return newPointer;
    });
  }, [history]);

  const findTodoById = useCallback((todos: Todo[], id: string): Todo | null => {
    for (const todo of todos) {
      if (todo.id === id) return todo;
      const found = findTodoById(todo.children, id);
      if (found) return found;
    }
    return null;
  }, []);

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
      return [...todos, newTodo];
    }

    return todos.map(todo => {
      if (todo.id === parentId) {
        return {
          ...todo,
          children: [...todo.children, newTodo],
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

  // New function to handle reordering
  const reorderTodos = useCallback((newTodos: Todo[]) => {
    saveState(newTodos); // Save state before reordering
    setTodos(newTodos);
  }, [saveState]);

  // Function to move a todo from one location to another
  const moveTodo = useCallback((draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => {
    setTodos(prevTodos => {
      saveState(prevTodos); // Save state before moving

      // Find and remove the dragged todo
      const draggedTodo = findTodoById(prevTodos, draggedId);
      if (!draggedTodo) return prevTodos;

      const todosWithoutDragged = removeTodoFromTree(prevTodos, draggedId);

      // If dropping at root level
      if (!targetId) {
        return [...todosWithoutDragged, draggedTodo];
      }

      // Find target todo and its parent
      const insertTodo = (todos: Todo[], targetId: string, draggedTodo: Todo, position: 'before' | 'after' | 'inside'): Todo[] => {
        for (let i = 0; i < todos.length; i++) {
          const todo = todos[i];
          
          if (todo.id === targetId) {
            if (position === 'inside') {
              // Add as child
              return todos.map(t => 
                t.id === targetId 
                  ? { ...t, children: [...t.children, draggedTodo], expanded: true }
                  : t
              );
            } else if (position === 'before') {
              // Insert before
              const newTodos = [...todos];
              newTodos.splice(i, 0, draggedTodo);
              return newTodos;
            } else {
              // Insert after
              const newTodos = [...todos];
              newTodos.splice(i + 1, 0, draggedTodo);
              return newTodos;
            }
          }
          
          // Recursively check children
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

      return insertTodo(todosWithoutDragged, targetId, draggedTodo, position);
    });
  }, [findTodoById, removeTodoFromTree, saveState]);

  const addTodo = useCallback((title: string, parentId?: string) => {
    const now = new Date();
    const newTodo: Todo = {
      id: uuidv4(),
      title,
      completed: false,
      expanded: false,
      children: [],
      createdAt: now,
      updatedAt: now
    };

    setTodos(prevTodos => {
      saveState(prevTodos); // Save state before adding
      const updated = addTodoToTree(prevTodos, parentId, newTodo);
      return sortTodos(updated);
    });
  }, [addTodoToTree, sortTodos, saveState]);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prevTodos => {
      saveState(prevTodos); // Save state before toggling
      const updated = updateTodoInTree(prevTodos, id, (todo) => {
        const canToggle = todo.children.length === 0 || isAllChildrenCompleted(todo);
        const now = new Date();
        
        if (!canToggle) return todo;
        
        const newCompleted = !todo.completed;
        
        return {
          ...todo,
          completed: newCompleted,
          updatedAt: now,
          endDate: newCompleted ? now : undefined
        };
      });
      return sortTodos(updated);
    });
  }, [updateTodoInTree, isAllChildrenCompleted, sortTodos, saveState]);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prevTodos => {
      saveState(prevTodos); // Save state before deleting
      return sortTodos(removeTodoFromTree(prevTodos, id));
    });
  }, [removeTodoFromTree, sortTodos, saveState]);

  const updateTodo = useCallback((id: string, title: string) => {
    setTodos(prevTodos => {
      saveState(prevTodos); // Save state before updating
      const updated = updateTodoInTree(prevTodos, id, (todo) => ({
        ...todo,
        title,
        updatedAt: new Date()
      }));
      return sortTodos(updated);
    });
  }, [updateTodoInTree, sortTodos, saveState]);

  const toggleExpanded = useCallback((id: string) => {
    setTodos(prevTodos => {
      saveState(prevTodos); // Save state before toggling expanded
      return updateTodoInTree(prevTodos, id, (todo) => ({
        ...todo,
        expanded: !todo.expanded,
        updatedAt: new Date()
      }));
    });
  }, [updateTodoInTree, saveState]);

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
    canUndo: historyPointer > 0
  };
};