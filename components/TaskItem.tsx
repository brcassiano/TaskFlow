'use client';

import { useState } from 'react';
import ConfirmModal from './ConfirmModal';
import type { Task } from '@/types';

interface TaskItemProps {
  task: Task;
  onUpdate: () => void;
  onDelete: () => void;
}

export default function TaskItem({ task, onUpdate, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [loading, setLoading] = useState(false);

  async function handleToggleComplete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: task.user_id,
          isCompleted: !task.is_completed,
        }),
      });

      if (res.ok) {
        onUpdate();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update task');
      }
    } catch (error) {
      alert('Connection error');
      console.error('Toggle error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!title.trim()) {
      alert('Title cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: task.user_id,
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        onUpdate();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save');
      }
    } catch (error) {
      alert('Connection error');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCancelEdit() {
    setTitle(task.title);
    setDescription(task.description || '');
    setIsEditing(false);
  }

  function handleDeleteClick() {
    setShowDeleteModal(true);
  }

  async function handleConfirmDelete() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tasks/${task.id}?userId=${encodeURIComponent(task.user_id)}`,
        { method: 'DELETE' },
      );

      if (res.ok) {
        setShowDeleteModal(false);
        onDelete();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (error) {
      alert('Connection error');
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCancelDelete() {
    setShowDeleteModal(false);
  }

  if (isEditing) {
    return (
      <div className="p-4 border-2 border-blue-300 rounded-lg mb-3 bg-blue-50">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded mb-2 font-medium"
          placeholder="Task title"
          disabled={loading}
          autoFocus
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded mb-3 text-sm"
          placeholder="Description (optional)"
          rows={2}
          disabled={loading}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSaveEdit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '...' : '✓ Save'}
          </button>
          <button
            onClick={handleCancelEdit}
            disabled={loading}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 disabled:opacity-50"
          >
            ✕ Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`p-4 border rounded-lg mb-3 transition-all ${
          task.is_completed
            ? 'bg-gray-50 border-gray-300'
            : 'bg-white border-gray-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={task.is_completed}
            onChange={handleToggleComplete}
            disabled={loading}
            className="w-5 h-5 mt-1 cursor-pointer"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className={`font-medium text-lg ${
                task.is_completed
                  ? 'line-through text-gray-500'
                  : 'text-gray-900'
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="text-gray-600 text-sm mt-1">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <span>
                {new Date(task.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {task.updated_at !== task.created_at && (
                <span className="text-blue-500">• edited</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              disabled={task.is_completed || loading}
              className="text-blue-600 hover:text-blue-800 disabled:opacity-30 text-xl"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={loading}
              className="text-red-600 hover:text-red-800 text-xl disabled:opacity-30"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmação */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}