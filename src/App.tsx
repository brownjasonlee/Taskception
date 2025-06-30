import React from 'react';
import { Header } from './components/Header';
import { TodoList } from './components/TodoList';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { useTheme } from './hooks/useTheme';
import { useTodos } from './hooks/useTodos';

function App() {
  const { isDark, toggleTheme } = useTheme();
  const { 
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
    canUndo,
    canRedo,
    editingTodoId,
    removeTodoIfEmpty
  } = useTodos();

  const handleAddChild = (title: string, parentId: string) => {
    addTodo(title, parentId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header 
        isDark={isDark} 
        toggleTheme={toggleTheme}
        onUndo={undo}
        canUndo={canUndo}
        onRedo={redo}
        canRedo={canRedo}
        onAddTodo={addTodo}
      />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <TodoList
          todos={todos}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
          onUpdate={updateTodo}
          onAddChild={handleAddChild}
          onAddSibling={addTodo}
          onToggleExpanded={toggleExpanded}
          isAllChildrenCompleted={isAllChildrenCompleted}
          onAddTodo={addTodo}
          moveTodo={moveTodo}
          editingTodoId={editingTodoId}
          removeTodoIfEmpty={removeTodoIfEmpty}
          toggleExpanded={toggleExpanded}
        />
      </main>
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

export default App;