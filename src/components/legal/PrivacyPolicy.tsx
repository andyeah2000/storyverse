import React from 'react';
import LegalLayout, { LegalSection } from './LegalLayout';

const sections: LegalSection[] = [
  {
    id: 'intro',
    title: '1. Introduction',
    content: (
      <p>
        StoryVerse (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use,
        disclose, and safeguard your information when you use our screenwriting application and website.
      </p>
    ),
  },
  {
    id: 'information',
    title: '2. Information We Collect',
    content: (
      <>
        <h3>2.1 Personal Information</h3>
        <ul>
          <li>Name and email address when you create an account</li>
          <li>Payment information when you subscribe to paid plans</li>
          <li>Profile information you choose to provide</li>
        </ul>
        <h3>2.2 Usage Data</h3>
        <ul>
          <li>Projects, scripts, and story content you create</li>
          <li>Feature usage and interaction data</li>
          <li>Device information and browser type</li>
        </ul>
        <h3>2.3 AI Interaction Data</h3>
        <p>
          When you use our AI features, your prompts and generated content are processed by Google's Gemini API. We do not store your voice recordings
          permanently. AI-generated content is associated with your account for functionality purposes.
        </p>
      </>
    ),
  },
  {
    id: 'usage',
    title: '3. How We Use Your Information',
    content: (
      <ul>
        <li>To provide and maintain our service</li>
        <li>To process your transactions and manage subscriptions</li>
        <li>To send you service-related communications</li>
        <li>To improve our application and develop new features</li>
        <li>To detect and prevent fraud or abuse</li>
        <li>To comply with legal obligations</li>
      </ul>
    ),
  },
  {
    id: 'storage',
    title: '4. Data Storage and Security',
    content: (
      <p>
        Your data is stored locally in your browser using localStorage. We implement industry-standard security measures to protect your information. However,
        no method of transmission over the Internet is 100% secure.
      </p>
    ),
  },
  {
    id: 'third-parties',
    title: '5. Third-Party Services',
    content: (
      <>
        <p>We use the following third-party services:</p>
        <ul>
          <li>
            <strong>Google Gemini API</strong> – For AI-powered features including voice interaction and content generation
          </li>
          <li>
            <strong>Stripe</strong> – For payment processing (if applicable)
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'rights',
    title: '6. Your Rights (GDPR)',
    content: (
      <>
        <p>If you are in the European Economic Area, you have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to processing of your data</li>
          <li>Data portability</li>
          <li>Withdraw consent at any time</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cookies',
    title: '7. Cookies',
    content: (
      <p>
        We use essential cookies to maintain your session and preferences. We do not use tracking cookies for advertising purposes. You can manage cookies
        through your browser settings.
      </p>
    ),
  },
  {
    id: 'children',
    title: "8. Children's Privacy",
    content: (
      <p>Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.</p>
    ),
  },
  {
    id: 'changes',
    title: '9. Changes to This Policy',
    content: (
      <p>
        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the
        &quot;Last updated&quot; date.
      </p>
    ),
  },
  {
    id: 'contact',
    title: '10. Contact Us',
    content: (
      <>
        <p>If you have questions about this Privacy Policy, please contact us at:</p>
        <p>
          <strong>privacy@storyverse.app</strong>
        </p>
      </>
    ),
  },
];

const PrivacyPolicy: React.FC = () => {
  return (
    <LegalLayout
      title="Privacy Policy"
      sections={sections}
      updatedAt={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      backLabel="Back to Home"
    />
  );
};

export default PrivacyPolicy;
