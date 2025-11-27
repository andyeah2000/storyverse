import React, { useEffect, useState } from 'react';
import { useStory } from '../context/StoryContext';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Share2,
  Sun, 
  Key, 
  Keyboard, 
  Eye, 
  EyeOff,
  Download,
  Upload,
  Trash2,
  Copy,
  FolderOpen,
  CreditCard,
  BarChart3,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getUsageCount } from '../lib/supabase';

type SettingsTab = 'general' | 'appearance' | 'shortcuts' | 'projects' | 'export' | 'billing';

const SettingsModal: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    settingsOpen, 
    setSettingsOpen,
    projects,
    currentProject,
    selectProject,
    createProject,
    deleteProject,
    duplicateProject,
    exportProject,
    importProject,
    openShareModal
  } = useStory();
  const { subscription, startCheckout, openBillingPortal, startCreditTopUp } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showApiKey, setShowApiKey] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [billingError, setBillingError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);
  const [monthlyAiUsage, setMonthlyAiUsage] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadUsage = async () => {
      const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const count = await getUsageCount('ai_request', windowStart);
      if (isMounted) {
        setMonthlyAiUsage(count);
      }
    };
    loadUsage();
    return () => {
      isMounted = false;
    };
  }, [subscription.plan]);

  if (!settingsOpen) return null;

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const data = event.target?.result as string;
          importProject(data);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const planLimits = {
    free: { projects: 3, ai: 30 },
    pro: { projects: Infinity, ai: Infinity },
  };

  const handleUpgrade = async () => {
    setBillingError(null);
    setCheckoutLoading(true);
    const result = await startCheckout();
    setCheckoutLoading(false);
    if (result.success && result.url) {
      window.location.href = result.url;
    } else {
      setBillingError(result.error || 'Unable to start checkout.');
    }
  };

  const handlePortal = async () => {
    setBillingError(null);
    setPortalLoading(true);
    const result = await openBillingPortal();
    setPortalLoading(false);
    if (result.success && result.url) {
      window.location.href = result.url;
    } else {
      setBillingError(result.error || 'Unable to open billing portal.');
    }
  };

  const handleCreditTopUp = async () => {
    setBillingError(null);
    setCreditLoading(true);
    const result = await startCreditTopUp();
    setCreditLoading(false);
    if (result.success && result.url) {
      window.location.href = result.url;
    } else {
      setBillingError(result.error || 'Unable to start credit purchase.');
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Key size={16} strokeWidth={1.75} /> },
    { id: 'appearance', label: 'Appearance', icon: <Sun size={16} strokeWidth={1.75} /> },
    { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={16} strokeWidth={1.75} /> },
    { id: 'projects', label: 'Projects', icon: <FolderOpen size={16} strokeWidth={1.75} /> },
    { id: 'export', label: 'Export', icon: <Download size={16} strokeWidth={1.75} /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={16} strokeWidth={1.75} /> },
  ];

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-floating flex flex-col overflow-hidden h-[90vh] sm:h-[80vh] lg:h-[640px] max-h-[95vh] animate-in zoom-in-95 fade-in duration-200">
        
        {/* Header */}
        <div className="h-14 px-6 flex justify-between items-center border-b border-stone-100 shrink-0">
          <h3 className="text-base font-semibold text-stone-900">Settings</h3>
          <button 
            onClick={() => setSettingsOpen(false)} 
            className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 gap-6">
          {/* Sidebar */}
          <div className="w-48 border-r border-stone-100 p-3 space-y-1 shrink-0 overflow-y-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2.5 transition-all",
                  activeTab === tab.id
                    ? 'bg-stone-100 text-stone-900'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div 
            className="flex-1 p-6 pr-5 pb-8 overflow-y-auto"
            style={{ scrollbarGutter: 'stable both-edges' }}
          >
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-stone-900 mb-1">API Key</h4>
                  <p className="text-xs text-stone-500 mb-3">
                    Enter your Gemini API key to enable AI features
                  </p>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.apiKey || ''}
                      onChange={(e) => updateSettings({ apiKey: e.target.value })}
                      placeholder="AIza..."
                      className="w-full h-11 pl-4 pr-12 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 outline-none font-mono text-sm transition-all placeholder:text-stone-400"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-900 mb-1">Auto-Save</h4>
                  <p className="text-xs text-stone-500 mb-3">
                    Automatically save your work
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div 
                      onClick={() => updateSettings({ autoSave: !settings.autoSave })}
                      className={cn(
                        "w-10 h-6 rounded-full transition-colors relative",
                        settings.autoSave ? 'bg-stone-900' : 'bg-stone-200'
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white absolute top-1 transition-all",
                        settings.autoSave ? 'left-5' : 'left-1'
                      )} />
                    </div>
                    <span className="text-sm text-stone-600">
                      {settings.autoSave ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-900 mb-1">Word & Page Count</h4>
                  <p className="text-xs text-stone-500 mb-3">
                    Show statistics in the editor
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showWordCount}
                        onChange={(e) => updateSettings({ showWordCount: e.target.checked })}
                        className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900/10"
                      />
                      <span className="text-sm text-stone-600">Show word count</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showPageCount}
                        onChange={(e) => updateSettings({ showPageCount: e.target.checked })}
                        className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900/10"
                      />
                      <span className="text-sm text-stone-600">Show page estimate</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-stone-900 mb-1">Font Size</h4>
                  <p className="text-xs text-stone-500 mb-3">
                    Adjust the editor font size
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'small', label: 'Small', preview: 'Aa' },
                      { id: 'medium', label: 'Medium', preview: 'Aa' },
                      { id: 'large', label: 'Large', preview: 'Aa' },
                    ].map(size => (
                      <button
                        key={size.id}
                        onClick={() => updateSettings({ fontSize: size.id as 'small' | 'medium' | 'large' })}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                          settings.fontSize === size.id
                            ? 'border-stone-900 bg-stone-50'
                            : 'border-stone-200 hover:border-stone-300'
                        )}
                      >
                        <span className={cn(
                          "font-mono text-stone-900",
                          size.id === 'small' && 'text-sm',
                          size.id === 'medium' && 'text-base',
                          size.id === 'large' && 'text-lg'
                        )}>
                          {size.preview}
                        </span>
                        <span className="text-xs font-medium text-stone-600">{size.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-900 mb-1">Font Family</h4>
                  <p className="text-xs text-stone-500 mb-3">
                    Choose your editor font
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'system', label: 'System', font: 'font-sans' },
                      { id: 'serif', label: 'Serif', font: 'font-serif' },
                      { id: 'mono', label: 'Mono', font: 'font-mono' },
                    ].map(font => (
                      <button
                        key={font.id}
                        onClick={() => updateSettings({ fontFamily: font.id as 'system' | 'serif' | 'mono' })}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                          settings.fontFamily === font.id
                            ? 'border-stone-900 bg-stone-50'
                            : 'border-stone-200 hover:border-stone-300'
                        )}
                      >
                        <span className={cn("text-stone-900", font.font)}>Abc</span>
                        <span className="text-xs font-medium text-stone-600">{font.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <p className="text-xs text-stone-500 mb-4">
                  Keyboard shortcuts to boost your productivity
                </p>
                <div className="space-y-3">
                  {Object.entries(settings.keyboardShortcuts).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-stone-100">
                      <span className="text-sm text-stone-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <kbd className="px-2 py-1 bg-stone-100 text-stone-600 text-xs font-mono rounded-md border border-stone-200">
                        {value}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-stone-900 mb-3">Your Projects</h4>
                  <div className="space-y-2 mb-4">
                    {projects.map(project => (
                      <div 
                        key={project.id}
                        className={cn(
                          "p-3 rounded-xl border transition-all flex items-center justify-between group",
                          project.id === currentProject?.id
                            ? 'border-stone-900 bg-stone-50'
                            : 'border-stone-200 hover:border-stone-300'
                        )}
                      >
                        <button
                          onClick={() => selectProject(project.id)}
                          className="flex-1 text-left"
                        >
                          <div className="font-medium text-sm text-stone-900">
                            {project.name}
                          </div>
                          <div className="text-xs text-stone-500">
                            {project.sources.length} sources · {project.scripts.length} scripts
                          </div>
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {project.id === currentProject?.id && (
                            <button
                              onClick={() => openShareModal()}
                              className="p-1.5 text-stone-400 hover:text-emerald-600 rounded-lg hover:bg-stone-100"
                              title="Share Project"
                            >
                              <Share2 size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => duplicateProject(project.id)}
                            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
                          {projects.length > 1 && (
                            <button
                              onClick={() => deleteProject(project.id)}
                              className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-stone-100"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="New project name..."
                      className="flex-1 h-10 px-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 outline-none text-sm transition-all placeholder:text-stone-400"
                    />
                    <button
                      onClick={() => {
                        if (newProjectName.trim()) {
                          createProject(newProjectName.trim());
                          setNewProjectName('');
                        }
                      }}
                      disabled={!newProjectName.trim()}
                      className="h-10 px-4 bg-stone-900 text-white rounded-xl font-medium text-sm hover:bg-stone-800 disabled:opacity-40 transition-all"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-stone-900 mb-1">Export Project</h4>
                  <p className="text-xs text-stone-500 mb-4">
                    Download your project in various formats
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => exportProject('json')}
                      className="p-4 rounded-xl border border-stone-200 hover:border-stone-300 transition-all flex flex-col items-center gap-2 hover:bg-stone-50"
                    >
                      <Download size={20} className="text-stone-600" />
                      <span className="text-xs font-medium text-stone-900">JSON</span>
                      <span className="text-[10px] text-stone-500">Full backup</span>
                    </button>
                    <button
                      onClick={() => exportProject('fountain')}
                      className="p-4 rounded-xl border border-stone-200 hover:border-stone-300 transition-all flex flex-col items-center gap-2 hover:bg-stone-50"
                    >
                      <Download size={20} className="text-stone-600" />
                      <span className="text-xs font-medium text-stone-900">Fountain</span>
                      <span className="text-[10px] text-stone-500">Script only</span>
                    </button>
                    <button
                      onClick={() => exportProject('pdf')}
                      className="p-4 rounded-xl border border-stone-200 hover:border-stone-300 transition-all flex flex-col items-center gap-2 hover:bg-stone-50"
                    >
                      <Download size={20} className="text-stone-600" />
                      <span className="text-xs font-medium text-stone-900">PDF</span>
                      <span className="text-[10px] text-stone-500">Printable</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-900 mb-1">Import Project</h4>
                  <p className="text-xs text-stone-500 mb-4">
                    Load a previously exported project
                  </p>
                  <button
                    onClick={handleImport}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-stone-200 hover:border-stone-300 transition-all flex flex-col items-center gap-2 hover:bg-stone-50"
                  >
                    <Upload size={20} className="text-stone-400" />
                    <span className="text-sm font-medium text-stone-600">
                      Choose JSON file
                    </span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-stone-200 p-5 bg-stone-50/60">
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-stone-900 uppercase tracking-wide">
                    <CreditCard size={16} />
                    Current Plan
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-2xl font-bold capitalize text-stone-900">{subscription.plan}</p>
                      <p className="text-xs text-stone-500">Status: {subscription.status}</p>
                      {subscription.current_period_end && (
                        <p className="text-xs text-stone-500">
                          Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {subscription.plan === 'free' ? (
                        <button
                          onClick={handleUpgrade}
                          disabled={checkoutLoading}
                          className="px-4 h-10 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition disabled:opacity-50"
                        >
                          {checkoutLoading ? 'Redirecting…' : 'Upgrade to Pro'}
                        </button>
                      ) : (
                        <button
                          onClick={handlePortal}
                          disabled={portalLoading}
                          className="px-4 h-10 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition disabled:opacity-50"
                        >
                          {portalLoading ? 'Opening…' : 'Manage Billing'}
                        </button>
                      )}
                    </div>
                  </div>
                  {billingError && (
                    <p className="text-xs text-red-500 mt-3">{billingError}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-stone-200 p-4 bg-white">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500 mb-1">
                      <FolderOpen size={14} />
                      Projects
                    </div>
                    <p className="text-2xl font-bold text-stone-900">
                      {projects.length} / {planLimits[subscription.plan].projects === Infinity ? '∞' : planLimits[subscription.plan].projects}
                    </p>
                    <p className="text-xs text-stone-500">Free plan allows up to 3 projects.</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 p-4 bg-white">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500 mb-1">
                      <Zap size={14} />
                      AI Requests (30 days)
                    </div>
                    <p className="text-2xl font-bold text-stone-900">
                      {monthlyAiUsage} / {planLimits[subscription.plan].ai === Infinity ? '∞' : planLimits[subscription.plan].ai}
                    </p>
                    <p className="text-xs text-stone-500">Upgrade for higher or unlimited usage.</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 p-4 bg-white flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500">
                      <CreditCard size={14} />
                      Credits
                    </div>
                    <p className="text-2xl font-bold text-stone-900">{subscription.credit_balance}</p>
                    <p className="text-xs text-stone-500 flex-1">Credits erlauben zusätzliche AI-Requests über das Freikontingent hinaus.</p>
                    <button
                      onClick={handleCreditTopUp}
                      disabled={creditLoading}
                      className="h-10 px-4 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition disabled:opacity-40"
                    >
                      {creditLoading ? 'Weiterleiten…' : 'Credits aufladen'}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-stone-200 p-4 bg-white">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-500 mb-3">
                    <BarChart3 size={14} />
                    Plan Comparison
                  </div>
                  <div className="grid grid-cols-2 text-sm text-stone-600 gap-4">
                    <div className="space-y-2">
                      <p className="font-semibold text-stone-900">Free</p>
                      <ul className="text-xs space-y-1">
                        <li>• 3 projects</li>
                        <li>• 30 AI requests / month</li>
                        <li>• Community support</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-stone-900">Pro</p>
                      <ul className="text-xs space-y-1">
                        <li>• Unlimited projects</li>
                        <li>• Priority AI processing</li>
                        <li>• Premium support</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;