import { InvoiceData } from '../invoice';
import { renderModernTemplate } from './modern';
import { renderClassicTemplate } from './classic';
import { renderMinimalTemplate } from './minimal';

export type TemplateName = 'modern' | 'classic' | 'minimal';

const templates: Record<TemplateName, (data: InvoiceData) => string> = {
  modern: renderModernTemplate,
  classic: renderClassicTemplate,
  minimal: renderMinimalTemplate,
};

export function renderInvoiceHtml(
  data: InvoiceData,
  template?: TemplateName
): string {
  const name = template ?? (data.request.options?.template ?? 'modern');
  const renderer = templates[name];
  if (!renderer) {
    throw new Error(`Unknown template: ${name}. Available: ${Object.keys(templates).join(', ')}`);
  }
  return renderer(data);
}

export { renderModernTemplate, renderClassicTemplate, renderMinimalTemplate };
