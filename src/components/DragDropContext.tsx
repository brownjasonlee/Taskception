import React, { createContext, useContext } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
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
  onToggleExpanded,
  isAllChildrenCompleted
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 500, // 500ms delay for touch to start drag (long press)
        tolerance: 5, // Allow 5px of movement during delay
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
                onToggleExpanded={onToggleExpanded}
                isAllChildrenCompleted={isAllChildrenCompleted}
                hasCompletedParent={false}
                editingTodoId=""
                removeTodoIfEmpty={() => {}}
                delayedOverId={null}
                delayedOverPosition={null}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </DragDropContext.Provider>
  );
};