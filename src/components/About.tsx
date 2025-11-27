import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Heart, Zap, Code } from 'lucide-react';
import Footer from './Footer';

const About: React.FC = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: Sparkles,
      title: 'AI-Augmented Creativity',
      description: 'I believe AI should enhance human creativity, not replace it. StoryVerse is designed to be your creative partner, helping you explore ideas and overcome writer\'s block.'
    },
    {
      icon: Heart,
      title: 'Passion for Storytelling',
      description: 'Every feature stems from a deep love for storytelling. I understand the craft because I write scripts myself.'
    },
    {
      icon: Code,
      title: 'Built with Care',
      description: 'As a solo developer, I can obsess over every detail. No corporate bureaucracy, just pure focus on making the best tool for writers.'
    },
    {
      icon: Zap,
      title: 'Speed & Focus',
      description: 'Writing should feel effortless. I obsess over performance so you can focus on what matters: telling great stories.'
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="border-b border-stone-200 shrink-0 bg-stone-50/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-stone-900">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            <span className="text-sm font-semibold text-stone-900">StoryVerse</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 text-stone-900">
            One developer.<br/>
            <span className="text-stone-400">Infinite stories.</span>
          </h1>
          <p className="text-xl leading-relaxed text-stone-500">
            StoryVerse is a passion project born from a simple belief: the best stories come from the intersection 
            of human imagination and intelligent tools.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl p-8 md:p-12 bg-white border border-stone-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-6 text-stone-900">
              The Story
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-stone-600">
              <p>
                Hi, I'm Andreas. It started in 2023, in a small apartment filled with coffee cups and unfinished screenplays. 
                As a frustrated screenwriter and developer, I found myself spending more time managing documents 
                and researching story structure than actually writing.
              </p>
              <p>
                The tools available felt disconnected—one for writing, another for research, yet another 
                for planning. None of them understood what a screenwriter actually needs. And none of them truly leveraged the power of AI to help, rather than hinder.
              </p>
              <p>
                So I built StoryVerse. A single, focused environment where AI doesn't replace your creativity 
                but amplifies it. Where your characters, locations, and lore live alongside your script. 
                Where you can speak your ideas and watch them come to life.
              </p>
              <p className="text-stone-900 font-medium pt-2">
                This is a solo project, built with love, coffee, and a lot of late nights. I hope it helps you tell your story.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-12 text-center text-stone-900">
            Philosophy
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, i) => (
              <div key={i} className="p-6 rounded-2xl border bg-white border-stone-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-stone-100 text-stone-900">
                  <value.icon size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-stone-900">
                  {value.title}
                </h3>
                <p className="text-stone-500">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-stone-900">
            Ready to start your story?
          </h2>
          <p className="text-lg mb-8 text-stone-500">
            Join me and other screenwriters who are creating amazing stories with AI.
          </p>
          <button 
            onClick={() => navigate('/signup')}
            className="group h-14 px-8 rounded-full font-semibold inline-flex items-center gap-3 transition-all active:scale-[0.98] bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"
          >
            Get Started Free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
