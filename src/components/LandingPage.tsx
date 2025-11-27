import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../hooks';
import ThemeToggleButton from './ThemeToggleButton';
import { 
  ArrowRight,
  Mic, 
  BookOpen, 
  Layers,
  Play,
  Check,
  Menu,
  X
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme === 'dark';
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  const navLinks: { label: string; href: string; type: 'anchor' | 'route' }[] = [];

  return (
    <div className={`min-h-screen selection:bg-current selection:text-white overflow-x-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#0c0a09] text-stone-100' : 'bg-[#FAFAF9] text-stone-900'
    }`}>
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? isDark 
            ? 'bg-[#0c0a09]/90 backdrop-blur-xl' 
            : 'bg-[#FAFAF9]/90 backdrop-blur-xl'
          : ''
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-white' : 'bg-stone-900'
            }`}>
              <span className={`text-sm font-bold ${isDark ? 'text-stone-900' : 'text-white'}`}>S</span>
            </div>
            <span className={`text-base font-semibold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
              StoryVerse
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              {navLinks.map(link => (
                link.type === 'anchor' ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    className={`text-sm font-medium transition-colors ${
                      isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </div>

            <ThemeToggleButton />
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => navigate('/login')}
                className={`h-10 px-5 rounded-full text-sm font-medium transition-colors ${
                  isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className={`h-10 px-5 rounded-full text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-white text-stone-900 hover:bg-stone-100' 
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                }`}
              >
                Get Started
              </button>
            </div>

            <button
              onClick={() => setMobileNavOpen(true)}
              className={`md:hidden w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-200/80'
              }`}
              aria-label="Open menu"
            >
              <Menu size={20} className={isDark ? 'text-white' : 'text-stone-900'} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Nav Sheet */}
      {mobileNavOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className={`fixed top-0 right-0 bottom-0 w-full max-w-sm z-50 md:hidden animate-in slide-in-from-right duration-300 ${
            isDark ? 'bg-[#0c0a09]' : 'bg-white'
          }`}>
            <div className="h-16 px-6 flex items-center justify-between">
              <span className="text-base font-semibold">Menu</span>
              <button
                onClick={() => setMobileNavOpen(false)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
                }`}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3 overflow-y-auto h-[calc(100%-4rem)] pb-10">
              <div className="space-y-2">
                {navLinks.map(link => (
                  link.type === 'anchor' ? (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`block px-4 py-3 rounded-2xl text-base font-medium transition-colors ${
                        isDark ? 'text-stone-200 hover:bg-stone-800' : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.label}
                      to={link.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`block px-4 py-3 rounded-2xl text-base font-medium transition-colors ${
                        isDark ? 'text-stone-200 hover:bg-stone-800' : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                ))}
              </div>
              <div className="pt-2 space-y-2 border-t border-stone-200/40 dark:border-white/5">
                <button 
                  onClick={() => {
                    navigate('/login');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full h-12 rounded-xl text-sm font-semibold transition-all ${
                    isDark ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-100 text-stone-900 hover:bg-stone-200'
                  }`}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => {
                    navigate('/signup');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full h-12 rounded-xl text-sm font-semibold transition-all ${
                    isDark ? 'bg-white text-stone-900 hover:bg-stone-100' : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}
                >
                  Get Started
                </button>
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 pt-4">
                © {new Date().getFullYear()} StoryVerse. All rights reserved.
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero-banner.jpg" 
            alt=""
            className={`w-full h-full object-cover object-center ${isDark ? 'opacity-20' : 'opacity-40'}`}
          />
          <div className={`absolute inset-0 ${
            isDark 
              ? 'bg-gradient-to-b from-[#0c0a09] via-[#0c0a09]/60 to-[#0c0a09]' 
              : 'bg-gradient-to-b from-[#FAFAF9] via-[#FAFAF9]/60 to-[#FAFAF9]'
          }`} />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 pt-32 pb-24">
          <p className={`text-sm font-medium tracking-widest uppercase mb-6 animate-fade-in ${
            isDark ? 'text-stone-500' : 'text-stone-400'
          }`}>
            AI-Powered Screenwriting
          </p>
          
          <h1 className="text-[clamp(3rem,10vw,6rem)] font-bold leading-[0.95] tracking-tight mb-8 animate-slide-up">
            Write stories
            <br />
            <span className={isDark ? 'text-stone-600' : 'text-stone-400'}>with your voice</span>
          </h1>

          <p className={`text-xl leading-relaxed max-w-xl mx-auto mb-12 animate-slide-up stagger-2 ${
            isDark ? 'text-stone-400' : 'text-stone-500'
          }`} style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            The AI co-author that understands your universe. 
            Build characters, structure plots, and write scripts through natural conversation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <button 
              onClick={() => navigate('/signup')}
              className={`group h-14 w-full sm:w-auto px-8 rounded-full font-semibold flex items-center justify-center gap-3 transition-all shadow-lg hover-lift press-effect ${
                isDark 
                  ? 'bg-white text-stone-900 hover:bg-stone-100 shadow-white/5' 
                  : 'bg-stone-900 text-white hover:bg-stone-800 shadow-black/10'
              }`}
            >
              Start Writing
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className={`h-14 w-full sm:w-auto px-6 rounded-full border font-medium flex items-center justify-center gap-2 backdrop-blur-sm transition-all hover-scale press-effect ${
              isDark 
                ? 'border-stone-800 text-stone-400 hover:border-stone-700 hover:bg-stone-900/50' 
                : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-white/50'
            }`}>
              <Play size={16} fill="currentColor" />
              Watch Demo
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className={`w-6 h-10 rounded-full border-2 flex items-start justify-center p-2 ${
            isDark ? 'border-stone-700' : 'border-stone-300'
          }`}>
            <div className={`w-1 h-2 rounded-full animate-bounce ${
              isDark ? 'bg-stone-600' : 'bg-stone-400'
            }`} />
          </div>
        </div>
      </section>

      {/* Visual Showcase */}
      <section id="features" className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Sci-Fi Image */}
            <div className="relative group">
              <div className={`absolute -inset-4 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                isDark ? 'bg-gradient-to-r from-white/5 to-transparent' : 'bg-gradient-to-r from-stone-900/5 to-transparent'
              }`} />
              <div className={`relative overflow-hidden rounded-2xl shadow-2xl ${
                isDark ? 'shadow-white/5' : 'shadow-black/10'
              }`}>
                <img 
                  src="/images/scene-scifi.jpg" 
                  alt="Sci-Fi story visualization"
                  className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className={`absolute inset-0 ${
                  isDark ? 'bg-gradient-to-t from-[#0c0a09]/80 to-transparent' : 'bg-gradient-to-t from-stone-900/60 to-transparent'
                }`} />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Science Fiction</span>
                  <h3 className="text-xl font-bold text-white mt-1">Space Opera</h3>
                </div>
              </div>
            </div>

            {/* Drama Image */}
            <div className="relative group md:mt-16">
              <div className={`absolute -inset-4 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                isDark ? 'bg-gradient-to-l from-white/5 to-transparent' : 'bg-gradient-to-l from-stone-900/5 to-transparent'
              }`} />
              <div className={`relative overflow-hidden rounded-2xl shadow-2xl ${
                isDark ? 'shadow-white/5' : 'shadow-black/10'
              }`}>
                <img 
                  src="/images/scene-drama.jpg" 
                  alt="Drama story visualization"
                  className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className={`absolute inset-0 ${
                  isDark ? 'bg-gradient-to-t from-[#0c0a09]/80 to-transparent' : 'bg-gradient-to-t from-stone-900/60 to-transparent'
                }`} />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Period Drama</span>
                  <h3 className="text-xl font-bold text-white mt-1">Character Study</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Caption */}
          <p className={`text-center mt-12 max-w-2xl mx-auto ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
            Every story begins as a thought. StoryVerse helps you capture those fleeting ideas 
            and transform them into fully realized screenplays.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className={`py-32 px-6 relative overflow-hidden ${
        isDark ? 'bg-stone-900' : 'bg-stone-900'
      }`}>
        {/* Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="max-w-2xl mb-20">
            <p className="text-sm text-stone-400 font-medium tracking-widest uppercase mb-4">
              Features
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
              Everything you need to write great stories
            </h2>
            <p className="text-lg text-stone-400 leading-relaxed">
              A focused set of tools designed for screenwriters who want to spend less time formatting and more time creating.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Mic size={24} />,
                title: 'Voice-First',
                description: 'Speak naturally and watch your story come to life. Your AI understands context and nuance.'
              },
              {
                icon: <BookOpen size={24} />,
                title: 'Story Bible',
                description: 'Keep characters, locations, and lore organized. The AI remembers everything about your universe.'
              },
              {
                icon: <Layers size={24} />,
                title: 'Structure Tools',
                description: 'Beat sheets, outlines, and story maps. Professional screenplay structure made simple.'
              }
            ].map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors duration-300">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-5 group-hover:bg-white/20 transition-colors text-white">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-stone-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className={`text-sm font-medium tracking-widest uppercase mb-4 ${
              isDark ? 'text-stone-500' : 'text-stone-400'
            }`}>
              How it works
            </p>
            <h2 className={`text-4xl md:text-5xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}>
              From idea to script
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Build your world',
                description: 'Add characters, locations, and backstory to your Story Bible.'
              },
              {
                step: '02',
                title: 'Talk to your AI',
                description: '"Write a scene where Max confronts Sarah." The AI writes, you refine.'
              },
              {
                step: '03',
                title: 'Export & share',
                description: 'Download in Fountain, PDF, or Final Draft format. Production-ready.'
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                <span className={`text-8xl font-bold absolute -top-4 -left-2 ${
                  isDark ? 'text-stone-800' : 'text-stone-100'
                }`}>{item.step}</span>
                <div className="relative pt-12">
                  <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    {item.title}
                  </h3>
                  <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={`py-32 px-6 ${isDark ? 'bg-stone-900/50' : 'bg-stone-100'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className={`text-sm font-medium tracking-widest uppercase mb-4 ${
              isDark ? 'text-stone-500' : 'text-stone-400'
            }`}>
              Pricing
            </p>
            <h2 className={`text-4xl md:text-5xl font-bold tracking-tight mb-4 ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}>
              Simple, transparent
            </h2>
            <p className={`text-lg ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Start free. Upgrade when you need more.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            {/* Free */}
            <div className={`p-8 rounded-2xl border transition-shadow duration-300 flex flex-col ${
              isDark 
                ? 'bg-stone-900 border-stone-800 hover:shadow-xl hover:shadow-white/5' 
                : 'bg-white border-stone-200 hover:shadow-xl hover:shadow-black/5'
            }`}>
              <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-stone-900'}`}>Free</h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>For trying out StoryVerse</p>
              <div className="mb-8">
                <span className={`text-5xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>$0</span>
                <span className={isDark ? 'text-stone-500' : 'text-stone-500'}>/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['1 Project', '10 AI requests/day', 'Basic Story Bible', 'Script Editor', 'PDF Export', 'Community Support'].map((f, i) => (
                  <li key={i} className={`flex items-center gap-3 text-sm ${
                    isDark ? 'text-stone-300' : 'text-stone-600'
                  }`}>
                    <Check size={16} className={isDark ? 'text-white' : 'text-stone-900'} />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => navigate('/signup')}
                className={`w-full h-12 rounded-xl font-semibold text-sm transition-colors mt-auto ${
                  isDark 
                    ? 'border border-stone-700 text-white hover:bg-stone-800' 
                    : 'border border-stone-200 text-stone-900 hover:bg-stone-50'
                }`}
              >
                Get Started
              </button>
            </div>

            {/* Pro */}
            <div className={`p-8 rounded-2xl relative overflow-hidden transition-shadow duration-300 flex flex-col ${
              isDark 
                ? 'bg-white text-stone-900 hover:shadow-xl hover:shadow-white/20' 
                : 'bg-stone-900 text-white hover:shadow-xl hover:shadow-black/20'
            }`}>
              <div className="absolute top-6 right-6">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                  isDark ? 'bg-stone-900/10 text-stone-600' : 'bg-white/10 text-white'
                }`}>Popular</span>
              </div>
              <h3 className="text-xl font-bold mb-1">Pro</h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>For serious screenwriters</p>
              <div className="mb-8">
                <span className="text-5xl font-bold">$19</span>
                <span className={isDark ? 'text-stone-500' : 'text-stone-400'}>/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Unlimited Projects', 'Unlimited AI', 'Voice Agent', 'Beat Sheet & Outline', 'Table Read Audio', 'Priority Support'].map((f, i) => (
                  <li key={i} className={`flex items-center gap-3 text-sm ${
                    isDark ? 'text-stone-600' : 'text-stone-300'
                  }`}>
                    <Check size={16} className={isDark ? 'text-stone-900' : 'text-white'} />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => navigate('/signup')}
                className={`w-full h-12 rounded-xl font-semibold text-sm transition-colors mt-auto ${
                  isDark 
                    ? 'bg-stone-900 text-white hover:bg-stone-800' 
                    : 'bg-white text-stone-900 hover:bg-stone-100'
                }`}
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-6 overflow-hidden">
        {/* Background */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-10' : 'opacity-10'}`}>
          <img 
            src="/images/hero-banner.jpg" 
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className={`absolute inset-0 ${
          isDark 
            ? 'bg-gradient-to-b from-[#0c0a09] via-transparent to-[#0c0a09]' 
            : 'bg-gradient-to-b from-[#FAFAF9] via-transparent to-[#FAFAF9]'
        }`} />

        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className={`text-4xl md:text-5xl font-bold tracking-tight mb-6 ${
            isDark ? 'text-white' : 'text-stone-900'
          }`}>
            Ready to write your story?
          </h2>
          <p className={`text-xl mb-10 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            Join screenwriters who are creating amazing stories with AI.
          </p>
          <button 
            onClick={() => navigate('/signup')}
            className={`group h-14 px-10 rounded-full font-semibold flex items-center gap-3 mx-auto transition-all shadow-lg ${
              isDark 
                ? 'bg-white text-stone-900 hover:bg-stone-100 shadow-white/5' 
                : 'bg-stone-900 text-white hover:bg-stone-800 shadow-black/10'
            }`}
          >
            Start Writing Free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 px-6 border-t ${
        isDark ? 'border-stone-800' : 'border-stone-200'
      }`}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded flex items-center justify-center ${
              isDark ? 'bg-white' : 'bg-stone-900'
            }`}>
              <span className={`text-xs font-bold ${isDark ? 'text-stone-900' : 'text-white'}`}>S</span>
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-stone-900'}`}>StoryVerse</span>
          </div>
          <div className={`flex items-center gap-6 text-sm ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
            <Link to="/about" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>About</Link>
            <Link to="/contact" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Contact</Link>
            <Link to="/privacy" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Privacy</Link>
            <Link to="/terms" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Terms</Link>
          </div>
          <p className={`text-sm ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>© 2025 StoryVerse</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
