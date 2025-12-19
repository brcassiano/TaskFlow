'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Task, ApiResponse } from '@/types';

interface DashboardClientProps {
  userId: string;
}

type Filter = 'all' | 'open' | 'done';

export default function DashboardClient({ userId }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Link code opcional: pode vir da URL (?linkCode=XXXX) ou ser gerado no backend
  const linkCodeFromUrl = searchParams.get('linkCode') ?? '';

  // Carrega tasks via API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/tasks?userId=${encodeURIComponent(userId)}`);
      const json = (await res.json()) as ApiResponse<Task[]>;

      if (!json.success || !json.data) {
        setError(json.error ?? 'Failed to load tasks');
        setTasks([]);
        return;
      }

      setTasks(json.data);
    } catch {
      setError('Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.is_completed).length;
    const open = total - done;
    const completion = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, open, completion };
  }, [tasks]);

  // Lista filtrada
  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    if (filter === 'open') return tasks.filter((t) => !t.is_completed);
    return tasks.filter((t) => t.is_completed);
  }, [tasks, filter]);

  // Criar task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setCreating(true);
      setError(null);

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: title.trim(),
          description: description.trim() || undefined,
        }),
      });

      const json = (await res.json()) as ApiResponse<Task>;

      if (!json.success || !json.data) {
        setError(json.error ?? 'Failed to create task');
        return;
      }

      setTitle('');
      setDescription('');
      setTasks((prev) => [json.data!, ...prev]);
    } catch {
      setError('Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  // Toggle complete
  const handleToggleComplete = async (task: Task) => {
    try {
      setError(null);

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          is_completed: !task.is_completed,
        }),
      });

      const json = (await res.json()) as ApiResponse<Task>;

      if (!json.success || !json.data) {
        setError(json.error ?? 'Failed to update task');
        return;
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? json.data! : t)),
      );
    } catch {
      setError('Failed to update task');
    }
  };

  // Delete
  const handleDeleteTask = async (task: Task) => {
    try {
      setError(null);

      const url = `/api/tasks/${task.id}?userId=${encodeURIComponent(userId)}`;
      const res = await fetch(url, { method: 'DELETE' });

      const json = (await res.json()) as ApiResponse<string>;

      if (!json.success) {
        setError(json.error ?? 'Failed to delete task');
        return;
      }

      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch {
      setError('Failed to delete task');
    }
  };

  // Short id para UX / WhatsApp
  const getShortId = (id: string) => id.split('-')[0];

  const linkCode = linkCodeFromUrl || 'YOUR_LINK_CODE';

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4">
      {/* Header */}
      <header className="flex flex-col gap-2 border-b pb-4">
        <h1 className="text-2xl font-bold">TaskFlow</h1>
        <p className="text-sm text-gray-600">
          Simple to-do list with Supabase, Next.js and WhatsApp integration.
        </p>
      </header>

      {/* Status / Errors */}
      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading && (
        <div className="rounded border border-gray-200 bg-gray-50 p-2 text-sm">
          Loading tasks...
        </div>
      )}

      {/* Stats */}
      <section className="grid gap-3 rounded border border-gray-200 bg-white p-4 sm:grid-cols-4">
        <div>
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-xl font-semibold">{stats.total}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Open</div>
          <div className="text-xl font-semibold text-blue-600">
            {stats.open}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Done</div>
          <div className="text-xl font-semibold text-green-600">
            {stats.done}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Completion</div>
          <div className="text-xl font-semibold">{stats.completion}%</div>
        </div>
      </section>

      {/* Create form */}
      <section className="rounded border border-gray-200 bg-white p-4">
        <form className="flex flex-col gap-3" onSubmit={handleCreateTask}>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">New task</label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Optional description..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Add task'}
            </button>

            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded px-2 py-1 ${
                  filter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-300'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter('open')}
                className={`rounded px-2 py-1 ${
                  filter === 'open'
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-300'
                }`}
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => setFilter('done')}
                className={`rounded px-2 py-1 ${
                  filter === 'done'
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-300'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Task list */}
      <section className="rounded border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Tasks
        </h2>

        {filteredTasks.length === 0 && !loading && (
          <div className="text-sm text-gray-500">No tasks yet.</div>
        )}

        <ul className="flex flex-col gap-2">
          {filteredTasks.map((task) => (
            <li
              key={task.id}
              className="flex items-start justify-between gap-2 rounded border border-gray-200 p-3"
            >
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(task)}
                    className={`h-4 w-4 rounded border ${
                      task.is_completed ? 'bg-green-500' : 'bg-white'
                    }`}
                    aria-label="Toggle complete"
                  />
                  <span
                    className={`text-sm font-medium ${
                      task.is_completed ? 'line-through text-gray-400' : ''
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                {task.description && (
                  <p className="pl-6 text-xs text-gray-500">
                    {task.description}
                  </p>
                )}
                <p className="pl-6 text-[10px] text-gray-400">
                  ID: {getShortId(task.id)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteTask(task)}
                className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* WhatsApp integration CTA */}
      <section className="rounded border border-dashed border-green-400 bg-green-50 p-4 text-sm">
        <h2 className="mb-2 text-sm font-semibold text-green-800">
          Manage your tasks via WhatsApp
        </h2>
        <p className="mb-2 text-xs text-green-800">
          Send this message to the WhatsApp bot:
        </p>
        <pre className="mb-2 rounded bg-white p-2 text-xs">
          {`#to-do-list link ${linkCode}`}
        </pre>
        <button
          type="button"
          onClick={() => {
            // Você pode trocar por um link real da Evolution API / número
            window.open('https://wa.me/YOUR_WHATSAPP_NUMBER', '_blank');
          }}
          className="inline-flex items-center rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
        >
          Open WhatsApp
        </button>
        <p className="mt-2 text-[11px] text-green-900">
          After linking, your tasks will sync automatically between the web app
          and WhatsApp.
        </p>
      </section>
    </div>
  );
}