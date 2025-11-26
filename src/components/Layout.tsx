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
  Moon,
  Sun,
  Undo2,
  Redo2,
  Check,
  Cloud,
  CloudOff,
  AlertTriangle,
  FolderOpen,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Users,
  Globe,
  Share2,
  Loader2,
  Bell
} from 'lucide-react';
import FileExplorer from './FileExplorer';
import SettingsModal from './SettingsModal';
import ShareProjectModal from './ShareProjectModal';
import { useStory } from '../context/StoryContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    theme, 
    saveStatus, 
    canUndo, 
    canRedo, 
    undo, 
    redo, 
    setSettingsOpen,
    currentProject,
    settings,
    updateSettings,
    sidebarOpen,
    setSidebarOpen,
    openShareModal,
    currentProjectPermission,
    incomingInvites,
    acceptInvite,
    declineInvite
  } = useStory();
  const { user, logout, isSupabaseMode } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

  const accessLabel = currentProjectPermission === 'owner'
    ? 'Owner'
    : currentProjectPermission === 'edit'
      ? 'Editor'
      : 'Viewer';

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

  return (
    <div className={cn(
      "flex h-screen w-screen font-sans overflow-hidden transition-colors duration-300",
      theme === 'dark' 
        ? 'bg-stone-950 text-stone-100' 
        : 'bg-stone-100 text-stone-900'
    )}>
      {/* Sidebar - File Explorer (hidden on mobile by default) */}
      <div className={cn(
        "hidden lg:block",
        sidebarOpen ? '' : 'lg:hidden'
      )}>
        {sidebarOpen && <FileExplorer />}
      </div>

      {/* Mobile File Explorer Drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 animate-in slide-in-from-left duration-300">
            <FileExplorer />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Header */}
        <header className={cn(
          "h-12 px-4 flex items-center justify-between shrink-0 border-b z-10 transition-colors",
          theme === 'dark'
            ? 'bg-stone-900/80 border-stone-800 backdrop-blur-xl'
            : 'bg-white/80 border-stone-200/60 backdrop-blur-xl'
        )}>
          {/* Left: Logo + Project */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors lg:hidden",
                theme === 'dark' ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
              )}
            >
              {mobileMenuOpen ? (
                <X size={18} strokeWidth={1.75} className="text-stone-500" />
              ) : (
                <Menu size={18} strokeWidth={1.75} className="text-stone-500" />
              )}
            </button>

            {/* Desktop File Explorer Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                "w-8 h-8 rounded-lg items-center justify-center transition-colors hidden lg:flex",
                theme === 'dark' ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
              )}
            >
              <FolderOpen size={16} strokeWidth={1.75} className="text-stone-500" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                theme === 'dark' ? 'bg-white text-stone-900' : 'bg-stone-900 text-white'
              )}>
                <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
                  <path d="M8 10L14 7L20 10V18L14 21L8 18V10Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="14" cy="14" r="2" fill="currentColor"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  "text-sm font-semibold tracking-tight leading-tight",
                  theme === 'dark' ? 'text-white' : 'text-stone-900'
                )}>
                  {currentProject?.name || 'StoryVerse'}
                </span>
                {currentProject && (
                  <span className={cn(
                    'text-[11px] uppercase tracking-wide font-medium mt-0.5 w-fit px-2 py-0.5 rounded-full',
                    theme === 'dark' ? 'bg-stone-800 text-stone-300' : 'bg-stone-200 text-stone-600'
                  )}>
                    {accessLabel}
                  </span>
                )}
              </div>
            </div>

            {currentProject && isSupabaseMode && (
              <button
                onClick={openShareModal}
                disabled={currentProjectPermission === 'view'}
                className={cn(
                  'ml-2 h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border',
                  currentProjectPermission === 'view'
                    ? 'cursor-not-allowed opacity-60'
                    : theme === 'dark'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                )}
              >
                <Share2 size={14} strokeWidth={1.75} />
                Share
              </button>
            )}

            {/* Save Status */}
            <div className="flex items-center gap-1.5 ml-2">
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
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
          <nav className={cn(
            "hidden lg:flex items-center gap-0.5 p-1 rounded-xl",
            theme === 'dark' ? 'bg-stone-800/50' : 'bg-stone-100/80'
          )}>
            <NavButton to="/app" icon={<PenTool size={14} strokeWidth={1.75} />} label="Editor" theme={theme} end />
            <NavButton to="/app/characters" icon={<Users size={14} strokeWidth={1.75} />} label="Chars" theme={theme} />
            <NavButton to="/app/wiki" icon={<Globe size={14} strokeWidth={1.75} />} label="Wiki" theme={theme} />
            <NavButton to="/app/beats" icon={<Sparkles size={14} strokeWidth={1.75} />} label="Beats" theme={theme} />
            <NavButton to="/app/outline" icon={<Layers size={14} strokeWidth={1.75} />} label="Outline" theme={theme} />
            <NavButton to="/app/map" icon={<Map size={14} strokeWidth={1.75} />} label="Map" theme={theme} />
            <NavButton to="/app/mindmap" icon={<GitBranch size={14} strokeWidth={1.75} />} label="Mind" theme={theme} />
            <NavButton to="/app/co-writer" icon={<MessageSquare size={14} strokeWidth={1.75} />} label="Chat" theme={theme} />
            <NavButton to="/app/table-read" icon={<Headphones size={14} strokeWidth={1.75} />} label="Audio" theme={theme} />
            <NavButton to="/app/notes" icon={<StickyNote size={14} strokeWidth={1.75} />} label="Notes" theme={theme} />
            <NavButton to="/app/mood-board" icon={<ImageIcon size={14} strokeWidth={1.75} />} label="Mood" theme={theme} />
          </nav>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Undo/Redo */}
            <button
              onClick={undo}
              disabled={!canUndo}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30",
                theme === 'dark' ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
              )}
              title="Undo (⌘Z)"
            >
              <Undo2 size={15} strokeWidth={1.75} className="text-stone-500" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30",
                theme === 'dark' ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
              )}
              title="Redo (⌘⇧Z)"
            >
              <Redo2 size={15} strokeWidth={1.75} className="text-stone-500" />
            </button>

            <div className="w-px h-5 bg-stone-200 dark:bg-stone-700 mx-1" />

            {/* Theme Toggle */}
            <button
              onClick={() => updateSettings({ 
                theme: settings.theme === 'light' ? 'dark' : 
                       settings.theme === 'dark' ? 'system' : 'light'
              })}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                theme === 'dark' ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
              )}
              title={`Theme: ${settings.theme}`}
            >
              {theme === 'dark' ? (
                <Moon size={15} strokeWidth={1.75} className="text-stone-400" />
              ) : (
                <Sun size={15} strokeWidth={1.75} className="text-stone-500" />
              )}
            </button>


            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={cn(
                  "h-8 px-2 rounded-lg flex items-center gap-2 transition-colors",
                  theme === 'dark' ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                  theme === 'dark' ? 'bg-stone-700 text-stone-300' : 'bg-stone-200 text-stone-600'
                )}>
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
                  <div className={cn(
                    "absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg z-50 overflow-hidden border",
                    theme === 'dark' 
                      ? 'bg-stone-900 border-stone-800' 
                      : 'bg-white border-stone-200'
                  )}>
                    <div className={cn(
                      "px-4 py-3 border-b",
                      theme === 'dark' ? 'border-stone-800' : 'border-stone-100'
                    )}>
                      <p className={cn(
                        "text-sm font-medium truncate",
                        theme === 'dark' ? 'text-white' : 'text-stone-900'
                      )}>
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
                        className={cn(
                          "w-full px-4 py-2 text-sm text-left flex items-center gap-3 transition-colors",
                          theme === 'dark' 
                            ? 'text-stone-300 hover:bg-stone-800' 
                            : 'text-stone-700 hover:bg-stone-50'
                        )}
                      >
                        <Settings size={14} />
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-sm text-left flex items-center gap-3 text-red-500 transition-colors",
                          theme === 'dark' ? 'hover:bg-stone-800' : 'hover:bg-stone-50'
                        )}
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

        {incomingInvites.length > 0 && (
          <div
            className={cn(
              'px-4 py-3 border-b space-y-2',
              theme === 'dark'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-100'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            )}
          >
            <p className="text-xs font-semibold tracking-wide uppercase flex items-center gap-2">
              <Bell size={14} />
              Collaboration invites
            </p>
            {incomingInvites.map(invite => (
              <div
                key={invite.id}
                className={cn(
                  'flex flex-col gap-2 rounded-xl px-3 py-2 border',
                  theme === 'dark' ? 'bg-stone-900/60 border-stone-800' : 'bg-white border-stone-200'
                )}
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
                      'inline-flex items-center gap-1 px-3 h-8 rounded-lg text-xs font-semibold transition-colors',
                      theme === 'dark' ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
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
                      'inline-flex items-center gap-1 px-3 h-8 rounded-lg text-xs font-semibold transition-colors',
                      theme === 'dark' ? 'bg-stone-900 text-stone-300 border border-stone-800 hover:bg-stone-800' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100',
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
        <main className={cn(
          "flex-1 overflow-hidden relative transition-colors",
          theme === 'dark' ? 'bg-stone-950' : 'bg-stone-100'
        )}>
          <div className="h-full w-full max-w-[1920px] mx-auto p-4">
            <Outlet />
          </div>
        </main>
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
          <div className={cn(
            "fixed left-0 top-0 bottom-0 w-72 z-50 lg:hidden animate-in slide-in-from-left duration-300",
            theme === 'dark' ? 'bg-stone-900' : 'bg-white'
          )}>
            {/* Mobile Menu Header */}
            <div className={cn(
              "h-14 px-4 flex items-center justify-between border-b",
              theme === 'dark' ? 'border-stone-800' : 'border-stone-200'
            )}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  theme === 'dark' ? 'bg-white text-stone-900' : 'bg-stone-900 text-white'
                )}>
                  <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
                    <path d="M8 10L14 7L20 10V18L14 21L8 18V10Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="14" cy="14" r="2" fill="currentColor"/>
                  </svg>
                </div>
                <span className={cn(
                  "font-semibold",
                  theme === 'dark' ? 'text-white' : 'text-stone-900'
                )}>
                  StoryVerse
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  theme === 'dark' ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
                )}
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
                      ? theme === 'dark'
                        ? 'bg-white text-stone-900'
                        : 'bg-stone-900 text-white'
                      : theme === 'dark'
                        ? 'text-stone-300 hover:bg-stone-800'
                        : 'text-stone-600 hover:bg-stone-100'
                  )}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Mobile Menu Footer */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 p-4 border-t",
              theme === 'dark' ? 'border-stone-800' : 'border-stone-200'
            )}>
              {/* File Explorer Toggle */}
              <button
                onClick={() => {
                  setSidebarOpen(!sidebarOpen);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors mb-2",
                  theme === 'dark' 
                    ? 'text-stone-300 hover:bg-stone-800'
                    : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                <FolderOpen size={18} />
                {sidebarOpen ? 'Hide Story Bible' : 'Show Story Bible'}
              </button>

              {/* Settings */}
              <button
                onClick={() => {
                  setSettingsOpen(true);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  theme === 'dark' 
                    ? 'text-stone-300 hover:bg-stone-800'
                    : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                <Settings size={18} />
                Settings
              </button>

              {/* User Info */}
              <div className={cn(
                "mt-4 pt-4 border-t flex items-center gap-3",
                theme === 'dark' ? 'border-stone-800' : 'border-stone-200'
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                  theme === 'dark' ? 'bg-stone-700 text-stone-300' : 'bg-stone-200 text-stone-600'
                )}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    theme === 'dark' ? 'text-white' : 'text-stone-900'
                  )}>
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
  theme: 'light' | 'dark';
  end?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ to, icon, label, theme, end }) => {
  return (
    <NavLink 
      to={to}
      end={end}
      className={({ isActive }) => cn(
        "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all duration-200",
        isActive 
          ? theme === 'dark'
            ? 'bg-stone-700 text-white shadow-sm'
            : 'bg-white text-stone-900 shadow-subtle'
          : theme === 'dark'
            ? 'text-stone-400 hover:text-white hover:bg-stone-700/50'
            : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
      )}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </NavLink>
  );
};

export default Layout;
