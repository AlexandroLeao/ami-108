import React from 'react';
import { copy, type Locale } from '../preview/copy';

// Editorial guidance for the private preview, not a ClassInd/IARC certificate.
export const contentWarning = {
  'pt-BR': {
    title: 'AVISO DE CONTEÚDO',
    age: 'Recomendação provisória: 16 anos',
    description: 'Este jogo contém violência, sangue, linguagem imprópria e elementos de terror.',
    status: 'Classificação indicativa a confirmar.',
    nonProfit: 'Projeto autoral e sem fins lucrativos.',
  },
  en: {
    title: 'CONTENT WARNING',
    age: 'Provisional guidance: ages 16 and up',
    description: 'This game contains violence, blood, strong language and horror elements.',
    status: 'Official age rating pending.',
    nonProfit: 'An original, non-profit project.',
  },
} as const;

export function campaignExtras(locale: Locale) {
  const pages = copy[locale].extrasPages;
  const warning = contentWarning[locale];
  return [
    { ...pages[0], paragraphs: [...pages[0].paragraphs, warning.nonProfit] },
    ...pages.slice(1),
    { title: warning.title, paragraphs: [warning.age, warning.description, warning.status] },
  ];
}

export function ContentWarning({ locale, busy, onContinue, onBack }: {
  locale: Locale; busy: boolean; onContinue: () => void; onBack: () => void;
}) {
  const warning = contentWarning[locale];
  const labels = copy[locale];
  const heading = React.useId();
  return (
    <section className="game-stage campaign-content-warning" aria-labelledby={heading}>
      <header className="campaign-header">
        <div className="stage-header"><span>AMI-108</span><div className="campaign-header-middle" /></div>
      </header>
      <div className="scene-frame campaign-warning-scene">
        <div className="campaign-warning-copy">
          <h1 id={heading}>{warning.title}</h1>
          <p className="campaign-warning-age">{warning.age}</p>
          <p>{warning.description}</p>
          <p className="campaign-warning-status">{warning.status}</p>
        </div>
      </div>
      <section className="dialogue-frame campaign-dialogue campaign-warning-controls" aria-busy={busy}>
        <button className="game-control" type="button" data-primary disabled={busy} onClick={onContinue}>{labels.continue}</button>
        <button className="game-control" type="button" disabled={busy} onClick={onBack}>{labels.mainMenu}</button>
      </section>
    </section>
  );
}
