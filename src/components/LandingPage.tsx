import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight,
  Mic, 
  BookOpen, 
  Layers,
  Play,
  Check,
  Menu,
  X,
  Sparkles,
  Wand2,
  FileText
} from 'lucide-react';
import Footer from './Footer';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
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
    <div className="min-h-screen selection:bg-amber-100 selection:text-amber-900 overflow-x-hidden bg-stone-50 text-stone-900 font-sans">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-stone-50/90 backdrop-blur-xl border-b border-stone-200/50 shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-900 shadow-lg shadow-stone-900/20">
              <span className="text-lg font-bold text-white">S</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-stone-900">
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
                    className="text-sm font-medium transition-colors text-stone-500 hover:text-stone-900"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm font-medium transition-colors text-stone-500 hover:text-stone-900"
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button 
                onClick={() => navigate('/login')}
                className="h-10 px-5 rounded-full text-sm font-semibold transition-colors text-stone-600 hover:text-stone-900"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/app')}
                className="h-10 px-6 rounded-full text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-stone-800 hover:shadow-lg hover:shadow-stone-900/20 active:scale-95"
              >
                Get Started
              </button>
            </div>

            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden w-11 h-11 rounded-full flex items-center justify-center transition-colors hover:bg-stone-200/80"
              aria-label="Open menu"
            >
              <Menu size={22} className="text-stone-900" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Nav Sheet */}
      {mobileNavOpen && (
        <>
          <div 
            className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-50 md:hidden animate-in slide-in-from-right duration-300 bg-white shadow-2xl p-6 flex flex-col">
            <div className="h-16 flex items-center justify-between mb-6">
              <span className="text-lg font-bold text-stone-900">Menu</span>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-stone-100"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <div className="space-y-2">
                {navLinks.map(link => (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="block px-4 py-4 rounded-2xl text-lg font-medium transition-colors text-stone-600 hover:bg-stone-100"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="mt-auto space-y-3 pt-6 border-t border-stone-100">
                <button 
                  onClick={() => {
                    navigate('/login');
                    setMobileNavOpen(false);
                  }}
                  className="w-full h-14 rounded-2xl text-base font-semibold transition-all bg-stone-100 text-stone-900 hover:bg-stone-200"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => {
                    navigate('/app');
                    setMobileNavOpen(false);
                  }}
                  className="w-full h-14 rounded-2xl text-base font-semibold transition-all bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"
                >
                  Get Started Free
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-amber-100/40 blur-[120px] rounded-full opacity-60 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[800px] h-[600px] bg-stone-200/30 blur-[100px] rounded-full opacity-40 pointer-events-none" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center px-4 sm:px-6 pb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-stone-200 shadow-sm mb-8 animate-fade-in">
            <Sparkles size={14} className="text-amber-500" fill="currentColor" />
            <span className="text-xs font-bold tracking-wide uppercase text-stone-600">
              The Future of Screenwriting is Here
            </span>
          </div>
          
          <h1 className="text-[clamp(3rem,8vw,5.5rem)] font-bold leading-[0.95] tracking-tight mb-8 animate-slide-up text-stone-900">
            Write screenplays
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800">
              at the speed of thought
            </span>
          </h1>

          <p className="text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto mb-12 animate-slide-up stagger-2 text-stone-600 font-medium" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            StoryVerse combines professional formatting with an intelligent AI co-writer that knows your world, characters, and style.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <button 
              onClick={() => navigate('/app')}
              className="group h-14 w-full sm:w-auto px-8 rounded-full font-bold flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 bg-stone-900 text-white hover:bg-stone-800 shadow-stone-900/20"
            >
              Start Writing for Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="h-14 w-full sm:w-auto px-8 rounded-full border-2 font-bold flex items-center justify-center gap-2 backdrop-blur-sm transition-all hover:bg-white/80 border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900">
              <Play size={16} fill="currentColor" />
              Watch Demo
            </button>
          </div>

          {/* Social Proof / Trust */}
          <div className="mt-16 pt-8 border-t border-stone-200/60 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p className="text-sm font-medium text-stone-400 mb-4 uppercase tracking-wider">Trusted by writers from</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
               {/* Placeholders for logos - using text for now to keep it clean */}
               <span className="text-lg font-serif font-bold text-stone-800">Sundance</span>
               <span className="text-lg font-serif font-bold text-stone-800">Tisch</span>
               <span className="text-lg font-serif font-bold text-stone-800">USC Arts</span>
               <span className="text-lg font-serif font-bold text-stone-800">NFTS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Showcase */}
      <section id="features" className="py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Editor Preview */}
            <div className="relative group order-2 md:order-1">
              <div className="absolute -inset-10 bg-gradient-to-r from-amber-100/50 to-stone-100/50 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-100 bg-stone-50 aspect-[4/3] flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-700">
                <img 
                  src="/images/scene-scifi.jpg" 
                  alt="Editor Interface"
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
                {/* UI Overlay Mockup */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                    <span className="text-xs font-medium opacity-80 uppercase tracking-widest">Live AI Co-Writer</span>
                  </div>
                  <p className="text-2xl font-medium font-serif leading-relaxed">
                    "INT. SPACESHIP - NIGHT"
                  </p>
                  <p className="text-lg opacity-80 font-serif mt-2">
                    The alarm BLARES. Commander HALE (40s) stumbles out of her cryo-pod...
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Text */}
            <div className="order-1 md:order-2 pl-0 md:pl-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider mb-6">
                <Wand2 size={14} />
                AI Magic
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-stone-900">
                Never face a blank page again.
              </h2>
              <p className="text-xl text-stone-600 leading-relaxed mb-8">
                Stuck on a scene? Need dialogue options? Just ask. StoryVerse understands screenplay structure and formatting, so you can focus on the story.
              </p>
              
              <ul className="space-y-4">
                {[
                  'Context-aware suggestions based on your story bible',
                  'Automatic industry-standard formatting',
                  'Real-time character consistency checks'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-stone-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={14} className="text-amber-700" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 relative overflow-hidden bg-stone-900 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} 
        />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-sm text-amber-500 font-bold tracking-widest uppercase mb-4">
              Everything You Need
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              A complete studio in your browser
            </h2>
            <p className="text-xl text-stone-400 leading-relaxed">
              StoryVerse isn't just an editor. It's a living database for your story world.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Mic size={28} />,
                title: 'Voice-First Writing',
                description: 'Dictate dialogue, brainstorm beats, or command the AI with your voice. Perfect for capturing flow states.'
              },
              {
                icon: <BookOpen size={28} />,
                title: 'Integrated Story Bible',
                description: 'Keep track of characters, locations, and lore. The AI references this constantly to ensure consistency.'
              },
              {
                icon: <Layers size={28} />,
                title: 'Structure Tools',
                description: 'Visualize your narrative arc with built-in beat sheets, outlines, and story maps.'
              },
              {
                icon: <Sparkles size={28} />,
                title: 'Smart Rewrite',
                description: 'Highlight any block of text and ask the AI to make it funnier, darker, or more concise.'
              },
              {
                icon: <FileText size={28} />,
                title: 'Industry Export',
                description: 'One-click export to PDF, Final Draft (.fdx), and Fountain. Ready for production.'
              },
              {
                icon: <Play size={28} />,
                title: 'Table Read',
                description: 'Listen to your script performed by distinct AI voices for each character to catch rhythm issues.'
              }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-stone-800 flex items-center justify-center mb-6 group-hover:bg-amber-500 group-hover:text-stone-900 transition-colors text-amber-500">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-stone-400 leading-relaxed text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 px-6 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-900 mb-6">
              From idea to script in three steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-16 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-stone-200 -z-10" />

            {[
              {
                step: '01',
                title: 'Build your world',
                description: 'Start by defining your characters and settings in the Story Bible. This grounds the AI in your unique universe.'
              },
              {
                step: '02',
                title: 'Collaborate & Write',
                description: 'Write naturally. Use "Ask AI" to bridge gaps, generate dialogue alternatives, or brainstorm plot twists.'
              },
              {
                step: '03',
                title: 'Refine & Export',
                description: 'Polish your draft with advanced formatting tools, then export to industry-standard formats ready for sharing.'
              }
            ].map((item, i) => (
              <div key={i} className="relative bg-stone-50 pt-4">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-stone-100 shadow-lg flex items-center justify-center mb-8 mx-auto text-2xl font-bold text-stone-900 z-10">
                  {item.step}
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-4 text-stone-900">
                    {item.title}
                  </h3>
                  <p className="leading-relaxed text-stone-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-32 px-6 bg-white border-t border-stone-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wider mb-4">
              Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-stone-900">
              Start for free, upgrade for power
            </h2>
            <p className="text-lg text-stone-500 max-w-xl mx-auto">
              We believe accessible tools create better stories. That's why our core features are free forever.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Free */}
            <div className="p-8 rounded-3xl border border-stone-200 hover:border-stone-300 transition-all bg-white shadow-sm hover:shadow-md">
              <h3 className="text-2xl font-bold mb-2 text-stone-900">Free</h3>
              <p className="text-stone-500 mb-8">Perfect for your first screenplay</p>
              <div className="mb-8">
                <span className="text-5xl font-bold text-stone-900">$0</span>
                <span className="text-stone-500 text-xl">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['1 Active Project', 'Standard AI Speed', 'Basic Story Bible', 'PDF Export', 'Community Support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-stone-600">
                    <Check size={18} className="text-stone-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => navigate('/app')}
                className="w-full h-12 rounded-xl font-bold text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-3xl border-2 border-stone-900 bg-stone-900 text-white shadow-2xl relative transform md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-stone-900 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-stone-400 mb-8">For serious writers & creators</p>
              <div className="mb-8">
                <span className="text-5xl font-bold">$19</span>
                <span className="text-stone-400 text-xl">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Unlimited Projects', 'Advanced AI Models', 'Full Story Bible', 'All Export Formats', 'Voice Dictation', 'Priority Support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-stone-300">
                    <Check size={18} className="text-amber-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => navigate('/app')}
                className="w-full h-12 rounded-xl font-bold text-stone-900 bg-white hover:bg-amber-50 transition-colors"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-6 overflow-hidden bg-stone-50">
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 text-stone-900">
            Your story belongs<br />to the world.
          </h2>
          <p className="text-xl md:text-2xl mb-12 text-stone-500 max-w-2xl mx-auto">
            Don't let formatting or writer's block stand in your way. Start writing today.
          </p>
          <button 
            onClick={() => navigate('/app')}
            className="group h-16 px-12 rounded-full font-bold text-lg flex items-center gap-3 mx-auto transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 bg-stone-900 text-white hover:bg-stone-800"
          >
            Start Writing Free
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
