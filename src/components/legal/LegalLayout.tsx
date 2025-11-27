import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
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
          rootMargin: '-20% 0px -70% 0px',
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
    setActiveId(id);
  };

  // Extract section number from title if present (e.g., "1. Introduction" -> "1")
  const getSectionNumber = (sectionTitle: string): string | null => {
    const match = sectionTitle.match(/^(\d+)\./);
    return match ? match[1] : null;
  };

  // Get title without number prefix
  const getTitleWithoutNumber = (sectionTitle: string): string => {
    return sectionTitle.replace(/^\d+\.\s*/, '');
  };

  return (
    <div className={cn(
      'min-h-screen flex flex-col transition-colors duration-300',
      isDark ? 'bg-[#0c0a09]' : 'bg-[#FAFAF9]'
    )}>
      {/* Header */}
      <header className={cn(
        'border-b shrink-0 sticky top-0 z-40 backdrop-blur-xl',
        isDark ? 'border-stone-800 bg-[#0c0a09]/90' : 'border-stone-200 bg-[#FAFAF9]/90'
      )}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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

      {/* Desktop TOC - Apple-style minimal sidebar, vertically centered */}
      <aside className={cn(
        'hidden lg:flex fixed left-0 top-[57px] bottom-0 w-56 flex-col items-start justify-center',
        isDark ? 'bg-[#0c0a09]' : 'bg-[#FAFAF9]'
      )}>
        <div className="pl-8 pr-6">
          <nav className="relative">
            {/* Animated pill indicator */}
            <div 
              className={cn(
                'absolute -left-1 w-[3px] rounded-full transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)',
                isDark ? 'bg-white' : 'bg-stone-900'
              )}
              style={{
                top: `${sections.findIndex(s => s.id === activeId) * 36 + 6}px`,
                height: '24px',
                opacity: activeId ? 1 : 0,
              }}
            />
            
            <div className="space-y-0">
              {sections.map((section, index) => {
                const displayTitle = getTitleWithoutNumber(section.title);
                const isActive = activeId === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => handleScrollTo(section.id)}
                    style={{
                      transitionDelay: `${index * 20}ms`,
                    }}
                    className={cn(
                      'group w-full text-left h-9 text-[13px] tracking-[-0.01em] transition-all duration-300 ease-out flex items-center',
                      isActive
                        ? isDark 
                          ? 'text-white font-medium' 
                          : 'text-stone-900 font-medium'
                        : isDark
                          ? 'text-stone-600 hover:text-stone-400'
                          : 'text-stone-400 hover:text-stone-500'
                    )}
                  >
                    <span 
                      className={cn(
                        'truncate transition-transform duration-300 ease-out',
                        isActive && 'translate-x-0.5'
                      )}
                    >
                      {displayTitle}
                    </span>
                  </button>
                );
              })}
            </div>
              </nav>
            </div>
          </aside>

      {/* Content */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:pl-60">
        <div className="max-w-3xl mx-auto">
            {/* Mobile TOC */}
            <div className="lg:hidden mb-8">
              <p className={cn(
                'text-[10px] uppercase tracking-[0.2em] font-medium mb-3',
                isDark ? 'text-stone-600' : 'text-stone-400'
              )}>
                Contents
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
                {sections.map((section, index) => {
                  const sectionNumber = getSectionNumber(section.title);
                  const displayTitle = getTitleWithoutNumber(section.title);
                  const isActive = activeId === section.id;
                  
                  return (
                  <button
                    key={section.id}
                    onClick={() => handleScrollTo(section.id)}
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0',
                        isActive
                        ? isDark
                            ? 'bg-white text-stone-900 shadow-sm'
                            : 'bg-stone-900 text-white shadow-sm'
                        : isDark
                            ? 'bg-stone-800/60 text-stone-400 hover:text-white hover:bg-stone-800'
                            : 'bg-stone-100 text-stone-500 hover:text-stone-900 hover:bg-stone-200'
                    )}
                  >
                      <span className={cn(
                        'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold',
                        isActive
                          ? isDark
                            ? 'bg-stone-900 text-white'
                            : 'bg-white text-stone-900'
                          : isDark
                            ? 'bg-stone-700 text-stone-400'
                            : 'bg-stone-200 text-stone-500'
                      )}>
                        {sectionNumber || (index + 1)}
                      </span>
                      {displayTitle}
                  </button>
                  );
                })}
              </div>
            </div>

              <div className="mb-10">
                <p className={cn(
                  'text-xs uppercase tracking-[0.3em] mb-4',
                  isDark ? 'text-stone-500' : 'text-stone-400'
                )}>
                  {updatedAt ? `Updated ${updatedAt}` : 'Current'}
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
      </main>

      {/* Footer */}
      <footer className={cn(
        'border-t shrink-0',
        isDark ? 'border-stone-800' : 'border-stone-200'
      )}>
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-6 h-6 rounded flex items-center justify-center',
              isDark ? 'bg-white' : 'bg-stone-900'
            )}>
              <span className={cn('text-xs font-bold', isDark ? 'text-stone-900' : 'text-white')}>S</span>
            </div>
            <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>StoryVerse</span>
          </div>
        <div className={cn(
            'flex items-center gap-6 text-sm',
            isDark ? 'text-stone-500' : 'text-stone-500'
        )}>
            <Link to="/about" className={cn('transition-colors', isDark ? 'hover:text-white' : 'hover:text-stone-900')}>
              About
            </Link>
            <Link to="/contact" className={cn('transition-colors', isDark ? 'hover:text-white' : 'hover:text-stone-900')}>
              Contact
            </Link>
            <Link to="/privacy" className={cn('transition-colors', isDark ? 'hover:text-white' : 'hover:text-stone-900')}>
              Privacy
            </Link>
            <Link to="/terms" className={cn('transition-colors', isDark ? 'hover:text-white' : 'hover:text-stone-900')}>
              Terms
            </Link>
          </div>
          <p className={cn('text-sm', isDark ? 'text-stone-600' : 'text-stone-400')}>© {new Date().getFullYear()} StoryVerse</p>
        </div>
      </footer>
    </div>
  );
};

export default LegalLayout;
