'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import TaskItem from './TaskItem';
import type { Task } from '@/types';

interface TaskListProps {
  userId: string;
  refreshKey: number;
  onTaskUpdated: () => void;
  onTasksLoaded: (count: number) => void;
}

export default function TaskList({ userId, refreshKey, onTaskUpdated, onTasksLoaded }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  async function loadTasks() {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/tasks?user_id=${encodeURIComponent(userId)}`);
      const json = await res.json();
      
      if (json.success) {
        const tasksList = json.data || [];
        setTasks(tasksList);
        onTasksLoaded(tasksList.length);
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

  // 🔥 Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const supabase = createBrowserClient();

    console.log('🔔 Subscribing to realtime changes...');

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 Realtime event:', payload);

          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as Task, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev =>
              prev.map(task =>
                task.id === payload.new.id ? (payload.new as Task) : task
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Unsubscribing from realtime...');
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p className="font-medium">❌ {error}</p>
        <button 
          onClick={loadTasks}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return !task.is_completed;
    if (filter === 'completed') return task.is_completed;
    return true;
  });

  const pendingCount = tasks.filter(t => !t.is_completed).length;
  const completedCount = tasks.filter(t => t.is_completed).length;

  return (
    <div>
      {/* Statistics - Unified with filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex items-center gap-3">
          {/* Filters with counters - Left side only */}
          <div className="flex gap-2">
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
        </div>
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-4xl mb-4">
            {filter === 'pending' && '🎉'}
            {filter === 'completed' && '📝'}
            {filter === 'all' && '📭'}
          </p>
          <p className="text-gray-600">
            {filter === 'pending' && 'Congratulations! No pending tasks.'}
            {filter === 'completed' && 'No completed tasks yet.'}
            {filter === 'all' && 'No tasks yet. Create your first one!'}
          </p>
        </div>
      ) : (
        <div>
          {filteredTasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onUpdate={onTaskUpdated}
              onDelete={onTaskUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}