import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks';
import { ArrowLeft, Moon, Sun } from 'lucide-react';

const Impressum: React.FC = () => {
  const theme = useTheme();
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const current = localStorage.getItem('storyverse_settings');
    const settings = current ? JSON.parse(current) : {};
    const newTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('storyverse_settings', JSON.stringify({ ...settings, theme: newTheme }));
    window.location.reload();
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-[#0c0a09]' : 'bg-[#FAFAF9]'
    }`}>
      {/* Header */}
      <header className={`border-b shrink-0 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link 
            to="/" 
            className={`inline-flex items-center gap-2 text-sm transition-colors group ${
              isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
          <button
            onClick={toggleTheme}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
            }`}
          >
            {isDark ? <Sun size={18} className="text-stone-400" /> : <Moon size={18} className="text-stone-500" />}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className={`text-3xl font-bold mb-10 ${isDark ? 'text-white' : 'text-stone-900'}`}>
            Impressum
          </h1>

          <div className="space-y-10">
            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Angaben gemäß § 5 TMG
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                StoryVerse<br />
                [Ihr Name / Firmenname]<br />
                [Straße und Hausnummer]<br />
                [PLZ Ort]<br />
                Deutschland
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Kontakt
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                E-Mail: contact@storyverse.app<br />
                Telefon: [Telefonnummer]
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Umsatzsteuer-ID
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
                [USt-IdNr.]
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                [Name]<br />
                [Adresse]
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                EU-Streitschlichtung
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                <a 
                  href="https://ec.europa.eu/consumers/odr/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`underline hover:no-underline ${isDark ? 'text-white' : 'text-stone-900'}`}
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Verbraucherstreitbeilegung/Universalschlichtungsstelle
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Haftung für Inhalte
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Haftung für Links
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Urheberrecht
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t shrink-0 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
        <div className={`max-w-3xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm ${
          isDark ? 'text-stone-500' : 'text-stone-400'
        }`}>
          <span>© 2025 StoryVerse</span>
          <div className="flex gap-6">
            <Link to="/privacy" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Privacy</Link>
            <Link to="/terms" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Terms</Link>
            <Link to="/contact" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Impressum;
