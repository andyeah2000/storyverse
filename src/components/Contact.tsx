import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, CheckCircle, Mail, MessageSquare, HelpCircle } from 'lucide-react';
import Footer from './Footer';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
        <header className="border-b border-stone-200 shrink-0 bg-stone-50/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm transition-colors group text-stone-500 hover:text-stone-900"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to Home
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-emerald-100">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold mb-3 text-stone-900">
              Message Sent!
            </h1>
            <p className="mb-8 text-stone-500">
              Thank you for reaching out. We'll get back to you within 24-48 hours.
            </p>
            <Link
              to="/"
              className="inline-flex h-12 px-6 rounded-xl font-semibold items-center gap-2 transition-all active:scale-[0.98] bg-stone-900 text-white hover:bg-stone-800"
            >
              Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
      <main className="flex-1 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-3 text-stone-900">
              Contact Us
            </h1>
            <p className="text-stone-500">
              Have a question? We'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Form */}
            <div className="rounded-2xl border border-stone-200 p-6 lg:p-8 h-fit bg-white">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-stone-900">
                <MessageSquare size={20} />
                Send a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-stone-900">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border outline-none transition-all bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-stone-900">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border outline-none transition-all bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-stone-900">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData(d => ({ ...d, subject: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border outline-none transition-all bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="feedback">Feedback</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-stone-900">Message</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={(e) => setFormData(d => ({ ...d, message: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border outline-none resize-none transition-all bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98] bg-stone-900 text-white hover:bg-stone-800"
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

              <div className="mt-6 pt-6 border-t border-stone-200">
                <p className="text-sm flex items-center gap-2 flex-wrap text-stone-500">
                  <Mail size={16} className="shrink-0" />
                  <span>Or email us directly:</span>
                  <a href="mailto:support@storyverse.app" className="font-medium hover:underline text-stone-900">
                    support@storyverse.app
                  </a>
                </p>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-stone-900">
                <HelpCircle size={20} />
                Frequently Asked Questions
              </h2>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="rounded-xl border border-stone-200 p-5 bg-white">
                    <h3 className="text-sm font-semibold mb-2 text-stone-900">{faq.question}</h3>
                    <p className="text-sm leading-relaxed text-stone-500">{faq.answer}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-5 rounded-xl bg-stone-100">
                <p className="text-sm text-stone-500">
                  Can't find what you're looking for?{' '}
                  <Link to="/pricing" className="font-medium hover:underline text-stone-900">
                    View pricing plans
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
