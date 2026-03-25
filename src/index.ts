import {
  computeInvoice,
  validateInvoiceRequest,
  type InvoiceRequest,
} from './invoice';
import { renderInvoiceHtml } from './templates';
import { generatePdfResponse, wrapHtmlForPrint } from './pdf';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Env {
  APP_NAME: string;
  APP_URL: string;
  // INVOICES: KVNamespace;  // Uncomment when KV is configured
  // STRIPE_SECRET_KEY: string;
  // STRIPE_WEBHOOK_SECRET: string;
}

// ─── CORS ────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function corsResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200): Response {
  return corsResponse(
    new Response(JSON.stringify(data, null, 2), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

function htmlResponse(html: string, status = 200): Response {
  return corsResponse(
    new Response(html, {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  );
}

function errorResponse(message: string, status = 400, errors?: string[]): Response {
  return jsonResponse({ error: message, errors }, status);
}

// ─── Landing Page ────────────────────────────────────────────────────────────

function getLandingPage(): string {
  return LANDING_HTML;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return corsResponse(new Response(null, { status: 204 }));
    }

    try {
      // Landing page
      if (pathname === '/' && method === 'GET') {
        return htmlResponse(getLandingPage());
      }

      // Health check
      if (pathname === '/health' && method === 'GET') {
        return jsonResponse({ status: 'ok', version: '1.0.0', name: env.APP_NAME });
      }

      // API docs
      if (pathname === '/api' && method === 'GET') {
        return jsonResponse(getApiDocs());
      }

      // Generate invoice
      if (pathname === '/generate' && method === 'POST') {
        return await handleGenerate(request);
      }

      // Preview invoice (HTML only)
      if (pathname === '/preview' && method === 'POST') {
        return await handlePreview(request);
      }

      // Demo invoice
      if (pathname === '/demo' && method === 'GET') {
        return handleDemo(url);
      }

      // 404
      return errorResponse('Not found', 404);
    } catch (err) {
      console.error('Unhandled error:', err);
      return errorResponse('Internal server error', 500);
    }
  },
};

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleGenerate(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  // Validate
  const validation = validateInvoiceRequest(body);
  if (!validation.valid) {
    return errorResponse('Validation failed', 400, validation.errors);
  }

  const req = body as InvoiceRequest;
  const format = req.options?.format ?? 'both';

  // Compute
  const invoiceData = computeInvoice(req);

  // Render HTML
  const html = renderInvoiceHtml(invoiceData);

  if (format === 'html') {
    return htmlResponse(wrapHtmlForPrint(html));
  }

  if (format === 'pdf') {
    const { contentType, body: pdfBody } = await generatePdfResponse(html);
    return corsResponse(
      new Response(pdfBody, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${req.invoice.number}.pdf"`,
        },
      })
    );
  }

  // 'both' — return JSON with HTML embedded and computed data
  return jsonResponse({
    invoice: {
      number: req.invoice.number,
      date: req.invoice.date,
      dueDate: invoiceData.computed.dueDate,
      subtotalHT: invoiceData.computed.subtotalHT,
      totalTVA: invoiceData.computed.totalTVA,
      totalTTC: invoiceData.computed.totalTTC,
      currency: req.invoice.currency ?? 'EUR',
      items: invoiceData.computed.items,
      legalMentions: invoiceData.computed.legalMentions,
    },
    html,
    template: req.options?.template ?? 'modern',
  });
}

async function handlePreview(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const validation = validateInvoiceRequest(body);
  if (!validation.valid) {
    return errorResponse('Validation failed', 400, validation.errors);
  }

  const req = body as InvoiceRequest;
  const invoiceData = computeInvoice(req);
  const html = renderInvoiceHtml(invoiceData);

  return htmlResponse(wrapHtmlForPrint(html));
}

