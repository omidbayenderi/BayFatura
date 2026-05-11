/**
 * BayFatura — UBL 2.1 / CIUS-PT Generator
 * 
 * Generates EU-compliant B2G (Business to Government) e-invoices in
 * UBL 2.1 format per CIUS-PT specification, required for Portuguese
 * public sector invoicing via eSPap (since Jan 2026 for all SMEs).
 * 
 * Standards:
 * - EU Directive 2014/55/EU
 * - EN 16931 European E-Invoicing Standard
 * - CIUS-PT: urn:cen.eu:en16931:2017#compliant#urn:fdc:cius-pt.pt:2022
 * - PEPPOL BIS Billing 3.0
 * 
 * Submission: via eSPap platform (https://www.espap.gov.pt) or PEPPOL network
 * 
 * Reference: https://www.espap.gov.pt/efatura/eFaturaPT/Paginas/efaturaPT.aspx
 */

// XML escape utility
const x = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// Format date as YYYY-MM-DD
const fDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().slice(0, 10);
    return dateStr.slice(0, 10);
};

// Invoice type codes (UN/CEFACT)
export const UBL_DOC_TYPES = {
    invoice: '380',    // Commercial Invoice
    credit: '381',     // Credit Note
    debit: '383',      // Debit Note
    proforma: '325',   // Proforma Invoice
    quote: '81',       // Quotation
};

// IVA category codes
const getVatCategoryCode = (rate) => {
    if (rate === 0) return 'Z';      // Zero-rated
    if (rate === 6) return 'R';      // Reduced Portugal
    if (rate === 13) return 'AA';    // Intermediate Portugal
    if (rate === 23) return 'S';     // Standard Portugal
    if (rate === 7) return 'AA';     // Reduced Germany
    if (rate === 19) return 'S';     // Standard Germany
    return 'S';
};

/**
 * Generate UBL 2.1 CIUS-PT XML for B2G invoice
 *
 * @param {Object} invoice - Invoice data
 * @param {Object} sender - Company profile (seller)
 * @param {Object} totals - { subtotal, tax, total }
 * @returns {string} XML string
 */
