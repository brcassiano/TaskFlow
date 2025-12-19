'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import TaskItem from './TaskItem';
import ConfirmModal from './ConfirmModal';
import type { Task } from '@/types';

interface TaskListProps {
  userId: string;
  refreshKey: number;
  onTaskUpdated: () => void;
  onTasksLoaded: (count: number) => void;
}

export default function TaskList({
  userId,
  refreshKey,
  onTaskUpdated,
  onTasksLoaded,
}: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // seleção para bulk delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  async function loadTasks() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/tasks?userId=${encodeURIComponent(userId)}`,
      );
      const json = await res.json();

      if (json.success) {
        const tasksList = json.data as Task[];
        setTasks(tasksList);
        onTasksLoaded(tasksList.length);
        setSelectedIds([]);
      } else {
        setError(json.error || 'Failed to load tasks');
      }
    } catch (error) {
      setError('Connection error');
      console.error('Load tasks error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId) {
      loadTasks();
    }
  }, [userId, refreshKey]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const supabase = createBrowserClient();
    console.log('Subscribing to realtime changes...');

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime event:', payload);
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [payload.new as Task, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === payload.new.id ? (payload.new as Task) : task,
              ),
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) =>
              prev.filter((task) => task.id !== payload.old.id),
            );
            setSelectedIds((prev) =>
              prev.filter((id) => id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from realtime...');
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={loadTasks}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending') return !task.is_completed;
    if (filter === 'completed') return task.is_completed;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.is_completed).length;
  const completedCount = tasks.filter((t) => t.is_completed).length;

  const showBulkControls = filteredTasks.length > 1;
  const selectAllActive =
    showBulkControls &&
    selectedIds.length > 0 &&
    selectedIds.length === filteredTasks.length;

  function toggleSelect(taskId: string) {
    setSelectedIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  }

  function handleToggleSelectAll() {
    if (!showBulkControls) return;

    if (selectAllActive) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTasks.map((t) => t.id));
    }
  }

  async function handleConfirmBulkDelete() {
    if (selectedIds.length === 0) {
      setShowBulkDeleteModal(false);
      return;
    }

    setBulkDeleting(true);
    try {
      const res = await fetch('/api/tasks/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ids: selectedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to delete selected tasks');
      } else {
        setTasks((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
        setSelectedIds([]);
        onTaskUpdated();
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      alert('Connection error');
    } finally {
      setBulkDeleting(false);
      setShowBulkDeleteModal(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtro + estatísticas + bulk actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Filtros */}
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All {tasks.length}
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending {pendingCount}
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed {completedCount}
          </button>
        </div>

        {/* Bulk actions */}
        {showBulkControls && (
          <div className="flex items-center gap-3 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={selectAllActive}
                onChange={handleToggleSelectAll}
              />
              <span className="text-gray-700">Select all</span>
            </label>

            <button
              onClick={() => setShowBulkDeleteModal(true)}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-700 text-xs font-medium"
            >
              Delete selected ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-4xl mb-4">
            {filter === 'pending'
              ? '🎉'
              : filter === 'completed'
                ? '📋'
                : '✨'}
          </p>
          <p className="text-gray-600">
            {filter === 'pending'
              ? 'Congratulations! No pending tasks.'
              : filter === 'completed'
                ? 'No completed tasks yet.'
                : 'No tasks yet. Create your first one!'}
          </p>
        </div>
      ) : (
        <div>
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={onTaskUpdated}
              onDelete={onTaskUpdated}
              bulkSelectable={showBulkControls}
              selectAllActive={selectAllActive}
              selected={selectedIds.includes(task.id)}
              onToggleSelect={() => toggleSelect(task.id)}
            />
          ))}
        </div>
      )}

      {/* Bulk delete modal reutilizando ConfirmModal */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        title="Delete Tasks"
        message={`Delete ${selectedIds.length} selected task(s)? This action cannot be undone.`}
        confirmText={bulkDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
      />
    </div>
  );
}