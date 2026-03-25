/**
 * HTML to PDF conversion for Cloudflare Workers.
 *
 * Strategy: We use Cloudflare's Browser Rendering API (puppeteer) when available,
 * or fall back to returning HTML with print-optimized CSS that generates
 * pixel-perfect PDFs when printed from any browser.
 *
 * For production, the recommended approach is:
 * 1. Use the HTML output directly (most clients can render/print it)
 * 2. Use a headless browser service (Browserless, Cloudflare Browser Rendering)
 * 3. Use a PDF API service (PDFShift, DocRaptor, etc.)
 */

export interface PdfOptions {
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

/**
 * Convert HTML to PDF using an external service.
 * This is a lightweight wrapper — in production, configure one of:
 * - Cloudflare Browser Rendering (built-in, best option)
 * - External API (PDFShift, DocRaptor, etc.)
 */
export async function htmlToPdf(
  html: string,
  _options?: PdfOptions
): Promise<Uint8Array | null> {
  // Cloudflare Browser Rendering would go here:
  // const browser = await puppeteer.launch(env.BROWSER);
  // const page = await browser.newPage();
  // await page.setContent(html, { waitUntil: 'networkidle0' });
  // const pdf = await page.pdf({ format: 'A4', printBackground: true });
  // await browser.close();
  // return new Uint8Array(pdf);

  // For now, return null — caller falls back to HTML
  // The HTML templates are print-optimized and produce great PDFs via Ctrl+P
  return null;
}

/**
 * Wrap HTML with print-specific meta tags and a print button
 * so users can easily generate PDF from the browser.
 */
export function wrapHtmlForPrint(html: string): string {
  // Inject a floating print button and auto-print script
  const printButton = `
    <div id="print-controls" style="
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      gap: 8px;
    ">
      <button onclick="window.print()" style="
        background: #2563eb;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      ">Imprimer / PDF</button>
    </div>
    <style>
      @media print {
        #print-controls { display: none !important; }
      }
    </style>`;

  // Insert before </body>
  return html.replace('</body>', `${printButton}\n</body>`);
}

/**
 * Generate a PDF response or fall back to HTML.
 * Returns { contentType, body } ready for Response construction.
 */
export async function generatePdfResponse(
  html: string,
  options?: PdfOptions
): Promise<{ contentType: string; body: Uint8Array | string }> {
  const pdfBytes = await htmlToPdf(html, options);

  if (pdfBytes) {
    return {
      contentType: 'application/pdf',
      body: pdfBytes,
    };
  }

  // Fallback: return print-optimized HTML
  return {
    contentType: 'text/html; charset=utf-8',
    body: wrapHtmlForPrint(html),
  };
}
