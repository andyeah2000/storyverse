import React from 'react';
import LegalLayout, { LegalSection } from './LegalLayout';

const sections: LegalSection[] = [
  {
    id: 'angaben',
    title: 'Angaben gemäß § 5 TMG',
    content: (
      <p>
        StoryVerse
        <br />
        [Ihr Name / Firmenname]
        <br />
        [Straße und Hausnummer]
        <br />
        [PLZ Ort]
        <br />
        Deutschland
      </p>
    ),
  },
  {
    id: 'kontakt',
    title: 'Kontakt',
    content: (
      <p>
        E-Mail: contact@storyverse.app
        <br />
        Telefon: [Telefonnummer]
      </p>
    ),
  },
  {
    id: 'umsatzsteuer',
    title: 'Umsatzsteuer-ID',
    content: (
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
        <br />
        [USt-IdNr.]
      </p>
    ),
  },
  {
    id: 'verantwortlich',
    title: 'Verantwortlich nach § 55 Abs. 2 RStV',
    content: (
      <p>
        [Name]
        <br />
        [Adresse]
      </p>
    ),
  },
  {
    id: 'streitschlichtung',
    title: 'EU-Streitschlichtung',
    content: (
      <>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
        </p>
        <p>Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
      </>
    ),
  },
  {
    id: 'verbraucherstreit',
    title: 'Verbraucherstreitbeilegung',
    content: (
      <p>
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    ),
  },
  {
    id: 'haftung-inhalte',
    title: 'Haftung für Inhalte',
    content: (
      <>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10
          TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
          forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
        </p>
        <p>
          Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine
          diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden
          Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
        </p>
      </>
    ),
  },
  {
    id: 'haftung-links',
    title: 'Haftung für Links',
    content: (
      <p>
        Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte
        keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich. Eine permanente
        inhaltliche Kontrolle der verlinkten Seiten ist ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
        Rechtsverletzungen werden wir derartige Links umgehend entfernen.
      </p>
    ),
  },
  {
    id: 'urheberrecht',
    title: 'Urheberrecht',
    content: (
      <p>
        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
        Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw.
        Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Sollten Sie trotzdem auf eine
        Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige
        Inhalte umgehend entfernen.
      </p>
    ),
  },
];

const Impressum: React.FC = () => {
  return (
    <LegalLayout
      title="Impressum"
      sections={sections}
      updatedAt={new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
      backLabel="Zurück zur Startseite"
    />
  );
};

export default Impressum;
