import { InvoiceData, formatCurrency } from '../invoice';

export function renderClassicTemplate(data: InvoiceData): string {
  const { request: req, computed } = data;
  const primaryColor = req.options?.primaryColor ?? '#1a1a1a';
  const lang = req.invoice.language ?? 'fr';
  const isFr = lang === 'fr';

  const itemsHtml = computed.items
    .map(
      (item, i) => `
    <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
      <td>${esc(item.description)}</td>
      <td class="center">${item.quantity}</td>
      <td class="center">${esc(item.unit)}</td>
      <td class="right">${formatCurrency(item.unitPrice, computed.currencySymbol)}</td>
      ${item.tvaRate > 0 ? `<td class="center">${item.tvaRate}%</td>` : '<td class="center">-</td>'}
      <td class="right bold">${formatCurrency(item.totalHT, computed.currencySymbol)}</td>
    </tr>`
    )
    .join('');

  const mentionsHtml = computed.legalMentions.map((m) => `<li>${esc(m)}</li>`).join('');

  const logoHtml = req.emitter.logo
    ? `<img src="${esc(req.emitter.logo)}" alt="Logo" style="max-height:50px;max-width:180px;" />`
    : '';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${computed.invoiceTitle} ${esc(req.invoice.number)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #333;
      background: #fff;
      font-size: 13px;
      line-height: 1.6;
    }
    .invoice {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid ${primaryColor};
      padding-bottom: 16px;
      margin-bottom: 32px;
    }
    .title {
      font-size: 28px;
      font-weight: bold;
      color: ${primaryColor};
      font-variant: small-caps;
      letter-spacing: 2px;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 32px;
    }
    .party { width: 45%; }
    .party h3 {
      font-size: 13px;
      font-weight: bold;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
      margin-bottom: 8px;
      color: ${primaryColor};
    }
    .party p { font-size: 12px; color: #555; }
    .party .name { font-weight: bold; font-size: 14px; color: #333; }
    .info-grid {
      display: flex;
      gap: 32px;
      margin-bottom: 24px;
      padding: 12px;
      border: 1px solid #ddd;
    }
    .info-item { font-size: 12px; }
    .info-item strong { display: block; color: #666; font-size: 10px; text-transform: uppercase; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    thead th {
      background: ${primaryColor};
      color: #fff;
      padding: 8px 10px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid ${primaryColor};
    }
    tbody td {
      padding: 8px 10px;
      border: 1px solid #ddd;
      font-size: 12px;
    }
    .even { background: #fafafa; }
    .odd { background: #fff; }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .totals {
      float: right;
      width: 280px;
      margin-bottom: 32px;
    }
    .totals table {
      width: 100%;
      border-collapse: collapse;
    }
    .totals td {
      padding: 6px 10px;
      border: 1px solid #ddd;
      font-size: 13px;
    }
    .totals .grand-total td {
      background: ${primaryColor};
      color: #fff;
      font-weight: bold;
      font-size: 15px;
      border-color: ${primaryColor};
    }
    .clear { clear: both; }
    .terms {
      border: 1px solid #ddd;
      padding: 12px;
      margin-bottom: 24px;
      font-size: 12px;
    }
    .terms strong { color: ${primaryColor}; }
    .bank {
      padding: 12px;
      background: #fafafa;
      border: 1px solid #ddd;
      margin-bottom: 24px;
      font-size: 12px;
    }
    .legal {
      border-top: 1px solid #ddd;
      padding-top: 16px;
      margin-top: 24px;
    }
    .legal ul {
      list-style: none;
      padding: 0;
    }
    .legal li {
      font-size: 9px;
      color: #999;
      margin-bottom: 3px;
      padding-left: 8px;
      border-left: 2px solid #ddd;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      font-size: 10px;
      color: #999;
      border-top: 1px solid #ddd;
      padding-top: 12px;
    }
    @media print {
      body { font-size: 11px; }
      .invoice { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        ${logoHtml}
        <div class="title">${computed.invoiceTitle}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 16px; font-weight: bold;">N\u00B0 ${esc(req.invoice.number)}</div>
        <div style="font-size: 12px; color: #666;">${computed.formattedDate}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>${isFr ? '\u00C9metteur' : 'From'}</h3>
        <p class="name">${esc(req.emitter.company ?? req.emitter.name)}</p>
        ${req.emitter.company ? `<p>${esc(req.emitter.name)}</p>` : ''}
        <p>${esc(req.emitter.address)}</p>
        <p>${esc(req.emitter.zip)} ${esc(req.emitter.city)}</p>
        <p>SIRET : ${esc(req.emitter.siret)}</p>
        ${req.emitter.email ? `<p>${esc(req.emitter.email)}</p>` : ''}
        ${req.emitter.phone ? `<p>${esc(req.emitter.phone)}</p>` : ''}
      </div>
      <div class="party">
        <h3>${isFr ? 'Destinataire' : 'Bill to'}</h3>
        <p class="name">${esc(req.client.company ?? req.client.name)}</p>
        ${req.client.company ? `<p>${esc(req.client.name)}</p>` : ''}
        <p>${esc(req.client.address)}</p>
        <p>${esc(req.client.zip)} ${esc(req.client.city)}</p>
        ${req.client.siret ? `<p>SIRET : ${esc(req.client.siret)}</p>` : ''}
      </div>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <strong>${isFr ? 'Date' : 'Date'}</strong>
        ${computed.formattedDate}
      </div>
      <div class="info-item">
        <strong>${isFr ? '\u00C9ch\u00E9ance' : 'Due'}</strong>
        ${computed.formattedDueDate}
      </div>
      ${req.invoice.purchaseOrder ? `
      <div class="info-item">
        <strong>${isFr ? 'R\u00E9f. commande' : 'PO'}</strong>
        ${esc(req.invoice.purchaseOrder)}
      </div>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th style="text-align:left;">${isFr ? 'D\u00E9signation' : 'Description'}</th>
          <th>${isFr ? 'Qt\u00E9' : 'Qty'}</th>
          <th>${isFr ? 'Unit\u00E9' : 'Unit'}</th>
          <th style="text-align:right;">${isFr ? 'P.U. HT' : 'Unit price'}</th>
          <th>${isFr ? 'TVA' : 'VAT'}</th>
          <th style="text-align:right;">${isFr ? 'Total HT' : 'Total'}</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tr>
          <td>${isFr ? 'Total HT' : 'Subtotal'}</td>
          <td class="right">${formatCurrency(computed.subtotalHT, computed.currencySymbol)}</td>
        </tr>
        <tr>
          <td>${isFr ? 'TVA' : 'VAT'}</td>
          <td class="right">${computed.totalTVA > 0 ? formatCurrency(computed.totalTVA, computed.currencySymbol) : (isFr ? 'Non applicable' : 'N/A')}</td>
        </tr>
        <tr class="grand-total">
          <td>${isFr ? 'Total TTC' : 'Total'}</td>
          <td class="right">${formatCurrency(computed.totalTTC, computed.currencySymbol)}</td>
        </tr>
      </table>
    </div>
    <div class="clear"></div>

    <div class="terms">
      <strong>${isFr ? 'Conditions de paiement' : 'Payment terms'} :</strong>
      ${esc(computed.paymentTermsText)}
    </div>

    ${req.emitter.bankIban ? `
    <div class="bank">
      <strong>${isFr ? 'Coordonn\u00E9es bancaires' : 'Bank details'} :</strong><br>
      IBAN : ${esc(req.emitter.bankIban)}
      ${req.emitter.bankBic ? `<br>BIC : ${esc(req.emitter.bankBic)}` : ''}
      ${req.emitter.bankName ? `<br>${isFr ? 'Banque' : 'Bank'} : ${esc(req.emitter.bankName)}` : ''}
    </div>` : ''}

    ${req.invoice.notes ? `
    <div class="terms">
      <strong>${isFr ? 'Notes' : 'Notes'} :</strong> ${esc(req.invoice.notes)}
    </div>` : ''}

    <div class="legal">
      <ul>${mentionsHtml}</ul>
    </div>

    <div class="footer">
      ${esc(req.emitter.company ?? req.emitter.name)} &bull; SIRET ${esc(req.emitter.siret)}
      ${req.emitter.website ? ` &bull; ${esc(req.emitter.website)}` : ''}
    </div>
  </div>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
