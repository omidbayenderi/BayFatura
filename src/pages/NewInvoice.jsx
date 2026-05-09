import React, { useState, useRef } from 'react';
import { useInvoice } from '../context/InvoiceContext';
import InvoicePaper from '../components/InvoicePaper';
import { Save, Download, Plus, Trash2, Search, X, Package, Car, HardHat, Utensils, HeartPulse, Monitor, ShoppingCart, Wrench, BarChart3, BookOpen, Briefcase } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { usePanel } from '../context/PanelContext';
import { useCustomers } from '../context/CustomerContext';
import { useProducts } from '../context/ProductContext';
import { getIndustryFields } from '../config/industryFields';
import jsPDF from 'jspdf';

const INDUSTRY_ICONS = {
    Car, HardHat, Utensils, HeartPulse, Monitor, ShoppingCart, Wrench, BarChart3, BookOpen, Briefcase
};

const b2gTranslations = {
    de: {
        title: "B2G — Öffentliche Hand / Staatliche Stellen",
        subtitleDE: "XRechnung (ZRE/OZG-RE) — §3 E-Rechnungsverordnung",
        subtitlePT: "UBL 2.1 CIUS-PT — eSPap / PEPPOL (verpflichtend seit Jan 2026)",
        leitwegId: "Leitweg-ID (Pflicht für Behörden)",
        buyerRef: "Käuferreferenz (eSPap / PEPPOL-ID)",
        placeholderDE: "04011000-1234567890-06",
        placeholderPT: "z.B. eSPap-REF-2026",
        entityId: "Körperschaft-ID / Behörden-Steuernummer",
        entityPlaceholderDE: "Steuernr. Behörde",
        entityPlaceholderPT: "Behörden-USt-ID",
        guides: {
            DE: {
                title: "📋 Einreichung über ZRE / OZG-RE (Deutschland):",
                steps: [
                    "Speichern und laden Sie das XRechnung-XML in der Rechnungsvorschau herunter",
                    "Gehen Sie zu: e-rechnung-bund.de",
                    "Melden Sie sich an und übermitteln Sie die XML-Datei"
                ],
                url: "https://www.e-rechnung-bund.de"
            },
            AT: {
                title: "📋 Einreichung über USP / e-Rechnung.gv.at (Österreich):",
                steps: [
                    "Speichern Sie die Rechnung und laden Sie das XRechnung-XML herunter",
                    "Gehen Sie zu: e-rechnung.gv.at",
                    "Melden Sie sich mit Ihrem Unternehmenskonto an und übermitteln Sie das XML"
                ],
                url: "https://www.e-rechnung.gv.at"
            },
            PT: {
                title: "📋 Einreichung über eSPap (Portugal):",
                steps: [
                    "Speichern Sie die Rechnung und laden Sie das UBL 2.1-XML herunter",
                    "Gehen Sie zum Portal: espap.gov.pt",
                    "Melden Sie sich mit Autenticação.gov oder einem digitalen Zertifikat an",
                    "Senden Sie die XML-Datei im Bereich 'Faturação Eletrónica'",
                    "Bewahren Sie die eSPap-Referenznummer auf (10 Jahre gemäß Art. 52 CIVA)"
                ],
                url: "https://www.espap.gov.pt"
            },
            TR: {
                title: "📋 Einreichung über e-Fatura Integrator (Türkei):",
                steps: [
                    "Speichern Sie die Rechnung und laden Sie das UBL 2.1-XML herunter",
                    "Melden Sie sich bei Ihrem e-Fatura Entegrator (EDM, Logo, QNB) oder dem GİB-Portal an",
                    "Laden Sie die XML-Datei hoch, um die Übermittlung an die Behörde abzuschließen"
                ]
            },
            FR: {
                title: "📋 Einreichung über Chorus Pro (Frankreich):",
                steps: [
                    "Speichern Sie die Rechnung und laden Sie das UBL 2.1-XML herunter",
                    "Gehen Sie zu: chorus-pro.gouv.fr",
                    "Melden Sie sich an und laden Sie die XML-Rechnung im Bereich 'Factures émises' hoch"
                ],
                url: "https://chorus-pro.gouv.fr"
            },
            ES: {
                title: "📋 Einreichung über FACe (Spanien):",
                steps: [
                    "Speichern Sie die Rechnung und laden Sie das XML-Dokument herunter",
                    "Gehen Sie zu: face.gob.es",
                    "Melden Sie sich mit Ihrem digitalen Zertifikat an und übermitteln Sie das XML"
                ],
                url: "https://face.gob.es"
            },
            NL: {
                title: "📋 Einreichung über Peppol Access Point (Niederlande):",
                steps: [
                    "Speichern Sie die Rechnung und laden Sie das UBL 2.1-XML herunter",
                    "Melden Sie sich bei Ihrem Peppol Access Point Anbieter an",
                    "Laden Sie das XML hoch, um es an die Behörde zu übermitteln"
                ]
            },
            GLOBAL: {
                title: "📋 Einreichung der B2G-Rechnung:",
                steps: [
                    "Speichern Sie die Rechnung und laden Sie das UBL 2.1-XML herunter",
                    "Melden Sie sich im offiziellen E-Invoicing-Portal Ihres Landes an",
                    "Laden Sie die XML-Datei hoch, um die Übermittlung abzuschließen"
                ]
            }
        }
    },
    tr: {
        title: "B2G — Kamu Kuruluşu / Devlet Daireleri",
        subtitleDE: "XRechnung (ZRE/OZG-RE) — §3 E-Fatura Yönetmeliği",
        subtitlePT: "UBL 2.1 CIUS-PT — eSPap / PEPPOL (Ocak 2026'dan itibaren zorunlu)",
        leitwegId: "Leitweg-ID (Kamu Kurumu Referansı)",
        buyerRef: "Alıcı Referansı (eSPap / PEPPOL ID)",
        placeholderDE: "Örn: 04011000-1234567890-06",
        placeholderPT: "Örn: eSPap-REF-2026",
        entityId: "Vergi No / Kurum Kimliği",
        entityPlaceholderDE: "Kurum Vergi No",
        entityPlaceholderPT: "Kamu Kurum NIF No (5xx...)",
        guides: {
            DE: {
                title: "📋 ZRE / OZG-RE Üzerinden Gönderim Adımları (Almanya):",
                steps: [
                    "Faturayı kaydedin ve fatura görünümünden XRechnung XML dosyasını indirin",
                    "Şu adrese gidin: e-rechnung-bund.de",
                    "Giriş yapın ve XML dosyasını yükleyin"
                ],
                url: "https://www.e-rechnung-bund.de"
            },
            AT: {
                title: "📋 USP / e-Rechnung.gv.at Üzerinden Gönderim Adımları (Avusturya):",
                steps: [
                    "Faturayı kaydedin ve XRechnung XML dosyasını indirin",
                    "Şu adrese gidin: e-rechnung.gv.at",
                    "Kurumsal hesabınızla giriş yapıp XML dosyasını yükleyin"
                ],
                url: "https://www.e-rechnung.gv.at"
            },
            PT: {
                title: "📋 eSPap Portalı Üzerinden Gönderim Adımları (Portekiz):",
                steps: [
                    "Faturayı kaydedin ve UBL 2.1 XML dosyasını indirin",
                    "Şu adrese gidin: espap.gov.pt",
                    "Autenticação.gov veya dijital sertifika ile giriş yapın",
                    "'Faturação Eletrónica' bölümünden XML dosyasını yükleyin",
                    "eSPap referans numarasını saklayın (10 yıl saklama zorunluluğu — CIVA Madde 52)"
                ],
                url: "https://www.espap.gov.pt"
            },
            TR: {
                title: "📋 e-Fatura Entegratör Üzerinden Gönderim Adımları (Türkiye):",
                steps: [
                    "Faturayı kaydedin ve UBL 2.1 XML dosyasını indirin",
                    "Özel entegratörünüze (EDM, Logo, QNB vb.) veya GİB Portalına giriş yapın",
                    "İndirdiğiniz XML dosyasını sisteme yükleyerek kamu kurumuna fatura iletimini tamamlayın"
                ]
            },
            FR: {
                title: "📋 Chorus Pro Portalı Üzerinden Gönderim Adımları (Fransa):",
                steps: [
                    "Faturayı kaydedin ve UBL 2.1 XML dosyasını indirin",
                    "Şu adrese gidin: chorus-pro.gouv.fr",
                    "Hesabınızla giriş yapıp XML faturanızı 'Factures émises' bölümüne yükleyin"
                ],
                url: "https://chorus-pro.gouv.fr"
            },
            ES: {
                title: "📋 FACe Portalı Üzerinden Gönderim Adımları (İspanya):",
                steps: [
                    "Faturayı kaydedin ve Facturae/UBL XML dosyasını indirin",
                    "Şu adrese gidin: face.gob.es",
                    "Dijital sertifikanızla giriş yapıp XML dosyasını sunun"
                ],
                url: "https://face.gob.es"
            },
            NL: {
                title: "📋 Peppol Erişim Noktası Üzerinden Gönderim Adımları (Hollanda):",
                steps: [
                    "Faturayı kaydedin ve UBL 2.1 XML dosyasını indirin",
                    "Peppol erişim noktası sağlayıcınıza giriş yapın",
                    "XML faturanızı sisteme yükleyip alıcı kamu kurumuna iletin"
                ]
            },
            GLOBAL: {
                title: "📋 B2G Kamu Kurumu Gönderim Adımları:",
                steps: [
                    "Faturayı kaydedin ve e-fatura uyumlu UBL 2.1 XML dosyasını indirin",
                    "Ülkenizin resmi kamu e-fatura portalına giriş yapın",
                    "İndirdiğiniz XML dosyasını yükleyip gönderimi tamamlayın"
                ]
            }
        }
    },
    en: {
        title: "B2G — Public Entity / Government Agency",
        subtitleDE: "XRechnung (ZRE/OZG-RE) — §3 E-Invoicing Regulation",
        subtitlePT: "UBL 2.1 CIUS-PT — eSPap / PEPPOL (mandatory since Jan 2026)",
        leitwegId: "Leitweg-ID (Mandatory for DE public entities)",
        buyerRef: "Buyer Reference (eSPap / PEPPOL ID)",
        placeholderDE: "04011000-1234567890-06",
        placeholderPT: "e.g., eSPap-REF-2026",
        entityId: "Corporate ID / Tax ID of Entity",
        entityPlaceholderDE: "Agency Tax ID",
        entityPlaceholderPT: "Public NIF (5xx...)",
        guides: {
            DE: {
                title: "📋 Submission via ZRE / OZG-RE (Germany):",
                steps: [
                    "Save and download the XRechnung XML from the invoice view page",
                    "Go to: e-rechnung-bund.de",
                    "Log in and submit the XML file"
                ],
                url: "https://www.e-rechnung-bund.de"
            },
            AT: {
                title: "📋 Submission via USP / e-Rechnung.gv.at (Austria):",
                steps: [
                    "Save and download the XRechnung XML file",
                    "Go to: e-rechnung.gv.at",
                    "Log in with your company account and submit the XML"
                ],
                url: "https://www.e-rechnung.gv.at"
            },
            PT: {
                title: "📋 Submission via eSPap (Portugal):",
                steps: [
                    "Save the invoice and download the UBL 2.1 XML",
                    "Go to the portal: espap.gov.pt",
                    "Log in with Autenticação.gov or digital certificate",
                    "Submit the XML file in the 'Faturação Eletrónica' section",
                    "Keep the eSPap reference number (10 years — CIVA Art. 52)"
                ],
                url: "https://www.espap.gov.pt"
            },
            TR: {
                title: "📋 Submission via e-Invoice Integrator (Turkey):",
                steps: [
                    "Save the invoice and download the UBL 2.1 XML",
                    "Log in to your private e-Invoice integrator (EDM, Logo, QNB) or GİB Portal",
                    "Upload the XML file to complete the submission to the public agency"
                ]
            },
            FR: {
                title: "📋 Submission via Chorus Pro (France):",
                steps: [
                    "Save the invoice and download the UBL 2.1 XML",
                    "Go to: chorus-pro.gouv.fr",
                    "Log in and upload the XML invoice in the 'Factures émises' section"
                ],
                url: "https://chorus-pro.gouv.fr"
            },
            ES: {
                title: "📋 Submission via FACe (Spain):",
                steps: [
                    "Save the invoice and download the XML document",
                    "Go to: face.gob.es",
                    "Log in with your digital certificate and submit the XML"
                ],
                url: "https://face.gob.es"
            },
            NL: {
                title: "📋 Submission via Peppol Access Point (Netherlands):",
                steps: [
                    "Save the invoice and download the UBL 2.1 XML",
                    "Log in to your Peppol Access Point provider",
                    "Upload the XML to transmit it to the public entity"
                ]
            },
            GLOBAL: {
                title: "📋 B2G Document Submission Steps:",
                steps: [
                    "Save the invoice and download the UBL 2.1 XML file",
                    "Log in to your country's official public e-invoicing portal",
                    "Upload the XML file to complete the submission"
                ]
            }
        }
    },
    pt: {
        title: "B2G — Entidade Pública / Setor Público",
        subtitleDE: "XRechnung (ZRE/OZG-RE) — Diretiva alemã §3",
        subtitlePT: "UBL 2.1 CIUS-PT — eSPap / PEPPOL (obrigatório desde Jan 2026)",
        leitwegId: "Leitweg-ID (Obrigatório para setor público DE)",
        buyerRef: "Referência do Comprador (eSPap / PEPPOL ID)",
        placeholderDE: "04011000-1234567890-06",
        placeholderPT: "ex: eSPap-REF-2026",
        entityId: "NIF Entidade / ID Corporativo",
        entityPlaceholderDE: "NIF da Entidade Pública",
        entityPlaceholderPT: "NIF público (5xx...)",
        guides: {
            DE: {
                title: "📋 Submissão via ZRE / OZG-RE (Alemanha):",
                steps: [
                    "Guarde e descarregue o XML XRechnung na visualização da fatura",
                    "Aceda a: e-rechnung-bund.de",
                    "Faça login e submeta o ficheiro XML"
                ],
                url: "https://www.e-rechnung-bund.de"
            },
            AT: {
                title: "📋 Submissão via USP / e-Rechnung.gv.at (Áustria):",
                steps: [
                    "Guarde e descarregue o XML XRechnung",
                    "Aceda a: e-rechnung.gv.at",
                    "Faça login com a conta da empresa e envie o XML"
                ],
                url: "https://www.e-rechnung.gv.at"
            },
            PT: {
                title: "📋 Como enviar para eSPap (Portugal):",
                steps: [
                    "Guarde a fatura e descarregue o XML UBL 2.1",
                    "Aceda ao portal: espap.gov.pt",
                    "Login com Autenticação.gov ou certificado digital",
                    "Envie o ficheiro XML na secção 'Faturação Eletrónica'",
                    "Conserve o nº referência eSPap (10 anos — art. 52º CIVA)"
                ],
                url: "https://www.espap.gov.pt"
            },
            TR: {
                title: "📋 Submissão via Integrador de Fatura Eletrónica (Turquia):",
                steps: [
                    "Guarde a fatura e descarregue o XML UBL 2.1",
                    "Aceda ao seu integrador privado (EDM, Logo, QNB) ou ao Portal GİB",
                    "Envie o ficheiro XML para concluir a submissão à entidade pública"
                ]
            },
            FR: {
                title: "📋 Submissão via Chorus Pro (França):",
                steps: [
                    "Guarde a fatura e descarregue o XML UBL 2.1",
                    "Aceda ao portal: chorus-pro.gouv.fr",
                    "Faça login e envie o ficheiro XML na secção 'Factures émises'"
                ],
                url: "https://chorus-pro.gouv.fr"
            },
            ES: {
                title: "📋 Submissão via FACe (Espanha):",
                steps: [
                    "Guarde a fatura e descarregue o XML",
                    "Aceda a: face.gob.es",
                    "Faça login com o certificado digital e submeta o ficheiro XML"
                ],
                url: "https://face.gob.es"
            },
            NL: {
                title: "📋 Submissão via Ponto de Acesso Peppol (Países Baixos):",
                steps: [
                    "Guarde a fatura e descarregue o XML UBL 2.1",
                    "Aceda ao portal do seu provedor Peppol Access Point",
                    "Submeta o XML para transmiti-lo à entidade pública"
                ]
            },
            GLOBAL: {
                title: "📋 Passos para Submissão de Documento B2G:",
                steps: [
                    "Guarde a fatura e descarregue o ficheiro XML UBL 2.1",
                    "Aceda ao portal oficial de faturação eletrónica do seu país",
                    "Submeta o XML para concluir o processo"
                ]
            }
        }
    },
    fr: {
        title: "B2G — Entité Publique / Administration",
        subtitleDE: "XRechnung (ZRE/OZG-RE) — Réglementation allemande §3",
        subtitlePT: "UBL 2.1 CIUS-PT — eSPap / PEPPOL (obligatoire depuis janv. 2026)",
        leitwegId: "Leitweg-ID (Obligatoire pour les entités DE)",
        buyerRef: "Référence de l'Acheteur (eSPap / PEPPOL ID)",
        placeholderDE: "04011000-1234567890-06",
        placeholderPT: "ex: eSPap-REF-2026",
        entityId: "ID de l'entité / Numéro de TVA",
        entityPlaceholderDE: "No TVA de l'administration",
        entityPlaceholderPT: "NIF public (5xx...)",
        guides: {
            DE: {
                title: "📋 Soumission via ZRE / OZG-RE (Allemagne) :",
                steps: [
                    "Enregistrez et téléchargez le XML XRechnung depuis la vue de facture",
                    "Allez sur : e-rechnung-bund.de",
                    "Connectez-vous et soumettez le fichier XML"
                ],
                url: "https://www.e-rechnung-bund.de"
            },
            AT: {
                title: "📋 Soumission via USP / e-Rechnung.gv.at (Autriche) :",
                steps: [
                    "Enregistrez et téléchargez le fichier XML XRechnung",
                    "Allez sur : e-rechnung.gv.at",
                    "Connectez-vous avec le compte entreprise et transmettez le XML"
                ],
                url: "https://www.e-rechnung.gv.at"
            },
            PT: {
                title: "📋 Soumission via eSPap (Portugal) :",
                steps: [
                    "Enregistrez la facture et téléchargez le XML UBL 2.1",
                    "Allez sur le portail : espap.gov.pt",
                    "Connectez-vous avec Autenticação.gov ou certificat numérique",
                    "Soumettez le fichier XML dans la section 'Faturação Eletrónica'",
                    "Conservez le numéro de référence eSPap (10 ans — art. 52 CIVA)"
                ],
                url: "https://www.espap.gov.pt"
            },
            TR: {
                title: "📋 Soumission via l'intégrateur e-Facture (Turquie) :",
                steps: [
                    "Enregistrez la facture et téléchargez le XML UBL 2.1",
                    "Connectez-vous à votre intégrateur privé (EDM, Logo, QNB) ou au Portail GİB",
                    "Soumettez le fichier XML pour finaliser l'envoi à l'entité publique"
                ]
            },
            FR: {
                title: "📋 Soumission via Chorus Pro (France) :",
                steps: [
                    "Enregistrez la facture et téléchargez le XML UBL 2.1",
                    "Allez sur : chorus-pro.gouv.fr",
                    "Connectez-vous et soumettez le fichier XML dans la section 'Factures émises'"
                ],
                url: "https://chorus-pro.gouv.fr"
            },
            ES: {
                title: "📋 Soumission via FACe (Espagne) :",
                steps: [
                    "Enregistrez la facture et téléchargez le XML",
                    "Allez sur : face.gob.es",
                    "Connectez-vous avec votre certificat numérique et soumettez le XML"
                ],
                url: "https://face.gob.es"
            },
            NL: {
                title: "📋 Soumission via Peppol Access Point (Pays-Bas) :",
                steps: [
                    "Enregistrez la facture et téléchargez le XML UBL 2.1",
                    "Connectez-vous à votre fournisseur Peppol Access Point",
                    "Soumettez le XML pour le transmettre à l'entité publique"
                ]
            },
            GLOBAL: {
                title: "📋 Étapes pour la soumission du document B2G :",
                steps: [
                    "Enregistrez la facture et téléchargez le fichier XML UBL 2.1",
                    "Connectez-vous au portail officiel de facturation électronique de votre pays",
                    "Soumettez le XML pour finaliser le processus"
                ]
            }
        }
    },
    es: {
        title: "B2G — Entidad Pública / Administración",
        subtitleDE: "XRechnung (ZRE/OZG-RE) — Regulación alemana §3",
        subtitlePT: "UBL 2.1 CIUS-PT — eSPap / PEPPOL (obligatorio desde enero de 2026)",
        leitwegId: "Leitweg-ID (Obligatorio para entidades DE)",
        buyerRef: "Referencia del Comprador (eSPap / PEPPOL ID)",
        placeholderDE: "04011000-1234567890-06",
        placeholderPT: "ej: eSPap-REF-2026",
        entityId: "ID de la Entidad / NIF",
        entityPlaceholderDE: "NIF de la administración",
        entityPlaceholderPT: "NIF público (5xx...)",
        guides: {
            DE: {
                title: "📋 Envío a través de ZRE / OZG-RE (Alemania):",
                steps: [
                    "Guarde y descargue el XML XRechnung en la vista de la factura",
                    "Vaya a: e-rechnung-bund.de",
                    "Inicie sesión y envíe el archivo XML"
                ],
                url: "https://www.e-rechnung-bund.de"
            },
            AT: {
                title: "📋 Envío a través de USP / e-Rechnung.gv.at (Austria):",
                steps: [
                    "Guarde y descargue el archivo XML XRechnung",
                    "Vaya a: e-rechnung.gv.at",
                    "Inicie sesión con la cuenta de la empresa y envíe el XML"
                ],
                url: "https://www.e-rechnung.gv.at"
            },
            PT: {
                title: "📋 Envío a través de eSPap (Portugal):",
                steps: [
                    "Guarde la fature y descargue el XML UBL 2.1",
                    "Vaya al portal: espap.gov.pt",
                    "Inicie sesión con Autenticação.gov o certificado digital",
                    "Envíe el archivo XML en la sección 'Faturação Eletrónica'",
                    "Conserve el número de referencia eSPap (10 años — art. 52 CIVA)"
                ],
                url: "https://www.espap.gov.pt"
            },
            TR: {
                title: "📋 Envío a través del Integrador de Factura Electrónica (Turquía):",
                steps: [
                    "Guarde la factura y descargue el XML UBL 2.1",
                    "Inicie sesión en su integrador privado (EDM, Logo, QNB) o en el Portal GİB",
                    "Suba el archivo XML para completar el envío a la entidad pública"
                ]
            },
            FR: {
                title: "📋 Envío a través de Chorus Pro (Francia):",
                steps: [
                    "Guarde la factura y descargue el XML UBL 2.1",
                    "Vaya a: chorus-pro.gouv.fr",
                    "Inicie sesión y envíe el archivo XML en la sección 'Factures émises'"
                ],
                url: "https://chorus-pro.gouv.fr"
            },
            ES: {
                title: "📋 Envío a través de FACe (España):",
                steps: [
                    "Guarde la factura y descargue el XML",
                    "Vaya a: face.gob.es",
                    "Inicie sesión con su certificado digital y envíe el archivo XML"
                ],
                url: "https://face.gob.es"
            },
            NL: {
                title: "📋 Envío a través de Peppol Access Point (Países Bajos):",
                steps: [
                    "Guarde la factura y descargue el XML UBL 2.1",
                    "Inicie sesión en el portal de su proveedor Peppol Access Point",
                    "Suba el XML para transmitirlo a la entidad pública"
                ]
            },
            GLOBAL: {
                title: "📋 Pasos para Envío de Documento B2G:",
                steps: [
                    "Guarde la factura y descarregue el archivo XML UBL 2.1",
                    "Inicie sesión en el portal oficial de facturación electrónica de su país",
                    "Suba el XML para completar el proceso"
                ]
            }
        }
    }
};

