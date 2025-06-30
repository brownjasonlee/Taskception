import React from 'react';
import { ChevronRight } from 'lucide-react';
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { Todo } from '../types/todo';
import { TodoItem } from './TodoItem';
import { TodoDragDropProvider } from './DragDropContext';
import { DRAG_NEST_DELAY_MS, DRAG_REORDER_DELAY_MS } from '../config/dnd';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onAddChild: (title: string, parentId: string) => void;
  onAddSibling: (title: string, parentId: string | undefined) => void;
  onToggleExpanded: (id: string) => void;
  isAllChildrenCompleted: (todo: Todo) => boolean;
  onAddTodo: (title: string) => void;
  moveTodo: (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => void;
  editingTodoId: string | null;
  removeTodoIfEmpty: (id: string, currentTitle: string) => void;
  toggleExpanded: (id: string) => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onToggle,
  onDelete,
  onUpdate,
  onAddChild,
  onAddSibling,
  onToggleExpanded,
  isAllChildrenCompleted,
  onAddTodo: _onAddTodo,
  moveTodo,
  editingTodoId,
  removeTodoIfEmpty,
  toggleExpanded
}) => {
  const [showCompleted, setShowCompleted] = React.useState(true);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activeTodo, setActiveTodo] = React.useState<Todo | null>(null);
  const [dragTimer, setDragTimer] = React.useState<NodeJS.Timeout | null>(null);
  const [delayedOverId, setDelayedOverId] = React.useState<string | null>(null);
  const [delayedOverPosition, setDelayedOverPosition] = React.useState<'before' | 'after' | 'inside' | null>(null);

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
    const { over } = event;

    if (!over) {
      if (dragTimer) {
        clearTimeout(dragTimer);
        setDragTimer(null);
      }
      setDelayedOverId(null);
      setDelayedOverPosition(null);
      return;
    }

    const overId = over.id as string;
    let potentialPosition: 'before' | 'after' | 'inside' | null = null;
    let actualOverId: string | null = null;

    if (overId.endsWith('-before')) {
      actualOverId = overId.replace('-before', '');
      potentialPosition = 'before';
    } else if (overId.endsWith('-after')) {
      actualOverId = overId.replace('-after', '');
      potentialPosition = 'after';
    } else if (overId.endsWith('-drop')) {
      actualOverId = overId.replace('-drop', '');
      potentialPosition = 'inside';
    } else {
      // If not a specific drop zone, clear any pending delayed state
      if (dragTimer) {
        clearTimeout(dragTimer);
        setDragTimer(null);
      }
      setDelayedOverId(null);
      setDelayedOverPosition(null);
      return;
    }

    // Check if the current potential drop is different from the already delayed one
    if (actualOverId !== delayedOverId || potentialPosition !== delayedOverPosition) {
      if (dragTimer) {
        clearTimeout(dragTimer);
      }

      // Use different delays for different operations
      const delay = potentialPosition === 'inside' ? DRAG_NEST_DELAY_MS : DRAG_REORDER_DELAY_MS;

      const timer = setTimeout(() => {
        setDelayedOverId(actualOverId);
        setDelayedOverPosition(potentialPosition);
        // If moving inside or to a different parent level, also expand the target parent after a delay
        if (potentialPosition === 'inside' && actualOverId) {
          const targetTodo = findTodoById(todos, actualOverId);
          if (targetTodo && !targetTodo.expanded) {
            toggleExpanded(actualOverId);
          }
        }
      }, delay);
      setDragTimer(timer);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (dragTimer) {
      clearTimeout(dragTimer);
      setDragTimer(null);
    }
    
    setActiveId(null);
    setActiveTodo(null);

    if (!over || active.id === over.id) {
      setDelayedOverId(null);
      setDelayedOverPosition(null);
      return;
    }

    const draggedId = active.id as string;

    let targetId: string | null = null;
    let position: 'before' | 'after' | 'inside' | null = null;

    // Use the delayed over ID and position for the actual move
    targetId = delayedOverId;
    position = delayedOverPosition;

    // Reset delayed state
    setDelayedOverId(null);
    setDelayedOverPosition(null);

    if (!targetId || !position) {
        return;
    }

    const targetTodo = findTodoById(todos, targetId);
    
    if (targetTodo && targetTodo.completed && position === 'inside') {
      return;
    }

    moveTodo(draggedId, targetId, position);
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
      onAddSibling={onAddSibling}
      onToggleExpanded={onToggleExpanded}
      isAllChildrenCompleted={isAllChildrenCompleted}
    >
      <div className="todo-list-container space-y-1">
        {incompleteTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            level={0}
            onToggle={onToggle}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onAddChild={onAddChild}
            onAddSibling={onAddSibling}
            onToggleExpanded={onToggleExpanded}
            isAllChildrenCompleted={isAllChildrenCompleted}
            hasCompletedParent={false}
            editingTodoId={editingTodoId}
            removeTodoIfEmpty={removeTodoIfEmpty}
            delayedOverId={delayedOverId}
            delayedOverPosition={delayedOverPosition}
            parentId={undefined}
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
                    onAddSibling={onAddSibling}
                    onToggleExpanded={onToggleExpanded}
                    isAllChildrenCompleted={isAllChildrenCompleted}
                    hasCompletedParent={false}
                    editingTodoId={editingTodoId}
                    removeTodoIfEmpty={removeTodoIfEmpty}
                    delayedOverId={delayedOverId}
                    delayedOverPosition={delayedOverPosition}
                    parentId={undefined}
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