export const generateUBL21 = (invoice, sender, totals) => {
    const { subtotal = 0, tax = 0, total = 0 } = totals;
    const taxRate = parseFloat(invoice.taxRate || 23);
    const vatCode = getVatCategoryCode(taxRate);
    const currency = invoice.currency || 'EUR';
    const docTypeCode = UBL_DOC_TYPES[invoice.type] || '380';

    // ATCUD note (if available)
    const atcudNote = invoice.atcud ? `ATCUD:${invoice.atcud}` : '';

    // Due date (invoice date + 30 days by default)
    const issueDate = fDate(invoice.date);
    const dueDate = (() => {
        const d = new Date(invoice.date || new Date());
        d.setDate(d.getDate() + 30);
        return d.toISOString().slice(0, 10);
    })();

    // Build invoice lines
    const lineItems = (invoice.items || []).map((item, idx) => {
        const lineTotal = parseFloat(item.price || 0) * parseFloat(item.quantity || 1);
        const itemTaxRate = parseFloat(item.taxRate ?? taxRate);
        const itemVatCode = getVatCategoryCode(itemTaxRate);
        return `
  <cac:InvoiceLine>
    <cbc:ID>${idx + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${parseFloat(item.quantity || 1).toFixed(2)}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${currency}">${lineTotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${x(item.description)}</cbc:Description>
      <cbc:Name>${x((item.description || '').slice(0, 100))}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${itemVatCode}</cbc:ID>
        <cbc:Percent>${itemTaxRate.toFixed(2)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${currency}">${parseFloat(item.price || 0).toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

  <!-- CIUS-PT Specification Identifier -->
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:cius-pt.pt:2022</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>

  <!-- Invoice Header -->
  <cbc:ID>${x(invoice.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:DueDate>${dueDate}</cbc:DueDate>
  <cbc:InvoiceTypeCode>${docTypeCode}</cbc:InvoiceTypeCode>
  ${atcudNote ? `<cbc:Note>${x(atcudNote)}</cbc:Note>` : ''}
  ${invoice.paymentTerms ? `<cbc:Note>${x(invoice.paymentTerms)}</cbc:Note>` : ''}
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${currency}</cbc:TaxCurrencyCode>
  ${invoice.buyerReference ? `<cbc:BuyerReference>${x(invoice.buyerReference)}</cbc:BuyerReference>` : '<cbc:BuyerReference>N/A</cbc:BuyerReference>'}

  <!-- Accounting Supplier Party (Seller / Emitente) -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="0211">${x(sender.taxId || sender.nif || '')}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${x(sender.companyName || sender.name || '')}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${x((sender.street || '') + ' ' + (sender.houseNum || ''))}</cbc:StreetName>
        <cbc:CityName>${x(sender.city || '')}</cbc:CityName>
        <cbc:PostalZone>${x(sender.zip || '')}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${x(sender.country || 'PT')}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${x((sender.country || 'PT') + (sender.taxId || sender.vatId || ''))}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${x(sender.companyName || sender.name || '')}</cbc:RegistrationName>
        <cbc:CompanyID>${x(sender.taxId || sender.nif || '')}</cbc:CompanyID>
      </cac:PartyLegalEntity>
      ${sender.companyEmail ? `<cac:Contact><cbc:ElectronicMail>${x(sender.companyEmail)}</cbc:ElectronicMail></cac:Contact>` : ''}
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- Accounting Customer Party (Buyer / Destinatário) -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${x(invoice.recipientName || '')}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${x((invoice.recipientStreet || '') + ' ' + (invoice.recipientHouseNum || ''))}</cbc:StreetName>
        <cbc:CityName>${x(invoice.recipientCity || '')}</cbc:CityName>
        <cbc:PostalZone>${x(invoice.recipientZip || '')}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${x(invoice.recipientCountry || 'PT')}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      ${invoice.recipientVatId || invoice.recipientTaxId ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${x(invoice.recipientVatId || invoice.recipientTaxId)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>` : ''}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${x(invoice.recipientName || '')}</cbc:RegistrationName>
        ${invoice.b2gEntityId ? `<cbc:CompanyID>${x(invoice.b2gEntityId)}</cbc:CompanyID>` : ''}
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <!-- Payment Means -->
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode><!-- 30 = Credit transfer -->
    ${invoice.senderIban ? `<cac:PayeeFinancialAccount>
      <cbc:ID>${x(invoice.senderIban)}</cbc:ID>
      ${invoice.senderBic ? `<cac:FinancialInstitutionBranch><cbc:ID>${x(invoice.senderBic)}</cbc:ID></cac:FinancialInstitutionBranch>` : ''}
    </cac:PayeeFinancialAccount>` : ''}
  </cac:PaymentMeans>

  <!-- Tax Total -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${tax.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${subtotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${tax.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${vatCode}</cbc:ID>
        <cbc:Percent>${taxRate.toFixed(2)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <!-- Legal Monetary Total -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="${currency}">0.00</cbc:AllowanceTotalAmount>
    <cbc:ChargeTotalAmount currencyID="${currency}">0.00</cbc:ChargeTotalAmount>
    <cbc:PayableAmount currencyID="${currency}">${total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <!-- Invoice Lines -->
  ${lineItems}

</Invoice>`;

    return xml;
};

/**
 * Download UBL XML as file
 */
export const downloadUBL = (xml, invoiceNumber) => {
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CIUS-PT_${invoiceNumber || 'fatura'}_${new Date().toISOString().slice(0, 10)}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Validate if NIF belongs to a public entity (Portugal)
 * Portuguese public entities have NIFs starting with 5 (state entities) or 6 (municipalities)
 */
export const isPublicEntityNIF = (nif) => {
    const cleaned = String(nif || '').replace(/\s/g, '');
    return cleaned.startsWith('5') || cleaned.startsWith('6');
};

/**
 * eSPap submission guidance text
 */
export const ESPAP_GUIDE = {
    platform: 'https://www.espap.gov.pt',
    peppol: 'https://peppol.eu',
    steps: [
        'Gere o ficheiro UBL 2.1 (CIUS-PT) com o botão abaixo',
        'Aceda ao Portal eSPap: espap.gov.pt',
        'Faça login com Autenticação.gov ou certificado digital',
        'Envie o ficheiro XML na secção "Faturação Eletrónica"',
        'Conserve o número de referência eSPap para arquivo (10 anos)',
    ],
};
