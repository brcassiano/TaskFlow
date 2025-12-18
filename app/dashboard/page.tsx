'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string>('');
  const [linkCode, setLinkCode] = useState<string>('');
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [taskCount, setTaskCount] = useState<number>(0);
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  // WhatsApp number
  const WHATSAPP_NUMBER = '5511984872770';

  useEffect(() => {
    initializeUser();
  }, [searchParams]);

  // Show banner after creating first task
  useEffect(() => {
    if (!isLinked && taskCount > 0 && linkCode) {
      const bannerShown = localStorage.getItem('taskflow_banner_shown');
      if (!bannerShown) {
        setShowBanner(true);
      }
    }
  }, [taskCount, isLinked, linkCode]);

  function initializeUser() {
    try {
      // PRIORITY 1: URL parameter ?phone (from WhatsApp)
      const phoneParam = searchParams.get('phone');
      
      if (phoneParam) {
        const formattedPhone = phoneParam.includes('@s.whatsapp.net') 
          ? phoneParam 
          : `${phoneParam}@s.whatsapp.net`;
        
        localStorage.setItem('taskflow_user_id', formattedPhone);
        localStorage.setItem('taskflow_linked', 'true');
        
        setUserId(formattedPhone);
        setIsLinked(true);
        setIsLoading(false);
        return;
      }

      // PRIORITY 2: localStorage (returning user)
      const savedUserId = localStorage.getItem('taskflow_user_id');
      const savedLinked = localStorage.getItem('taskflow_linked') === 'true';
      
      if (savedUserId) {
        setUserId(savedUserId);
        setIsLinked(savedLinked);
        
        if (savedUserId.startsWith('guest-') && !savedLinked) {
          const code = savedUserId.slice(-8);
          setLinkCode(code.toUpperCase());
        }
        
        setIsLoading(false);
        return;
      }

      // PRIORITY 3: New user
      const guestId = `guest-${crypto.randomUUID()}`;
      const code = guestId.slice(-8);
      
      localStorage.setItem('taskflow_user_id', guestId);
      localStorage.setItem('taskflow_linked', 'false');
      
      setUserId(guestId);
      setIsLinked(false);
      setLinkCode(code.toUpperCase());
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error initializing user:', error);
      setIsLoading(false);
    }
  }

  function handleTaskCreated() {
    setRefreshKey(prev => prev + 1);
    setTaskCount(prev => prev + 1);
  }

  function handleTaskUpdated() {
    setRefreshKey(prev => prev + 1);
  }

  function handleTasksLoaded(count: number) {
    setTaskCount(count);
  }

  function closeBanner() {
    setShowBanner(false);
    localStorage.setItem('taskflow_banner_shown', 'true');
  }

  function getWhatsAppLink() {
    const message = `link ${linkCode}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* ==================== HEADER ==================== */}
        <header className="mb-8 text-center relative">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📝 TaskFlow
          </h1>
          <p className="text-gray-600">
            Organize your tasks simply and efficiently
          </p>

          {/* Link WhatsApp Button */}
          {!isLinked && linkCode && (
            <button
              onClick={() => setShowLinkModal(true)}
              className="absolute top-0 right-0 flex items-center gap-2 px-3 py-1.5 bg-white border border-green-300 hover:border-green-400 text-green-700 hover:text-green-800 rounded-lg text-sm font-medium transition-all hover:shadow-md"
            >
              <span className="text-lg">📱</span>
              <span>Link WhatsApp</span>
            </button>
          )}

          {/* Linked indicator */}
          {isLinked && userId.includes('@s.whatsapp.net') && (
            <div className="absolute top-0 right-0 flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-300 text-green-700 rounded-lg text-sm font-medium">
              <span className="text-lg">✅</span>
              <span>WhatsApp Linked</span>
            </div>
          )}
        </header>

        {/* ==================== BANNER: After first task ==================== */}
        {showBanner && !isLinked && linkCode && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 shadow-lg animate-slideDown">
            <button
              onClick={closeBanner}
              className="float-right text-green-600 hover:text-green-800 text-xl font-bold leading-none"
            >
              ×
            </button>
            
            <div className="flex items-start gap-3">
              <div className="text-3xl">🎉</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-1">
                  Great! First task created!
                </h3>
                <p className="text-sm text-green-800 mb-3">
                  Want to manage via WhatsApp too? Your tasks will sync automatically! ✨
                </p>
                
                <button
                  onClick={() => {
                    setShowLinkModal(true);
                    closeBanner();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  📱 Link Now
                </button>
                
                <button
                  onClick={closeBanner}
                  className="ml-2 text-green-700 hover:text-green-900 text-sm underline"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MODAL: Link WhatsApp ==================== */}
        {showLinkModal && !isLinked && linkCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-fadeIn">
              <button
                onClick={() => setShowLinkModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                ×
              </button>

              <div className="text-center mb-6">
                <div className="text-5xl mb-3">📱</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Link WhatsApp
                </h2>
                <p className="text-sm text-gray-600">
                  Manage your tasks via WhatsApp and sync everything automatically!
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5 border-2 border-green-300">
                  <p className="text-sm text-gray-700 mb-3 text-center">
                    Click the button below to open WhatsApp with your unique link code:
                  </p>
                  
                  <div className="bg-white rounded-lg px-4 py-3 border-2 border-green-400 mb-3">
                    de className="text-lg font-mono font-bold text-green-900 block text-center">
                      link {linkCode}
                    </code>
                  </div>

                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-xl">💬</span>
                      <span>Open WhatsApp</span>
                    </span>
                  </a>
                </div>

                <p className="text-xs text-gray-600 text-center">
                  💡 After linking, you'll be able to create and manage tasks directly from WhatsApp!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== FORM AND LIST ==================== */}
        <TaskForm 
          userId={userId} 
          onTaskCreated={handleTaskCreated} 
        />
        
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