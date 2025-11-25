import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks';
import { ArrowLeft, Send, Loader2, CheckCircle, Mail, MessageSquare, HelpCircle, Moon, Sun } from 'lucide-react';

const Contact: React.FC = () => {
  const theme = useTheme();
  const isDark = theme === 'dark';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleTheme = () => {
    const current = localStorage.getItem('storyverse_settings');
    const settings = current ? JSON.parse(current) : {};
    const newTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('storyverse_settings', JSON.stringify({ ...settings, theme: newTheme }));
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Form submitted:', formData);
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const faqs = [
    {
      question: 'How do I get an API key?',
      answer: 'Visit Google AI Studio at aistudio.google.com/apikey to get a free Gemini API key. Enter it in Settings within the app.',
    },
    {
      question: 'Is my data stored securely?',
      answer: 'Your data is stored locally in your browser. We do not have access to your scripts or story content unless you explicitly share it.',
    },
    {
      question: 'Can I use StoryVerse offline?',
      answer: 'Basic editing works offline, but AI features require an internet connection to communicate with the Gemini API.',
    },
    {
      question: 'How do I export my script?',
      answer: 'Click the Export button in the Script Editor to download your screenplay in various formats including PDF and Fountain.',
    },
  ];

  if (isSubmitted) {
    return (
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDark ? 'bg-[#0c0a09]' : 'bg-[#FAFAF9]'
      }`}>
        <header className={`border-b shrink-0 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
          <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
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
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="text-center max-w-md">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'
            }`}>
              <CheckCircle size={32} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
            </div>
            <h1 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Message Sent!
            </h1>
            <p className={`mb-8 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Thank you for reaching out. We'll get back to you within 24-48 hours.
            </p>
            <Link
              to="/"
              className={`inline-flex h-12 px-6 rounded-xl font-semibold items-center gap-2 transition-all active:scale-[0.98] ${
                isDark 
                  ? 'bg-white text-stone-900 hover:bg-stone-100' 
                  : 'bg-stone-900 text-white hover:bg-stone-800'
              }`}
            >
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

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

      {/* Content */}
      <main className="flex-1 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className={`text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Contact Us
            </h1>
            <p className={isDark ? 'text-stone-400' : 'text-stone-500'}>
              Have a question? We'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Form */}
            <div className={`rounded-2xl border p-6 lg:p-8 h-fit ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}>
              <h2 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-stone-900'
              }`}>
                <MessageSquare size={20} />
                Send a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-stone-300' : 'text-stone-900'
                  }`}>Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
                    className={`w-full h-12 px-4 rounded-xl border outline-none transition-all ${
                      isDark
                        ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-500 focus:border-stone-600 focus:ring-2 focus:ring-white/5'
                        : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-stone-300' : 'text-stone-900'
                  }`}>Email</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))}
                    className={`w-full h-12 px-4 rounded-xl border outline-none transition-all ${
                      isDark
                        ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-500 focus:border-stone-600 focus:ring-2 focus:ring-white/5'
                        : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-stone-300' : 'text-stone-900'
                  }`}>Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData(d => ({ ...d, subject: e.target.value }))}
                    className={`w-full h-12 px-4 rounded-xl border outline-none transition-all ${
                      isDark
                        ? 'bg-stone-800 border-stone-700 text-white focus:border-stone-600 focus:ring-2 focus:ring-white/5'
                        : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5'
                    }`}
                  >
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="feedback">Feedback</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-stone-300' : 'text-stone-900'
                  }`}>Message</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={(e) => setFormData(d => ({ ...d, message: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border outline-none resize-none transition-all ${
                      isDark
                        ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-500 focus:border-stone-600 focus:ring-2 focus:ring-white/5'
                        : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98] ${
                    isDark 
                      ? 'bg-white text-stone-900 hover:bg-stone-100' 
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Message
                    </>
                  )}
                </button>
              </form>

              <div className={`mt-6 pt-6 border-t ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
                <p className={`text-sm flex items-center gap-2 flex-wrap ${
                  isDark ? 'text-stone-500' : 'text-stone-500'
                }`}>
                  <Mail size={16} className="shrink-0" />
                  <span>Or email us directly:</span>
                  <a href="mailto:support@storyverse.app" className={`font-medium hover:underline ${
                    isDark ? 'text-white' : 'text-stone-900'
                  }`}>
                    support@storyverse.app
                  </a>
                </p>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h2 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-stone-900'
              }`}>
                <HelpCircle size={20} />
                Frequently Asked Questions
              </h2>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className={`rounded-xl border p-5 ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}>
                    <h3 className={`text-sm font-semibold mb-2 ${
                      isDark ? 'text-white' : 'text-stone-900'
                    }`}>{faq.question}</h3>
                    <p className={`text-sm leading-relaxed ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>{faq.answer}</p>
                  </div>
                ))}
              </div>

              <div className={`mt-6 p-5 rounded-xl ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}>
                <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Can't find what you're looking for?{' '}
                  <Link to="/pricing" className={`font-medium hover:underline ${
                    isDark ? 'text-white' : 'text-stone-900'
                  }`}>
                    View pricing plans
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t shrink-0 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
        <div className={`max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm ${
          isDark ? 'text-stone-500' : 'text-stone-400'
        }`}>
          <span>© 2025 StoryVerse</span>
          <div className="flex gap-6">
            <Link to="/privacy" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Privacy</Link>
            <Link to="/terms" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Terms</Link>
            <Link to="/pricing" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
