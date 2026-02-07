// Industry-specific field configurations for invoice forms
// Each industry has custom fields that appear in the "Details" section of the invoice form

export const INDUSTRY_FIELDS = {
    automotive: {
        icon: '🚗',
        sectionTitle: 'Fahrzeug-Details',
        sectionTitleTR: 'Araç Detayları',
        fields: [
            { name: 'vehicle', label: 'Fahrzeug', labelTR: 'Araç', type: 'text', placeholder: 'z.B. VW Golf VII' },
            { name: 'plate', label: 'Kennzeichen', labelTR: 'Plaka', type: 'text', placeholder: 'z.B. ESW-AB 123' },
            { name: 'km', label: 'Kilometerstand', labelTR: 'Kilometre', type: 'number', placeholder: '123456' },
            { name: 'vin', label: 'Fahrgestellnummer (VIN)', labelTR: 'Şase No (VIN)', type: 'text', placeholder: 'Optional' }
        ]
    },
    construction: {
        icon: '🏗️',
        sectionTitle: 'Baustellen-Details',
        sectionTitleTR: 'Şantiye Detayları',
        fields: [
            { name: 'projectName', label: 'Projektname', labelTR: 'Proje Adı', type: 'text', placeholder: 'z.B. Neubau Einfamilienhaus' },
            { name: 'siteAddress', label: 'Baustellenadresse', labelTR: 'Şantiye Adresi', type: 'text', placeholder: 'z.B. Musterstraße 1, 12345 Berlin' },
            { name: 'workPhase', label: 'Bauphase', labelTR: 'İnşaat Aşaması', type: 'text', placeholder: 'z.B. Rohbau, Innenausbau' },
            { name: 'contractRef', label: 'Auftrags-Nr.', labelTR: 'Sözleşme No', type: 'text', placeholder: 'Optional' }
        ]
    },
    gastronomy: {
        icon: '🍽️',
        sectionTitle: 'Veranstaltungs-Details',
        sectionTitleTR: 'Etkinlik Detayları',
        fields: [
            { name: 'eventName', label: 'Veranstaltung', labelTR: 'Etkinlik Adı', type: 'text', placeholder: 'z.B. Hochzeit, Firmenfeier' },
            { name: 'eventDate', label: 'Veranstaltungsdatum', labelTR: 'Etkinlik Tarihi', type: 'date', placeholder: '' },
            { name: 'guestCount', label: 'Personenzahl', labelTR: 'Kişi Sayısı', type: 'number', placeholder: 'z.B. 50' },
            { name: 'venue', label: 'Veranstaltungsort', labelTR: 'Mekan', type: 'text', placeholder: 'Optional' }
        ]
    },
    healthcare: {
        icon: '🏥',
        sectionTitle: 'Patienten-Details',
        sectionTitleTR: 'Hasta Detayları',
        fields: [
            { name: 'patientId', label: 'Patienten-ID', labelTR: 'Hasta ID', type: 'text', placeholder: 'z.B. PAT-12345' },
            { name: 'treatmentType', label: 'Behandlungsart', labelTR: 'Tedavi Türü', type: 'text', placeholder: 'z.B. Physiotherapie' },
            { name: 'treatmentDate', label: 'Behandlungsdatum', labelTR: 'Tedavi Tarihi', type: 'date', placeholder: '' },
            { name: 'insuranceRef', label: 'Versicherungs-Nr.', labelTR: 'Sigorta No', type: 'text', placeholder: 'Optional' }
        ]
    },
    it: {
        icon: '💻',
        sectionTitle: 'Projekt-Details',
        sectionTitleTR: 'Proje Detayları',
        fields: [
            { name: 'projectName', label: 'Projektname', labelTR: 'Proje Adı', type: 'text', placeholder: 'z.B. Website Redesign' },
            { name: 'projectPhase', label: 'Projektphase', labelTR: 'Proje Aşaması', type: 'text', placeholder: 'z.B. Entwicklung, Testing' },
            { name: 'hoursWorked', label: 'Arbeitsstunden', labelTR: 'Çalışılan Saat', type: 'number', placeholder: 'z.B. 40' },
            { name: 'ticketRef', label: 'Ticket/Auftrags-Nr.', labelTR: 'Ticket/Sipariş No', type: 'text', placeholder: 'Optional' }
        ]
    },
    retail: {
        icon: '🛒',
        sectionTitle: 'Bestell-Details',
        sectionTitleTR: 'Sipariş Detayları',
        fields: [
            { name: 'orderNumber', label: 'Bestellnummer', labelTR: 'Sipariş No', type: 'text', placeholder: 'z.B. ORD-2025-001' },
            { name: 'deliveryDate', label: 'Lieferdatum', labelTR: 'Teslimat Tarihi', type: 'date', placeholder: '' },
            { name: 'deliveryAddress', label: 'Lieferadresse', labelTR: 'Teslimat Adresi', type: 'text', placeholder: 'Falls abweichend' },
            { name: 'trackingNumber', label: 'Sendungsnummer', labelTR: 'Kargo Takip No', type: 'text', placeholder: 'Optional' }
        ]
    },
    crafts: {
        icon: '🔧',
        sectionTitle: 'Auftrags-Details',
        sectionTitleTR: 'İş Detayları',
        fields: [
            { name: 'workType', label: 'Art der Arbeit', labelTR: 'İş Türü', type: 'text', placeholder: 'z.B. Reparatur, Installation' },
            { name: 'workLocation', label: 'Einsatzort', labelTR: 'Çalışma Yeri', type: 'text', placeholder: 'Kundenadresse' },
            { name: 'workDuration', label: 'Arbeitszeit (Std.)', labelTR: 'Çalışma Süresi (Saat)', type: 'number', placeholder: 'z.B. 4' },
            { name: 'materialUsed', label: 'Verwendetes Material', labelTR: 'Kullanılan Malzeme', type: 'text', placeholder: 'Optional' }
        ]
    },
    consulting: {
        icon: '📊',
        sectionTitle: 'Beratungs-Details',
        sectionTitleTR: 'Danışmanlık Detayları',
        fields: [
            { name: 'projectName', label: 'Projektbezeichnung', labelTR: 'Proje Adı', type: 'text', placeholder: 'z.B. Strategieberatung Q1' },
            { name: 'consultingHours', label: 'Beratungsstunden', labelTR: 'Danışmanlık Saati', type: 'number', placeholder: 'z.B. 20' },
            { name: 'consultingPeriod', label: 'Beratungszeitraum', labelTR: 'Danışmanlık Dönemi', type: 'text', placeholder: 'z.B. 01.01 - 31.01.2025' },
            { name: 'contractRef', label: 'Vertrags-Nr.', labelTR: 'Sözleşme No', type: 'text', placeholder: 'Optional' }
        ]
    },
    education: {
        icon: '📚',
        sectionTitle: 'Kurs-Details',
        sectionTitleTR: 'Kurs Detayları',
        fields: [
            { name: 'courseName', label: 'Kursbezeichnung', labelTR: 'Kurs Adı', type: 'text', placeholder: 'z.B. Deutschkurs A1' },
            { name: 'studentName', label: 'Teilnehmername', labelTR: 'Öğrenci Adı', type: 'text', placeholder: 'Name des Teilnehmers' },
            { name: 'courseDuration', label: 'Kursdauer (Std.)', labelTR: 'Kurs Süresi (Saat)', type: 'number', placeholder: 'z.B. 40' },
            { name: 'courseDate', label: 'Kurszeitraum', labelTR: 'Kurs Dönemi', type: 'text', placeholder: 'z.B. Jan - März 2025' }
        ]
    },
    general: {
        icon: '💼',
        sectionTitle: 'Projekt-Details',
        sectionTitleTR: 'Proje Detayları',
        fields: [
            { name: 'reference', label: 'Referenz/Projekt-Nr.', labelTR: 'Referans/Proje No', type: 'text', placeholder: 'z.B. PRJ-2025-001' },
            { name: 'description', label: 'Kurzbeschreibung', labelTR: 'Kısa Açıklama', type: 'text', placeholder: 'Worum geht es?' },
            { name: 'serviceDate', label: 'Leistungsdatum', labelTR: 'Hizmet Tarihi', type: 'date', placeholder: '' },
            { name: 'notes', label: 'Zusätzliche Notizen', labelTR: 'Ek Notlar', type: 'text', placeholder: 'Optional' }
        ]
    }
};

// Helper to get fields for a specific industry
export const getIndustryFields = (industry) => {
    return INDUSTRY_FIELDS[industry] || INDUSTRY_FIELDS.general;
};

// Get all field names that should be saved for any industry
export const getAllIndustryFieldNames = () => {
    const allFields = new Set();
    Object.values(INDUSTRY_FIELDS).forEach(config => {
        config.fields.forEach(field => allFields.add(field.name));
    });
    return Array.from(allFields);
};
