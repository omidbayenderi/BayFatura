import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Globe, Mail, MapPin, Star, Award, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Impressum — Legally required in EU/DE for commercial websites (TMG §5)
 * Also required in Portugal for commercial entities
 * Enhanced with BayEnderi partnership presentation
 * Language-sensitive content
 */
const Impressum = () => {
    const { t, LANGUAGES, appLanguage, setAppLanguage } = useLanguage();
    
    const impressumTranslations = {
        de: {
            title: 'Impressum & Unternehmensangaben',
            subtitle: 'Legal Notice · Aviso Legal · Informações Legais',
            section1: 'Angaben gemäß §5 TMG / Informações Legais',
            company: 'Unternehmen / Empresa',
            representedBy: 'Vertreten durch / Representado por',
            address: 'Adresse / Endereço',
            nif: 'NIF (Portugal)',
            email: 'E-Mail',
            website: 'Website',
            bayenderiGroup: 'Teil der Bayenderi Unternehmensgruppe',
            bayenderiDesc: 'Part of the Bayenderi Corporate Group · Membro do Grupo Empresarial Bayenderi',
            bayenderiGmbH: 'Bayenderi LLC & Co. Lda',
            bayenderiDescLong: 'Als strategischer Partner und Muttergesellschaften unterstützen Bayenderi LLC & Co. Lda und Bayenderi GmbH & Co. KG die technologische Entwicklung und Marktexpansion von BayFatura. Gemeinsam bringen wir innovative Fintech-Lösungen nach Europa.',
            bayenderiDescLongPT: 'Como parceiros estratégicos e empresas-mãe, a Bayenderi LLC & Co. Lda e a Bayenderi GmbH & Co. KG apoiam o desenvolvimento tecnológico e a expansão de mercado da BayFatura.',
            certification: 'Zertifizierung',
            rating: 'Bewertung',
            locations: 'Standorte',
            euDispute: 'EU-Streitschlichtung / Resolução de Litígios UE',
            disclaimer: 'Haftungsausschluss / Disclaimer'
        },
        en: {
            title: 'Impressum & Company Information',
            subtitle: 'Legal Notice · Aviso Legal · Informações Legais',
            section1: 'Information pursuant to §5 TMG / Informações Legais',
            company: 'Company / Empresa',
            representedBy: 'Represented by / Representado por',
            address: 'Address / Endereço',
            nif: 'NIF (Portugal)',
            email: 'E-Mail',
            website: 'Website',
            bayenderiGroup: 'Part of Bayenderi Corporate Group',
            bayenderiDesc: 'Part of the Bayenderi Corporate Group · Membro do Grupo Empresarial Bayenderi',
            bayenderiGmbH: 'Bayenderi LLC & Co. Lda',
            bayenderiDescLong: 'As strategic partners and parent companies, Bayenderi LLC & Co. Lda and Bayenderi GmbH & Co. KG support the technological development and market expansion of BayFatura. Together, we bring innovative fintech solutions to Europe.',
            bayenderiDescLongPT: 'Como parceiros estratégicos e empresas-mãe, a Bayenderi LLC & Co. Lda e a Bayenderi GmbH & Co. KG apoiam o desenvolvimento tecnológico e a expansão de mercado da BayFatura.',
            certification: 'Certification',
            rating: 'Rating',
            locations: 'Locations',
            euDispute: 'EU Dispute Resolution / Resolução de Litígios UE',
            disclaimer: 'Disclaimer / Aviso Legal'
        },
        pt: {
            title: 'Impressum & Informações Empresariais',
            subtitle: 'Aviso Legal · Legal Notice · Informações Legais',
            section1: 'Informações conforme o §5 TMG / Informações Legais',
            company: 'Empresa / Unternehmen',
            representedBy: 'Representado por / Vertreten durch',
            address: 'Endereço / Adresse',
            nif: 'NIF (Portugal)',
            email: 'E-Mail',
            website: 'Website',
            bayenderiGroup: 'Parte do Grupo Empresarial Bayenderi',
            bayenderiDesc: 'Parte do Grupo Empresarial Bayenderi · Teil der Bayenderi Unternehmensgruppe',
            bayenderiGmbH: 'Bayenderi LLC & Co. Lda',
            bayenderiDescLong: 'Como parceiros estratégicos e empresas-mãe, a Bayenderi LLC & Co. Lda e a Bayenderi GmbH & Co. KG apoiam o desenvolvimento tecnológico e a expansão de mercado da BayFatura. Juntos, trazemos soluções fintech inovadoras para a Europa.',
            bayenderiDescLongPT: 'A Bayenderi LLC & Co. Lda atua como entidade principal em Portugal, garantindo conformidade e inovação contínua.',
            certification: 'Certificação',
            rating: 'Avaliação',
            locations: 'Localizações',
            euDispute: 'Resolução de Litígios UE / EU-Streitschlichtung',
            disclaimer: 'Disclaimer / Aviso Legal'
        },
        tr: {
            title: 'Impressum & Şirket Bilgileri',
            subtitle: 'Legal Notice · Aviso Legal · Informações Legais',
            section1: '§5 TMG uyarınca bilgiler / Informações Legais',
            company: 'Şirket / Empresa',
            representedBy: 'Temsil eden / Representado por',
            address: 'Adres / Endereço',
            nif: 'NIF (Portekiz)',
            email: 'E-Posta',
            website: 'Web Sitesi',
            bayenderiGroup: 'Bayenderi Kurumsal Grubu\'nun bir parçası',
            bayenderiDesc: 'Bayenderi Kurumsal Grubu\'nun bir parçası · Parte do Grupo Empresarial Bayenderi',
            bayenderiGmbH: 'Bayenderi LLC & Co. Lda',
            bayenderiDescLong: 'Stratejik ortaklar ve ana şirketler olarak, Bayenderi LLC & Co. Lda ve Bayenderi GmbH & Co. KG, BayFatura\'nın teknolojik gelişimini ve pazar genişlemesini destekler. Birlikte, Avrupa\'ya yenilikçi fintech çözümleri getiriyoruz.',
            bayenderiDescLongPT: 'Como parceiros estratégicos e empresas-mãe, a Bayenderi LLC & Co. Lda e a Bayenderi GmbH & Co. KG apoiam o desenvolvimento tecnológico e a expansão de mercado da BayFatura.',
            certification: 'Sertifikasyon',
            rating: 'Değerlendirme',
            locations: 'Konumlar',
            euDispute: 'AB Uyuşmazlık Çözümü / Resolução de Litígios UE',
            disclaimer: 'Sorumluluk Reddi / Disclaimer'
        },
        fr: {
            title: 'Impressum & Informations de l\'entreprise',
            subtitle: 'Aviso Legal · Legal Notice · Informações Legais',
            section1: 'Informations conformes au §5 TMG / Informações Legais',
            company: 'Entreprise / Empresa',
            representedBy: 'Représenté par / Representado por',
            address: 'Adresse / Endereço',
            nif: 'NIF (Portugal)',
            email: 'E-Mail',
            website: 'Site Web',
            bayenderiGroup: 'Partie du Groupe d\'entreprise Bayenderi',
            bayenderiDesc: 'Partie du Groupe d\'entreprise Bayenderi · Parte do Grupo Empresarial Bayenderi',
            bayenderiGmbH: 'Bayenderi LLC & Co. Lda',
            bayenderiDescLong: 'En tant que partenaires stratégiques et sociétés mères, Bayenderi LLC & Co. Lda et Bayenderi GmbH & Co. KG soutiennent le développement technologique et l\'expansion du marché de BayFatura. Ensemble, nous apportons des solutions fintech innovantes en Europe.',
            bayenderiDescLongPT: 'Como parceiros estratégicos e empresas-mãe, a Bayenderi LLC & Co. Lda e a Bayenderi GmbH & Co. KG apoiam o desenvolvimento tecnológico e a expansão de mercado da BayFatura.',
            certification: 'Certification',
            rating: 'Évaluation',
            locations: 'Emplacements',
            euDispute: 'Résolution des litiges UE / Resolução de Litígios UE',
            disclaimer: 'Avis de non-responsabilité / Disclaimer'
        },
        es: {
            title: 'Impressum & Información de la empresa',
            subtitle: 'Aviso Legal · Legal Notice · Informações Legais',
            section1: 'Información conforme al §5 TMG / Informações Legais',
            company: 'Empresa / Unternehmen',
            representedBy: 'Representado por / Vertreten durch',
            address: 'Dirección / Endereço',
            nif: 'NIF (Portugal)',
            email: 'Correo electrónico',
            website: 'Sitio web',
            bayenderiGroup: 'Parte del Grupo Empresarial Bayenderi',
            bayenderiDesc: 'Parte del Grupo Empresarial Bayenderi · Teil der Bayenderi Unternehmensgruppe',
            bayenderiGmbH: 'Bayenderi LLC & Co. Lda',
            bayenderiDescLong: 'Como socios estratégicos y empresas matrices, Bayenderi LLC & Co. Lda y Bayenderi GmbH & Co. KG apoyan el desarrollo tecnológico y la expansión de mercado de BayFatura. Juntos, llevamos soluciones fintech innovadoras a Europa.',
            bayenderiDescLongPT: 'Como parceiros estratégicos e empresas-mãe, a Bayenderi LLC & Co. Lda e a Bayenderi GmbH & Co. KG apoiam o desenvolvimento tecnológico e a expansão de mercado da BayFatura.',
            certification: 'Certificación',
            rating: 'Valoración',
            locations: 'Ubicaciones',
            euDispute: 'Resolución de litigios UE / Resolução de Litígios UE',
            disclaimer: 'Descargo de responsabilidad / Disclaimer'
        }
    };

    const TI = impressumTranslations[appLanguage] || impressumTranslations.de;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
            color: '#e2e8f0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
        }}>
            <header style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: '16px',
                flexWrap: 'wrap'
            }}>
                <Link to="/" style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    textDecoration: 'none', color: '#e2e8f0'
                }}>
                    <img src="/logo.png" alt="BayFatura Logo" style={{ height: '48px', width: 'auto' }} />
                </Link>
                <span style={{ color: '#475569', fontSize: '0.85rem' }}>/ Impressum</span>
                
                {/* Language Selector */}
                <div style={{ marginLeft: 'auto' }}>
                    <select 
                        value={appLanguage} 
                        onChange={(e) => setAppLanguage(e.target.value)}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#e2e8f0',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                        aria-label="Select language"
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code} style={{ background: '#1e293b' }}>
                                {lang.flag} {lang.label}
                            </option>
                        ))}
                    </select>
                </div>
            </header>

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', color: '#f1f5f9' }}>
                    {TI.title}
                </h1>
                <p style={{ color: '#64748b', marginBottom: '48px', fontSize: '1rem' }}>
                    {TI.subtitle}
                </p>

                {/* Bayenderi Group Prestige Section */}
                <div style={{
                    padding: '32px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)',
                    borderRadius: '20px',
                    border: '2px solid rgba(99,102,241,0.3)',
                    marginBottom: '32px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-50px',
                        right: '-50px',
                        width: '200px',
                        height: '200px',
                        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                        borderRadius: '50%'
                    }} />
                    
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Building2 size={24} color="white" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fbbf24', margin: 0 }}>
                                    {TI.bayenderiGroup}
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: '#a5b4fc', margin: '4px 0 0 0' }}>
                                    {TI.bayenderiDesc}
                                </p>
                            </div>

                        <div style={{
                            padding: '20px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            border: '1px solid rgba(245,158,11,0.2)',
                            marginBottom: '16px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <Award size={20} style={{ color: '#fbbf24', marginTop: '2px', flexShrink: 0 }} />
                                <div>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fbbf24', margin: '0 0 8px 0' }}>
                                        {TI.bayenderiGmbH}
                                    </h3>
                                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                                        {TI.bayenderiDescLong}
                                        <br /><br />
                                        <strong style={{ color: '#fbbf24' }}>Portugal:</strong> {TI.bayenderiDescLongPT}
                                    </p>
                                </div>
                            </div>
                        </div>
                        </div>



                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                            <div style={{
                                padding: '16px',
                                background: 'rgba(245,158,11,0.08)',
                                borderRadius: '10px',
                                border: '1px solid rgba(245,158,11,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <Shield size={18} style={{ color: '#fbbf24' }} />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Zertifizierung
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: '600', marginTop: '2px' }}>
                                        ISO 27001 / GDPR
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                padding: '16px',
                                background: 'rgba(245,158,11,0.08)',
                                borderRadius: '10px',
                                border: '1px solid rgba(245,158,11,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <Star size={18} style={{ color: '#fbbf24' }} />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Bewertung
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: '600', marginTop: '2px' }}>
                                        4.9/5.0 ★★★★★
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                padding: '16px',
                                background: 'rgba(245,158,11,0.08)',
                                borderRadius: '10px',
                                border: '1px solid rgba(245,158,11,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <Globe size={18} style={{ color: '#fbbf24' }} />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Standorte
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: '600', marginTop: '2px' }}>
                                        Lissabon · Berlin · Wien
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Angaben gem. §5 TMG */}
                <div style={{
                    padding: '28px',
                    background: 'rgba(99,102,241,0.08)',
                    borderRadius: '16px',
                    border: '1px solid rgba(99,102,241,0.2)',
                    marginBottom: '24px'
                }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#a5b4fc', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={18} />
                        {TI.section1}
                    </h2>

                    <div style={{ display: 'grid', gap: '16px', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.7 }}>
                        <div style={{
                            padding: '16px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '10px',
                            borderLeft: '3px solid #6366f1'
                        }}>
                            <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                {TI.company}
                            </div>
                            <div style={{ fontWeight: '700', color: '#f1f5f9', fontSize: '1rem' }}>BayFatura</div>
                            <div style={{ fontSize: '0.8rem', color: '#a5b4fc', marginTop: '4px' }}>
                                {TI.bayenderiGroup}
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '12px'
                        }}>
                            <div>
                                <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{TI.representedBy}</div>
                                <div style={{ fontWeight: '600', color: '#f1f5f9', marginTop: '2px' }}>
                                    Omid Bayandarimoghaddam
                                </div>
                            </div>
                            <div>
                                <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{TI.nif}</div>
                                <div style={{ fontWeight: '600', color: '#f1f5f9', marginTop: '2px' }}>319325237</div>
                            </div>
                        </div>

                        <div>
                            <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{TI.address}</div>
                            <div style={{ fontWeight: '600', color: '#f1f5f9', marginTop: '2px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <MapPin size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                                <div>
                                    RUA BADEN POWELL, N. 24 SÃO JOÃO DA TALHA<br />
                                    2695-671 LISBOA<br />
                                    Portugal
                                </div>
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '12px'
                        }}>
                            <div>
                                <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{TI.email}</div>
                                <div style={{ marginTop: '2px' }}>
                                    <a href="mailto:support@bayfatura.com" style={{ color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Mail size={14} /> support@bayfatura.com
                                    </a>
                                </div>
                            </div>
                            <div>
                                <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{TI.website}</div>
                                <div style={{ marginTop: '2px' }}>
                                    <a href="https://bayfatura.com" style={{ color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Globe size={14} /> bayfatura.com
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* EU Dispute Resolution */}
                <div style={{
                    padding: '24px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: '24px'
                }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#a5b4fc', marginBottom: '14px' }}>
                        {TI.euDispute}
                    </h2>
                    <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '0.88rem', margin: 0 }}>
                        {appLanguage === 'de' && (
                            <>
                                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer"
                                    style={{ color: '#818cf8' }}>
                                    https://ec.europa.eu/consumers/odr/
                                </a>
                                <br /><br />
                                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                                Verbraucherschlichtungsstelle teilzunehmen.
                                <br /><br />
                                <strong style={{ color: '#e2e8f0' }}>Für Portugal:</strong> Rede de Arbitragem de Consumo —{' '}
                                <a href="https://www.consumidor.gov.pt/" target="_blank" rel="noreferrer"
                                    style={{ color: '#818cf8' }}>
                                    www.consumidor.gov.pt
                                </a>
                            </>
                        )}
                        {appLanguage === 'en' && (
                            <>
                                The European Commission provides a platform for online dispute resolution (OS):{' '}
                                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer"
                                    style={{ color: '#818cf8' }}>
                                    https://ec.europa.eu/consumers/odr/
                                </a>
                                <br /><br />
                                We are not willing or obligated to participate in dispute resolution proceedings before
                                a consumer arbitration board.
                                <br /><br />
                                <strong style={{ color: '#e2e8f0' }}>For Portugal:</strong> Rede de Arbitragem de Consumo —{' '}
                                <a href="https://www.consumidor.gov.pt/" target="_blank" rel="noreferrer"
                                    style={{ color: '#818cf8' }}>
                                    www.consumidor.gov.pt
                                </a>
                            </>
                        )}
                        {appLanguage === 'pt' && (
                            <>
                                A Comissão Europeia disponibiliza uma plataforma para resolução de litígios online (RLL):{' '}
                                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer"
                                    style={{ color: '#818cf8' }}>
                                    https://ec.europa.eu/consumers/odr/
                                </a>
                                <br /><br />
                                Não estamos dispostos nem obrigados a participar em procedimentos de resolução de litígios
                                perante um conselho de arbitragem de consumidores.
                                <br /><br />
                                <strong style={{ color: '#e2e8f0' }}>Para Portugal:</strong> Rede de Arbitragem de Consumo —{' '}
                                <a href="https://www.consumidor.gov.pt/" target="_blank" rel="noreferrer"
                                    style={{ color: '#818cf8' }}>
                                    www.consumidor.gov.pt
                                </a>
                            </>
                        )}
                        {appLanguage === 'tr' && (
                            <>
                                Avrupa Komisyonu, online uyuşmazlık çözümü (OS) için bir plataform sağlar:{' '}
                                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer"
                                    style={{ color: '#818cf8' }}>
                                    https://ec.europa.eu/consumers/odr/
                                </a>
                                <br /><br />
                                Bir tüketici tahkim kurulunda uyuşmazlık çözüm süreçlerine katılmaya istekli veya yükümlü değiliz.
                                <br /><br />
                                <strong style={{ color: '#e2e8f0' }}>Portekiz için:</strong> Rede de Arbitragem de Consumo —{' '}
                                <a href="https://www.consumidor.gov.pt/" target="_blank" rel="noreferrer"
                                    style={{ color: '#818cf8' }}>
                                    www.consumidor.gov.pt
                                </a>
                            </>
                        )}
                        {appLanguage === 'fr' && (
                            <>
                                La Commission Européenne met à disposition une plataforme de résolution des litiges en ligne (RLL):{' '}
                                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer"
                                    style={{ color: '#818cf8' }}>
                                    https://ec.europa.eu/consumers/odr/
                                </a>
                                <br /><br />
                                Nous ne sommes pas disposés ou obligés de participer à des procédures de résolution de litiges
                                devant un conseil d'arbitrage des consommateurs.
                                <br /><br />
                                <strong style={{ color: '#e2e8f0' }}>Pour le Portugal:</strong> Rede de Arbitragem de Consumo —{' '}
                                <a href="https://www.consumidor.gov.pt/" target="_blank" rel="noreferrer"
                                    style={{ color: '#818cf8' }}>
                                    www.consumidor.gov.pt
                                </a>
                            </>
                        )}
                        {appLanguage === 'es' && (
                            <>
                                La Comisión Europea proporciona una plataforma para la resolución de litigios en línea (RLL):{' '}
                                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer"
                                    style={{ color: '#818cf8' }}>
                                    https://ec.europa.eu/consumers/odr/
                                </a>
                                <br /><br />
                                No estamos dispuestos u obligados a participar en procedimientos de resolución de litigios
                                ante un consejo de arbitraje de consumidores.
                                <br /><br />
                                <strong style={{ color: '#e2e8f0' }}>Para Portugal:</strong> Rede de Arbitragem de Consumo —{' '}
                                <a href="https://www.consumidor.gov.pt/" target="_blank" rel="noreferrer"
                                    style={{ color: '#818cf8' }}>
                                    www.consumidor.gov.pt
                                </a>
                            </>
                        )}
                    </p>
                </div>

                {/* Disclaimer */}
                <div style={{
                    padding: '24px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: '24px'
                }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#a5b4fc', marginBottom: '14px' }}>
                        {TI.disclaimer}
                    </h2>
                    <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '0.88rem', margin: 0 }}>
                        {appLanguage === 'de' && (
                            <>
                                Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
                                Vollständigkeit und Aktualität der Inhalte übernehmen wir keine Gewähr.
                                BayFatura ist eine Software-as-a-Service Plattform und kein Steuerberater.
                                Alle steuerlichen und rechtlichen Entscheidungen sollten mit einem zugelassenen Fachmann getroffen werden.
                                <br /><br />
                                <strong style={{ color: '#e2e8f0' }}>Portugal:</strong> BayFatura não é software certificado AT.
                                Para emissão legal de faturas em Portugal, consulte um TOC (Técnico Oficial de Contas).
                            </>
                        )}
                        {appLanguage === 'en' && (
                            <>
                                The contents of this website were created with the utmost care. We assume no liability for the
                                correctness, completeness, and timeliness of the contents.
                                BayFatura is a Software-as-a-Service platform and not a tax advisor.
                                All tax and legal decisions should be made with a licensed professional.
                                <br /><br />
                                <strong style={{ color: '#e2e8f0' }}>Portugal:</strong> BayFatura não é software certificado AT.
                                Para emissão legal de faturas em Portugal, consulte um TOC (Técnico Oficial de Contas).
                            </>
                        )}
                        {appLanguage === 'pt' && (
                            <>
                                Os conteúdos deste site foram criados com o maior cuidado. Não assumimos qualquer responsabilidade
                                pela exatidão, integridade e atualidade dos conteúdos.
                                A BayFatura é uma plataforma Software-como-Serviço e não é consultora fiscal.
                                Todas as decisões fiscais e jurídicas devem ser tomadas com um profissional licenciado.
                                <br /><br />
                                <strong style={{ color: '#e2e8f0' }}>Portugal:</strong> BayFatura não é software certificado AT.
                                Para emissão legal de faturas em Portugal, consulte um TOC (Técnico Oficial de Contas).
                            </>
                        )}
                        {appLanguage === 'tr' && (
                            <>
                                Bu web sitesinin içerikleri büyük bir özenle hazırlanmıştır. İçeriklerin doğruluğu,
                                tamlığı ve güncelliği konusunda hiçbir garanti vermiyoruz.
                                BayFatura bir Yazılım-olarak-Hizmet plataformudur ve vergi danışmanı değildir.
                                Tüm vergisel ve yasal kararlar lisanslı bir uzmanla alınmalıdır.
                                <br /><br />
                                <strong style={{ color: '#e2e8f0' }}>Portekiz:</strong> BayFatura não é software certificado AT.
                                Para emissão legal de faturas em Portugal, consulte um TOC (Técnico Oficial de Contas).
                            </>
                        )}
                        {appLanguage === 'fr' && (
                            <>
                                Les contenus de ce site web ont été créés avec le plus grand soin. Nous n'assumons aucune garantie
                                concernant l'exactitude, l'exhaustivité et l'actualité des contenus.
                                BayFatura est une plateforme Logiciel-comme-Service et non un conseiller fiscal.
                                Toutes les décisions fiscales et juridiques doivent être prises avec un professionnel agréé.
                                <br /><br />
                                <strong style={{ color: '#e2e8f0' }}>Portugal:</strong> BayFatura não é software certificado AT.
                                Para emissão legal de faturas em Portugal, consulte um TOC (Técnico Oficial de Contas).
                            </>
                        )}
                        {appLanguage === 'es' && (
                            <>
                                Los contenidos de este sitio web se han creado con la mayor diligencia. No asumimos responsabilidad
                                por la exactitud, integridad y actualidad de los contenidos.
                                BayFatura es una plataforma Software-como-Servicio y no es asesor fiscal.
                                Todas las decisiones fiscales y jurídicas deben tomarse con un profesional licenciado.
                                <br /><br />
                                <strong style={{ color: '#e2e8f0' }}>Portugal:</strong> BayFatura não é software certificado AT.
                                Para emissão legal de faturas em Portugal, consulte um TOC (Técnico Oficial de Contas).
                            </>
                        )}
                    </p>
                </div>

                {/* Footer nav */}
                <div style={{ display: 'flex', gap: '20px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                    <Link to="/privacy" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem' }}>Datenschutz</Link>
                    <Link to="/terms" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem' }}>AGB / Terms</Link>
                    <Link to="/" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem' }}>← Zurück / Back</Link>
                </div>

                {/* Powered by Bayenderi Footer */}
                <div style={{
                    marginTop: '48px',
                    padding: '24px',
                    background: 'rgba(245,158,11,0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(245,158,11,0.1)',
                    textAlign: 'center'
                }}>
                    <p style={{ fontSize: '0.8rem', color: '#a5b4fc', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Building2 size={14} />
                        Powered by <span style={{ color: '#fbbf24', fontWeight: '700' }}>Bayenderi</span> — Innovation in Finance
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Impressum;
