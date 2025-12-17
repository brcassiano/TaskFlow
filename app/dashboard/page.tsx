'use client';

import { useState } from 'react';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';

export default function Dashboard() {
  const USER_ID = 'edc238a8-fc3a-43bf-a14a-6115993fb5d9';
  
  // 🔍 DEBUG
  console.log('Dashboard USER_ID:', USER_ID);
  
  const [refreshKey, setRefreshKey] = useState(0);

  function handleTaskCreated() {
    setRefreshKey(prev => prev + 1);
  }

  function handleTaskUpdated() {
    setRefreshKey(prev => prev + 1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📝 TaskFlow
          </h1>
          <p className="text-gray-600">
            Organize your tasks simply and efficiently
          </p>
        </header>

        <TaskForm userId={USER_ID} onTaskCreated={handleTaskCreated} />

        <TaskList 
          userId={USER_ID}
          refreshKey={refreshKey}
          onTaskUpdated={handleTaskUpdated}
        />
      </div>
    </div>
  );
}