function handleDemo(url: URL): Response {
  const template = (url.searchParams.get('template') ?? 'modern') as 'modern' | 'classic' | 'minimal';
  const lang = url.searchParams.get('lang') ?? 'fr';

  const demoRequest: InvoiceRequest = {
    emitter: {
      name: 'Thomas Gorisse',
      company: 'Thomas Gorisse EI',
      address: '12 rue de la Loire',
      city: 'Nantes',
      zip: '44000',
      country: 'France',
      siret: '12345678901234',
      ape: '6201Z',
      email: 'thomas@example.com',
      phone: '06 12 34 56 78',
      website: 'https://thomasgorisse.dev',
      bankIban: 'FR76 1234 5678 9012 3456 7890 123',
      bankBic: 'BNPAFRPPXXX',
      bankName: 'BNP Paribas',
    },
    client: {
      name: 'Marie Dupont',
      company: 'Acme SAS',
      address: '42 avenue des Champs-\u00C9lys\u00E9es',
      city: 'Paris',
      zip: '75008',
      country: 'France',
      siret: '98765432109876',
    },
    invoice: {
      number: 'F-2026-001',
      date: '2026-03-25',
      paymentTerms: 30,
      language: lang,
      notes: lang === 'fr'
        ? 'Merci pour votre confiance !'
        : 'Thank you for your business!',
    },
    items: [
      {
        description: lang === 'fr'
          ? 'D\u00E9veloppement application mobile Android'
          : 'Android mobile app development',
        quantity: 12,
        unitPrice: 650,
        unit: 'days',
      },
      {
        description: lang === 'fr'
          ? 'Design UI/UX — maquettes Figma'
          : 'UI/UX Design — Figma mockups',
        quantity: 3,
        unitPrice: 500,
        unit: 'days',
      },
      {
        description: lang === 'fr'
          ? 'Support technique et maintenance'
          : 'Technical support and maintenance',
        quantity: 1,
        unitPrice: 200,
        unit: 'forfait',
      },
    ],
    options: {
      template,
      tvaApplicable: false,
      format: 'html',
    },
  };

  const invoiceData = computeInvoice(demoRequest);
  const html = renderInvoiceHtml(invoiceData, template);

  return htmlResponse(wrapHtmlForPrint(html));
}

// ─── API Documentation ───────────────────────────────────────────────────────

function getApiDocs() {
  return {
    name: 'AI Invoice API',
    version: '1.0.0',
    description: 'AI-powered invoice generator for French freelancers and auto-entrepreneurs',
    endpoints: {
      'POST /generate': {
        description: 'Generate an invoice. Returns JSON with computed data + HTML, or direct HTML/PDF.',
        body: 'InvoiceRequest JSON',
        formats: ['pdf', 'html', 'both (default)'],
        templates: ['modern', 'classic', 'minimal'],
      },
      'POST /preview': {
        description: 'Preview an invoice as HTML (print-optimized)',
        body: 'InvoiceRequest JSON',
      },
      'GET /demo': {
        description: 'View a demo invoice',
        params: {
          template: 'modern | classic | minimal (default: modern)',
          lang: 'fr | en (default: fr)',
        },
      },
      'GET /health': {
        description: 'Health check',
      },
    },
    features: [
      'URSSAF-compliant for auto-entrepreneurs',
      'Auto-calculates TVA (20%, 10%, 5.5%, 2.1%)',
      'Article 293 B du CGI exemption mention',
      'Late payment penalties (required by French law)',
      'Bank details (IBAN/BIC)',
      'Bilingual (French/English)',
      '3 professional templates',
      'Custom branding (logo, colors)',
      'Recurring invoice support',
    ],
    example: {
      emitter: { name: 'John Doe', address: '1 rue de Paris', city: 'Paris', zip: '75001', siret: '12345678901234' },
      client: { name: 'Client Corp', address: '2 rue de Lyon', city: 'Lyon', zip: '69001' },
      invoice: { number: 'F-2026-001', date: '2026-03-25' },
      items: [{ description: 'Consulting', quantity: 5, unitPrice: 500, unit: 'days' }],
    },
  };
}

// ─── Landing Page HTML ───────────────────────────────────────────────────────

