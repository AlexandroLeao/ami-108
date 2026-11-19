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
    expect(html.indexOf('>'+copy[locale].mainMenu+'</button>')).toBeLessThan(html.indexOf('>'+copy[locale].continue+'</button>'));
    expect(html).toContain('>'+copy[locale].mainMenu+'</button>');
    expect(html).toContain('>'+copy[locale].continue+'</button>');
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
  it.each(['pt-BR', 'en'] as const)('keeps other extras and uses a spoiler-free nonprofit synopsis in %s', locale => {
    const pages = campaignExtras(locale);
    expect(pages).toHaveLength(4);
    expect(pages[0].paragraphs).toEqual(contentWarning[locale].about);
    expect(pages[0].paragraphs).toHaveLength(2);
    expect(pages[0].paragraphs.join(' ')).not.toMatch(/David/i);
    const original = locale === 'pt-BR' ? /projeto autoral/gi : /original/gi;
    expect(pages[0].paragraphs.join(' ').match(original)).toHaveLength(1);
    expect(pages[0].paragraphs[1]).toContain(locale === 'pt-BR' ? 'sem fins lucrativos' : 'non-profit');
    expect(pages.slice(1, 3)).toEqual(copy[locale].extrasPages.slice(1));
    expect(pages[3].paragraphs).toEqual([contentWarning[locale].age, contentWarning[locale].description, contentWarning[locale].status]);
  });
});
