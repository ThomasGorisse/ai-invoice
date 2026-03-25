import { InvoiceData, formatCurrency } from '../invoice';

export function renderModernTemplate(data: InvoiceData): string {
  const { request: req, computed } = data;
  const primaryColor = req.options?.primaryColor ?? '#2563eb';
  const accentColor = req.options?.accentColor ?? '#1e40af';
  const lang = req.invoice.language ?? 'fr';
  const isFr = lang === 'fr';

  const itemsHtml = computed.items
    .map(
      (item) => `
    <tr>
      <td class="item-desc">${esc(item.description)}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-center">${esc(item.unit)}</td>
      <td class="text-right">${formatCurrency(item.unitPrice, computed.currencySymbol)}</td>
      ${item.discount > 0 ? `<td class="text-center">${item.discount}%</td>` : '<td class="text-center">-</td>'}
      ${item.tvaRate > 0 ? `<td class="text-center">${item.tvaRate}%</td>` : '<td class="text-center">-</td>'}
      <td class="text-right font-bold">${formatCurrency(item.totalHT, computed.currencySymbol)}</td>
    </tr>`
    )
    .join('');

  const mentionsHtml = computed.legalMentions.map((m) => `<p>${esc(m)}</p>`).join('');

  const logoHtml = req.emitter.logo
    ? `<img src="${esc(req.emitter.logo)}" alt="Logo" class="logo" />`
    : '';

  const bankHtml =
    req.emitter.bankIban
      ? `
    <div class="bank-info">
      <h4>${isFr ? 'Coordonn\u00E9es bancaires' : 'Bank details'}</h4>
      <p><strong>IBAN :</strong> ${esc(req.emitter.bankIban)}</p>
      ${req.emitter.bankBic ? `<p><strong>BIC :</strong> ${esc(req.emitter.bankBic)}</p>` : ''}
      ${req.emitter.bankName ? `<p><strong>${isFr ? 'Banque' : 'Bank'} :</strong> ${esc(req.emitter.bankName)}</p>` : ''}
    </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${computed.invoiceTitle} ${esc(req.invoice.number)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1f2937;
      background: #fff;
      font-size: 14px;
      line-height: 1.5;
    }
    .invoice {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${primaryColor};
    }
    .logo { max-height: 60px; max-width: 200px; }
    .invoice-title {
      font-size: 32px;
      font-weight: 800;
      color: ${primaryColor};
      letter-spacing: -0.5px;
    }
    .invoice-number {
      font-size: 16px;
      color: #6b7280;
      margin-top: 4px;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      gap: 40px;
      margin-bottom: 40px;
    }
    .party {
      flex: 1;
    }
    .party h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${primaryColor};
      margin-bottom: 8px;
      font-weight: 700;
    }
    .party .name {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .party p {
      color: #4b5563;
      font-size: 13px;
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      background: #f9fafb;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 32px;
    }
    .meta-item label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9ca3af;
      display: block;
    }
    .meta-item span {
      font-size: 14px;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    thead th {
      background: ${primaryColor};
      color: #fff;
      padding: 10px 12px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    thead th:first-child { border-radius: 6px 0 0 0; }
    thead th:last-child { border-radius: 0 6px 0 0; }
    tbody td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: #f9fafb; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 600; }
    .item-desc { max-width: 280px; }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    .totals-table {
      width: 300px;
    }
    .totals-table .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }
    .totals-table .row.total {
      border-top: 2px solid ${primaryColor};
      margin-top: 8px;
      padding-top: 12px;
      font-size: 18px;
      font-weight: 800;
      color: ${primaryColor};
    }
    .payment-terms {
      background: #f0f7ff;
      border-left: 4px solid ${primaryColor};
      padding: 12px 16px;
      margin-bottom: 24px;
      border-radius: 0 6px 6px 0;
      font-size: 13px;
    }
    .bank-info {
      background: #f9fafb;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .bank-info h4 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${primaryColor};
      margin-bottom: 6px;
    }
    .legal {
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      margin-top: 32px;
    }
    .legal p {
      font-size: 10px;
      color: #9ca3af;
      margin-bottom: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
    }
    @media print {
      body { font-size: 12px; }
      .invoice { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        ${logoHtml}
        <div class="invoice-title">${computed.invoiceTitle}</div>
        <div class="invoice-number">${esc(req.invoice.number)}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 24px; font-weight: 800; color: ${primaryColor};">
          ${formatCurrency(computed.totalTTC, computed.currencySymbol)}
        </div>
        <div style="font-size: 12px; color: #9ca3af;">
          ${isFr ? 'Montant TTC' : 'Total incl. tax'}
        </div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>${isFr ? 'De' : 'From'}</h3>
        <div class="name">${esc(req.emitter.company ?? req.emitter.name)}</div>
        ${req.emitter.company ? `<p>${esc(req.emitter.name)}</p>` : ''}
        <p>${esc(req.emitter.address)}</p>
        <p>${esc(req.emitter.zip)} ${esc(req.emitter.city)}</p>
        ${req.emitter.email ? `<p>${esc(req.emitter.email)}</p>` : ''}
        ${req.emitter.phone ? `<p>${esc(req.emitter.phone)}</p>` : ''}
      </div>
      <div class="party">
        <h3>${isFr ? 'Facturer \u00E0' : 'Bill to'}</h3>
        <div class="name">${esc(req.client.company ?? req.client.name)}</div>
        ${req.client.company ? `<p>${esc(req.client.name)}</p>` : ''}
        <p>${esc(req.client.address)}</p>
        <p>${esc(req.client.zip)} ${esc(req.client.city)}</p>
        ${req.client.email ? `<p>${esc(req.client.email)}</p>` : ''}
      </div>
    </div>

    <div class="meta">
      <div class="meta-item">
        <label>${isFr ? 'Date de facture' : 'Invoice date'}</label>
        <span>${computed.formattedDate}</span>
      </div>
      <div class="meta-item">
        <label>${isFr ? 'Date d\u2019\u00E9ch\u00E9ance' : 'Due date'}</label>
        <span>${computed.formattedDueDate}</span>
      </div>
      ${req.invoice.purchaseOrder ? `
      <div class="meta-item">
        <label>${isFr ? 'Bon de commande' : 'Purchase order'}</label>
        <span>${esc(req.invoice.purchaseOrder)}</span>
      </div>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th style="text-align: left;">${isFr ? 'Description' : 'Description'}</th>
          <th>${isFr ? 'Qt\u00E9' : 'Qty'}</th>
          <th>${isFr ? 'Unit\u00E9' : 'Unit'}</th>
          <th style="text-align: right;">${isFr ? 'Prix unitaire' : 'Unit price'}</th>
          <th>${isFr ? 'Remise' : 'Discount'}</th>
          <th>${isFr ? 'TVA' : 'VAT'}</th>
          <th style="text-align: right;">${isFr ? 'Total HT' : 'Total excl.'}</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-table">
        <div class="row">
          <span>${isFr ? 'Sous-total HT' : 'Subtotal excl. tax'}</span>
          <span>${formatCurrency(computed.subtotalHT, computed.currencySymbol)}</span>
        </div>
        ${computed.totalDiscount > 0 ? `
        <div class="row">
          <span>${isFr ? 'Remise totale' : 'Total discount'}</span>
          <span>-${formatCurrency(computed.totalDiscount, computed.currencySymbol)}</span>
        </div>` : ''}
        <div class="row">
          <span>${isFr ? 'TVA' : 'VAT'}</span>
          <span>${computed.totalTVA > 0 ? formatCurrency(computed.totalTVA, computed.currencySymbol) : (isFr ? 'Non applicable' : 'N/A')}</span>
        </div>
        <div class="row total">
          <span>${isFr ? 'Total TTC' : 'Total incl. tax'}</span>
          <span>${formatCurrency(computed.totalTTC, computed.currencySymbol)}</span>
        </div>
      </div>
    </div>

    <div class="payment-terms">
      ${esc(computed.paymentTermsText)}
    </div>

    ${bankHtml}

    ${req.invoice.notes ? `
    <div style="margin-bottom: 24px;">
      <strong>${isFr ? 'Notes' : 'Notes'} :</strong>
      <p style="color: #4b5563; margin-top: 4px;">${esc(req.invoice.notes)}</p>
    </div>` : ''}

    <div class="legal">
      ${mentionsHtml}
    </div>

    <div class="footer">
      ${esc(req.emitter.company ?? req.emitter.name)} &mdash; SIRET ${esc(req.emitter.siret)}
      ${req.emitter.website ? ` &mdash; ${esc(req.emitter.website)}` : ''}
    </div>
  </div>
</body>
</html>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
