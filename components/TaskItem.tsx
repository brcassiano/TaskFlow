'use client';

import { useState } from 'react';
import ConfirmModal from './ConfirmModal';
import type { Task } from '@/types';

interface TaskItemProps {
  task: Task;
  onUpdate: () => void;
  onDelete: () => void;
  bulkSelectable?: boolean;
  selectAllActive?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export default function TaskItem({
  task,
  onUpdate,
  onDelete,
  bulkSelectable = false,
  selectAllActive = false,
  selected = false,
  onToggleSelect,
}: TaskItemProps) {
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
          user_id: task.user_id,
          is_completed: !task.is_completed,
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
          user_id: task.user_id,
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
        {
          method: 'DELETE',
        },
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

  const completedClasses = task.is_completed
    ? 'bg-gray-50 border-gray-200 opacity-80'
    : 'bg-white border-gray-200';

  const titleClasses = task.is_completed
    ? 'line-through text-gray-400'
    : 'text-gray-900';

  if (isEditing) {
    return (
      <>
        <div className="p-4 border rounded-lg mb-3 bg-white">
          <div className="space-y-3">
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              placeholder="Task title"
            />
            <textarea
              className="w-full border rounded px-3 py-2 text-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="Description (optional)"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={loading}
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>

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

  return (
    <>
      <div
        className={`p-4 border rounded-lg mb-3 transition-all ${completedClasses}`}
      >
        <div className="flex items-start gap-3">
          {/* Coluna de controles à esquerda */}
          <div className="flex flex-col items-center gap-2 mt-1">
            {/* Botão de complete (check) */}
            <button
              type="button"
              onClick={handleToggleComplete}
              disabled={loading}
              className={`w-7 h-7 flex items-center justify-center rounded-full border text-sm font-bold transition-colors ${
                task.is_completed
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'bg-white border-gray-300 text-gray-400 hover:border-green-500 hover:text-green-600'
              }`}
              aria-label={task.is_completed ? 'Mark as pending' : 'Mark as done'}
            >
              ✓
            </button>

            {/* Checkbox de seleção para bulk delete */}
            {bulkSelectable && selectAllActive && onToggleSelect && (
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={selected}
                onChange={onToggleSelect}
              />
            )}
          </div>

          {/* Conteúdo da task */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-lg ${titleClasses}`}>
              {task.title}
            </h3>

            {task.description && (
              <p className="text-gray-600 text-sm mt-1">{task.description}</p>
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

          {/* Ícones de edição/remoção */}
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