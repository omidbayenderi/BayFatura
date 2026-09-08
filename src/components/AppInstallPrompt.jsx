import React, { useEffect, useMemo, useState } from 'react';
import { Download, MonitorSmartphone, X, Share, MoreHorizontal } from 'lucide-react';

const DISMISS_KEY = 'bayfatura_install_prompt_dismissed';
const INSTALLED_KEY = 'bayfatura_app_installed';

const isStandalone = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
};

const getInstallSurface = () => {
    if (typeof window === 'undefined') return 'desktop';
    const ua = window.navigator.userAgent || '';
    const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    const isMobile = isIos || isAndroid || window.matchMedia?.('(max-width: 768px)')?.matches;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);

    if (isIos) return isSafari ? 'ios-safari' : 'ios-browser';
    if (isAndroid) return 'android';
    if (isMobile) return 'mobile';
    return 'desktop';
};

// iOS Safari Share icon — matches the exact icon in iOS toolbar
const IosShareIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
);

const IosInstallSheet = ({ surface, onDismiss }) => (
    <div className="ios-install-overlay" onClick={onDismiss}>
        <div className="ios-install-sheet" onClick={e => e.stopPropagation()}>
            <div className="ios-install-handle" />
            <div className="ios-install-header">
                <img src="/logo-192.png" alt="BayFatura" className="ios-install-app-icon" />
                <div>
                    <div className="ios-install-app-name">BayFatura</div>
                    <div className="ios-install-app-url">bayfatura.com</div>
                </div>
                <button className="ios-install-close" onClick={onDismiss} aria-label="Kapat">
                    <X size={18} />
                </button>
            </div>

            {surface === 'ios-safari' ? (
                <>
                    <p className="ios-install-desc">
                        Ana ekranına ekleyerek uygulama gibi kullanabilirsin. Ücretsiz, indirme gerektirmez.
                    </p>
                    <ol className="ios-install-steps">
                        <li>
                            <span className="ios-step-num">1</span>
                            <span>Alttaki araç çubuğunda <strong>Paylaş</strong> düğmesine dokun</span>
                            <span className="ios-step-icon ios-step-icon--share"><IosShareIcon /></span>
                        </li>
                        <li>
                            <span className="ios-step-num">2</span>
                            <span>Aşağı kaydırıp <strong>"Ana Ekrana Ekle"</strong> seçeneğine dokun</span>
                        </li>
                        <li>
                            <span className="ios-step-num">3</span>
                            <span>Sağ üstten <strong>"Ekle"</strong> düğmesine dokun</span>
                        </li>
                    </ol>
                    <div className="ios-install-arrow-hint">
                        <span>Paylaş butonu burada</span>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                    </div>
                </>
            ) : (
                <>
                    <p className="ios-install-desc">
                        BayFatura'yı ana ekrana eklemek için <strong>Safari</strong> ile açman gerekiyor.
                    </p>
                    <div className="ios-safari-hint">
                        <span>Sayfayı Safari'de aç, ardından Paylaş</span>
                        <span className="ios-step-icon ios-step-icon--share"><IosShareIcon /></span>
                        <span>menüsünden "Ana Ekrana Ekle"yi seç.</span>
                    </div>
                </>
            )}
        </div>
    </div>
);

const AppInstallPrompt = ({ currentUser }) => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [visible, setVisible] = useState(false);
    const [showIosSheet, setShowIosSheet] = useState(false);
    const installSurface = useMemo(() => getInstallSurface(), []);
    const isIos = installSurface.startsWith('ios');
    const isMobileFallback = ['ios-safari', 'ios-browser', 'android', 'mobile'].includes(installSurface);

    useEffect(() => {
        const dismissed = localStorage.getItem(DISMISS_KEY) === 'true';
        const installed = localStorage.getItem(INSTALLED_KEY) === 'true' || isStandalone();
        if (!currentUser || dismissed || installed) {
            setVisible(false);
            return;
        }
        if (deferredPrompt || isMobileFallback) {
            setVisible(true);
        }
    }, [currentUser, deferredPrompt, isMobileFallback]);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
        };
        const handleInstalled = () => {
            localStorage.setItem(INSTALLED_KEY, 'true');
            setVisible(false);
            setDeferredPrompt(null);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleInstalled);
        };
    }, []);

    const dismiss = () => {
        localStorage.setItem(DISMISS_KEY, 'true');
        setVisible(false);
        setShowIosSheet(false);
    };

    const install = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice?.outcome === 'accepted') {
                localStorage.setItem(INSTALLED_KEY, 'true');
                setVisible(false);
            }
            setDeferredPrompt(null);
            return;
        }
        // iOS: open the step-by-step sheet
        if (isIos) {
            setShowIosSheet(true);
            return;
        }
        // Android without beforeinstallprompt (rare): show browser menu hint
        setShowIosSheet(true);
    };

    if (!visible || !currentUser) return null;

    return (
        <>
            <div className="app-install-shell no-print" role="region" aria-label="BayFatura uygulamasını yükle">
                <div className="app-install-bar">
                    <div className="app-install-icon" aria-hidden="true">
                        <MonitorSmartphone size={18} />
                    </div>
                    <div className="app-install-copy">
                        <span className="app-install-title">BayFatura uygulamasını yükle</span>
                        <span className="app-install-subtitle">
                            Daha hızlı erişim için cihazında uygulama gibi kullan.
                        </span>
                    </div>
                    <button className="app-install-button" type="button" onClick={install}>
                        <Download size={16} />
                        <span>{deferredPrompt ? 'Yükle' : isIos ? 'Nasıl yüklenir?' : 'Yükle'}</span>
                    </button>
                    <button className="app-install-dismiss" type="button" onClick={dismiss} aria-label="Yükleme önerisini kapat">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {showIosSheet && (
                <IosInstallSheet surface={installSurface} onDismiss={() => setShowIosSheet(false)} />
            )}
        </>
    );
};

export default AppInstallPrompt;
