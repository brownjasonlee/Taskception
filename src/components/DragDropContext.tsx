import React, { createContext, useContext } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  MeasuringStrategy
} from '@dnd-kit/core';
import { TodoItem } from './TodoItem';
import { Todo } from '../types/todo';

interface DragDropContextProps {
  children: React.ReactNode;
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  activeId: string | null;
  activeTodo: Todo | null;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onAddChild: (title: string, parentId: string) => void;
  onAddSibling: (title: string, parentId: string | undefined) => void;
  onToggleExpanded: (id: string) => void;
  isAllChildrenCompleted: (todo: Todo) => boolean;
}

const DragDropContext = createContext<{
  activeId: string | null;
  overId: string | null;
  dropPosition: 'before' | 'after' | 'inside' | null;
}>({
  activeId: null,
  overId: null,
  dropPosition: null
});

export const useDragDrop = () => useContext(DragDropContext);

export const TodoDragDropProvider: React.FC<DragDropContextProps> = ({
  children,
  onDragStart,
  onDragOver,
  onDragEnd,
  activeId,
  activeTodo,
  onToggle,
  onDelete,
  onUpdate,
  onAddChild,
  onAddSibling,
  onToggleExpanded,
  isAllChildrenCompleted
}) => {
  // Prevent scrolling during drag operations
  React.useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      if (activeId) {
        e.preventDefault();
      }
    };

    if (activeId) {
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.body.style.overflow = 'hidden';
      // Haptic feedback for drag start
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } else {
      document.removeEventListener('touchmove', preventScroll);
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('touchmove', preventScroll);
      document.body.style.overflow = '';
    };
  }, [activeId]);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 500, // 500ms delay for touch to start drag (long press)
        tolerance: 10, // Allow 10px of movement during delay for touch precision
      },
    })
  );

  const measuring = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  };

  return (
    <DragDropContext.Provider value={{ activeId, overId: null, dropPosition: null }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        measuring={measuring}
      >
        {children}
        <DragOverlay>
          {activeId && activeTodo ? (
            <div className="opacity-90 transform rotate-2 shadow-lg">
              <TodoItem
                todo={activeTodo}
                level={0}
                onToggle={onToggle}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onAddChild={onAddChild}
                onAddSibling={onAddSibling}
                onToggleExpanded={onToggleExpanded}
                isAllChildrenCompleted={isAllChildrenCompleted}
                hasCompletedParent={false}
                editingTodoId=""
                removeTodoIfEmpty={() => {}}
                delayedOverId={null}
                delayedOverPosition={null}
                parentId={undefined}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </DragDropContext.Provider>
  );
};