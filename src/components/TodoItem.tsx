import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Plus, Trash2, Info } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { TodoItemProps } from '../types/todo';
import { useDragDrop } from './DragDropContext';

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  level,
  onToggle,
  onDelete,
  onUpdate,
  onAddChild,
  onAddSibling,
  onToggleExpanded,
  isAllChildrenCompleted,
  hasCompletedParent,
  editingTodoId,
  removeTodoIfEmpty,
  delayedOverId,
  delayedOverPosition,
  parentId
}) => {
  const [isEditing, setIsEditing] = useState(editingTodoId === todo.id);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [showTooltip, setShowTooltip] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [swipeState, setSwipeState] = useState<{
    isSwipping: boolean;
    startX: number;
    startY: number;
    startTime: number;
  }>({
    isSwipping: false,
    startX: 0,
    startY: 0,
    startTime: 0
  });
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTodoId === todo.id && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingTodoId, todo.id]);

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
    disabled: isActive || isEditing
  });

  const hasChildren = todo.children.length > 0;
  // Calculate completion status for subtasks
  const completedChildrenCount = todo.children.filter(child => child.completed).length;
  const totalChildrenCount = todo.children.length;
  const showCompletionIndicator = hasChildren && totalChildrenCount > 0;

  // Droppable setup for different drop zones
  const {
    setNodeRef: setDropRefInside,
    // isOver: isOverInside // No longer directly used, relies on delayedOverId
  } = useDroppable({
    id: `${todo.id}-drop`,
    disabled: isDraggingThis || isActive || todo.completed
  });

  const {
    setNodeRef: setDropRefBefore,
    // isOver: isOverBefore // No longer directly used, relies on delayedOverId
  } = useDroppable({
    id: `${todo.id}-before`,
    disabled: isDraggingThis || isActive || todo.completed
  });

  const {
    setNodeRef: setDropRefAfter,
    // isOver: isOverAfter // No longer directly used, relies on delayedOverId
  } = useDroppable({
    id: `${todo.id}-after`,
    disabled: isDraggingThis || isActive || todo.completed
  });

  const canComplete = !hasChildren || isAllChildrenCompleted(todo);
  const canUncheck = todo.completed && !hasCompletedParent;
  const indentLevel = level * 12; // Reduced from 16px to 12px per level

  // Only handle swipe gestures in edit mode - let dnd-kit handle drag detection otherwise
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only track swipes when editing to avoid interfering with drag
    if (isEditing && !isDraggingThis) {
      const touch = e.touches[0];
      setSwipeState({
        isSwipping: false,
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now()
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Only process swipes when editing
    if (isEditing && !isDraggingThis && e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - swipeState.startX;
      const deltaY = touch.clientY - swipeState.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Mark as swiping if moved more than 20px
      if (distance > 20) {
        setSwipeState(prev => ({ ...prev, isSwipping: true }));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const currentTime = Date.now();
    
    // Handle swipe gestures (only in edit mode and if we actually swiped)
    if (isEditing && swipeState.isSwipping) {
      const swipeDuration = currentTime - swipeState.startTime;
      
      if (swipeDuration < 500) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - swipeState.startX;
        const deltaY = touch.clientY - swipeState.startY;
        
        // Check if it's primarily a horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
          e.preventDefault();
          
          if (deltaX > 0) {
            // Swipe right while editing = create child (Tab behavior)
            // Save current changes first - only update if there's content
            if (editTitle.trim() !== "" && editTitle !== todo.title) {
              onUpdate(todo.id, editTitle.trim());
            }
            setIsEditing(false);
            
            // Only create child if current todo has content
            if (todo.title.trim() !== "" || editTitle.trim() !== "") {
              // Expand parent to show new child
              if (!todo.expanded) {
                onToggleExpanded(todo.id);
              }
              
              // Create child todo and provide haptic feedback
              onAddChild("", todo.id);
              if (navigator.vibrate) {
                navigator.vibrate(50); // Light haptic feedback
              }
            }
          }
          // Note: Could add swipe left for outdent/unindent in the future
        }
      }
    }
    
    setSwipeState(prev => ({ ...prev, isSwipping: false }));
  };

  const handleEdit = () => {
    if (editTitle.trim() === "") {
      removeTodoIfEmpty(todo.id, editTitle);
    } else if (editTitle !== todo.title) {
      onUpdate(todo.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Save current changes - only update if there's content
      if (editTitle.trim() !== "" && editTitle !== todo.title) {
        onUpdate(todo.id, editTitle.trim());
      }
      setIsEditing(false);
      
      // Only create new sibling if current todo has content
      if (todo.title.trim() !== "" || editTitle.trim() !== "") {
        onAddSibling("", parentId);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Save current changes - only update if there's content
      if (editTitle.trim() !== "" && editTitle !== todo.title) {
        onUpdate(todo.id, editTitle.trim());
      }
      setIsEditing(false);
      
      // Only create child if current todo has content
      if (todo.title.trim() !== "" || editTitle.trim() !== "") {
        // Expand parent to show new child
        if (!todo.expanded) {
          onToggleExpanded(todo.id);
        }
        onAddChild("", todo.id);
      }
    } else if (e.key === 'Escape') {
      if (todo.title === "") {
        removeTodoIfEmpty(todo.id, todo.title);
      } else {
        setEditTitle(todo.title);
      }
      setIsEditing(false);
    }
  };

  const handleDoubleClick = () => {
    if (!isDraggingThis) {
      setIsEditing(true);
    }
  };

  const handleAddChildClick = () => {
    onAddChild("", todo.id);
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

  const showDropHighlight = delayedOverId === todo.id;
  const showDropHighlightInside = showDropHighlight && delayedOverPosition === 'inside';
  const showDropHighlightBefore = showDropHighlight && delayedOverPosition === 'before';
  const showDropHighlightAfter = showDropHighlight && delayedOverPosition === 'after';



  if (isDraggingThis && !isActive) {
    return (
      <div 
        style={{ marginLeft: `${indentLevel}px` }}
        className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 opacity-50"
      />
    );
  }

  return (
    <div className={`todo-item group relative ${isEditing ? 'editing' : ''}`}>
      {/* Before drop zone - invisible area above the todo item */}
      <div
        ref={setDropRefBefore}
        className={`absolute top-0 left-0 right-0 h-2 -mt-1 z-20 ${
          showDropHighlightBefore ? 'bg-blue-100 dark:bg-blue-900' : ''
        }`}
        style={{ marginLeft: `${indentLevel}px` }}
      />
      
      {/* Visual indicator for before drop */}
      {showDropHighlightBefore && (
        <div 
          className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full -mt-0.25 z-30"
          style={{ marginLeft: `${indentLevel}px` }}
        />
      )}
      
      <div 
        ref={(node) => {
          setDragRef(node);
          setDropRefInside(node);
        }}
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
          showDropHighlightInside ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
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
          className={`flex-1 min-w-0 transition-all duration-200 `}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleEdit}
              onKeyDown={handleKeyPress}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ touchAction: 'manipulation' }}
              autoFocus
            />
          ) : (
            <span
              onDoubleClick={handleDoubleClick}
              onTouchEnd={(e) => {
                const currentTime = Date.now();
                if (currentTime - lastTapTime < 300) {
                  e.preventDefault();
                  if (!isDraggingThis) {
                    setIsEditing(true);
                  }
                }
                setLastTapTime(currentTime);
              }}
              className={`block truncate text-sm cursor-pointer select-none ${
                todo.completed
                  ? 'line-through text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-white'
              }`}
              title="Double-click or double-tap to edit • Hold down to drag"
            >
              {todo.title}
              {showCompletionIndicator && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  ({completedChildrenCount}/{totalChildrenCount})
                </span>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 min-w-[72px]">
          {!todo.completed && (
            <button
              onClick={handleAddChildClick}
              className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
              aria-label="Add child todo"
            >
              <Plus size={14} />
            </button>
          )}
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
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 p-2 rounded-lg shadow-lg text-xs text-gray-700 dark:text-gray-200 z-10">
                <p className="font-semibold">Created:</p>
                <p>{formatDate(todo.createdAt)}</p>
                <p className="font-semibold mt-2">Last Updated:</p>
                <p>{formatDate(todo.updatedAt)}</p>
                {todo.endDate && (
                  <>
                    <p className="font-semibold mt-2">Completed:</p>
                    <p>{formatDate(todo.endDate)}</p>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => onDelete(todo.id)}
            className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
            aria-label="Delete todo"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      {/* After drop zone - invisible area below the todo item */}
      <div
        ref={setDropRefAfter}
        className={`absolute bottom-0 left-0 right-0 h-2 -mb-1 z-20 ${
          showDropHighlightAfter ? 'bg-blue-100 dark:bg-blue-900' : ''
        }`}
        style={{ marginLeft: `${indentLevel}px` }}
      />
      
      {/* Visual indicator for after drop */}
      {showDropHighlightAfter && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full -mb-0.25 z-30"
          style={{ marginLeft: `${indentLevel}px` }}
        />
      )}
      
      {todo.expanded && hasChildren && (
        <div 
          className="pt-1 relative"
        >
          {/* Vertical line positioned at the current level */}
          <div 
            className="absolute top-0 bottom-0 border-l border-gray-200 dark:border-gray-700"
            style={{ left: `${indentLevel}px` }}
          />
          <div className="space-y-1">
            {todo.children.map((childTodo) => (
              <TodoItem
                key={childTodo.id}
                todo={childTodo}
                level={level + 1}
                onToggle={onToggle}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onAddChild={onAddChild}
                onAddSibling={onAddSibling}
                onToggleExpanded={onToggleExpanded}
                isAllChildrenCompleted={isAllChildrenCompleted}
                hasCompletedParent={todo.completed || hasCompletedParent}
                editingTodoId={editingTodoId}
                removeTodoIfEmpty={removeTodoIfEmpty}
                delayedOverId={delayedOverId}
                delayedOverPosition={delayedOverPosition}
                parentId={todo.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};