import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles, Building2, User, Zap } from 'lucide-react';
import Footer from './Footer';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

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
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="border-b border-stone-200 shrink-0 bg-stone-50/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm transition-colors group text-stone-500 hover:text-stone-900"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-stone-900">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            <span className="text-sm font-semibold text-stone-900">StoryVerse</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3 text-stone-900">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-stone-500">
              Choose the plan that fits your creative journey
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-100">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'yearly' 
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Yearly
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
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
                    ? 'border-stone-900 bg-white shadow-xl md:-mt-4 md:mb-4'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 bg-stone-900 text-white">
                    <Zap size={12} />
                    Most Popular
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-stone-100">
                    <plan.icon size={20} className="text-stone-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-1 text-stone-900">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-stone-500">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6 pb-6 border-b border-stone-200">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-stone-900">
                      ${plan.price[billingCycle]}
                    </span>
                    {plan.price[billingCycle] > 0 && (
                      <span className="text-stone-500">/month</span>
                    )}
                  </div>
                  {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                    <p className="text-xs mt-1 text-stone-400">
                      Billed ${plan.price.yearly * 12}/year
                    </p>
                  )}
                  {plan.price[billingCycle] === 0 && (
                    <p className="text-xs mt-1 text-stone-400">
                      Free forever
                    </p>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleCta(plan.id)}
                  className={`w-full h-12 rounded-xl font-semibold mb-6 transition-all ${
                    plan.popular
                      ? 'bg-stone-900 text-white hover:bg-stone-800'
                      : 'border border-stone-200 text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Features */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-4 text-stone-400">
                    What's included
                  </p>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={12} className="text-emerald-600" />
                      </div>
                      <span className="text-sm text-stone-600">
                        {feature}
                      </span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-start gap-3 opacity-50">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <span className="text-stone-400">—</span>
                      </div>
                      <span className="text-sm text-stone-500">
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
            <p className="text-stone-500">
              Have questions?{' '}
              <Link to="/contact" className="font-medium hover:underline text-stone-900">
                Contact our team
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
