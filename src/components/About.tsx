import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks';
import { ArrowLeft, ArrowRight, Sparkles, Heart, Users, Zap, Moon, Sun } from 'lucide-react';

const About: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const current = localStorage.getItem('storyverse_settings');
    const settings = current ? JSON.parse(current) : {};
    const newTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('storyverse_settings', JSON.stringify({ ...settings, theme: newTheme }));
    window.location.reload();
  };

  const values = [
    {
      icon: Sparkles,
      title: 'AI-Augmented Creativity',
      description: 'We believe AI should enhance human creativity, not replace it. StoryVerse is designed to be your creative partner, helping you explore ideas and overcome writer\'s block.'
    },
    {
      icon: Heart,
      title: 'Passion for Storytelling',
      description: 'Every feature we build stems from a deep love for storytelling. We understand the craft because we\'re writers ourselves.'
    },
    {
      icon: Users,
      title: 'Writer-First Design',
      description: 'Our interface is designed around how writers actually work. Less friction, more flow. Every pixel serves your creative process.'
    },
    {
      icon: Zap,
      title: 'Speed & Focus',
      description: 'Writing should feel effortless. We obsess over performance so you can focus on what matters: telling great stories.'
    },
  ];

  const team = [
    { name: 'Alex Chen', role: 'Founder & CEO', description: 'Former screenwriter turned technologist. Believes every story deserves the best tools.' },
    { name: 'Sarah Miller', role: 'Head of Product', description: 'UX designer with 10+ years crafting creative tools. Obsessed with simplicity.' },
    { name: 'James Wright', role: 'Lead Engineer', description: 'AI researcher passionate about human-AI collaboration in creative fields.' },
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-[#0c0a09]' : 'bg-[#FAFAF9]'
    }`}>
      {/* Header */}
      <header className={`border-b shrink-0 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
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

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className={`text-4xl md:text-5xl font-bold tracking-tight mb-6 ${
            isDark ? 'text-white' : 'text-stone-900'
          }`}>
            Building the future of screenwriting
          </h1>
          <p className={`text-xl leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            StoryVerse was born from a simple belief: the best stories come from the intersection 
            of human imagination and intelligent tools. We're here to make that intersection seamless.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className={`rounded-2xl p-8 md:p-12 ${isDark ? 'bg-stone-900' : 'bg-stone-100'}`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Our Story
            </h2>
            <div className={`space-y-4 text-lg leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
              <p>
                It started in 2023, in a small apartment filled with coffee cups and unfinished screenplays. 
                Our founder, a frustrated screenwriter, found himself spending more time managing documents 
                and researching story structure than actually writing.
              </p>
              <p>
                The tools available felt disconnected—one for writing, another for research, yet another 
                for planning. None of them understood what a screenwriter actually needs.
              </p>
              <p>
                So we built StoryVerse. A single, focused environment where AI doesn't replace your creativity 
                but amplifies it. Where your characters, locations, and lore live alongside your script. 
                Where you can speak your ideas and watch them come to life.
              </p>
              <p className={isDark ? 'text-white' : 'text-stone-900'}>
                <strong>Today, thousands of screenwriters trust StoryVerse to bring their stories to life.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-2xl font-bold mb-12 text-center ${isDark ? 'text-white' : 'text-stone-900'}`}>
            What We Believe
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, i) => (
              <div key={i} className={`p-6 rounded-2xl border ${
                isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
              }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  isDark ? 'bg-stone-800' : 'bg-stone-100'
                }`}>
                  <value.icon size={24} className={isDark ? 'text-white' : 'text-stone-900'} />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  {value.title}
                </h3>
                <p className={isDark ? 'text-stone-400' : 'text-stone-500'}>
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className={`py-16 px-6 ${isDark ? 'bg-stone-900' : 'bg-stone-100'}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-2xl font-bold mb-12 text-center ${isDark ? 'text-white' : 'text-stone-900'}`}>
            The Team
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <div key={i} className={`p-6 rounded-2xl text-center ${
                isDark ? 'bg-stone-800' : 'bg-white'
              }`}>
                <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold ${
                  isDark ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-600'
                }`}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  {member.name}
                </h3>
                <p className={`text-sm font-medium mb-3 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  {member.role}
                </p>
                <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
            Ready to start your story?
          </h2>
          <p className={`text-lg mb-8 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            Join thousands of screenwriters who are creating amazing stories with AI.
          </p>
          <button 
            onClick={() => navigate('/signup')}
            className={`group h-14 px-8 rounded-full font-semibold inline-flex items-center gap-3 transition-all active:scale-[0.98] ${
              isDark 
                ? 'bg-white text-stone-900 hover:bg-stone-100' 
                : 'bg-stone-900 text-white hover:bg-stone-800'
            }`}
          >
            Get Started Free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t shrink-0 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
        <div className={`max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm ${
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

export default About;

