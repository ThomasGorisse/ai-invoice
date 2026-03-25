# AI Invoice

AI-powered invoice generator for French freelancers and auto-entrepreneurs.

Built on Cloudflare Workers. Zero ops, global edge, sub-100ms responses.

## Features

- **URSSAF-compliant**: all required legal mentions for auto-entrepreneurs (article 293 B du CGI, late payment penalties, recovery indemnity)
- **Auto-calculations**: TVA (20%, 10%, 5.5%, 2.1%), subtotals, discounts, due dates
- **3 templates**: Modern, Classic, Minimal — with custom logo and colors
- **Bilingual**: French and English
- **Multiple formats**: HTML (print-optimized), PDF, JSON
- **Recurring invoices**: weekly, monthly, quarterly, yearly with auto-numbering
- **Single API call**: POST /generate with your data, get a professional invoice

## Quick Start

```bash
npm install
npm run dev     # local dev server on port 8787
npm run deploy  # deploy to Cloudflare Workers
```

## API

### POST /generate

Generate an invoice. Send JSON, get back a professional invoice.

```bash
curl -X POST http://localhost:8787/generate \
  -H "Content-Type: application/json" \
  -d '{
    "emitter": {
      "name": "Thomas Gorisse",
      "address": "12 rue de la Loire",
      "city": "Nantes",
      "zip": "44000",
      "siret": "12345678901234"
    },
    "client": {
      "name": "Acme SAS",
      "address": "42 avenue des Champs",
      "city": "Paris",
      "zip": "75008"
    },
    "invoice": {
      "number": "F-2026-001",
      "date": "2026-03-25"
    },
    "items": [
      {
        "description": "Developpement Android",
        "quantity": 12,
        "unitPrice": 650,
        "unit": "days"
      }
    ]
  }'
```

### Options

| Field | Type | Default | Description |
|---|---|---|---|
| `options.template` | `modern\|classic\|minimal` | `modern` | Invoice template |
| `options.format` | `pdf\|html\|both` | `both` | Output format |
| `options.primaryColor` | `string` | `#2563eb` | Brand color (hex) |
| `options.tvaApplicable` | `boolean` | `false` | Enable TVA calculation |
| `options.tvaRate` | `number` | `20` | Default TVA rate (%) |
| `invoice.language` | `fr\|en` | `fr` | Invoice language |
| `invoice.paymentTerms` | `number` | `30` | Payment terms in days |

### GET /demo

Preview a demo invoice: `/demo?template=modern&lang=fr`

### GET /api

Full API documentation as JSON.

## Stack

- **Runtime**: Cloudflare Workers (TypeScript)
- **PDF**: HTML templates with print-optimized CSS (browser Print > PDF)
- **Payments**: Stripe ($4.99/month for Pro)
- **Storage**: Cloudflare KV (invoice history)

## Legal Compliance

Automatically includes all mentions required by French law for auto-entrepreneurs:
- TVA exemption (article 293 B du CGI) when applicable
- SIRET, SIREN, APE codes
- Late payment penalties (3x legal interest rate)
- Recovery indemnity (40 EUR)
- No early payment discount mention
- Intra-community VAT number when TVA applicable

## License

MIT
