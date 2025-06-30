import React from 'react';
import { ChevronRight } from 'lucide-react';
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { Todo } from '../types/todo';
import { TodoItem } from './TodoItem';
import { TodoDragDropProvider } from './DragDropContext';
import { DRAG_DELAY_MS } from '../config/dnd';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onAddChild: (title: string, parentId: string) => void;
  onToggleExpanded: (id: string) => void;
  isAllChildrenCompleted: (todo: Todo) => boolean;
  onAddTodo: (title: string) => void;
  moveTodo: (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => void;
  editingTodoId: string | null;
  removeTodoIfEmpty: (id: string, currentTitle: string) => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onToggle,
  onDelete,
  onUpdate,
  onAddChild,
  onToggleExpanded,
  isAllChildrenCompleted,
  onAddTodo,
  moveTodo,
  editingTodoId,
  removeTodoIfEmpty
}) => {
  const [showCompleted, setShowCompleted] = React.useState(true);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activeTodo, setActiveTodo] = React.useState<Todo | null>(null);
  const [dragTimer, setDragTimer] = React.useState<NodeJS.Timeout | null>(null);

  const findTodoById = (todos: Todo[], id: string): Todo | null => {
    for (const todo of todos) {
      if (todo.id === id) return todo;
      const found = findTodoById(todo.children, id);
      if (found) return found;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const todo = findTodoById(todos, active.id as string);
    setActiveTodo(todo);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over logic for visual feedback
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (dragTimer) {
      clearTimeout(dragTimer);
      setDragTimer(null);
    }
    
    setActiveId(null);
    setActiveTodo(null);

    if (!over || active.id === over.id) return;

    const draggedId = active.id as string;
    const overId = over.id as string;

    let targetId: string | null = null;
    let position: 'before' | 'after' | 'inside' | null = null;

    if (overId.endsWith('-before')) {
      targetId = overId.replace('-before', '');
      position = 'before';
    } else if (overId.endsWith('-after')) {
      targetId = overId.replace('-after', '');
      position = 'after';
    } else if (overId.endsWith('-drop')) {
      targetId = overId.replace('-drop', '');
      position = 'inside';
    } else {
      return;
    }

    if (!targetId || !position) {
        return;
    }

    const targetTodo = findTodoById(todos, targetId);
    
    if (targetTodo && targetTodo.completed && position === 'inside') {
      return;
    }

    if (position === 'inside') {
      const timer = setTimeout(() => {
        moveTodo(draggedId, targetId, position);
      }, DRAG_DELAY_MS);
      setDragTimer(timer);
    } else {
      moveTodo(draggedId, targetId, position);
    }
  };

  if (todos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 text-lg mb-4">
          No todos yet. Click the + button in the header to add your first todo.
        </div>
      </div>
    );
  }

  const incompleteTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed);

  return (
    <TodoDragDropProvider
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      activeId={activeId}
      activeTodo={activeTodo}
      onToggle={onToggle}
      onDelete={onDelete}
      onUpdate={onUpdate}
      onAddChild={onAddChild}
      onToggleExpanded={onToggleExpanded}
      isAllChildrenCompleted={isAllChildrenCompleted}
    >
      <div className="space-y-1">
        {incompleteTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            level={0}
            onToggle={onToggle}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onAddChild={onAddChild}
            onToggleExpanded={onToggleExpanded}
            isAllChildrenCompleted={isAllChildrenCompleted}
            hasCompletedParent={false}
            editingTodoId={editingTodoId}
            removeTodoIfEmpty={removeTodoIfEmpty}
          />
        ))}

        {completedTodos.length > 0 && (
          <>
            <div className="pt-4 pb-2">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 w-full text-left text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <ChevronRight 
                  size={16}
                  className={`transition-transform duration-200 ${showCompleted ? 'rotate-90' : ''}`}
                />
                <span>Completed ({completedTodos.length})</span>
              </button>
            </div>
            {showCompleted && (
              <div className="space-y-1">
                {completedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    level={0}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                    onAddChild={onAddChild}
                    onToggleExpanded={onToggleExpanded}
                    isAllChildrenCompleted={isAllChildrenCompleted}
                    hasCompletedParent={false}
                    editingTodoId={editingTodoId}
                    removeTodoIfEmpty={removeTodoIfEmpty}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </TodoDragDropProvider>
  );
};