import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface AddTodoFormProps {
  onAdd: (title: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

export const AddTodoForm: React.FC<AddTodoFormProps> = ({ 
  onAdd, 
  onCancel, 
  placeholder = "Enter todo title..." 
}) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 py-1 px-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        autoFocus
      />
      
      <button
        type="submit"
        disabled={!title.trim()}
        className="p-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-md transition-colors duration-200"
        aria-label="Add todo"
      >
        <Plus size={14} />
      </button>
      
      <button
        type="button"
        onClick={onCancel}
        className="p-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-md transition-colors duration-200"
        aria-label="Cancel"
      >
        <X size={14} />
      </button>
    </form>
  );
};