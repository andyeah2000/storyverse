import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks';
import { ArrowLeft, Moon, Sun } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
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
            Privacy Policy
          </h1>
          <p className={`text-sm mb-10 ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="space-y-10">
            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                1. Introduction
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                StoryVerse ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our screenwriting application and website.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                2. Information We Collect
              </h2>
              
              <h3 className={`text-lg font-medium mb-3 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                2.1 Personal Information
              </h3>
              <ul className={`list-disc list-inside mb-5 space-y-2 ml-1 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                <li>Name and email address when you create an account</li>
                <li>Payment information when you subscribe to paid plans</li>
                <li>Profile information you choose to provide</li>
              </ul>
              
              <h3 className={`text-lg font-medium mb-3 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                2.2 Usage Data
              </h3>
              <ul className={`list-disc list-inside mb-5 space-y-2 ml-1 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                <li>Projects, scripts, and story content you create</li>
                <li>Feature usage and interaction data</li>
                <li>Device information and browser type</li>
              </ul>

              <h3 className={`text-lg font-medium mb-3 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                2.3 AI Interaction Data
              </h3>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                When you use our AI features, your prompts and generated content are processed by Google's Gemini API. We do not store your voice recordings permanently. AI-generated content is associated with your account for functionality purposes.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                3. How We Use Your Information
              </h2>
              <ul className={`list-disc list-inside space-y-2 ml-1 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                <li>To provide and maintain our service</li>
                <li>To process your transactions and manage subscriptions</li>
                <li>To send you service-related communications</li>
                <li>To improve our application and develop new features</li>
                <li>To detect and prevent fraud or abuse</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                4. Data Storage and Security
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Your data is stored locally in your browser using localStorage. We implement industry-standard security measures to protect your information. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                5. Third-Party Services
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                We use the following third-party services:
              </p>
              <ul className={`list-disc list-inside space-y-2 ml-1 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                <li><strong className={isDark ? 'text-white' : 'text-stone-900'}>Google Gemini API</strong> – For AI-powered features including voice interaction and content generation</li>
                <li><strong className={isDark ? 'text-white' : 'text-stone-900'}>Stripe</strong> – For payment processing (if applicable)</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                6. Your Rights (GDPR)
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                If you are in the European Economic Area, you have the right to:
              </p>
              <ul className={`list-disc list-inside space-y-2 ml-1 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                7. Cookies
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                We use essential cookies to maintain your session and preferences. We do not use tracking cookies for advertising purposes. You can manage cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                8. Children's Privacy
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                9. Changes to This Policy
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                10. Contact Us
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <p className={`font-medium mt-3 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                privacy@storyverse.app
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
            <Link to="/terms" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Terms</Link>
            <Link to="/impressum" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Impressum</Link>
            <Link to="/contact" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
