import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Share, PlusSquare, X, Sparkles, Smartphone } from 'lucide-react';
import { Button } from './ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'lumi_pwa_prompt_dismissed_at';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // 1. Verifica se já está rodando como app instalado (Standalone)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 2. Verifica se foi dispensado recentemente
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const timeSinceDismiss = Date.now() - parseInt(dismissedAt, 10);
      if (timeSinceDismiss < DISMISS_DURATION_MS) {
        return;
      }
    }

    // 3. Detecta iOS / iPadOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Captura evento no Android / Chromium
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // No iOS, se não for standalone e não foi dispensado, exibe após alguns segundos
    if (isIosDevice) {
      const timer = window.setTimeout(() => {
        setIsOpen(true);
      }, 4000);
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.clearTimeout(timer);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setIsOpen(false);
      setDeferredPrompt(null);
    } else {
      handleDismiss();
    }
  };

  if (isStandalone || !isOpen) return null;

  return (
    <>
      {/* Banner flutuante no rodapé, posicionado acima do botão de carrinho no mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className="fixed bottom-24 left-4 right-4 z-30 md:bottom-6 md:left-6 md:right-auto md:w-96 rounded-2xl bg-brand-deep/95 p-4 text-brand-bg shadow-lift backdrop-blur-md border border-brand-sand/15"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-brown border border-brand-sand/20 overflow-hidden shadow-sm">
                <img
                  src="/pwa-192x192.png"
                  alt="Lumi Imports"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> App Lumi
                  </span>
                </div>
                <p className="text-sm font-semibold text-white truncate">
                  Instale o App Lumi Imports
                </p>
                <p className="text-xs text-white/70 line-clamp-2 mt-0.5 font-light">
                  Acesso rápido em tela cheia e experiência fluida ao catálogo de fragrâncias.
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <Button
                    onClick={handleInstallClick}
                    size="sm"
                    className="h-8 px-3.5 text-xs font-medium bg-white text-brand-deep hover:bg-white/90 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isIOS ? 'Como Instalar' : 'Instalar App'}
                  </Button>
                  <button
                    onClick={handleDismiss}
                    className="text-xs text-white/60 hover:text-white px-2 py-1 transition-colors cursor-pointer"
                  >
                    Agora não
                  </button>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="text-white/40 hover:text-white transition-colors p-1 rounded-md cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal explicativo específico para Safari / iOS */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-brand-deep/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-brand-brown/10 text-brand-brown"
            >
              <div className="flex items-center justify-between border-b border-brand-brown/10 pb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-brand-brown" />
                  <h3 className="text-base font-semibold">Instalar no iPhone</h3>
                </div>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="rounded-full p-1 text-brand-brown/50 hover:bg-brand-brown/5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-xs text-brand-brown/80">
                <div className="flex items-start gap-3 rounded-xl bg-brand-surface p-3 border border-brand-brown/5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-brown/10 text-brand-brown font-bold text-xs">
                    1
                  </div>
                  <p className="pt-0.5">
                    No Safari, toque no botão <strong>Compartilhar</strong> (<Share className="w-3.5 h-3.5 inline mx-0.5 text-brand-brown" />) na barra inferior.
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-brand-surface p-3 border border-brand-brown/5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-brown/10 text-brand-brown font-bold text-xs">
                    2
                  </div>
                  <p className="pt-0.5">
                    Role a lista e selecione a opção <strong>"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-brand-brown" />).
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-brand-surface p-3 border border-brand-brown/5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-brown/10 text-brand-brown font-bold text-xs">
                    3
                  </div>
                  <p className="pt-0.5">
                    Toque em <strong>"Adicionar"</strong> no canto superior direito para finalizar.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    setShowIOSModal(false);
                    handleDismiss();
                  }}
                  className="w-full bg-brand-brown text-white hover:bg-brand-deep rounded-xl h-10 text-xs font-semibold cursor-pointer"
                >
                  Entendi
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
