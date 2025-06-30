import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isIOSSafari = isIOSDevice && !(window as any).MSStream;
    setIsIOS(isIOSSafari);

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event (doesn't work on iOS Safari)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show the install prompt after a delay (better UX)
      setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    // For iOS, show manual instructions after delay
    if (isIOSSafari && !isStandalone && !isInWebAppiOS) {
      setTimeout(() => {
        if (!sessionStorage.getItem('ios-pwa-prompt-dismissed')) {
          setIsVisible(true);
        }
      }, 5000); // Longer delay for iOS
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Don't show again for this session
    const storageKey = isIOS ? 'ios-pwa-prompt-dismissed' : 'pwa-prompt-dismissed';
    sessionStorage.setItem(storageKey, 'true');
  };

  // Don't show if already installed or dismissed
  if (isInstalled || !isVisible || 
      (!deferredPrompt && !isIOS) ||
      sessionStorage.getItem(isIOS ? 'ios-pwa-prompt-dismissed' : 'pwa-prompt-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {isIOS ? (
                <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              ) : (
                <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {isIOS ? 'Add to Home Screen' : 'Install Taskception'}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                {isIOS 
                  ? 'Tap the Share button below, then "Add to Home Screen"'
                  : 'Add to your home screen for quick access and offline use'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {isIOS ? (
          // iOS instructions
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-600 font-mono">📱</span>
              <span>1. Tap the Share button in Safari</span>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-600 font-mono">➕</span>
              <span>2. Scroll down and tap "Add to Home Screen"</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-600 font-mono">🚀</span>
              <span>3. Tap "Add" to install Taskception</span>
            </div>
          </div>
        ) : (
          // Standard install button for other browsers
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 px-3 rounded-md transition-colors"
            >
              Not now
            </button>
          </div>
        )}
        
        {isIOS && (
          <button
            onClick={handleDismiss}
            className="w-full mt-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 px-3 rounded-md transition-colors"
          >
            Got it, thanks!
          </button>
        )}
      </div>
    </div>
  );
}; 