const NewInvoice = () => {
    const { companyProfile, saveInvoice } = useInvoice();
    const { t, appLanguage, invoiceLanguage } = useLanguage();
    const b2g = b2gTranslations[invoiceLanguage] || b2gTranslations['de'];
    const { showToast } = usePanel();
    const { customers } = useCustomers();
    const { products } = useProducts();
    const navigate = useNavigate();
    const location = useLocation();
    const invoiceRef = useRef();
    const [isSaving, setIsSaving] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const prefillData = location.state?.prefill || {};

    const industryConfig = getIndustryFields(companyProfile.industry || 'general');
    const IndustryIcon = INDUSTRY_ICONS[industryConfig.icon] || Briefcase;

    // Local state - industryData stores dynamic fields based on selected industry
    const [invoiceData, setInvoiceData] = useState({
        recipientName: prefillData.recipientName || '',
        recipientStreet: '',
        recipientHouseNum: '',
        recipientZip: '',
        recipientCity: '',
        recipientCountry: '',
        recipientVatId: '',
        invoiceNumber: new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 1000)).padStart(4, '0'),
        date: new Date().toISOString().split('T')[0],
        leistungsdatum: '',        // §14 UStG — Leistungs-/Lieferdatum
        reverseCharge: false,      // §13b UStG — EU B2B Reverse Charge
        currency: companyProfile.defaultCurrency || 'EUR',
        taxRate: companyProfile.kleinunternehmer ? 0 : (companyProfile.defaultTaxRate || 19),
        status: 'draft',
        items: prefillData.items || [{ description: '', quantity: 1, price: 0 }],
        footerNote: '',
        paymentTerms: companyProfile.paymentTerms || '',
        industryData: {} // Dynamic fields based on industry
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInvoiceData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectCustomer = (customer) => {
        setInvoiceData(prev => ({
            ...prev,
            recipientName: customer.name || '',
            recipientStreet: customer.street || '',
            recipientHouseNum: customer.houseNum || '',
            recipientZip: customer.zip || '',
            recipientCity: customer.city || '',
            recipientCountry: customer.country || '',
            recipientVatId: customer.vatId || '',
            recipientId: customer.id,
        }));
        setCustomerSearch(customer.name);
        setShowCustomerDropdown(false);
    };

    const filteredCustomers = customerSearch.length > 0
        ? customers.filter(c =>
            c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
            c.company?.toLowerCase().includes(customerSearch.toLowerCase())
          ).slice(0, 6)
        : [];

    // Handler for industry-specific fields
    const handleIndustryFieldChange = (fieldName, value) => {
        setInvoiceData(prev => ({
            ...prev,
            industryData: { ...prev.industryData, [fieldName]: value }
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...invoiceData.items];
        newItems[index][field] = field === 'description' ? value : value;
        setInvoiceData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setInvoiceData(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, price: 0 }]
        }));
    };

    const addItemFromProduct = (product) => {
        setInvoiceData(prev => ({
            ...prev,
            items: [...prev.items, {
                description: product.name + (product.description ? ` – ${product.description}` : ''),
                quantity: 1,
                price: parseFloat(product.price || 0)
            }]
        }));
    };

    const deleteItem = (index) => {
        setInvoiceData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    // Merge Profile + Invoice Data for the Paper
    const fullData = {
        // Map Context Profile to Paper Props
        logo: companyProfile.logo,
        signatureUrl: companyProfile.signatureUrl || '',
        stampUrl: companyProfile.stampUrl || '',
        senderCompany: companyProfile.companyName,
        senderStreet: companyProfile.street,
        senderHouseNum: companyProfile.houseNum,
        senderZip: companyProfile.zip,
        senderCity: companyProfile.city,
        senderPhone: companyProfile.companyPhone,
        senderEmail: companyProfile.companyEmail,
        senderTaxId: companyProfile.taxId,
        senderVatId: companyProfile.vatId,
        senderBank: companyProfile.bankName,
        senderIban: companyProfile.iban,
        senderBic: companyProfile.bic,
        paypalMe: companyProfile.paypalMe,
        stripeLink: companyProfile.stripeLink,
        industry: companyProfile.industry || 'general',
        logoDisplayMode: companyProfile.logoDisplayMode || 'both',

        // Portugal AT Compliance fields
        senderCountry: companyProfile.country || 'PT',
        country: companyProfile.country || 'PT',
        atValidationCode: companyProfile.atValidationCode,
        ptQrEnabled: companyProfile.ptQrEnabled,
        ptDocType: companyProfile.ptDocType || 'FT',

        // Germany §19 + §13b fields
        kleinunternehmer: companyProfile.kleinunternehmer,
        kleinunternehmerText: companyProfile.kleinunternehmerText || 'Gemäß §19 UStG wird keine Umsatzsteuer berechnet.',
        invoiceSeries: companyProfile.invoiceSeries,

        // Footer Data
        paymentTerms: invoiceData.paymentTerms,
        footerPayment: `Bank: ${companyProfile.bankName}\nIBAN: ${companyProfile.iban}\n${invoiceData.paymentTerms}`,

        // Invoice Specifics
        ...invoiceData,
        // Flatten industryData for paper
        ...invoiceData.industryData
    };


    // Calculate totals for UI
    const calculateTotals = () => {
        const subtotal = invoiceData.items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0);
        const tax = subtotal * (parseFloat(invoiceData.taxRate || 0) / 100);
        const total = subtotal + tax;
        return { subtotal, tax, total };
    };
    const totals = calculateTotals();

    const handleDownloadPdf = async () => {
        const element = invoiceRef.current;
        if (!element) return;

        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Rechnung_${invoiceData.invoiceNumber}.pdf`);
        } catch (error) {
            console.error('PDF generation failed:', error);
            window.print();
        }
    };

    const handleSaveAndPrint = async () => {
        try {
            setIsSaving(true);
            // 1. Save to Archive (capture new invoice object to get ID)
            const newInvoice = await saveInvoice({
                ...invoiceData,
                clientId: invoiceData.recipientId || '', // Future proofing
                ...totals,
                senderSnapshot: companyProfile,
                language: invoiceLanguage // Save the language of the invoice at creation time
            });

            // 2. Navigate to Invoice Details View with autoprint flag
            if (newInvoice && newInvoice.id) {
                navigate(`/invoice/${newInvoice.id}?autoprint=true`);
            } else {
                navigate('/archive');
            }
        } catch (error) {
            console.error("Error saving invoice:", error);
            showToast(t('saveFailed') + " " + error.message, 'error');
            setIsSaving(false);
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>{t('newInvoice')}</h1>
                <div className="actions">
                    <button className="primary-btn" onClick={handleSaveAndPrint} disabled={isSaving}>
                        <Download size={20} className={isSaving ? 'animate-spin' : ''} />
                        {isSaving ? t('saving') : t('saveAndPrint')}
                    </button>
                </div>
            </header>

            <div className="editor-layout">
                {/* Linke Seite: Eingabeformular */}
                <div className="input-section">

                    <div className="card">
                        <h3 className="card-title-flex">
                            {t('customerInfo')}
                            {customers.length > 0 && (
                                <span className="customer-count-badge">
                                    {customers.length} {t('customers')}
                                </span>
                            )}
                        </h3>
                        {/* Customer Autocomplete */}
                        <div className="form-group form-group-relative">
                            <label>{t('customer')}</label>
                            <div className="form-group-relative">
                                <Search size={16} className="input-search-icon" />
                                <input
                                    className="form-input input-with-search"
                                    value={customerSearch || invoiceData.recipientName}
                                    onChange={e => {
                                        setCustomerSearch(e.target.value);
                                        setInvoiceData(prev => ({ ...prev, recipientName: e.target.value }));
                                        setShowCustomerDropdown(true);
                                    }}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 150)}
                                    placeholder={t('searchCustomers')}
                                />
                                {customerSearch && (
                                    <button onClick={() => { setCustomerSearch(''); setInvoiceData(prev => ({ ...prev, recipientName: '' })); }}
                                        className="input-clear-btn">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            {showCustomerDropdown && filteredCustomers.length > 0 && (
                                <div className="customer-dropdown">
                                    {filteredCustomers.map(c => (
                                        <button key={c.id} onMouseDown={() => handleSelectCustomer(c)} className="customer-dropdown-item">
                                            <div className="customer-avatar">
                                                {c.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="customer-name">{c.name}</div>
                                                {c.company && <div className="customer-company">{c.company}</div>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="form-row">
                            <div className="form-group form-group-flex2">
                                <label>{t('street')}</label>
                                <input className="form-input" name="recipientStreet" value={invoiceData.recipientStreet} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('houseNum')}</label>
                                <input className="form-input" name="recipientHouseNum" value={invoiceData.recipientHouseNum} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('zip')}</label>
                                <input className="form-input" name="recipientZip" value={invoiceData.recipientZip} onChange={handleChange} />
                            </div>
                            <div className="form-group form-group-flex2">
                                <label>{t('city')}</label>
                                <input className="form-input" name="recipientCity" value={invoiceData.recipientCity} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Land / País / Country</label>
                                <input className="form-input" name="recipientCountry" value={invoiceData.recipientCountry} onChange={handleChange} placeholder="PT / DE / FR ..." />
                            </div>
                            <div className="form-group">
                                <label>USt-IdNr. / NIF / VAT ID</label>
                                <input className="form-input" name="recipientVatId" value={invoiceData.recipientVatId} onChange={handleChange} placeholder="DE123456789" />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title-flex">
                            <IndustryIcon size={18} color="var(--primary)" />
                            {t((companyProfile.industry || 'general') + 'SectionTitle')}
                        </h3>

                        {/* Dynamic Industry-Specific Fields */}
                        <div className="form-row">
                            {industryConfig.fields.slice(0, 2).map(field => (
                                <div className="form-group" key={field.name}>
                                    <label>{t(field.name + 'Label')}</label>
                                    <input
                                        type={field.type}
                                        className="form-input"
                                        value={invoiceData.industryData[field.name] || ''}
                                        onChange={(e) => handleIndustryFieldChange(field.name, e.target.value)}
                                        placeholder={field.placeholder}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="form-row">
                            {industryConfig.fields.slice(2, 4).map(field => (
                                <div className="form-group" key={field.name}>
                                    <label>{t(field.name + 'Label')}</label>
                                    <input
                                        type={field.type}
                                        className="form-input"
                                        value={invoiceData.industryData[field.name] || ''}
                                        onChange={(e) => handleIndustryFieldChange(field.name, e.target.value)}
                                        placeholder={field.placeholder}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Standard Invoice Fields */}
                        <div className="form-row form-row-separator">
                            <div className="form-group">
                                <label>{t('invoiceNumber')}</label>
                                <input className="form-input" name="invoiceNumber" value={invoiceData.invoiceNumber} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('date')}</label>
                                <input type="date" className="form-input" name="date" value={invoiceData.date} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Leistungsdatum — §14 UStG mandatory for DE */}
                        <div className="form-row">
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    Leistungs-/Lieferdatum
                                    {companyProfile.country === 'DE' && (
                                        <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: '#f59e0b20', color: '#f59e0b', borderRadius: '4px' }}>§14 UStG</span>
                                    )}
                                </label>
                                <input
                                    type="date"
                                    className="form-input"
                                    name="leistungsdatum"
                                    value={invoiceData.leistungsdatum || ''}
                                    onChange={handleChange}
                                />
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                                    {invoiceData.leistungsdatum ? '' : 'Leer = entspricht Rechnungsdatum / igual à data da fatura'}
                                </span>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('currency')}</label>
                                <select className="form-input" name="currency" value={invoiceData.currency} onChange={handleChange}>
                                    <option value="EUR">Euro (€)</option>
                                    <option value="USD">US Dollar ($)</option>
                                    <option value="TRY">Türk Lirası (₺)</option>
                                    <option value="GBP">British Pound (£)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('status')}</label>
                                <select className="form-input" name="status" value={invoiceData.status} onChange={handleChange}>
                                    <option value="draft">{t('draft')}</option>
                                    <option value="sent">{t('sent')}</option>
                                    <option value="paid">{t('paid')}</option>
                                    <option value="partial">{t('partial')}</option>
                                    <option value="overdue">{t('overdue')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('taxRate')}</label>
                                {(companyProfile.kleinunternehmer === true || companyProfile.kleinunternehmer === 'true') ? (
                                    <div style={{ padding: '10px 14px', background: '#3b82f610', borderRadius: '8px', border: '1px solid #3b82f630', fontSize: '0.85rem', color: '#3b82f6' }}>
                                        §19 UStG aktiv — 0% (keine MwSt)
                                    </div>
                                ) : (
                                    <input type="number" className="form-input" name="taxRate" value={invoiceData.taxRate} onChange={handleChange} />
                                )}
                            </div>
                        </div>

                        {/* Reverse Charge — §13b UStG (EU B2B cross-border) */}
                        {invoiceData.recipientCountry && invoiceData.recipientCountry !== (companyProfile.country || 'PT') && (
                        <div className="form-row">
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    Reverse Charge (EU B2B)
                                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: '#8b5cf620', color: '#8b5cf6', borderRadius: '4px' }}>§13b UStG</span>
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                                    <div
                                        onClick={() => setInvoiceData(prev => ({
                                            ...prev,
                                            reverseCharge: !prev.reverseCharge,
                                            taxRate: !prev.reverseCharge ? 0 : (companyProfile.defaultTaxRate || 19)
                                        }))}
                                        style={{
                                            width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
                                            background: invoiceData.reverseCharge ? '#8b5cf6' : '#334155',
                                            position: 'relative', transition: 'background 0.2s ease', flexShrink: 0
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute', top: '3px',
                                            left: invoiceData.reverseCharge ? '23px' : '3px',
                                            width: '18px', height: '18px', borderRadius: '50%',
                                            background: 'white', transition: 'left 0.2s ease'
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {invoiceData.reverseCharge
                                            ? '✓ Aktiv — 0% MwSt, Pflichttext wird eingefügt'
                                            : 'Inaktiv'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>

                    {/* B2G Section */}
                    <div className="card" style={{ border: invoiceData.b2g ? '1px solid rgba(21,128,61,0.3)' : undefined }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: invoiceData.b2g ? '16px' : 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.1rem' }}>🏛️</span>
                                <div>
                                    <strong style={{ fontSize: '0.9rem' }}>{b2g.title}</strong>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {companyProfile.country === 'DE' ? b2g.subtitleDE : b2g.subtitlePT}
                                    </p>
                                </div>
                            </div>
                            <div
                                onClick={() => setInvoiceData(prev => ({ ...prev, b2g: !prev.b2g }))}
                                style={{
                                    width: '48px', height: '26px', borderRadius: '13px', cursor: 'pointer',
                                    background: invoiceData.b2g ? '#15803d' : '#334155',
                                    position: 'relative', transition: 'background 0.2s ease', flexShrink: 0
                                }}
                            >
                                <div style={{
                                    position: 'absolute', top: '3px',
                                    left: invoiceData.b2g ? '25px' : '3px',
                                    width: '20px', height: '20px', borderRadius: '50%',
                                    background: 'white', transition: 'left 0.2s ease'
                                }} />
                            </div>
                        </div>

                        {invoiceData.b2g && (() => {
                            const userCountry = companyProfile.country || 'PT';
                            const activeGuide = b2g.guides[userCountry] || b2g.guides['GLOBAL'];
                            return (
                                <>
                                    <div className="form-row">
                                        <div className="form-group form-group-flex2">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {companyProfile.country === 'DE' ? b2g.leitwegId : b2g.buyerRef}
                                            </label>
                                            <input
                                                className="form-input"
                                                name="buyerReference"
                                                value={invoiceData.buyerReference || ''}
                                                onChange={handleChange}
                                                placeholder={companyProfile.country === 'DE' ? b2g.placeholderDE : b2g.placeholderPT}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>{b2g.entityId}</label>
                                            <input
                                                className="form-input"
                                                name="b2gEntityId"
                                                value={invoiceData.b2gEntityId || ''}
                                                onChange={handleChange}
                                                placeholder={companyProfile.country === 'DE' ? b2g.entityPlaceholderDE : b2g.entityPlaceholderPT}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ padding: '12px 14px', background: 'rgba(21,128,61,0.06)', borderRadius: '10px', border: '1px solid rgba(21,128,61,0.15)' }}>
                                        <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#15803d', fontWeight: '700' }}>
                                            {activeGuide.title}
                                        </p>
                                        <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: '#166534', lineHeight: 1.7 }}>
                                            {activeGuide.steps.map((step, idx) => (
                                                <li key={idx}>
                                                    {activeGuide.url && idx === 1 ? (
                                                        <>
                                                            {userCountry === 'DE' ? 'Gehen Sie zu: ' :
                                                             userCountry === 'AT' ? 'Gehen Sie zu: ' :
                                                             userCountry === 'PT' ? 'Aceda ao portal: ' :
                                                             userCountry === 'FR' ? 'Allez sur : ' :
                                                             userCountry === 'ES' ? 'Vaya a: ' : 'Go to: '}
                                                            <a href={activeGuide.url} target="_blank" rel="noreferrer" style={{ color: '#15803d', textDecoration: 'underline' }}>
                                                                {activeGuide.url.replace('https://www.', '').replace('https://', '')}
                                                            </a>
                                                        </>
                                                    ) : step}
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    <div className="card full-width">
                        <div className="card-header">
                            <h3>{companyProfile.industry === 'general' ? t('genericService') : t('items')}</h3>
                        </div>
                        <table className="items-editor-table">
                            <thead>
                                <tr>
                                    <th>{t('description')}</th>
                                    <th className="th-width-sm">{t('quantity')}</th>
                                    <th className="th-width-md">{t('price')} ({invoiceData.currency === 'TRY' ? '₺' : invoiceData.currency === 'USD' ? '$' : invoiceData.currency === 'GBP' ? '£' : '€'})</th>
                                    <th className="th-width-xs"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoiceData.items.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            <input className="form-input" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                                        </td>
                                        <td>
                                            <input type="number" className="form-input" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                                        </td>
                                        <td>
                                            <input type="number" className="form-input" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} />
                                        </td>
                                        <td>
                                            <button className="icon-btn delete" onClick={() => deleteItem(index)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="button-row">
                            <button className="secondary-btn button-flex" onClick={addItem}>
                                <Plus size={16} /> {t('addRow')}
                            </button>
                            <div className="product-picker-wrapper">
                                <button
                                    className="secondary-btn btn-product-picker"
                                    onClick={() => setShowProductPicker(prev => !prev)}
                                    type="button"
                                >
                                    <Package size={16} /> {t('fromCatalog')}
                                </button>
                                {showProductPicker && (
                                    <div className="product-picker-dropdown">
                                        <div className="product-picker-search">
                                            <div className="form-group-relative">
                                                <Search size={14} className="product-search-icon" />
                                                <input
                                                    className="form-input product-picker-input"
                                                    placeholder={t('searchProducts')}
                                                    value={productSearch}
                                                    onChange={e => setProductSearch(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="product-list">
                                            {(productSearch
                                                ? products.filter(p => p.name?.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 8)
                                                : products.slice(0, 8)
                                            ).length === 0 ? (
                                                <div className="no-products-found">
                                                    {t('noProductsFound')}
                                                </div>
                                            ) : (
                                                (productSearch
                                                    ? products.filter(p => p.name?.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 8)
                                                    : products.slice(0, 8)
                                                ).map(product => (
                                                    <button
                                                        key={product.id}
                                                        type="button"
                                                        onMouseDown={() => {
                                                            addItemFromProduct(product);
                                                            setShowProductPicker(false);
                                                            setProductSearch('');
                                                        }}
                                                        className="product-item-btn"
                                                    >
                                                        <div>
                                                            <div className="product-name">{product.name}</div>
                                                            {product.description && <div className="product-description">{product.description}</div>}
                                                        </div>
                                                        <div className="product-price">
                                                            €{parseFloat(product.price || 0).toFixed(2)}/{product.unit}
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mini-totals">
                            <div className="row"><span>{t('subtotal')}:</span> <span>{totals.subtotal.toFixed(2)} {invoiceData.currency === 'TRY' ? '₺' : invoiceData.currency === 'USD' ? '$' : invoiceData.currency === 'GBP' ? '£' : '€'}</span></div>
                            <div className="row"><span>{t('tax')} ({invoiceData.taxRate}%):</span> <span>{totals.tax.toFixed(2)} {invoiceData.currency === 'TRY' ? '₺' : invoiceData.currency === 'USD' ? '$' : invoiceData.currency === 'GBP' ? '£' : '€'}</span></div>
                            <div className="row total"><span>{t('total')}:</span> <span>{totals.total.toFixed(2)} {invoiceData.currency === 'TRY' ? '₺' : invoiceData.currency === 'USD' ? '$' : invoiceData.currency === 'GBP' ? '£' : '€'}</span></div>
                        </div>
                    </div>

                    <div className="card full-width">
                        <h3>{t('paymentTerms')}</h3>
                        <div className="form-group">
                            <label>{t('additionalInfo')}</label>
                             <input 
                                 className="form-input footer-note-input" 
                                 name="footerNote" 
                                 value={invoiceData.footerNote} 
                                 onChange={handleChange}
                                 placeholder={t('thanksPlaceholder')}
                             />
                            
                            <label>{t('paymentTerms')}</label>
                            <textarea 
                                className="form-input" 
                                name="paymentTerms" 
                                value={invoiceData.paymentTerms} 
                                onChange={handleChange}
                                rows="3"
                                placeholder="..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Print Area */}
            <div className="hidden-print-container">
                <InvoicePaper
                    data={fullData}
                    totals={totals}
                    ref={invoiceRef}
                />
            </div>
        </div>
    );
};

export default NewInvoice;
