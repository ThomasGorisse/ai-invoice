// ─── Types ───────────────────────────────────────────────────────────────────

export interface InvoiceRequest {
  // Emitter (freelancer/auto-entrepreneur)
  emitter: {
    name: string;
    company?: string;
    address: string;
    city: string;
    zip: string;
    country?: string;
    siret: string;
    siren?: string;
    ape?: string;
    tvaNumber?: string; // FR + 11 digits if TVA applicable
    email?: string;
    phone?: string;
    website?: string;
    logo?: string; // URL or base64
    bankIban?: string;
    bankBic?: string;
    bankName?: string;
  };

  // Client
  client: {
    name: string;
    company?: string;
    address: string;
    city: string;
    zip: string;
    country?: string;
    siret?: string;
    tvaNumber?: string;
    email?: string;
  };

  // Invoice details
  invoice: {
    number: string; // e.g. "F-2026-001"
    date: string; // ISO date
    dueDate?: string; // ISO date, auto-calculated if missing
    purchaseOrder?: string;
    currency?: string; // default EUR
    language?: string; // 'fr' | 'en'
    notes?: string;
    paymentTerms?: number; // days, default 30
  };

  // Line items
  items: InvoiceItem[];

  // Options
  options?: {
    template?: 'modern' | 'classic' | 'minimal';
    primaryColor?: string; // hex
    accentColor?: string; // hex
    format?: 'pdf' | 'html' | 'both';
    tvaApplicable?: boolean; // auto-entrepreneurs can opt for TVA
    tvaRate?: number; // default 20%
    recurring?: RecurringConfig;
  };
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number; // HT (before tax)
  unit?: string; // 'hours', 'days', 'units', 'forfait'
  tvaRate?: number; // per-item TVA override
  discount?: number; // percentage
}

export interface RecurringConfig {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  autoIncrement: boolean; // auto-increment invoice number
}

export interface InvoiceData {
  request: InvoiceRequest;
  computed: ComputedInvoice;
}

export interface ComputedInvoice {
  items: ComputedItem[];
  subtotalHT: number;
  totalTVA: number;
  totalTTC: number;
  totalDiscount: number;
  dueDate: string;
  legalMentions: string[];
  paymentTermsText: string;
  invoiceTitle: string;
  currencySymbol: string;
  formattedDate: string;
  formattedDueDate: string;
}

