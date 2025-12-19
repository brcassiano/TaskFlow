'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';

interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  is_guest: boolean;
  link_code: string | null;
  created_via: string;
  created_at: string;
}

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [taskCount, setTaskCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [linkingStatus, setLinkingStatus] = useState<'idle' | 'checking' | 'linked'>('idle');

  const WHATSAPP_NUMBER = '5511984872770';

  // Carregar ou criar profile
  useEffect(() => {
    async function initProfile() {
      try {
        const phoneParam = searchParams.get('phone');
        const savedUserId = localStorage.getItem('taskflow_user_id');

        let currentUserId = savedUserId;

        // Se veio phone na URL (redirect do WhatsApp)
        if (phoneParam) {
          const formattedPhone = phoneParam.includes('@s.whatsapp.net')
            ? phoneParam
            : `${phoneParam}@s.whatsapp.net`;

          // Buscar profile pelo phone
          const res = await fetch(`/api/profiles/current?userId=${formattedPhone}`);
          const data = await res.json();

          if (data.success && data.data) {
            currentUserId = data.data.id;
            setProfile(data.data);
            localStorage.setItem('taskflow_user_id', data.data.id);
          }
        } else if (currentUserId) {
          // Buscar profile existente
          const res = await fetch(`/api/profiles/current?userId=${currentUserId}`);
          const data = await res.json();

          if (data.success && data.data) {
            setProfile(data.data);
          } else {
            // Profile não existe mais, criar novo
            currentUserId = null;
          }
        }

        // Se não tem userId ou profile não existe, criar novo guest
        if (!currentUserId) {
          const res = await fetch('/api/profiles/current', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });

          const data = await res.json();

          if (data.success && data.data) {
            currentUserId = data.data.id;
            setProfile(data.data);
            localStorage.setItem('taskflow_user_id', data.data.id);
          }
        }

        setUserId(currentUserId || '');
      } catch (err) {
        console.error('Error initializing profile:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initProfile();
  }, [searchParams]);

  // Mostrar banner de link se tiver tasks e não estiver linkado
  useEffect(() => {
    if (!profile) return;

    const isLinked = profile.phone && !profile.is_guest;

    if (isLinked || taskCount === 0) {
      setShowBanner(false);
      return;
    }

    setShowBanner(true);
  }, [taskCount, profile]);

  // Verificar status de vinculação periodicamente quando modal aberto
  useEffect(() => {
    if (!showLinkModal || !profile?.link_code) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/profiles/current?userId=${userId}`);
        const data = await res.json();

        if (data.success && data.data) {
          setProfile(data.data);

          // Se foi vinculado, fechar modal
          if (data.data.phone && !data.data.is_guest) {
            setLinkingStatus('linked');
            setTimeout(() => {
              setShowLinkModal(false);
              setRefreshKey((prev) => prev + 1);
            }, 2000);
          }
        }
      } catch (err) {
        console.error('Error checking link status:', err);
      }
    }, 3000); // Verificar a cada 3 segundos

    return () => clearInterval(interval);
  }, [showLinkModal, profile?.link_code, userId]);

  function handleTaskCreated() {
    setTaskCount((prev) => prev + 1);
    setRefreshKey((prev) => prev + 1);
  }

  function handleTaskUpdated() {
    setRefreshKey((prev) => prev + 1);
  }

  function handleTasksLoaded(count: number) {
    setTaskCount(count);
  }

  function closeBannerForever() {
    setShowBanner(false);
    localStorage.setItem('taskflow_hide_banner', 'true');
  }

  function getWhatsAppLink() {
    const text = '#to-do-list';
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }

  function getLinkCommand() {
    if (!profile?.link_code) return 'link XXXXXXXX';
    return `link ${profile.link_code}`;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // Opcional: mostrar toast de sucesso
  }

  const isLinked = profile?.phone && !profile?.is_guest;

  if (isLoading) {
    return <div className="p-8 text-center">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">📝 TaskFlow</h1>
            <p className="text-gray-600">
              Organize your tasks simply and efficiently
            </p>
          </div>

          <button
            onClick={() => {
              if (!isLinked) {
                setLinkingStatus('idle');
                setShowLinkModal(true);
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              isLinked
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-white border-green-300 text-green-700 hover:border-green-400 hover:text-green-800 hover:shadow-md'
            }`}
          >
            <span className="text-lg">📱</span>
            <span>
              {isLinked ? 'Linked to WhatsApp' : 'Link WhatsApp'}
            </span>
          </button>
        </header>

        {showBanner && !isLinked && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="text-3xl">✨</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-1">
                  Manage these tasks via WhatsApp too
                </h3>
                <p className="text-sm text-green-800 mb-3">
                  Link your number and control all your tasks directly from your
                  phone. You can unlink any time.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setShowLinkModal(true)}
                    className="bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Link WhatsApp
                  </button>
                  <button
                    onClick={closeBannerForever}
                    className="text-green-700 text-sm underline hover:text-green-800"
                  >
                    Don&apos;t show again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showLinkModal && !isLinked && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full relative shadow-2xl">
              <button
                onClick={() => setShowLinkModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors"
              >
                ×
              </button>

              {linkingStatus === 'linked' ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-green-900 mb-2">
                    Successfully Linked!
                  </h2>
                  <p className="text-gray-600">
                    Your WhatsApp is now connected to TaskFlow.
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-3">📱</div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Link WhatsApp
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Control your TaskFlow directly from your phone.
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-5 border border-green-300 mb-4">
                    <p className="text-sm font-semibold text-gray-800 mb-3">
                      Just follow these two quick steps:
                    </p>

                    <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                          1
                        </div>
                        <div className="flex-1">
                          <p className="mb-2">
                            <span className="font-semibold">Activate TaskFlow:</span>{' '}
                            send this message to the WhatsApp bot:
                          </p>

                          <button
                            type="button"
                            onClick={() => copyToClipboard('#to-do-list')}
                            className="inline-flex items-center justify-between gap-2 bg-white border border-green-300 rounded-lg px-3 py-2 text-xs font-mono text-green-900 hover:border-green-500 hover:bg-green-50 transition-colors"
                          >
                            <span>#to-do-list</span>
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700">
                              <span>Copy</span>
                              <span>📋</span>
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="mb-2">
                            <span className="font-semibold">Link your account:</span>{' '}
                            after activation, send this code to connect:
                          </p>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(getLinkCommand())}
                            className="w-full flex items-center justify-between gap-2 bg-white border border-green-300 rounded-lg px-3 py-2 text-sm font-mono text-green-900 hover:border-green-500 hover:bg-green-50 transition-colors"
                          >
                            <span className="font-bold text-base">{getLinkCommand()}</span>
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700">
                              <span>Copy</span>
                              <span>📋</span>
                            </span>
                          </button>

                          {linkingStatus === 'checking' && (
                            <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                              <span className="animate-spin">⏳</span>
                              Waiting for WhatsApp link...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <a
                      href={getWhatsAppLink()}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setLinkingStatus('checking')}
                      className="block w-full bg-green-600 text-white py-3 rounded-lg text-center text-sm font-semibold hover:bg-green-700 transition-colors mt-4"
                    >
                      Open WhatsApp with #to-do-list
                    </a>
                  </div>

                  <p className="text-[11px] text-gray-500 text-center mt-3 leading-relaxed">
                    After linking, your <span className="font-semibold">entire account</span>{' '}
                    will be connected to WhatsApp. Every task created here or via
                    WhatsApp will stay in sync.
                  </p>
                </>
              )}
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