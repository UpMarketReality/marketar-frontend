import { inject, provideAppInitializer } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

// Íconos SVG propios registrados en <mat-icon svgIcon="...">.
// Se registran localmente, así funcionan sin conexión y sin depender de una fuente externa.
const line = (paths: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const solid = (paths: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">${paths}</svg>`;

const HEART =
  'M12 21s-7.5-4.6-9.6-9.2C.9 8.5 2.9 4.5 6.6 4.5c2.1 0 3.6 1.1 4.4 2.4h2c.8-1.3 2.3-2.4 4.4-2.4 3.7 0 5.7 4 4.2 7.3C19.5 16.4 12 21 12 21Z';
const STAR = 'm12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9Z';

export const APP_ICONS: Record<string, string> = {
  heart: solid(`<path d="${HEART}"/>`),
  'heart-outline': line(`<path d="${HEART}"/>`),
  cube: line('<path d="m21 7.5-9-5-9 5v9l9 5 9-5Z"/><path d="m3 7.5 9 5 9-5M12 12.5v9"/>'),
  cart: line(
    '<path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.5L22 8H6"/><circle cx="10" cy="20.5" r="1"/><circle cx="18" cy="20.5" r="1"/>',
  ),
  star: solid(`<path d="${STAR}"/>`),
  'star-outline': line(`<path d="${STAR}"/>`),
  'star-half': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${STAR}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 2.8v14.5l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9Z" fill="currentColor"/></svg>`,
  clock: line('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  sparkles: solid(
    '<path d="M10 2.5l1.9 5.1 5.1 1.9-5.1 1.9L10 16.5l-1.9-5.1L3 9.5l5.1-1.9Z"/><path d="M18.5 13l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/>',
  ),
  'arrow-right': line('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  file: line('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
  image: line('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 9"/>'),
  search: line('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  sort: line('<path d="M3 6h18M6 12h12M10 18h4"/>'),
  check: line('<path d="m5 12 5 5 9-10"/>'),
  close: line('<path d="M6 6l12 12M18 6 6 18"/>'),
};

// Registrar en app.config.ts dentro de "providers"
export function provideAppIcons() {
  return provideAppInitializer(() => {
    const registry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);
    for (const [name, svg] of Object.entries(APP_ICONS)) {
      registry.addSvgIconLiteral(name, sanitizer.bypassSecurityTrustHtml(svg));
    }
  });
}
