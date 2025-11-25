import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks';
import { ArrowLeft, Check, Sparkles, Building2, User, Zap, Moon, Sun } from 'lucide-react';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme === 'dark';
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const toggleTheme = () => {
    const current = localStorage.getItem('storyverse_settings');
    const settings = current ? JSON.parse(current) : {};
    const newTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('storyverse_settings', JSON.stringify({ ...settings, theme: newTheme }));
    window.location.reload();
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      icon: User,
      price: { monthly: 0, yearly: 0 },
      features: [
        '1 Project',
        'Basic script editor',
        'Story structure tools',
        'Export to PDF',
        'Community support',
      ],
      limitations: [
        'Limited AI features (10/day)',
        'No voice agent',
        'Basic source management',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For serious screenwriters',
      icon: Sparkles,
      price: { monthly: 19, yearly: 15 },
      features: [
        'Unlimited Projects',
        'Advanced script editor',
        'Full AI co-writer access',
        'Voice agent (AI Agent)',
        'Unlimited AI features',
        'Character interviews',
        'Table reads with voices',
        'Priority support',
        'Export to all formats',
      ],
      limitations: [],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      id: 'team',
      name: 'Team',
      description: 'For writers rooms',
      icon: Building2,
      price: { monthly: 49, yearly: 39 },
      features: [
        'Everything in Pro',
        'Up to 10 team members',
        'Real-time collaboration',
        'Shared story worlds',
        'Version history',
        'Admin dashboard',
        'Dedicated support',
        'Custom integrations',
      ],
      limitations: [],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const handleCta = (planId: string) => {
    if (planId === 'team') {
      navigate('/contact');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-[#0c0a09]' : 'bg-[#FAFAF9]'
    }`}>
      {/* Header */}
      <header className={`border-b shrink-0 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
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
      <main className="flex-1 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className={`text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Simple, transparent pricing
            </h1>
            <p className={`text-lg ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Choose the plan that fits your creative journey
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className={`inline-flex items-center gap-1 p-1 rounded-xl ${
              isDark ? 'bg-stone-800' : 'bg-stone-100'
            }`}>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  billingCycle === 'monthly' 
                    ? isDark 
                      ? 'bg-stone-700 text-white shadow-sm' 
                      : 'bg-white text-stone-900 shadow-sm'
                    : isDark
                      ? 'text-stone-400 hover:text-white'
                      : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'yearly' 
                    ? isDark 
                      ? 'bg-stone-700 text-white shadow-sm' 
                      : 'bg-white text-stone-900 shadow-sm'
                    : isDark
                      ? 'text-stone-400 hover:text-white'
                      : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Yearly
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold dark:bg-emerald-500/20 dark:text-emerald-400">
                  -20%
                </span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-4 lg:gap-6 items-start">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 lg:p-8 transition-all ${
                  plan.popular 
                    ? isDark
                      ? 'border-white bg-stone-900 shadow-xl md:-mt-4 md:mb-4'
                      : 'border-stone-900 bg-white shadow-xl md:-mt-4 md:mb-4'
                    : isDark
                      ? 'border-stone-800 bg-stone-900 hover:border-stone-700 hover:shadow-lg hover:shadow-white/5'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                    isDark ? 'bg-white text-stone-900' : 'bg-stone-900 text-white'
                  }`}>
                    <Zap size={12} />
                    Most Popular
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                    isDark ? 'bg-stone-800' : 'bg-stone-100'
                  }`}>
                    <plan.icon size={20} className={isDark ? 'text-stone-300' : 'text-stone-600'} />
                  </div>
                  <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className={`mb-6 pb-6 border-b ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                      ${plan.price[billingCycle]}
                    </span>
                    {plan.price[billingCycle] > 0 && (
                      <span className={isDark ? 'text-stone-500' : 'text-stone-500'}>/month</span>
                    )}
                  </div>
                  {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                    <p className={`text-xs mt-1 ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
                      Billed ${plan.price.yearly * 12}/year
                    </p>
                  )}
                  {plan.price[billingCycle] === 0 && (
                    <p className={`text-xs mt-1 ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
                      Free forever
                    </p>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleCta(plan.id)}
                  className={`w-full h-12 rounded-xl font-semibold mb-6 transition-all ${
                    plan.popular
                      ? isDark
                        ? 'bg-white text-stone-900 hover:bg-stone-100'
                        : 'bg-stone-900 text-white hover:bg-stone-800'
                      : isDark
                        ? 'border border-stone-700 text-white hover:bg-stone-800'
                        : 'border border-stone-200 text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Features */}
                <div className="space-y-3">
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-4 ${
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  }`}>
                    What's included
                  </p>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className={`text-sm ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-start gap-3 opacity-50">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <span className={isDark ? 'text-stone-600' : 'text-stone-400'}>—</span>
                      </div>
                      <span className={`text-sm ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                        {limitation}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Link */}
          <div className="text-center mt-16">
            <p className={isDark ? 'text-stone-500' : 'text-stone-500'}>
              Have questions?{' '}
              <Link to="/contact" className={`font-medium hover:underline ${
                isDark ? 'text-white' : 'text-stone-900'
              }`}>
                Contact our team
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t shrink-0 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
        <div className={`max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm ${
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

export default Pricing;
