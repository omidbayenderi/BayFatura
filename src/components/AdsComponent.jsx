import React, { useEffect } from 'react';

const AD_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || "ca-pub-6878862794554027";
const isDev = import.meta.env.DEV;

const AdsComponent = ({ slot = "0000000000", format = "auto" }) => {
    const adRef = React.useRef(null);

    useEffect(() => {
        if (isDev) return; // Geliştirme modunda reklam yükleme
        
        const timer = setTimeout(() => {
            try {
                if (adRef.current && adRef.current.offsetWidth > 0) {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                }
            } catch {
                // Silently handle
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    if (isDev) {
        return (
            <div style={{ margin: '15px auto', textAlign: 'center', minHeight: '50px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>Ad (Dev Mode — Ads disabled)</span>
            </div>
        );
    }

    return (
        <div 
            ref={adRef}
            className="ads-container" 
            style={{ 
                margin: '15px auto', 
                textAlign: 'center', 
                background: 'transparent',
                minHeight: '50px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
            }}
        >
            <ins 
                className="adsbygoogle"
                style={{ display: 'block', minWidth: '250px', minHeight: '50px' }}
                data-ad-client={AD_CLIENT}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            ></ins>
            <span style={{ fontSize: '9px', color: '#cbd5e1', letterSpacing: '1px', textTransform: 'uppercase' }}>Anzeige</span>
        </div>
    );
};

export default AdsComponent;
