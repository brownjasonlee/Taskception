import React, { useState } from 'react';
import { ChevronRight, Plus, Trash2, Info } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Todo } from '../types/todo';
import { AddTodoForm } from './AddTodoForm';
import { useDragDrop } from './DragDropContext';

interface TodoItemProps {
  todo: Todo;
  level: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onAddChild: (title: string, parentId: string) => void;
  onToggleExpanded: (id: string) => void;
  isAllChildrenCompleted: (todo: Todo) => boolean;
  hasCompletedParent: boolean;
  isDragging?: boolean;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  level,
  onToggle,
  onDelete,
  onUpdate,
  onAddChild,
  onToggleExpanded,
  isAllChildrenCompleted,
  hasCompletedParent,
  isDragging = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [showTooltip, setShowTooltip] = useState(false);

  const { activeId } = useDragDrop();
  const isActive = activeId === todo.id;

  // Draggable setup
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging: isDraggingThis
  } = useDraggable({
    id: todo.id,
    disabled: isDragging || isEditing
  });

  // Droppable setup for different drop zones
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `${todo.id}-drop`,
    disabled: isDragging || isActive
  });

  const { setNodeRef: setBeforeDropRef, isOver: isOverBefore } = useDroppable({
    id: `${todo.id}-before`,
    disabled: isDragging || isActive
  });

  const { setNodeRef: setAfterDropRef, isOver: isOverAfter } = useDroppable({
    id: `${todo.id}-after`,
    disabled: isDragging || isActive
  });

  const hasChildren = todo.children.length > 0;
  const canComplete = !hasChildren || isAllChildrenCompleted(todo);
  const canUncheck = todo.completed && !hasCompletedParent;
  const indentLevel = level * 20;

  const handleEdit = () => {
    if (editTitle.trim() && editTitle !== todo.title) {
      onUpdate(todo.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditTitle(todo.title);
      setIsEditing(false);
    }
  };

  const handleDoubleClick = () => {
    if (!isDragging) {
      setIsEditing(true);
    }
  };

  const handleAddChild = (title: string) => {
    onAddChild(title, todo.id);
    setIsAddingChild(false);
  };

  const handleToggle = () => {
    if (todo.completed && !canUncheck) {
      return;
    }
    onToggle(todo.id);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Not set';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000
  } : undefined;

  if (isDraggingThis && !isDragging) {
    return (
      <div 
        style={{ marginLeft: `${indentLevel}px` }}
        className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 opacity-50"
      />
    );
  }

  return (
    <div className="todo-item group relative">
      {/* Drop indicator before */}
      <div
        ref={setBeforeDropRef}
        className={`absolute -top-1 left-0 right-0 h-2 transition-all duration-200 ${
          isOverBefore ? 'bg-blue-500 rounded-full opacity-100' : 'opacity-0'
        }`}
        style={{ marginLeft: `${indentLevel}px` }}
      />

      <div 
        ref={isDragging ? undefined : setDragRef}
        style={{ 
          marginLeft: `${indentLevel}px`,
          ...dragStyle
        }}
        className={`flex items-center gap-2 py-1 px-2 rounded-lg transition-all duration-200 cursor-grab active:cursor-grabbing ${
          isDraggingThis ? 'opacity-50' : ''
        } ${
          todo.completed 
            ? 'bg-green-50 dark:bg-green-900/20 opacity-75' 
            : 'bg-white dark:bg-gray-800'
        } ${
          isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
        }`}
        {...attributes}
        {...listeners}
      >
        <div className="w-4 flex-shrink-0">
          <button
            onClick={() => onToggleExpanded(todo.id)}
            className={`expand-button p-0.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ${
              todo.expanded ? 'expanded' : ''
            } ${!hasChildren ? 'invisible' : ''}`}
            aria-label={todo.expanded ? 'Collapse' : 'Expand'}
            disabled={!hasChildren}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <button
          onClick={handleToggle}
          disabled={!canComplete || (todo.completed && !canUncheck)}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
            todo.completed
              ? 'bg-green-500 border-green-500 text-white'
              : canComplete
              ? 'border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400'
              : 'border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50'
          } ${todo.completed && !canUncheck ? 'cursor-not-allowed opacity-50' : ''}`}
          aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
          title={todo.completed && !canUncheck ? 'Cannot uncheck while parent is completed' : ''}
        >
          {todo.completed && (
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <div 
          ref={setDropRef}
          className={`flex-1 min-w-0 transition-all duration-200 ${
            isOver ? 'bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1' : ''
          }`}
        >
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleEdit}
              onKeyDown={handleKeyPress}
              className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <span
              onDoubleClick={handleDoubleClick}
              className={`block truncate text-sm cursor-pointer select-none ${
                todo.completed
                  ? 'line-through text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-white'
              }`}
              title="Double-click to edit"
            >
              {todo.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 opacity-100 transition-opacity duration-200">
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
              aria-label="Task information"
            >
              <Info size={14} />
            </button>
            
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10">
                <div className="space-y-1">
                  <div><strong>Created:</strong> {formatDate(todo.createdAt)}</div>
                  <div><strong>Completed:</strong> {formatDate(todo.endDate)}</div>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsAddingChild(true)}
            className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
            aria-label="Add subtask"
          >
            <Plus size={14} />
          </button>
          
          <button
            onClick={() => onDelete(todo.id)}
            className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
            aria-label="Delete todo"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Drop indicator after */}
      <div
        ref={setAfterDropRef}
        className={`absolute -bottom-1 left-0 right-0 h-2 transition-all duration-200 ${
          isOverAfter ? 'bg-blue-500 rounded-full opacity-100' : 'opacity-0'
        }`}
        style={{ marginLeft: `${indentLevel}px` }}
      />

      {isAddingChild && (
        <div style={{ marginLeft: `${indentLevel + 20}px` }} className="mt-1">
          <AddTodoForm
            onAdd={handleAddChild}
            onCancel={() => setIsAddingChild(false)}
            placeholder="Enter subtask title..."
          />
        </div>
      )}

      {hasChildren && todo.expanded && (
        <div className="mt-1 space-y-1">
          {todo.children.map((child) => (
            <TodoItem
              key={child.id}
              todo={child}
              level={level + 1}
              onToggle={onToggle}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onAddChild={onAddChild}
              onToggleExpanded={onToggleExpanded}
              isAllChildrenCompleted={isAllChildrenCompleted}
              hasCompletedParent={todo.completed || hasCompletedParent}
            />
          ))}
        </div>
      )}
    </div>
  );
};