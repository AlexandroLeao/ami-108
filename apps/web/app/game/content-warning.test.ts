import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ContentWarning, campaignExtras, contentWarning } from './content-warning';
import { copy } from '../preview/copy';

describe('pre-game content warning', () => {
  it.each(['pt-BR', 'en'] as const)('places localized warning above both controls in %s', locale => {
    const html = renderToStaticMarkup(createElement(ContentWarning, {
      locale, busy: false, onContinue: () => {}, onBack: () => {},
    }));
    const warning = contentWarning[locale];
    expect(html).toContain('scene-frame campaign-warning-scene');
    expect(html).toContain(warning.title);
    expect(html).toContain(warning.age);
    expect(html).toContain(warning.description);
    expect(html).toContain(warning.status);
    expect(html.indexOf(warning.description)).toBeLessThan(html.indexOf('campaign-warning-controls'));
    expect(html).toContain(copy[locale].continue);
    expect(html).toContain(copy[locale].mainMenu);
    expect(html.match(/<button /g)).toHaveLength(2);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<input');
  });
  it('disables both controls while session creation is in flight', () => {
    const html = renderToStaticMarkup(createElement(ContentWarning, {
      locale: 'pt-BR', busy: true, onContinue: () => {}, onBack: () => {},
    }));
    expect(html.match(/disabled=""/g)).toHaveLength(2);
  });
  it.each(['pt-BR', 'en'] as const)('keeps approved extras and adds nonprofit and advisory in %s', locale => {
    const pages = campaignExtras(locale);
    expect(pages).toHaveLength(4);
    expect(pages[0].paragraphs).toEqual([...copy[locale].extrasPages[0].paragraphs, contentWarning[locale].nonProfit]);
    expect(pages.slice(1, 3)).toEqual(copy[locale].extrasPages.slice(1));
    expect(pages[3].paragraphs).toEqual([contentWarning[locale].age, contentWarning[locale].description, contentWarning[locale].status]);
  });
});
