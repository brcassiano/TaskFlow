'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [taskCount, setTaskCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const phoneParam = searchParams.get('phone');
    const savedUserId = localStorage.getItem('taskflow_user_id');

    if (phoneParam) {
      const formattedPhone = phoneParam.includes('@s.whatsapp.net') 
        ? phoneParam 
        : `${phoneParam}@s.whatsapp.net`;
      setUserId(formattedPhone);
      localStorage.setItem('taskflow_user_id', formattedPhone);
    } else if (savedUserId) {
      setUserId(savedUserId);
    } else {
      const newGuestId = `guest-${crypto.randomUUID()}`;
      setUserId(newGuestId);
      localStorage.setItem('taskflow_user_id', newGuestId);
    }
    setIsLoading(false);
  }, [searchParams]);

  function handleTaskCreated() {
    setRefreshKey(prev => prev + 1);
  }

  function handleTaskUpdated() {
    setRefreshKey(prev => prev + 1);
  }

  function handleTasksLoaded(count: number) {
    setTaskCount(count);
  }

  if (isLoading) return <div className="p-8 text-center">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold">📝 TaskFlow</h1>
          <p className="text-gray-600">User ID: {userId}</p>
        </header>

        <TaskForm userId={userId} onTaskCreated={handleTaskCreated} />

        <TaskList 
          userId={userId}
          refreshKey={refreshKey}
          onTaskUpdated={handleTaskUpdated}
          onTasksLoaded={handleTasksLoaded}
        />
      </div>
    </div>
  );
}