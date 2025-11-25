import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { StoryProvider, useStory } from './context/StoryContext';
import { AuthProvider } from './context/AuthContext';
import { AgentProvider } from './context/AgentContext';

// Auth Pages
import { Login, Signup, ForgotPassword, ResetPassword, ProtectedRoute } from './components/auth';

// Legal Pages
import { PrivacyPolicy, TermsOfService, Impressum } from './components/legal';

// Error & Utility Components
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import NotFound from './components/NotFound';
import CookieConsent from './components/CookieConsent';
import NetworkStatus from './components/NetworkStatus';

// Core Pages (eager load)
import LandingPage from './components/LandingPage';
import Layout from './components/Layout';

// Lazy loaded pages for code splitting
const Contact = lazy(() => import('./components/Contact'));
const Settings = lazy(() => import('./components/Settings'));
const Pricing = lazy(() => import('./components/Pricing'));
const About = lazy(() => import('./components/About'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const ScriptEditor = lazy(() => import('./components/ScriptEditor'));
const ChatInterface = lazy(() => import('./components/ChatInterface'));
const AudioOverview = lazy(() => import('./components/AudioOverview'));
const StoryMap = lazy(() => import('./components/StoryMap'));
const BeatSheet = lazy(() => import('./components/BeatSheet'));
const Outline = lazy(() => import('./components/Outline'));
const Notes = lazy(() => import('./components/Notes'));
const MoodBoard = lazy(() => import('./components/MoodBoard'));
const MindMap = lazy(() => import('./components/MindMap'));
const VoiceAgent = lazy(() => import('./components/VoiceAgent'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#0c0a09]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-stone-300 dark:border-stone-700 border-t-stone-900 dark:border-t-white rounded-full animate-spin" />
      <span className="text-sm text-stone-500 dark:text-stone-400">Loading...</span>
    </div>
  </div>
);

// Wrapper components to bridge Context -> Props
const ChatPage = () => {
  const { sources } = useStory();
  return <ChatInterface sources={sources} />;
};

const AudioPage = () => {
  const { sources } = useStory();
  return <AudioOverview sources={sources} />;
};

// Protected App Routes with Agent
const AppRoutes = () => {
  return (
    <ProtectedRoute>
      <AgentProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<ScriptEditor />} />
              <Route path="beats" element={<BeatSheet />} />
              <Route path="outline" element={<Outline />} />
              <Route path="map" element={<StoryMap />} />
              <Route path="mindmap" element={<MindMap />} />
              <Route path="co-writer" element={<ChatPage />} />
              <Route path="table-read" element={<AudioPage />} />
              <Route path="notes" element={<Notes />} />
              <Route path="mood-board" element={<MoodBoard />} />
            </Route>
          </Routes>
          <VoiceAgent />
        </Suspense>
      </AgentProvider>
    </ProtectedRoute>
  );
};

// Main Router
const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Legal Pages */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        
        {/* Onboarding - Protected */}
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />
        
        {/* Settings - Protected */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        
        {/* App Routes - Protected */}
        <Route path="/app/*" element={<AppRoutes />} />
        
        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <StoryProvider>
            <Router>
              <AppRouter />
              <CookieConsent />
              <NetworkStatus />
            </Router>
          </StoryProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