const LANDING_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Invoice — Factures pro pour freelances et auto-entrepreneurs</title>
  <meta name="description" content="G\u00E9n\u00E9rez des factures professionnelles conformes URSSAF en 30 secondes. API simple, templates modernes, mentions l\u00E9gales automatiques.">
  <style>
    :root {
      --bg: #0a0a0f;
      --surface: #12121a;
      --border: #1e1e2e;
      --text: #e4e4ed;
      --muted: #8888a0;
      --primary: #6366f1;
      --primary-glow: rgba(99, 102, 241, 0.15);
      --accent: #22d3ee;
      --success: #34d399;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

    /* Nav */
    nav {
      padding: 20px 0;
      border-bottom: 1px solid var(--border);
    }
    nav .container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-size: 20px;
      font-weight: 800;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .nav-links { display: flex; gap: 24px; align-items: center; }
    .nav-links a {
      color: var(--muted);
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;
    }
    .nav-links a:hover { color: var(--text); }

    /* Hero */
    .hero {
      padding: 80px 0 60px;
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      background: var(--primary-glow);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 20px;
      font-size: 13px;
      color: var(--primary);
      margin-bottom: 24px;
    }
    h1 {
      font-size: 52px;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 20px;
      letter-spacing: -1px;
    }
    h1 span {
      background: linear-gradient(135deg, var(--primary), var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      font-size: 18px;
      color: var(--muted);
      max-width: 600px;
      margin: 0 auto 40px;
    }
    .cta-group {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background: var(--primary);
      color: #fff;
    }
    .btn-primary:hover {
      background: #4f46e5;
      transform: translateY(-1px);
      box-shadow: 0 4px 20px var(--primary-glow);
    }
    .btn-secondary {
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover {
      border-color: var(--primary);
      background: var(--primary-glow);
    }

    /* Features */
    .features {
      padding: 80px 0;
    }
    .features h2 {
      text-align: center;
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 48px;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .feature-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      transition: border-color 0.2s;
    }
    .feature-card:hover { border-color: var(--primary); }
    .feature-icon {
      font-size: 28px;
      margin-bottom: 12px;
    }
    .feature-card h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .feature-card p {
      font-size: 14px;
      color: var(--muted);
    }

    /* Code demo */
    .demo {
      padding: 60px 0;
    }
    .demo h2 {
      text-align: center;
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .demo .sub {
      text-align: center;
      color: var(--muted);
      margin-bottom: 40px;
    }
    .code-block {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      overflow-x: auto;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
      line-height: 1.7;
      color: var(--muted);
      max-width: 700px;
      margin: 0 auto;
    }
    .code-block .key { color: var(--accent); }
    .code-block .str { color: var(--success); }
    .code-block .num { color: #f59e0b; }
    .code-block .comment { color: #555; }

    /* Templates preview */
    .templates {
      padding: 60px 0;
      text-align: center;
    }
    .templates h2 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .templates .sub {
      color: var(--muted);
      margin-bottom: 40px;
    }
    .template-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .template-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      transition: all 0.2s;
      text-decoration: none;
      color: var(--text);
    }
    .template-card:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
    }
    .template-card .preview {
      height: 120px;
      background: #fff;
      border-radius: 6px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }
    .template-card h3 { font-size: 15px; margin-bottom: 4px; }
    .template-card p { font-size: 12px; color: var(--muted); }

    /* Pricing */
    .pricing {
      padding: 80px 0;
      text-align: center;
    }
    .pricing h2 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .pricing .sub {
      color: var(--muted);
      margin-bottom: 48px;
    }
    .pricing-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      max-width: 700px;
      margin: 0 auto;
    }
    .pricing-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
    }
    .pricing-card.featured {
      border-color: var(--primary);
      box-shadow: 0 0 40px var(--primary-glow);
    }
    .pricing-card h3 {
      font-size: 18px;
      margin-bottom: 8px;
    }
    .pricing-card .price {
      font-size: 40px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .pricing-card .price span {
      font-size: 16px;
      font-weight: 400;
      color: var(--muted);
    }
    .pricing-card .period {
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 24px;
    }
    .pricing-card ul {
      list-style: none;
      text-align: left;
      margin-bottom: 24px;
    }
    .pricing-card li {
      font-size: 14px;
      padding: 6px 0;
      color: var(--muted);
    }
    .pricing-card li::before {
      content: "\\2713 ";
      color: var(--success);
      font-weight: bold;
    }

    /* Footer */
    footer {
      padding: 40px 0;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--muted);
      font-size: 13px;
    }
    footer a { color: var(--primary); text-decoration: none; }

    @media (max-width: 768px) {
      h1 { font-size: 32px; }
      .template-grid { grid-template-columns: 1fr; }
      .pricing-cards { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <nav>
    <div class="container">
      <div class="logo">AI Invoice</div>
      <div class="nav-links">
        <a href="#features">Fonctionnalit\u00E9s</a>
        <a href="#demo">API</a>
        <a href="#pricing">Tarifs</a>
        <a href="/api">Documentation</a>
        <a href="/demo" class="btn btn-primary" style="padding: 8px 16px; font-size: 13px;">D\u00E9mo</a>
      </div>
    </div>
  </nav>

  <section class="hero">
    <div class="container">
      <div class="badge">Conforme URSSAF 2026</div>
      <h1>Factures pro en <span>30 secondes</span></h1>
      <p class="subtitle">
        API d'intelligence artificielle pour g\u00E9n\u00E9rer des factures conformes.
        Mentions l\u00E9gales automatiques, calcul TVA, templates professionnels.
        Id\u00E9al pour les auto-entrepreneurs et freelances.
      </p>
      <div class="cta-group">
        <a href="/demo" class="btn btn-primary">Voir la d\u00E9mo</a>
        <a href="/api" class="btn btn-secondary">Documentation API</a>
      </div>
    </div>
  </section>

  <section class="features" id="features">
    <div class="container">
      <h2>Tout ce dont vous avez besoin</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">\u2696\uFE0F</div>
          <h3>Conforme URSSAF</h3>
          <p>Toutes les mentions l\u00E9gales obligatoires : article 293 B du CGI, p\u00E9nalit\u00E9s de retard, indemnit\u00E9 forfaitaire de recouvrement.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">\uD83E\uDDE0</div>
          <h3>Calcul automatique</h3>
          <p>TVA (20%, 10%, 5.5%, 2.1%), sous-totaux, remises, \u00E9ch\u00E9ances. Zero erreur de calcul.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">\uD83C\uDFA8</div>
          <h3>3 Templates pro</h3>
          <p>Modern, Classic, Minimal. Couleurs personnalisables, logo, coordonn\u00E9es bancaires. Pr\u00EAt \u00E0 imprimer.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">\u26A1</div>
          <h3>API ultra-rapide</h3>
          <p>Un seul appel POST. R\u00E9ponse en &lt;100ms depuis Cloudflare Workers. JSON, HTML, ou PDF.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">\uD83C\uDDEB\uD83C\uDDF7</div>
          <h3>Bilingue FR/EN</h3>
          <p>Facturez vos clients fran\u00E7ais et internationaux dans leur langue. Mentions l\u00E9gales adapt\u00E9es.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">\uD83D\uDD01</div>
          <h3>Factures r\u00E9currentes</h3>
          <p>Configurez une r\u00E9currence (mensuelle, trimestrielle, annuelle) et num\u00E9rotation automatique.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="demo" id="demo">
    <div class="container">
      <h2>Un seul appel API</h2>
      <p class="sub">POST /generate avec vos donn\u00E9es, r\u00E9cup\u00E9rez une facture pro.</p>
      <div class="code-block">
<span class="comment">// curl -X POST https://ai-invoice.workers.dev/generate</span>
{
  <span class="key">"emitter"</span>: {
    <span class="key">"name"</span>: <span class="str">"Thomas Gorisse"</span>,
    <span class="key">"siret"</span>: <span class="str">"12345678901234"</span>,
    <span class="key">"address"</span>: <span class="str">"12 rue de la Loire"</span>,
    <span class="key">"city"</span>: <span class="str">"Nantes"</span>,
    <span class="key">"zip"</span>: <span class="str">"44000"</span>
  },
  <span class="key">"client"</span>: {
    <span class="key">"name"</span>: <span class="str">"Acme SAS"</span>,
    <span class="key">"address"</span>: <span class="str">"42 avenue des Champs"</span>,
    <span class="key">"city"</span>: <span class="str">"Paris"</span>,
    <span class="key">"zip"</span>: <span class="str">"75008"</span>
  },
  <span class="key">"invoice"</span>: {
    <span class="key">"number"</span>: <span class="str">"F-2026-001"</span>,
    <span class="key">"date"</span>: <span class="str">"2026-03-25"</span>
  },
  <span class="key">"items"</span>: [{
    <span class="key">"description"</span>: <span class="str">"D\u00E9veloppement Android"</span>,
    <span class="key">"quantity"</span>: <span class="num">12</span>,
    <span class="key">"unitPrice"</span>: <span class="num">650</span>,
    <span class="key">"unit"</span>: <span class="str">"days"</span>
  }]
}
      </div>
    </div>
  </section>

  <section class="templates" id="templates">
    <div class="container">
      <h2>3 Templates professionnels</h2>
      <p class="sub">Cliquez pour pr\u00E9visualiser</p>
      <div class="template-grid">
        <a href="/demo?template=modern" class="template-card">
          <div class="preview" style="background: linear-gradient(135deg, #eff6ff, #dbeafe);">\uD83D\uDCCB</div>
          <h3>Modern</h3>
          <p>Clean, color\u00E9, contemporain</p>
        </a>
        <a href="/demo?template=classic" class="template-card">
          <div class="preview" style="background: linear-gradient(135deg, #fafaf9, #e7e5e4);">\uD83D\uDCC4</div>
          <h3>Classic</h3>
          <p>Traditionnel, s\u00E9rieux, pro</p>
        </a>
        <a href="/demo?template=minimal" class="template-card">
          <div class="preview" style="background: linear-gradient(135deg, #fff, #f5f5f5);">\u2728</div>
          <h3>Minimal</h3>
          <p>\u00C9pur\u00E9, \u00E9l\u00E9gant, design</p>
        </a>
      </div>
    </div>
  </section>

  <section class="pricing" id="pricing">
    <div class="container">
      <h2>Tarifs simples</h2>
      <p class="sub">Pas de frais cach\u00E9s. Annulez \u00E0 tout moment.</p>
      <div class="pricing-cards">
        <div class="pricing-card">
          <h3>Gratuit</h3>
          <div class="price">0\u20AC</div>
          <div class="period">pour toujours</div>
          <ul>
            <li>5 factures / mois</li>
            <li>Template Modern uniquement</li>
            <li>Export HTML</li>
            <li>Mentions l\u00E9gales URSSAF</li>
          </ul>
          <a href="/api" class="btn btn-secondary" style="width: 100%; display: block; text-align: center;">Commencer</a>
        </div>
        <div class="pricing-card featured">
          <h3>Pro</h3>
          <div class="price">4,99\u20AC <span>/ mois</span></div>
          <div class="period">factures illimit\u00E9es</div>
          <ul>
            <li>Factures illimit\u00E9es</li>
            <li>3 templates + branding</li>
            <li>Export PDF + HTML</li>
            <li>Factures r\u00E9currentes</li>
            <li>Logo et couleurs perso</li>
            <li>Support prioritaire</li>
          </ul>
          <a href="#" class="btn btn-primary" style="width: 100%; display: block; text-align: center;">S'abonner</a>
        </div>
      </div>
    </div>
  </section>

  <footer>
    <div class="container">
      <p>AI Invoice &mdash; G\u00E9n\u00E9rateur de factures pour auto-entrepreneurs et freelances</p>
      <p style="margin-top: 8px;">
        <a href="/terms">CGU</a> &middot;
        <a href="/privacy">Confidentialit\u00E9</a> &middot;
        <a href="/api">API</a> &middot;
        <a href="https://github.com/thomasgorisse/ai-invoice">GitHub</a>
      </p>
    </div>
  </footer>
</body>
</html>`;
