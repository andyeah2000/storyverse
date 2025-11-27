import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../../hooks';
import ThemeToggleButton from '../ThemeToggleButton';
import { cn } from '../../lib/utils';

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalLayoutProps {
  title: string;
  updatedAt?: string;
  sections: LegalSection[];
  backHref?: string;
  backLabel?: string;
}

const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  updatedAt,
  sections,
  backHref = '/',
  backLabel = 'Back to Home',
}) => {
  const theme = useTheme();
  const isDark = theme === 'dark';
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '');

  const sectionIds = useMemo(() => sections.map(section => section.id), [sections]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach(id => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          });
        },
        {
          rootMargin: '-45% 0px -45% 0px',
          threshold: 0,
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [sectionIds]);

  const handleScrollTo = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    window.scrollTo({
      top: target.offsetTop - 100,
      behavior: 'smooth',
    });
  };

  return (
    <div className={cn(
      'min-h-screen flex flex-col transition-colors duration-300',
      isDark ? 'bg-[#0c0a09]' : 'bg-[#FAFAF9]'
    )}>
      {/* Header */}
      <header className={cn(
        'border-b shrink-0',
        isDark ? 'border-stone-800' : 'border-stone-200'
      )}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link 
            to={backHref} 
            className={cn(
              'inline-flex items-center gap-2 text-sm font-medium transition-colors',
              isDark ? 'text-stone-300 hover:text-white' : 'text-stone-600 hover:text-stone-900'
            )}
          >
            <ArrowLeft size={16} />
            {backLabel}
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="hidden sm:flex items-center gap-2.5">
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
                isDark ? 'bg-white text-stone-900' : 'bg-stone-900 text-white'
              )}>
                S
              </div>
              <span className={cn(
                'text-sm font-semibold',
                isDark ? 'text-white' : 'text-stone-900'
              )}>
                StoryVerse
              </span>
            </Link>
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[220px_1fr] gap-8">
          {/* Desktop TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className={cn(
                'text-xs uppercase tracking-[0.2em] mb-4',
                isDark ? 'text-stone-500' : 'text-stone-400'
              )}>
                Inhaltsverzeichnis
              </p>
              <nav className="space-y-1">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => handleScrollTo(section.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all',
                      activeId === section.id
                        ? isDark 
                          ? 'bg-stone-800 text-white' 
                          : 'bg-white text-stone-900 shadow-sm shadow-stone-900/5'
                        : isDark
                          ? 'text-stone-400 hover:text-white hover:bg-stone-900/60'
                          : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                    )}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <div>
            {/* Mobile TOC */}
            <div className="lg:hidden mb-6 -mx-2">
              <div className={cn(
                'flex gap-2 overflow-x-auto px-2 py-3 rounded-2xl border',
                isDark ? 'border-stone-800 bg-stone-900/60' : 'border-stone-200 bg-white'
              )}>
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => handleScrollTo(section.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                      activeId === section.id
                        ? isDark
                          ? 'bg-white text-stone-900'
                          : 'bg-stone-900 text-white'
                        : isDark
                          ? 'text-stone-400 hover:text-white'
                          : 'text-stone-500 hover:text-stone-900'
                    )}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-w-3xl">
              <div className="mb-10">
                <p className={cn(
                  'text-xs uppercase tracking-[0.3em] mb-4',
                  isDark ? 'text-stone-500' : 'text-stone-400'
                )}>
                  {updatedAt ? `Aktualisiert ${updatedAt}` : 'Aktuell'}
                </p>
                <h1 className={cn(
                  'text-3xl sm:text-4xl font-bold',
                  isDark ? 'text-white' : 'text-stone-900'
                )}>
                  {title}
                </h1>
              </div>

              <div className="space-y-12">
                {sections.map(section => (
                  <section key={section.id} id={section.id} className="scroll-mt-32">
                    <h2 className={cn(
                      'text-2xl font-semibold mb-4',
                      isDark ? 'text-white' : 'text-stone-900'
                    )}>
                      {section.title}
                    </h2>
                    <div className={cn(
                      'prose prose-stone max-w-none dark:prose-invert',
                      '[&>p]:leading-relaxed [&>p]:text-base',
                      '[&>p]:text-stone-600 dark:[&>p]:text-stone-400',
                      '[&>ul]:space-y-2 [&>ul]:ml-4',
                      '[&>ul]:text-stone-600 dark:[&>ul]:text-stone-400'
                    )}>
                      {section.content}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={cn(
        'border-t shrink-0',
        isDark ? 'border-stone-800' : 'border-stone-200'
      )}>
        <div className={cn(
          'max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm',
          isDark ? 'text-stone-500' : 'text-stone-400'
        )}>
          <span>© {new Date().getFullYear()} StoryVerse</span>
          <div className="flex gap-6">
            <Link to="/privacy" className={cn(isDark ? 'hover:text-white' : 'hover:text-stone-900')}>
              Privacy
            </Link>
            <Link to="/terms" className={cn(isDark ? 'hover:text-white' : 'hover:text-stone-900')}>
              Terms
            </Link>
            <Link to="/impressum" className={cn(isDark ? 'hover:text-white' : 'hover:text-stone-900')}>
              Impressum
            </Link>
            <Link to="/contact" className={cn(isDark ? 'hover:text-white' : 'hover:text-stone-900')}>
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LegalLayout;
