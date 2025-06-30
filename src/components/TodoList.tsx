import React, { useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { Todo } from '../types/todo';
import { TodoItem } from './TodoItem';
import { AddTodoForm } from './AddTodoForm';
import { TodoDragDropProvider } from './DragDropContext';

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
  moveTodo
}) => {
  const [showCompleted, setShowCompleted] = useState(true);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null);
  const [dragTimer, setDragTimer] = useState<NodeJS.Timeout | null>(null);

  const handleAddTodo = (title: string) => {
    onAddTodo(title);
    setIsAddingTodo(false);
  };

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
      }, 500);
      setDragTimer(timer);
    } else {
      moveTodo(draggedId, targetId, position);
    }
  };

  if (todos.length === 0 && !isAddingTodo) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 text-lg mb-4">
          No todos yet
        </div>
        <button
          onClick={() => setIsAddingTodo(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
        >
          <Plus size={16} />
          Add your first todo
        </button>
        {isAddingTodo && (
          <div className="mt-4 max-w-sm mx-auto">
            <AddTodoForm
              onAdd={handleAddTodo}
              onCancel={() => setIsAddingTodo(false)}
              placeholder="Enter todo title..."
            />
          </div>
        )}
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
        <div className="mb-4">
          {!isAddingTodo ? (
            <button
              onClick={() => setIsAddingTodo(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200"
            >
              <Plus size={16} />
              <span>Add new todo...</span>
            </button>
          ) : (
            <AddTodoForm
              onAdd={handleAddTodo}
              onCancel={() => setIsAddingTodo(false)}
              placeholder="Enter todo title..."
            />
          )}
        </div>

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
                  size={14} 
                  className={`transition-transform duration-200 ${showCompleted ? 'rotate-90' : ''}`}
                />
                <span>Completed ({completedTodos.length})</span>
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600 ml-2"></div>
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