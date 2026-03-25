import { InvoiceData, formatCurrency } from '../invoice';

export function renderMinimalTemplate(data: InvoiceData): string {
  const { request: req, computed } = data;
  const primaryColor = req.options?.primaryColor ?? '#000000';
  const lang = req.invoice.language ?? 'fr';
  const isFr = lang === 'fr';

  const itemsHtml = computed.items
    .map(
      (item) => `
    <tr>
      <td>${esc(item.description)}</td>
      <td class="r">${item.quantity} ${esc(item.unit)}</td>
      <td class="r">${formatCurrency(item.unitPrice, computed.currencySymbol)}</td>
      <td class="r b">${formatCurrency(item.totalHT, computed.currencySymbol)}</td>
    </tr>`
    )
    .join('');

  const mentionsHtml = computed.legalMentions.map((m) => esc(m)).join(' \u2014 ');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${computed.invoiceTitle} ${esc(req.invoice.number)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #222;
      background: #fff;
      font-size: 13px;
      line-height: 1.7;
    }
    .inv {
      max-width: 740px;
      margin: 0 auto;
      padding: 48px 40px;
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 48px;
    }
    .top h1 {
      font-size: 14px;
      font-weight: 400;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: ${primaryColor};
    }
    .top .num {
      font-size: 13px;
      color: #888;
    }
    .cols {
      display: flex;
      justify-content: space-between;
      margin-bottom: 48px;
    }
    .col { width: 45%; }
    .col .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #aaa;
      margin-bottom: 6px;
    }
    .col .name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 2px;
    }
    .col p { font-size: 12px; color: #666; }
    .dates {
      display: flex;
      gap: 48px;
      margin-bottom: 40px;
      padding-bottom: 16px;
      border-bottom: 1px solid #eee;
    }
    .dates .d .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #aaa;
    }
    .dates .d .val {
      font-size: 13px;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    thead th {
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #aaa;
      font-weight: 400;
      padding: 0 0 8px 0;
      border-bottom: 1px solid #ddd;
    }
    thead th.r { text-align: right; }
    tbody td {
      padding: 10px 0;
      border-bottom: 1px solid #f3f3f3;
      font-size: 13px;
    }
    .r { text-align: right; }
    .b { font-weight: 600; }
    .summary {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .summary-box {
      width: 260px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 13px;
      color: #666;
    }
    .summary-row.total {
      padding-top: 12px;
      margin-top: 8px;
      border-top: 2px solid ${primaryColor};
      color: ${primaryColor};
      font-size: 20px;
      font-weight: 700;
    }
    .note {
      font-size: 12px;
      color: #888;
      margin-bottom: 32px;
      padding: 12px 0;
      border-top: 1px solid #eee;
    }
    .bank {
      font-size: 11px;
      color: #888;
      margin-bottom: 24px;
    }
    .legal {
      font-size: 9px;
      color: #bbb;
      border-top: 1px solid #eee;
      padding-top: 16px;
      margin-top: 32px;
      line-height: 1.8;
    }
    @media print {
      .inv { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="inv">
    <div class="top">
      <h1>${computed.invoiceTitle}</h1>
      <div class="num">${esc(req.invoice.number)}</div>
    </div>

    <div class="cols">
      <div class="col">
        <div class="label">${isFr ? 'De' : 'From'}</div>
        <div class="name">${esc(req.emitter.company ?? req.emitter.name)}</div>
        ${req.emitter.company ? `<p>${esc(req.emitter.name)}</p>` : ''}
        <p>${esc(req.emitter.address)}</p>
        <p>${esc(req.emitter.zip)} ${esc(req.emitter.city)}</p>
        ${req.emitter.email ? `<p>${esc(req.emitter.email)}</p>` : ''}
      </div>
      <div class="col">
        <div class="label">${isFr ? '\u00C0' : 'To'}</div>
        <div class="name">${esc(req.client.company ?? req.client.name)}</div>
        ${req.client.company ? `<p>${esc(req.client.name)}</p>` : ''}
        <p>${esc(req.client.address)}</p>
        <p>${esc(req.client.zip)} ${esc(req.client.city)}</p>
      </div>
    </div>

    <div class="dates">
      <div class="d">
        <div class="label">${isFr ? 'Date' : 'Date'}</div>
        <div class="val">${computed.formattedDate}</div>
      </div>
      <div class="d">
        <div class="label">${isFr ? '\u00C9ch\u00E9ance' : 'Due'}</div>
        <div class="val">${computed.formattedDueDate}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>${isFr ? 'Description' : 'Description'}</th>
          <th class="r">${isFr ? 'Quantit\u00E9' : 'Quantity'}</th>
          <th class="r">${isFr ? 'Prix unitaire' : 'Rate'}</th>
          <th class="r">${isFr ? 'Montant' : 'Amount'}</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-box">
        <div class="summary-row">
          <span>${isFr ? 'Sous-total' : 'Subtotal'}</span>
          <span>${formatCurrency(computed.subtotalHT, computed.currencySymbol)}</span>
        </div>
        <div class="summary-row">
          <span>${isFr ? 'TVA' : 'VAT'}</span>
          <span>${computed.totalTVA > 0 ? formatCurrency(computed.totalTVA, computed.currencySymbol) : '\u2014'}</span>
        </div>
        <div class="summary-row total">
          <span>${isFr ? 'Total' : 'Total'}</span>
          <span>${formatCurrency(computed.totalTTC, computed.currencySymbol)}</span>
        </div>
      </div>
    </div>

    <div class="note">
      ${esc(computed.paymentTermsText)}
      ${req.invoice.notes ? `<br>${esc(req.invoice.notes)}` : ''}
    </div>

    ${req.emitter.bankIban ? `
    <div class="bank">
      IBAN ${esc(req.emitter.bankIban)}${req.emitter.bankBic ? ` &middot; BIC ${esc(req.emitter.bankBic)}` : ''}
    </div>` : ''}

    <div class="legal">${mentionsHtml}</div>
  </div>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
