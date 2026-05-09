/**
 * BayFatura Email Service
 * Resend API üzerinden profesyonel fatura e-postaları gönderir
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'fatura@bayfatura.com';

/**
 * Fatura/teklif için HTML e-posta şablonu üretir
 */
const buildEmailHtml = ({ invoice, senderName, senderEmail, type, language, publicUrl }) => {
    const isQuote = type === 'quote';
    const currencySymbol = invoice.currency === 'TRY' ? '₺' : invoice.currency === 'USD' ? '$' : invoice.currency === 'GBP' ? '£' : '€';
    const formatMoney = (val) => `${currencySymbol}${parseFloat(val || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

    const labels = {
        de: {
            greeting: `Sehr geehrte/r ${invoice.recipientName},`,
            body: isQuote
                ? `vielen Dank für Ihre Anfrage. Anbei finden Sie unser Angebot.`
                : `bitte begleichen Sie die folgende Rechnung bis zum angegebenen Fälligkeitsdatum.`,
            viewBtn: isQuote ? 'Angebot online ansehen' : 'Rechnung online ansehen',
            invoiceLabel: isQuote ? 'Angebotsnummer' : 'Rechnungsnummer',
            dateLabel: 'Datum',
            totalLabel: 'Gesamtbetrag',
            itemsLabel: 'Positionen',
            quantityLabel: 'Menge',
            priceLabel: 'Preis',
            subtotalLabel: 'Zwischensumme',
            taxLabel: 'MwSt.',
            footer: `Diese E-Mail wurde über BayFatura gesendet. Bei Fragen wenden Sie sich an ${senderEmail}.`,
        },
        tr: {
            greeting: `Sayın ${invoice.recipientName},`,
            body: isQuote
                ? `Talebiniz için teşekkür ederiz. Teklifimizi ekte bulabilirsiniz.`
                : `Lütfen aşağıdaki faturayı belirtilen son ödeme tarihine kadar ödeyiniz.`,
            viewBtn: isQuote ? 'Teklifi Online Gör' : 'Faturayı Online Gör',
            invoiceLabel: isQuote ? 'Teklif No' : 'Fatura No',
            dateLabel: 'Tarih',
            totalLabel: 'Toplam Tutar',
            itemsLabel: 'Kalemler',
            quantityLabel: 'Miktar',
            priceLabel: 'Birim Fiyat',
            subtotalLabel: 'Ara Toplam',
            taxLabel: 'KDV',
            footer: `Bu e-posta BayFatura üzerinden gönderildi. Sorularınız için ${senderEmail} adresine yazabilirsiniz.`,
        },
        en: {
            greeting: `Dear ${invoice.recipientName},`,
            body: isQuote
                ? `Thank you for your inquiry. Please find our quote attached.`
                : `Please settle the following invoice by the due date.`,
            viewBtn: isQuote ? 'View Quote Online' : 'View Invoice Online',
            invoiceLabel: isQuote ? 'Quote Number' : 'Invoice Number',
            dateLabel: 'Date',
            totalLabel: 'Total Amount',
            itemsLabel: 'Line Items',
            quantityLabel: 'Qty',
            priceLabel: 'Price',
            subtotalLabel: 'Subtotal',
            taxLabel: 'Tax',
            footer: `This email was sent via BayFatura. For questions contact ${senderEmail}.`,
        },
        fr: {
            greeting: `Bonjour ${invoice.recipientName},`,
            body: isQuote
                ? `Merci pour votre demande. Veuillez trouver ci-joint notre devis.`
                : `Veuillez régler la facture suivante avant la date d'échéance.`,
            viewBtn: isQuote ? 'Voir le devis en ligne' : 'Voir la facture en ligne',
            invoiceLabel: isQuote ? 'Numéro de devis' : 'Numéro de facture',
            dateLabel: 'Date',
            totalLabel: 'Montant total',
            itemsLabel: 'Articles',
            quantityLabel: 'Qté',
            priceLabel: 'Prix',
            subtotalLabel: 'Sous-total',
            taxLabel: 'TVA',
            footer: `Cet e-mail a été envoyé via BayFatura. Pour toute question, contactez ${senderEmail}.`,
        },
        es: {
            greeting: `Estimado/a ${invoice.recipientName},`,
            body: isQuote
                ? `Gracias por su solicitud. Adjunto encontrará nuestro presupuesto.`
                : `Por favor, liquide la siguiente factura antes de la fecha de vencimiento.`,
            viewBtn: isQuote ? 'Ver presupuesto en línea' : 'Ver factura en línea',
            invoiceLabel: isQuote ? 'Número de presupuesto' : 'Número de factura',
            dateLabel: 'Fecha',
            totalLabel: 'Importe total',
            itemsLabel: 'Artículos',
            quantityLabel: 'Cant.',
            priceLabel: 'Precio',
            subtotalLabel: 'Subtotal',
            taxLabel: 'IVA',
            footer: `Este correo electrónico fue enviado a través de BayFatura. Si tiene alguna pregunta, contacte a ${senderEmail}.`,
        },
        pt: {
            greeting: `Prezado(a) ${invoice.recipientName},`,
            body: isQuote
                ? `Obrigado pelo seu pedido. Segue em anexo o nosso orçamento.`
                : `Por favor, liquide a seguinte fatura até a data de vencimento.`,
            viewBtn: isQuote ? 'Ver orçamento online' : 'Ver fatura online',
            invoiceLabel: isQuote ? 'Número do orçamento' : 'Número da fatura',
            dateLabel: 'Data',
            totalLabel: 'Valor total',
            itemsLabel: 'Itens',
            quantityLabel: 'Qtd.',
            priceLabel: 'Preço',
            subtotalLabel: 'Subtotal',
            taxLabel: 'IVA',
            footer: `Este e-mail foi enviado via BayFatura. Para dúvidas, entre em contato com ${senderEmail}.`,
        },
    };

    const L = labels[language] || labels['de'];

    const itemRows = (invoice.items || []).map(item => `
        <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155">${item.description || ''}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;text-align:center">${item.quantity}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;text-align:right">${formatMoney(parseFloat(item.price || 0) * parseFloat(item.quantity || 1))}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="${language}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${L.invoiceLabel}: ${invoice.invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:20px 20px 0 0;padding:36px 40px;text-align:center">
        <h1 style="margin:0;color:white;font-size:26px;font-weight:800;letter-spacing:-0.5px">BayFatura</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">${senderName}</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:white;padding:36px 40px">
        <p style="margin:0 0 20px;font-size:16px;color:#334155;line-height:1.7">${L.greeting}</p>
        <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.7">${L.body}</p>

        <!-- Invoice Meta -->
        <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:28px;display:flex;gap:24px;flex-wrap:wrap">
          <div style="flex:1;min-width:120px">
            <span style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.5px">${L.invoiceLabel}</span>
            <p style="margin:4px 0 0;font-size:16px;font-weight:800;color:#1e293b">${invoice.invoiceNumber}</p>
          </div>
          <div style="flex:1;min-width:120px">
            <span style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.5px">${L.dateLabel}</span>
            <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#1e293b">${invoice.date}</p>
          </div>
          <div style="flex:1;min-width:120px">
            <span style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.5px">${L.totalLabel}</span>
            <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#3b82f6">${formatMoney(invoice.total)}</p>
          </div>
        </div>

        <!-- Items Table -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">${L.itemsLabel}</th>
              <th style="padding:10px 12px;text-align:center;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">${L.quantityLabel}</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">${L.priceLabel}</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr style="background:#f8fafc">
              <td colspan="2" style="padding:10px 12px;font-size:13px;color:#64748b;text-align:right">${L.subtotalLabel}:</td>
              <td style="padding:10px 12px;font-size:13px;color:#334155;text-align:right;font-weight:600">${formatMoney(invoice.subtotal)}</td>
            </tr>
            <tr style="background:#f8fafc">
              <td colspan="2" style="padding:8px 12px;font-size:13px;color:#64748b;text-align:right">${L.taxLabel} (${invoice.taxRate || 19}%):</td>
              <td style="padding:8px 12px;font-size:13px;color:#334155;text-align:right;font-weight:600">${formatMoney(invoice.tax)}</td>
            </tr>
            <tr style="background:linear-gradient(135deg,#eff6ff,#eef2ff)">
              <td colspan="2" style="padding:14px 12px;font-size:15px;color:#1e293b;text-align:right;font-weight:800">${L.totalLabel}:</td>
              <td style="padding:14px 12px;font-size:18px;color:#3b82f6;text-align:right;font-weight:900">${formatMoney(invoice.total)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- CTA Button -->
        <div style="text-align:center;margin:32px 0">
          <a href="${publicUrl}" target="_blank" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;text-decoration:none;border-radius:100px;font-size:15px;font-weight:700;letter-spacing:.3px">
            ${L.viewBtn} →
          </a>
        </div>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f1f5f9;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center">
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7">${L.footer}</p>
        <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1">Powered by <strong>BayFatura</strong> · bayfatura.com</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>
    `.trim();
};

