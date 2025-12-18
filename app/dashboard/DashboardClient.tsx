'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';

export default function DashboardClient() {
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState<string>('');
  const [linkCode, setLinkCode] = useState<string>('');
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerShown, setBannerShown] = useState(false);

  const WHATSAPP_NUMBER = '5511984872770';

  useEffect(() => {
    initializeUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    console.log('useEffect: userId changed to:', userId);

    if (userId && userId.startsWith('guest-')) {
      console.log('Guest user - checking if link already exists');
      checkLinkStatus();
    } else if (userId && !userId.startsWith('guest-')) {
      console.log('Non-guest user, setting as linked');
      setIsLinked(true);
    }
  }, [userId]);

  // Show banner ONLY quando: não está linkado, tem 1+ tasks, é a primeira vez e não foi mostrado ainda
  useEffect(() => {
    if (!isLinked && taskCount > 0 && !bannerShown && linkCode) {
      console.log('Showing banner - first time with tasks');
      setShowBanner(true);
      setBannerShown(true);
      localStorage.setItem(`taskflow_banner_shown_${userId}`, 'true');
    }
  }, [taskCount, isLinked, linkCode, bannerShown, userId]);

  async function checkLinkStatus() {
    try {
      console.log('checkLinkStatus: Checking link status for phone:', userId);
      const res = await fetch(`/api/link?phone=${encodeURIComponent(userId)}`);
      const data = await res.json();

      console.log('checkLinkStatus: Link status response:', data);

      const linked = data.data && Array.isArray(data.data) && data.data.length > 0;
      console.log('checkLinkStatus: Is linked:', linked);

      if (linked) {
        const linkedPhoneNumber = data.data[0].phone;
        console.log('User was linked to phone:', linkedPhoneNumber);

        localStorage.setItem('taskflow_user_id', linkedPhoneNumber);
        localStorage.setItem('taskflow_linked', 'true');
        setUserId(linkedPhoneNumber);
        setIsLinked(true);
      } else {
        console.log('User is still a guest');
        setIsLinked(false);
      }

      localStorage.setItem('taskflow_linked', linked ? 'true' : 'false');
    } catch (err) {
      console.error('checkLinkStatus: Error checking link status:', err);
      setIsLinked(false);
    }
  }

  function initializeUser() {
    try {
      console.log('initializeUser: called');

      const phoneParam = searchParams.get('phone');
      console.log('initializeUser: phoneParam:', phoneParam);

      if (phoneParam) {
        const formattedPhone = phoneParam.includes('@s.whatsapp.net')
          ? phoneParam
          : `${phoneParam}@s.whatsapp.net`;

        console.log('initializeUser: Set userId to phone:', formattedPhone);
        localStorage.setItem('taskflow_user_id', formattedPhone);
        localStorage.setItem('taskflow_linked', 'true');
        setUserId(formattedPhone);
        setIsLinked(true);
        setIsLoading(false);
        return;
      }

      const savedUserId = localStorage.getItem('taskflow_user_id');
      const savedLinked = localStorage.getItem('taskflow_linked') === 'true';

      console.log('initializeUser: savedUserId:', savedUserId, 'savedLinked:', savedLinked);

      if (savedUserId) {
        setUserId(savedUserId);
        setIsLinked(savedLinked);

        // Verificar se o banner já foi mostrado para este usuário
        const bannerWasShown = localStorage.getItem(`taskflow_banner_shown_${savedUserId}`) === 'true';
        setBannerShown(bannerWasShown);

        if (savedUserId.startsWith('guest-') && !savedLinked) {
          const code = savedUserId.slice(-8);
          setLinkCode(code.toUpperCase());
        }

        setIsLoading(false);
        return;
      }

      const guestId = `guest-${crypto.randomUUID()}`;
      const code = guestId.slice(-8);

      console.log('initializeUser: Set userId to guest:', guestId);
      localStorage.setItem('taskflow_user_id', guestId);
      localStorage.setItem('taskflow_linked', 'false');
      setUserId(guestId);
      setIsLinked(false);
      setLinkCode(code.toUpperCase());
      setBannerShown(false); // Reset banner flag para novo usuário
      setIsLoading(false);
    } catch (error) {
      console.error('initializeUser: Error initializing user:', error);
      setIsLoading(false);
    }
  }

  function handleTaskCreated() {
    setRefreshKey((prev) => prev + 1);
  }

  function handleTaskUpdated() {
    setRefreshKey((prev) => prev + 1);
  }

  function handleTasksLoaded(count: number) {
    setTaskCount(count);
  }

  function closeBanner() {
    setShowBanner(false);
  }

  function getWhatsAppLink() {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      `#to-do-list link ${linkCode}`
    )}`;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8 text-center relative">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📝 TaskFlow</h1>
          <p className="text-gray-600">Organize your tasks simply and efficiently</p>

          {!isLinked && linkCode && (
            <button
              onClick={() => setShowLinkModal(true)}
              className="absolute top-0 right-0 flex items-center gap-2 px-3 py-1.5 bg-white border border-green-300 hover:border-green-400 text-green-700 hover:text-green-800 rounded-lg text-sm font-medium transition-all hover:shadow-md"
            >
              <span className="text-lg">📱</span>
              <span>Link WhatsApp</span>
            </button>
          )}

          {isLinked && (
            <div className="absolute top-0 right-0 flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-300 text-green-700 rounded-lg text-sm font-medium">
              <span className="text-lg">✅</span>
              <span>Linked</span>
            </div>
          )}
        </header>

        {showBanner && !isLinked && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🎉</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-1">
                  Great! First task created!
                </h3>
                <p className="text-sm text-green-800 mb-3">
                  Want to manage via WhatsApp too?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLinkModal(true)}
                    className="bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Link Now
                  </button>
                  <button
                    onClick={closeBanner}
                    className="text-green-700 text-sm underline hover:text-green-800"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showLinkModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full relative shadow-2xl">
              <button
                onClick={() => setShowLinkModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors"
              >
                ×
              </button>

              <div className="text-center mb-6">
                <div className="text-5xl mb-3">📱</div>
                <h2 className="text-2xl font-bold text-gray-900">Link WhatsApp</h2>
              </div>

              <div className="bg-green-50 rounded-lg p-5 border-2 border-green-300 mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Send this message to the WhatsApp bot:
                </p>
                <code className="text-lg font-mono font-bold text-green-900 block text-center mb-4 bg-white p-3 rounded border border-green-200">
                  #to-do-list link {linkCode}
                </code>
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full bg-green-600 text-white py-3 rounded-lg text-center font-medium hover:bg-green-700 transition-colors"
                >
                  Open WhatsApp
                </a>
              </div>

              <p className="text-xs text-gray-500 text-center">
                After linking, your tasks will sync automatically
              </p>
            </div>
          </div>
        )}

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