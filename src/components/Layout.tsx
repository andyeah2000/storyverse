import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Headphones, 
  PenTool, 
  Map, 
  GitBranch,
  Sparkles, 
  Layers, 
  StickyNote, 
  Image as ImageIcon,
  Settings,
  Check,
  Cloud,
  CloudOff,
  AlertTriangle,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Users,
  Globe,
  Loader2,
  Bell
} from 'lucide-react';
import FileExplorer from './FileExplorer';
import SettingsModal from './SettingsModal';
import ShareProjectModal from './ShareProjectModal';
// VoiceAgentHeader removed from here
import { useStory } from '../context/StoryContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { getUsageCount } from '../lib/supabase';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    saveStatus, 
    setSettingsOpen,
    incomingInvites,
    acceptInvite,
    declineInvite,
    projects,
  } = useStory();
  const { user, logout, isSupabaseMode, subscription, startCheckout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);
  const [bannerCheckoutLoading, setBannerCheckoutLoading] = useState(false);
  const [aiUsage, setAiUsage] = useState(0);

  const handleAcceptInvite = async (shareId: string) => {
    setProcessingInviteId(shareId);
    const result = await acceptInvite(shareId);
    if (!result.success && result.error) {
      console.error(result.error);
    }
    setProcessingInviteId(null);
  };

  const handleDeclineInvite = async (shareId: string) => {
    setProcessingInviteId(shareId);
    const result = await declineInvite(shareId);
    if (!result.success && result.error) {
      console.error(result.error);
    }
    setProcessingInviteId(null);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    let mounted = true;
    const loadUsage = async () => {
      if (!isSupabaseMode) {
        setAiUsage(0);
        return;
      }
      const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const usage = await getUsageCount('ai_request', windowStart);
      if (mounted) {
        setAiUsage(usage);
      }
    };
    loadUsage();
    return () => { mounted = false; };
  }, [isSupabaseMode, subscription.plan]);

  const freeProjectLimit = 3;
  const aiLimit = subscription.plan === 'free' ? 30 : Infinity;
  const showProjectLimitBanner = subscription.plan === 'free' && projects.length >= freeProjectLimit;
  const showAiLimitBanner = subscription.plan === 'free' && aiUsage >= aiLimit;

  const handleOpenBilling = () => {
    setSettingsOpen(true);
  };

  const handleBannerUpgrade = async () => {
    setBannerCheckoutLoading(true);
    const result = await startCheckout();
    setBannerCheckoutLoading(false);
    if (result.success && result.url) {
      window.location.href = result.url;
    } else if (result.error) {
      alert(result.error);
    }
  };

  const navItems = [
    { to: '/app', icon: <PenTool size={18} strokeWidth={1.75} />, label: 'Editor', end: true },
    { to: '/app/characters', icon: <Users size={18} strokeWidth={1.75} />, label: 'Characters' },
    { to: '/app/wiki', icon: <Globe size={18} strokeWidth={1.75} />, label: 'Wiki' },
    { to: '/app/beats', icon: <Sparkles size={18} strokeWidth={1.75} />, label: 'Beat Sheet' },
    { to: '/app/outline', icon: <Layers size={18} strokeWidth={1.75} />, label: 'Outline' },
    { to: '/app/map', icon: <Map size={18} strokeWidth={1.75} />, label: 'Story Map' },
    { to: '/app/mindmap', icon: <GitBranch size={18} strokeWidth={1.75} />, label: 'Mind Map' },
    { to: '/app/co-writer', icon: <MessageSquare size={18} strokeWidth={1.75} />, label: 'Co-Writer' },
    { to: '/app/table-read', icon: <Headphones size={18} strokeWidth={1.75} />, label: 'Table Read' },
    { to: '/app/notes', icon: <StickyNote size={18} strokeWidth={1.75} />, label: 'Notes' },
    { to: '/app/mood-board', icon: <ImageIcon size={18} strokeWidth={1.75} />, label: 'Mood Board' },
  ];

  const mobileNavItems = [
    { to: '/app', icon: <PenTool size={18} strokeWidth={1.75} />, label: 'Write', end: true },
    { to: '/app/beats', icon: <Sparkles size={18} strokeWidth={1.75} />, label: 'Beats' },
    { to: '/app/co-writer', icon: <MessageSquare size={18} strokeWidth={1.75} />, label: 'Chat' },
    { to: '/app/notes', icon: <StickyNote size={18} strokeWidth={1.75} />, label: 'Notes' },
  ];

  return (
    <div className="flex h-screen w-screen font-sans overflow-hidden bg-stone-100 text-stone-900">
      {/* Sidebar - File Explorer (always visible on desktop, hidden on mobile unless drawer) */}
      <div className="hidden lg:block shrink-0">
        <FileExplorer />
      </div>

      {/* Mobile File Explorer Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 pointer-events-none">
          {/* Logic handled by mobile menu mostly, but if we wanted a separate drawer: */}
          {/* For now, file explorer is accessed via mobile menu or just hidden on mobile main view */}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Header */}
        <header className="h-12 px-4 flex items-center justify-between shrink-0 border-b z-10 bg-white/80 border-stone-200/60 backdrop-blur-xl min-w-0">
          {/* Left: Logo + Project */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 lg:hidden transition-colors shrink-0"
            >
              {mobileMenuOpen ? (
                <X size={18} strokeWidth={1.75} className="text-stone-500" />
              ) : (
                <Menu size={18} strokeWidth={1.75} className="text-stone-500" />
              )}
            </button>

            {/* No toggle button on desktop anymore, File Explorer is fixed */}
            
            {/* AI Agent in Header - Removed as it's now in FileExplorer */}
            
            {/* Share button moved to Settings */}
            
            {/* Save Status */}
            <div className="flex items-center gap-1.5 ml-2 shrink-0">
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <Check size={12} />
                </span>
              )}
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-xs text-stone-400">
                  <Cloud size={12} className="animate-pulse" />
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1 text-xs text-red-500">
                  <CloudOff size={12} />
                </span>
              )}
              {saveStatus === 'conflict' && (
                <span className="flex items-center gap-1 text-xs text-amber-500" title="Conflict detected. Please reload the page.">
                  <AlertTriangle size={12} />
                </span>
              )}
            </div>
          </div>
          
          {/* Center: Navigation - Hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-1 px-1 rounded-xl mx-2 flex-1 justify-center min-w-0 h-full overflow-x-auto no-scrollbar">
            <NavButton to="/app" icon={<PenTool size={16} strokeWidth={2} />} label="Editor" end />
            <div className="w-px h-4 bg-stone-200 mx-1 opacity-50 shrink-0" />
            <NavButton to="/app/beats" icon={<Sparkles size={16} strokeWidth={2} />} label="Beats" />
            <NavButton to="/app/outline" icon={<Layers size={16} strokeWidth={2} />} label="Outline" />
            <div className="w-px h-4 bg-stone-200 mx-1 opacity-50 shrink-0" />
            <NavButton to="/app/characters" icon={<Users size={16} strokeWidth={2} />} label="Characters" />
            <NavButton to="/app/map" icon={<Map size={16} strokeWidth={2} />} label="Story Map" />
            <NavButton to="/app/mindmap" icon={<GitBranch size={16} strokeWidth={2} />} label="Mind Map" />
            <div className="w-px h-4 bg-stone-200 mx-1 opacity-50 shrink-0" />
            <NavButton to="/app/wiki" icon={<Globe size={16} strokeWidth={2} />} label="Wiki" />
            <NavButton to="/app/notes" icon={<StickyNote size={16} strokeWidth={2} />} label="Notes" />
            <NavButton to="/app/mood-board" icon={<ImageIcon size={16} strokeWidth={2} />} label="Mood Board" />
            <div className="w-px h-4 bg-stone-200 mx-1 opacity-50 shrink-0" />
            <NavButton to="/app/co-writer" icon={<MessageSquare size={16} strokeWidth={2} />} label="Co-Writer" />
            <NavButton to="/app/table-read" icon={<Headphones size={16} strokeWidth={2} />} label="Table Read" />
          </nav>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Undo/Redo - Removed from here */}

            <div className="w-px h-5 bg-stone-200 mx-1" />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="h-8 px-2 rounded-lg flex items-center gap-2 hover:bg-stone-100 transition-colors"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-stone-200 text-stone-600">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <ChevronDown size={12} className="text-stone-500" />
              </button>

              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserMenuOpen(false)} 
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg z-50 overflow-hidden border bg-white border-stone-200">
                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="text-sm font-medium truncate text-stone-900">
                        {user?.name}
                      </p>
                      <p className="text-xs text-stone-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          setSettingsOpen(true);
                        }}
                        className="w-full px-4 py-2 text-sm text-left flex items-center gap-3 text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        <Settings size={14} />
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full px-4 py-2 text-sm text-left flex items-center gap-3 text-red-500 hover:bg-stone-50 transition-colors"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {(showProjectLimitBanner || showAiLimitBanner) && (
          <div className="px-4 py-2 border-b flex flex-col gap-2 text-xs bg-amber-50 border-amber-200 text-amber-700">
            {showProjectLimitBanner && (
              <div className="flex flex-wrap items-center gap-2">
                <AlertTriangle size={14} />
                <span>
                  Du nutzt bereits {projects.length}/{freeProjectLimit} Projekten im Free-Plan.
                </span>
                <button
                  onClick={handleBannerUpgrade}
                  disabled={bannerCheckoutLoading}
                  className="px-3 h-7 rounded-lg bg-stone-900 text-white text-[11px] font-semibold hover:bg-stone-800 transition disabled:opacity-40"
                >
                  {bannerCheckoutLoading ? 'Öffne Stripe…' : 'Upgrade'}
                </button>
                <button
                  onClick={handleOpenBilling}
                  className="px-3 h-7 rounded-lg border border-current/30 text-[11px] font-semibold"
                >
                  Billing öffnen
                </button>
              </div>
            )}
            {showAiLimitBanner && (
              <div className="flex flex-wrap items-center gap-2">
                <AlertTriangle size={14} />
                <span>
                  AI-Limit erreicht ({aiUsage}/{aiLimit}). Lade Credits auf oder upgrade.
                </span>
                <button
                  onClick={handleOpenBilling}
                  className="px-3 h-7 rounded-lg border border-current/30 text-[11px] font-semibold"
                >
                  Billing öffnen
                </button>
              </div>
            )}
          </div>
        )}

        {incomingInvites.length > 0 && (
          <div className="px-4 py-3 border-b space-y-2 bg-amber-50 border-amber-200 text-amber-700">
            <p className="text-xs font-semibold tracking-wide uppercase flex items-center gap-2">
              <Bell size={14} />
              Collaboration invites
            </p>
            {incomingInvites.map(invite => (
              <div
                key={invite.id}
                className="flex flex-col gap-2 rounded-xl px-3 py-2 border bg-white border-stone-200"
              >
                <div>
                  <p className="text-sm font-semibold">{invite.project_name}</p>
                  <p className="text-xs opacity-70">
                    {invite.permission === 'edit' ? 'Can edit' : 'View only'} access
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAcceptInvite(invite.id)}
                    disabled={processingInviteId === invite.id}
                    className={cn(
                      'inline-flex items-center gap-1 px-3 h-8 rounded-lg text-xs font-semibold transition-colors bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
                      processingInviteId === invite.id && 'cursor-not-allowed opacity-75'
                    )}
                  >
                    {processingInviteId === invite.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      'Accept'
                    )}
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(invite.id)}
                    disabled={processingInviteId === invite.id}
                    className={cn(
                      'inline-flex items-center gap-1 px-3 h-8 rounded-lg text-xs font-semibold transition-colors bg-white border border-stone-200 text-stone-600 hover:bg-stone-100',
                      processingInviteId === invite.id && 'cursor-not-allowed opacity-75'
                    )}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Workspace */}
        <main className="flex-1 overflow-hidden relative pb-24 lg:pb-0 bg-stone-100">
          <div className="h-full w-full max-w-[1920px] mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
            <Outlet />
          </div>
        </main>

        <MobileNavDock 
          items={mobileNavItems}
          hidden={mobileMenuOpen}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal />
      <ShareProjectModal />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-72 z-50 lg:hidden animate-in slide-in-from-left duration-300 bg-white">
            {/* Mobile Menu Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-stone-900 text-white">
                  <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
                    <path d="M8 10L14 7L20 10V18L14 21L8 18V10Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="14" cy="14" r="2" fill="currentColor"/>
                  </svg>
                </div>
                <span className="font-semibold text-stone-900">
                  StoryVerse
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100"
              >
                <X size={18} className="text-stone-500" />
              </button>
            </div>

            {/* Mobile Navigation Items */}
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive 
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  )}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Mobile Menu Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-200">
              {/* Settings */}
              <button
                onClick={() => {
                  setSettingsOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-stone-600 hover:bg-stone-100"
              >
                <Settings size={18} />
                Settings
              </button>

              {/* User Info */}
              <div className="mt-4 pt-4 border-t border-stone-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-stone-200 text-stone-600">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-stone-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-stone-500 truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface NavButtonProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ to, icon, label, end }) => {
  return (
    <NavLink 
      to={to}
      end={end}
      className={({ isActive }) => cn(
        "px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all duration-200 whitespace-nowrap shrink-0 h-8",
        isActive 
          ? 'bg-stone-900 text-white shadow-sm'
          : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
      )}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </NavLink>
  );
};

interface MobileNavDockProps {
  items: { to: string; icon: React.ReactNode; label: string; end?: boolean }[];
  hidden: boolean;
}

const MobileNavDock: React.FC<MobileNavDockProps> = ({ items, hidden }) => {
  return (
    <div
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 border-t px-2 pb-[env(safe-area-inset-bottom)] pt-2 z-30 transition-transform duration-300 backdrop-blur-lg bg-white/95 border-stone-200",
        hidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      )}
    >
      <nav className="grid grid-cols-4 gap-2">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-2xl text-[11px] font-medium transition-colors",
              isActive
                ? 'bg-stone-900 text-white'
                : 'text-stone-500 hover:bg-stone-100'
            )}
          >
            <span className="h-5 flex items-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;