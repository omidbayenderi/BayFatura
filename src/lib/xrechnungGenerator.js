/**
 * BayFatura — XRechnung & ZUGFeRD Generator
 * 
 * Implements EN 16931 (European e-invoice standard) in CII (Cross Industry Invoice) format.
 * Compatible with:
 *   → XRechnung 3.0 (DE mandatory for B2G since 2020, B2B phased from 2025)
 *   → ZUGFeRD 2.3 (EXTENDED profile — machine-readable XML embedded in PDF)
 * 
 * Reference: https://www.xoev.de/xrechnung-16828
 */

/**
 * Escape XML special characters
 */
const xmlEscape = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

/**
 * Format date as YYYYMMDD (CII standard date format)
 */
const formatDateCII = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.replace(/-/g, '');
};

/**
 * Format currency amount (always 2 decimal places, period as decimal separator)
 */
const formatAmount = (val) => parseFloat(val || 0).toFixed(2);

/**
 * Generate CII (UN/CEFACT Cross Industry Invoice) XML — the format used by XRechnung & ZUGFeRD
 * 
 * @param {Object} invoice - Invoice data object
 * @param {Object} sender - Sender (company) profile
 * @returns {string} Complete XML string
 */
export const generateXRechnungXML = (invoice, sender) => {
    const taxRate = parseFloat(invoice.taxRate || 19);
    const subtotal = formatAmount(invoice.subtotal || 0);
    const taxAmount = formatAmount(invoice.tax || 0);
    const total = formatAmount(invoice.total || 0);
    const currency = invoice.currency || 'EUR';
    const invoiceDate = formatDateCII(invoice.date);
    // Due date: 30 days after invoice date by default
    const dueDate = invoice.dueDate
        ? formatDateCII(invoice.dueDate)
        : formatDateCII(new Date(new Date(invoice.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

    const items = (invoice.items || []).map((item, idx) => {
        const lineTotal = formatAmount(parseFloat(item.price || 0) * parseFloat(item.quantity || 1));
        const unitCode = 'C62'; // UN/ECE generic unit code (piece)
        return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${idx + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${xmlEscape(item.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${formatAmount(item.price)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${unitCode}">${parseFloat(item.quantity || 1).toFixed(4)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${taxRate === 0 ? 'Z' : 'S'}</ram:CategoryCode>
          <ram:RateApplicablePercent>${taxRate.toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${lineTotal}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  BayFatura XRechnung / ZUGFeRD 2.3 — EN 16931 compliant
  Profile: XRECHNUNG / ZUGFeRD EXTENDED
  Generator: BayFatura (bayfatura.com)
  Generated: ${new Date().toISOString()}
-->
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">

  <!-- ──────────────────────────────────────────────
       HEADER: Document type, number, date
  ────────────────────────────────────────────── -->
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <!-- XRechnung 3.0 profile URI -->
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_3.0</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <rsm:ExchangedDocument>
    <ram:ID>${xmlEscape(invoice.invoiceNumber)}</ram:ID>
    <!-- 380 = Commercial Invoice (EN 16931 type code) -->
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${invoiceDate}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${invoice.footerNote ? `<ram:IncludedNote><ram:Content>${xmlEscape(invoice.footerNote)}</ram:Content></ram:IncludedNote>` : ''}
  </rsm:ExchangedDocument>

  <!-- ──────────────────────────────────────────────
       TRADE TRANSACTION
  ────────────────────────────────────────────── -->
  <rsm:SupplyChainTradeTransaction>

    <!-- ── Line Items ─────────────────────────── -->
    ${items}

    <!-- ── Header Trade Agreement ─────────────── -->
    <ram:ApplicableHeaderTradeAgreement>

      <!-- Seller (Rechnungssteller) -->
      <ram:SellerTradeParty>
        <ram:Name>${xmlEscape(sender.companyName || sender.name || '')}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${xmlEscape(sender.zip || '')}</ram:PostcodeCode>
          <ram:LineOne>${xmlEscape((sender.street || '') + ' ' + (sender.houseNum || ''))}</ram:LineOne>
          <ram:CityName>${xmlEscape(sender.city || '')}</ram:CityName>
          <ram:CountryID>${xmlEscape(sender.country || sender.countryCode || 'DE')}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${sender.email ? `<ram:URIUniversalCommunication><ram:URIID schemeID="EM">${xmlEscape(sender.email)}</ram:URIID></ram:URIUniversalCommunication>` : ''}
        <ram:SpecifiedTaxRegistration>
          ${sender.vatId ? `<ram:ID schemeID="VA">${xmlEscape(sender.vatId)}</ram:ID>` : ''}
          ${sender.taxId ? `<ram:ID schemeID="FC">${xmlEscape(sender.taxId)}</ram:ID>` : ''}
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>

      <!-- Buyer (Rechnungsempfänger) -->
      <ram:BuyerTradeParty>
        <ram:Name>${xmlEscape(invoice.recipientName || '')}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${xmlEscape(invoice.recipientZip || '')}</ram:PostcodeCode>
          <ram:LineOne>${xmlEscape((invoice.recipientStreet || '') + ' ' + (invoice.recipientHouseNum || ''))}</ram:LineOne>
          <ram:CityName>${xmlEscape(invoice.recipientCity || '')}</ram:CityName>
          <ram:CountryID>${xmlEscape(invoice.recipientCountry || 'DE')}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${invoice.recipientEmail ? `<ram:URIUniversalCommunication><ram:URIID schemeID="EM">${xmlEscape(invoice.recipientEmail)}</ram:URIID></ram:URIUniversalCommunication>` : ''}
      </ram:BuyerTradeParty>

      <ram:BuyerOrderReferencedDocument>
        <ram:IssuerAssignedID>${xmlEscape(invoice.invoiceNumber)}</ram:IssuerAssignedID>
      </ram:BuyerOrderReferencedDocument>
    </ram:ApplicableHeaderTradeAgreement>

    <!-- ── Delivery ────────────────────────────── -->
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${invoiceDate}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>

    <!-- ── Settlement (Payment & Totals) ──────── -->
    <ram:ApplicableHeaderTradeSettlement>
      <ram:PaymentReference>${xmlEscape(invoice.invoiceNumber)}</ram:PaymentReference>
      <ram:InvoiceCurrencyCode>${currency}</ram:InvoiceCurrencyCode>

      <!-- IBAN Payment (SEPA Credit Transfer) -->
      ${sender.iban ? `
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${xmlEscape(sender.iban.replace(/\s/g, ''))}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
        ${sender.bic ? `<ram:PayeeSpecifiedCreditorFinancialInstitution><ram:BICID>${xmlEscape(sender.bic)}</ram:BICID></ram:PayeeSpecifiedCreditorFinancialInstitution>` : ''}
      </ram:SpecifiedTradeSettlementPaymentMeans>` : ''}

      <!-- Tax -->
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${taxAmount}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${subtotal}</ram:BasisAmount>
        <ram:CategoryCode>${taxRate === 0 ? 'Z' : 'S'}</ram:CategoryCode>
        <ram:DueDateTypeCode>5</ram:DueDateTypeCode>
        <ram:RateApplicablePercent>${taxRate.toFixed(2)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>

      <!-- Due date -->
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${dueDate}</udt:DateTimeString>
        </ram:DueDateDateTime>
        ${invoice.paymentTerms ? `<ram:Description>${xmlEscape(invoice.paymentTerms)}</ram:Description>` : ''}
      </ram:SpecifiedTradePaymentTerms>

      <!-- Monetary Totals -->
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${subtotal}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${subtotal}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${currency}">${taxAmount}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${total}</ram:GrandTotalAmount>
        <ram:TotalPrepaidAmount>0.00</ram:TotalPrepaidAmount>
        <ram:DuePayableAmount>${total}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>

  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

    return xml;
};

/**
 * Download XRechnung XML file
 */
export const downloadXRechnungXML = (invoice, sender) => {
    const xml = generateXRechnungXML(invoice, sender);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `XRechnung_${invoice.invoiceNumber || 'invoice'}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Validate if invoice data is sufficient for XRechnung generation
 * Returns { valid: boolean, missing: string[] }
 */
export const validateXRechnungData = (invoice, sender) => {
    const missing = [];
    if (!invoice.invoiceNumber) missing.push('Rechnungsnummer');
    if (!invoice.date) missing.push('Rechnungsdatum');
    if (!invoice.recipientName) missing.push('Empfängername');
    if (!sender.companyName && !sender.name) missing.push('Absendername');
    if (!sender.vatId && !sender.taxId) missing.push('Steuernummer / USt-IdNr.');
    if (!sender.iban) missing.push('IBAN (für SEPA-Zahlung)');
    if (!(invoice.items && invoice.items.length > 0)) missing.push('Mindestens eine Rechnungsposition');
    return { valid: missing.length === 0, missing };
};
