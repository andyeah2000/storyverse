import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import Footer from '../Footer';

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
    return match?.[1] ?? null;
  };

  // Get title without number prefix
  const getTitleWithoutNumber = (sectionTitle: string): string => {
    return sectionTitle.replace(/^\d+\.\s*/, '');
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-[#FAFAF9]">
      {/* Header */}
      <header className="border-b shrink-0 sticky top-0 z-40 backdrop-blur-xl border-stone-200 bg-[#FAFAF9]/90">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            to={backHref} 
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft size={16} />
            {backLabel}
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="hidden sm:flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-stone-900 text-white">
                S
              </div>
              <span className="text-sm font-semibold text-stone-900">
                StoryVerse
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Desktop TOC - Sticky sidebar */}
        <aside className="hidden lg:flex sticky top-[57px] h-[calc(100vh-57px)] w-64 flex-col py-10 overflow-y-auto shrink-0">
          <nav className="relative px-4">
            {/* Animated pill indicator */}
            <div 
              className="absolute left-0 w-[3px] rounded-full transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) bg-stone-900"
              style={{
                top: `${sections.findIndex(s => s.id === activeId) * 36 + 6}px`,
                height: '24px',
                opacity: activeId ? 1 : 0,
              }}
            />
            
            <div className="space-y-0 pl-4 border-l border-stone-200/50">
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
                        ? 'text-stone-900 font-medium'
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
        </aside>

        {/* Content Area */}
        <main className="flex-1 py-10 px-4 sm:px-6 lg:px-12 min-w-0">
          <div className="max-w-3xl mx-auto lg:mx-0">
              {/* Mobile TOC */}
              <div className="lg:hidden mb-8">
                <p className="text-[10px] uppercase tracking-[0.2em] font-medium mb-3 text-stone-400">
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
                            ? 'bg-stone-900 text-white shadow-sm'
                            : 'bg-stone-100 text-stone-500 hover:text-stone-900 hover:bg-stone-200'
                      )}
                    >
                        <span className={cn(
                          'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold',
                          isActive
                            ? 'bg-white text-stone-900'
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
                  <p className="text-xs uppercase tracking-[0.3em] mb-4 text-stone-400">
                    {updatedAt ? `Updated ${updatedAt}` : 'Current'}
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-bold text-stone-900">
                    {title}
                  </h1>
                </div>

                <div className="space-y-12">
                  {sections.map(section => (
                    <section key={section.id} id={section.id} className="scroll-mt-32">
                      <h2 className="text-2xl font-semibold mb-4 text-stone-900">
                        {section.title}
                      </h2>
                      <div className={cn(
                        'prose prose-stone max-w-none',
                        '[&>p]:leading-relaxed [&>p]:text-base',
                        '[&>p]:text-stone-600',
                        '[&>ul]:space-y-2 [&>ul]:ml-4',
                        '[&>ul]:text-stone-600'
                      )}>
                        {section.content}
                      </div>
                    </section>
                  ))}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LegalLayout;
