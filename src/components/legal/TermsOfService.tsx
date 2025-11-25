import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks';
import { ArrowLeft, Moon, Sun } from 'lucide-react';

const TermsOfService: React.FC = () => {
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
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>
            Terms of Service
          </h1>
          <p className={`text-sm mb-10 ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="space-y-10">
            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                1. Acceptance of Terms
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                By accessing or using StoryVerse ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                2. Description of Service
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                StoryVerse is an AI-powered screenwriting application that provides tools for story development, script writing, and creative collaboration with artificial intelligence.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                3. User Accounts
              </h2>
              <ul className={`list-disc list-inside space-y-2 ml-1 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                <li>You must provide accurate and complete registration information</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You must be at least 13 years old to use this Service</li>
                <li>One person may not maintain more than one account</li>
                <li>You are responsible for all activity that occurs under your account</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                4. User Content
              </h2>
              
              <h3 className={`text-lg font-medium mb-3 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                4.1 Ownership
              </h3>
              <p className={`leading-relaxed mb-5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                You retain all rights to the content you create using StoryVerse, including scripts, characters, and story materials. We do not claim ownership of your creative work.
              </p>
              
              <h3 className={`text-lg font-medium mb-3 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                4.2 License to Us
              </h3>
              <p className={`leading-relaxed mb-5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                By using the Service, you grant us a limited license to process your content solely for the purpose of providing the Service to you.
              </p>

              <h3 className={`text-lg font-medium mb-3 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                4.3 AI-Generated Content
              </h3>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Content generated by our AI features is provided for your use. You may use AI-generated content in your projects, subject to applicable laws and third-party rights.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                5. Acceptable Use
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>You agree not to:</p>
              <ul className={`list-disc list-inside space-y-2 ml-1 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                <li>Use the Service for any illegal purpose</li>
                <li>Generate content that is harmful, abusive, or violates others' rights</li>
                <li>Attempt to bypass any security measures</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Resell or redistribute the Service without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                6. Subscription and Payment
              </h2>
              
              <h3 className={`text-lg font-medium mb-3 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                6.1 Free Tier
              </h3>
              <p className={`leading-relaxed mb-5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                The free tier includes limited features and usage quotas as described on our pricing page.
              </p>
              
              <h3 className={`text-lg font-medium mb-3 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                6.2 Paid Plans
              </h3>
              <p className={`leading-relaxed mb-5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Paid subscriptions are billed monthly or annually. Prices are subject to change with 30 days notice. Refunds are provided in accordance with our refund policy.
              </p>

              <h3 className={`text-lg font-medium mb-3 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                6.3 Cancellation
              </h3>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                You may cancel your subscription at any time. Access continues until the end of your billing period.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                7. Intellectual Property
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                The Service, including its design, features, and content (excluding user-generated content), is owned by StoryVerse and protected by intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                8. Disclaimer of Warranties
              </h2>
              <p className={`leading-relaxed uppercase text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                9. Limitation of Liability
              </h2>
              <p className={`leading-relaxed uppercase text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, STORYVERSE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                10. Termination
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                We may terminate or suspend your account at any time for violation of these terms. Upon termination, your right to use the Service will immediately cease.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                11. Changes to Terms
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                We reserve the right to modify these terms at any time. We will provide notice of significant changes. Continued use of the Service constitutes acceptance of modified terms.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                12. Governing Law
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                These Terms shall be governed by the laws of the Federal Republic of Germany, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                13. Contact
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                For questions about these Terms, please contact us at:
              </p>
              <p className={`font-medium mt-3 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                legal@storyverse.app
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
            <Link to="/impressum" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Impressum</Link>
            <Link to="/contact" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
