import React from 'react';
import { copy, type Locale } from '../preview/copy';

// Editorial guidance for the private preview, not a ClassInd/IARC certificate.
export const contentWarning = {
  'pt-BR': {
    title: 'AVISO DE CONTEÚDO',
    age: 'Recomendação provisória: 16 anos',
    description: 'Este jogo contém violência, sangue, linguagem imprópria e elementos de terror.',
    status: 'Classificação indicativa a confirmar.',
    about: [
      'AMI-108 é uma aventura narrativa retrofuturista. Você e um robô de memórias corrompidas lutam para sobreviver em um mundo em ruínas.',
      'Projeto autoral de engenharia de software, sem fins lucrativos, que une narrativa interativa, arte pixelada e inteligência artificial controlada.',
    ],
  },
  en: {
    title: 'CONTENT WARNING',
    age: 'Provisional guidance: ages 16 and up',
    description: 'This game contains violence, blood, strong language and horror elements.',
    status: 'Official age rating pending.',
    about: [
      'AMI-108 is a retrofuturistic narrative adventure. You and a robot with corrupted memories fight to survive in a world in ruins.',
      'An original, non-profit software engineering project combining interactive storytelling, pixel art and controlled artificial intelligence.',
    ],
  },
} as const;

export function campaignExtras(locale: Locale) {
  const pages = copy[locale].extrasPages;
  const warning = contentWarning[locale];
  return [
    { ...pages[0], paragraphs: warning.about },
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
        <button className="game-control" type="button" disabled={busy} onClick={onBack}>{labels.mainMenu}</button>
        <button className="game-control" type="button" data-primary disabled={busy} onClick={onContinue}>{labels.continue}</button>
      </section>
    </section>
  );
}
