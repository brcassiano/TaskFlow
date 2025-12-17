'use client';

import { useState } from 'react';

interface TaskFormProps {
  userId: string;
  onTaskCreated: () => void;
}

export default function TaskForm({ userId, onTaskCreated }: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId, 
          title: title.trim(), 
          description: description.trim() || null 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Reset form
        setTitle('');
        setDescription('');
        setShowDescription(false);
        setError('');
        setIsOpen(false);
        onTaskCreated(); // Trigger refresh
      } else {
        setError(data.error || 'Failed to create task');
      }
    } catch (error) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setTitle('');
    setDescription('');
    setShowDescription(false);
    setError('');
    setIsOpen(false);
  }

  // Se não está aberto, mostra apenas o botão
  if (!isOpen) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-blue-600 text-white p-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span>
          New Task
        </button>
      </div>
    );
  }

  // Quando aberto, mostra o formulário completo
  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6 border-2 border-blue-500">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-blue-600">+</span> New Task
        </h2>
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50"
        >
          ✕
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What do you need to do?"
        className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
        disabled={loading}
        autoFocus
      />
      
      {/* Link para mostrar descrição */}
      {!showDescription ? (
        <button
          type="button"
          onClick={() => setShowDescription(true)}
          disabled={loading}
          className="text-blue-600 hover:text-blue-700 text-sm mb-4 flex items-center gap-1 disabled:opacity-50"
        >
          <span>+</span> Add notes/description
        </button>
      ) : (
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details (optional)..."
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
          rows={3}
          disabled={loading}
          autoFocus
        />
      )}
      
      {/* Botões alinhados à direita com tamanho proporcional */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim() || loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '...' : '✓ Create Task'}
        </button>
      </div>
    </form>
  );
}