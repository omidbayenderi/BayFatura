import { useEffect } from 'react';

/**
 * SEO AGENT 🕵️‍♂️
 * 
 * Bu bileşen arka planda çalışan bir "Yapay Zeka" gibi davranır.
 * Kullanıcının girdiği verileri (başlıklar, hizmetler, iletişim) analiz eder
 * ve Google/Bing/LLM'lerin anlayacağı en optimize SEO etiketlerini ve
 * JSON-LD yapısal verilerini otomatik olarak oluşturur.
 */
const SeoAgent = ({ websiteData, profile }) => {

    useEffect(() => {
        if (!websiteData) return;

        // 1. DATA EXTRACTION & INTELLIGENCE
        // ------------------------------------------------
        const companyName = profile?.companyName || websiteData.hero?.title || 'İşletme Adı';
        const rawDescription = websiteData.sections?.find(s => s.type === 'text')?.data?.text ||
            websiteData.hero?.subtitle ||
            "Profesyonel hizmetler ve kaliteli çözümler.";

        // Remove HTML tags for meta description
        const cleanDescription = rawDescription.replace(/<[^>]*>?/gm, '').substring(0, 160).trim();

        // Extract Keywords from Features/Services
        const serviceKeywords = websiteData.sections
            ?.filter(s => s.type === 'features')
            .flatMap(s => s.data.items?.map(i => i.title))
            .filter(Boolean)
            .join(', ');

        const baseKeywords = `${companyName}, ${profile?.industry || 'Hizmet'}, ${serviceKeywords || ''}, profesyonel, kaliteli, uygun fiyat`;

        // 2. DOM MANIPULATION (META TAGS)
        // ------------------------------------------------

        // Title
        document.title = `${companyName} | Profesyonel Hizmetler`;

        // Meta Tags Helper
        const setMeta = (name, content) => {
            let element = document.querySelector(`meta[name="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.name = name;
                document.head.appendChild(element);
            }
            element.content = content || '';
        };

        const setOgMeta = (property, content) => {
            let element = document.querySelector(`meta[property="${property}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('property', property);
                document.head.appendChild(element);
            }
            element.content = content || '';
        };

        // Standard SEO
        setMeta('description', cleanDescription);
        setMeta('keywords', baseKeywords);
        setMeta('robots', 'index, follow');
        setMeta('author', companyName);
        setMeta('geo.region', 'TR'); // Varsayılan TR, dinamik yapılabilir
        if (profile?.city) setMeta('geo.placename', profile.city);

        // Open Graph (Social Media & Sharing)
        setOgMeta('og:title', companyName);
        setOgMeta('og:description', cleanDescription);
        setOgMeta('og:type', 'website');
        setOgMeta('og:site_name', companyName);
        // Hero image as OG Image if available
        if (websiteData.hero?.image) {
            setOgMeta('og:image', websiteData.hero.image);
        }

        // Twitter Card
        setMeta('twitter:card', 'summary_large_image');
        setMeta('twitter:title', companyName);
        setMeta('twitter:description', cleanDescription);


        // 3. STRUCTURED DATA (JSON-LD) for GOOGLE & LLMs
        // ------------------------------------------------
        // Bu bölüm, Google'ın "Bu bir işletmedir" diye anlaması için kritiktir.
        // LLM'ler (ChatGPT vb.) bu veriyi okuyarak işletmeyi tanır.

        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": companyName,
            "image": websiteData.hero?.image || "",
            "description": cleanDescription,
            "telephone": profile?.phone || "",
            "email": profile?.email || "",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": profile?.address || "",
                "addressLocality": profile?.city || "",
                "addressCountry": "TR"
            },
            "url": window.location.href,
            "openingHoursSpecification": [
                {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "opens": "09:00",
                    "closes": "18:00"
                }
            ],
            "priceRange": "₺₺",
            "potentialAction": {
                "@type": "ReserveAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${window.location.origin}/booking`,
                    "inLanguage": "tr-TR",
                    "actionPlatform": [
                        "http://schema.org/DesktopWebPlatform",
                        "http://schema.org/IOSPlatform",
                        "http://schema.org/AndroidPlatform"
                    ]
                },
                "result": {
                    "@type": "Reservation",
                    "name": "Randevu Al"
                }
            },
            ...(websiteData.sections?.some(s => s.type === 'features') && {
                "hasOfferCatalog": {
                    "@type": "OfferCatalog",
                    "name": "Hizmetlerimiz",
                    "itemListElement": websiteData.sections
                        .filter(s => s.type === 'features')
                        .flatMap(s => s.data.items || [])
                        .map((item, index) => ({
                            "@type": "Offer",
                            "itemOffered": {
                                "@type": "Service",
                                "name": item.title,
                                "description": item.desc
                            }
                        }))
                }
            })
        };

        // Inject JSON-LD
        let scriptTag = document.getElementById('seo-json-ld');
        if (!scriptTag) {
            scriptTag = document.createElement('script');
            scriptTag.id = 'seo-json-ld';
            scriptTag.type = 'application/ld+json';
            document.head.appendChild(scriptTag);
        }
        scriptTag.text = JSON.stringify(jsonLd);

        console.log("🕵️‍♂️ SEO Agent: Site başarıyla optimize edildi.", { title: document.title, keywords: baseKeywords });

        // 4. ANALYTICS INJECTION (Google Analytics)
        // ------------------------------------------------
        const analyticsId = websiteData.config?.analyticsId || profile?.analyticsId;

        // Clean up previous script if ID changes or is removed
        const existingScript = document.getElementById('ga-script');
        const existingConfig = document.getElementById('ga-config');

        if (analyticsId && !existingScript) {
            // Inject gtag.js
            const script = document.createElement('script');
            script.id = 'ga-script';
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
            document.head.appendChild(script);

            // Inject config
            const configScript = document.createElement('script');
            configScript.id = 'ga-config';
            configScript.innerHTML = `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${analyticsId}');
             `;
            document.head.appendChild(configScript);
            console.log(`📊 SEO Agent: Google Analytics (${analyticsId}) injected.`);
        }


    }, [websiteData, profile]); // Re-run whenever data changes

    return null; // This component renders nothing visually
};

export default SeoAgent;