export interface ComputedItem {
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  tvaRate: number;
  discount: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TVA_RATES: Record<string, number> = {
  normal: 20,
  intermediaire: 10,
  reduit: 5.5,
  super_reduit: 2.1,
};

const UNIT_LABELS_FR: Record<string, string> = {
  hours: 'heures',
  days: 'jours',
  units: 'unites',
  forfait: 'forfait',
};

const UNIT_LABELS_EN: Record<string, string> = {
  hours: 'hours',
  days: 'days',
  units: 'units',
  forfait: 'flat rate',
};

// ─── Computation ─────────────────────────────────────────────────────────────

export function computeInvoice(req: InvoiceRequest): InvoiceData {
  const tvaApplicable = req.options?.tvaApplicable ?? false;
  const defaultTvaRate = req.options?.tvaRate ?? TVA_RATES.normal;
  const currency = req.invoice.currency ?? 'EUR';
  const language = req.invoice.language ?? 'fr';
  const paymentTermsDays = req.invoice.paymentTerms ?? 30;

  // Compute each line item
  const computedItems: ComputedItem[] = req.items.map((item) => {
    const qty = item.quantity;
    const price = item.unitPrice;
    const discount = item.discount ?? 0;
    const tvaRate = tvaApplicable ? (item.tvaRate ?? defaultTvaRate) : 0;
    const unit = item.unit ?? 'units';

    const lineHT = qty * price;
    const discountAmount = lineHT * (discount / 100);
    const totalHT = lineHT - discountAmount;
    const totalTVA = totalHT * (tvaRate / 100);
    const totalTTC = totalHT + totalTVA;

    return {
      description: item.description,
      quantity: qty,
      unitPrice: price,
      unit,
      tvaRate,
      discount,
      totalHT: round2(totalHT),
      totalTVA: round2(totalTVA),
      totalTTC: round2(totalTTC),
    };
  });

  const subtotalHT = round2(computedItems.reduce((s, i) => s + i.totalHT, 0));
  const totalTVA = round2(computedItems.reduce((s, i) => s + i.totalTVA, 0));
  const totalTTC = round2(subtotalHT + totalTVA);
  const totalDiscount = round2(
    req.items.reduce((s, item) => {
      const lineHT = item.quantity * item.unitPrice;
      return s + lineHT * ((item.discount ?? 0) / 100);
    }, 0)
  );

  // Due date
  const invoiceDate = new Date(req.invoice.date);
  const dueDate =
    req.invoice.dueDate ??
    new Date(invoiceDate.getTime() + paymentTermsDays * 86400000)
      .toISOString()
      .split('T')[0];

  // Legal mentions (URSSAF-compliant for auto-entrepreneurs)
  const legalMentions = buildLegalMentions(req, tvaApplicable, language);

  // Payment terms text
  const paymentTermsText = buildPaymentTerms(paymentTermsDays, dueDate, language);

  // Invoice title
  const invoiceTitle = language === 'fr' ? 'FACTURE' : 'INVOICE';

  // Currency
  const currencySymbol = currency === 'EUR' ? '\u20AC' : currency;

  // Format dates
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const formattedDate = formatDate(req.invoice.date, locale);
  const formattedDueDate = formatDate(dueDate, locale);

  return {
    request: req,
    computed: {
      items: computedItems,
      subtotalHT,
      totalTVA,
      totalTTC,
      totalDiscount,
      dueDate,
      legalMentions,
      paymentTermsText,
      invoiceTitle,
      currencySymbol,
      formattedDate,
      formattedDueDate,
    },
  };
}

// ─── Legal Mentions ──────────────────────────────────────────────────────────

function buildLegalMentions(
  req: InvoiceRequest,
  tvaApplicable: boolean,
  language: string
): string[] {
  const mentions: string[] = [];
  const isFr = language === 'fr';

  // Auto-entrepreneur TVA exemption (article 293 B du CGI)
  if (!tvaApplicable) {
    mentions.push(
      isFr
        ? 'TVA non applicable, art. 293 B du CGI'
        : 'VAT not applicable, article 293 B of the French Tax Code'
    );
  }

  // SIRET
  if (req.emitter.siret) {
    mentions.push(`SIRET : ${req.emitter.siret}`);
  }

  // SIREN
  if (req.emitter.siren) {
    mentions.push(`SIREN : ${req.emitter.siren}`);
  }

  // APE/NAF code
  if (req.emitter.ape) {
    mentions.push(`Code APE : ${req.emitter.ape}`);
  }

  // TVA number
  if (tvaApplicable && req.emitter.tvaNumber) {
    mentions.push(
      isFr
        ? `N\u00B0 TVA intracommunautaire : ${req.emitter.tvaNumber}`
        : `VAT number: ${req.emitter.tvaNumber}`
    );
  }

  // Late payment penalties (required by French law)
  mentions.push(
    isFr
      ? 'En cas de retard de paiement, une p\u00E9nalit\u00E9 de 3 fois le taux d\u2019int\u00E9r\u00EAt l\u00E9gal sera appliqu\u00E9e, ainsi qu\u2019une indemnit\u00E9 forfaitaire de 40\u20AC pour frais de recouvrement.'
      : 'Late payment will incur a penalty of 3 times the legal interest rate, plus a fixed indemnity of \u20AC40 for recovery costs.'
  );

  // No discount for early payment
  mentions.push(
    isFr
      ? 'Pas d\u2019escompte pour paiement anticip\u00E9.'
      : 'No discount for early payment.'
  );

  // Micro-enterprise / auto-entrepreneur mention
  mentions.push(
    isFr
      ? 'Membre d\u2019une association de gestion agr\u00E9\u00E9e, le r\u00E8glement par ch\u00E8que et carte bancaire est accept\u00E9.'
      : 'Member of an approved management association. Payment by check and bank card accepted.'
  );

  return mentions;
}

function buildPaymentTerms(days: number, dueDate: string, language: string): string {
  const isFr = language === 'fr';

  if (days === 0) {
    return isFr ? 'Paiement comptant' : 'Payment due immediately';
  }

  const formattedDue = formatDate(dueDate, isFr ? 'fr-FR' : 'en-US');
  return isFr
    ? `Paiement \u00E0 ${days} jours. Date limite : ${formattedDue}`
    : `Payment within ${days} days. Due date: ${formattedDue}`;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateInvoiceRequest(req: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!req || typeof req !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }

  const r = req as Record<string, unknown>;

  // Emitter
  if (!r.emitter || typeof r.emitter !== 'object') {
    errors.push('emitter is required');
  } else {
    const e = r.emitter as Record<string, unknown>;
    if (!e.name) errors.push('emitter.name is required');
    if (!e.address) errors.push('emitter.address is required');
    if (!e.city) errors.push('emitter.city is required');
    if (!e.zip) errors.push('emitter.zip is required');
    if (!e.siret) errors.push('emitter.siret is required');
    if (e.siret && typeof e.siret === 'string' && e.siret.replace(/\s/g, '').length !== 14) {
      errors.push('emitter.siret must be 14 digits');
    }
  }

  // Client
  if (!r.client || typeof r.client !== 'object') {
    errors.push('client is required');
  } else {
    const c = r.client as Record<string, unknown>;
    if (!c.name) errors.push('client.name is required');
    if (!c.address) errors.push('client.address is required');
    if (!c.city) errors.push('client.city is required');
    if (!c.zip) errors.push('client.zip is required');
  }

  // Invoice
  if (!r.invoice || typeof r.invoice !== 'object') {
    errors.push('invoice is required');
  } else {
    const inv = r.invoice as Record<string, unknown>;
    if (!inv.number) errors.push('invoice.number is required');
    if (!inv.date) errors.push('invoice.date is required');
  }

  // Items
  if (!Array.isArray(r.items) || r.items.length === 0) {
    errors.push('items must be a non-empty array');
  } else {
    (r.items as Record<string, unknown>[]).forEach((item, i) => {
      if (!item.description) errors.push(`items[${i}].description is required`);
      if (typeof item.quantity !== 'number' || item.quantity <= 0)
        errors.push(`items[${i}].quantity must be a positive number`);
      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0)
        errors.push(`items[${i}].unitPrice must be a non-negative number`);
    });
  }

  return { valid: errors.length === 0, errors };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatDate(dateStr: string, locale: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatCurrency(amount: number, symbol: string): string {
  return `${amount.toFixed(2)} ${symbol}`;
}

export function generateNextInvoiceNumber(current: string): string {
  // Pattern: F-YYYY-NNN or any prefix-year-number
  const match = current.match(/^(.+-)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const num = parseInt(match[2], 10) + 1;
    return `${prefix}${String(num).padStart(match[2].length, '0')}`;
  }
  return current + '-next';
}