/**
 * Resend API üzerinden e-posta gönderir
 */
export const sendInvoiceEmail = async ({ toEmail, toName, invoice, senderName, senderEmail, type, language }) => {
    const isQuote = type === 'quote';
    const publicUrl = `${window.location.origin}/p/${type}/${invoice.id}`;

    const subjects = {
        de: isQuote ? `Angebot ${invoice.invoiceNumber} von ${senderName}` : `Rechnung ${invoice.invoiceNumber} von ${senderName}`,
        tr: isQuote ? `${senderName} - Teklif ${invoice.invoiceNumber}` : `${senderName} - Fatura ${invoice.invoiceNumber}`,
        en: isQuote ? `Quote ${invoice.invoiceNumber} from ${senderName}` : `Invoice ${invoice.invoiceNumber} from ${senderName}`,
        fr: isQuote ? `Devis ${invoice.invoiceNumber} de ${senderName}` : `Facture ${invoice.invoiceNumber} de ${senderName}`,
        es: isQuote ? `Presupuesto ${invoice.invoiceNumber} de ${senderName}` : `Factura ${invoice.invoiceNumber} de ${senderName}`,
        pt: isQuote ? `Orçamento ${invoice.invoiceNumber} de ${senderName}` : `Fatura ${invoice.invoiceNumber} de ${senderName}`,
    };

    const subject = subjects[language] || subjects['de'];
    const html = buildEmailHtml({ invoice, senderName, senderEmail, type, language, publicUrl });

    try {
        const sendEmailFn = httpsCallable(functions, 'sendInvoiceEmail');
        const result = await sendEmailFn({
            to: `${toName} <${toEmail}>`,
            subject,
            html,
            invoiceId: invoice.id
        });
        return result.data;
    } catch (error) {
        console.error("Cloud Email Error:", error);
        throw new Error(error.message || "Email send failed via Cloud Function");
    }
};
