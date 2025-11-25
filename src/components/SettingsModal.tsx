import React, { useState } from 'react';
import { useStory } from '../context/StoryContext';
import { 
  X, 
  Moon, 
  Sun, 
  Monitor, 
  Key, 
  Keyboard, 
  Eye, 
  EyeOff,
  Check,
  Download,
  Upload,
  Trash2,
  Copy,
  FolderOpen
} from 'lucide-react';
import { cn } from '../lib/utils';

type SettingsTab = 'general' | 'appearance' | 'shortcuts' | 'projects' | 'export';

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
    importProject
  } = useStory();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showApiKey, setShowApiKey] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

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

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Key size={16} strokeWidth={1.75} /> },
    { id: 'appearance', label: 'Appearance', icon: <Sun size={16} strokeWidth={1.75} /> },
    { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={16} strokeWidth={1.75} /> },
    { id: 'projects', label: 'Projects', icon: <FolderOpen size={16} strokeWidth={1.75} /> },
    { id: 'export', label: 'Export', icon: <Download size={16} strokeWidth={1.75} /> },
  ];

  return (
    <div className="fixed inset-0 bg-stone-900/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-2xl shadow-floating flex flex-col max-h-[85vh] animate-in zoom-in-95 fade-in duration-200">
        
        {/* Header */}
        <div className="h-14 px-6 flex justify-between items-center border-b border-stone-100 dark:border-stone-800 shrink-0">
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">Settings</h3>
          <button 
            onClick={() => setSettingsOpen(false)} 
            className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-48 border-r border-stone-100 dark:border-stone-800 p-3 space-y-1 shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2.5 transition-all",
                  activeTab === tab.id
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800/50'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">API Key</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                    Enter your Gemini API key to enable AI features
                  </p>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.apiKey || ''}
                      onChange={(e) => updateSettings({ apiKey: e.target.value })}
                      placeholder="AIza..."
                      className="w-full h-11 pl-4 pr-12 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 focus:border-stone-400 dark:focus:border-stone-600 outline-none font-mono text-sm transition-all placeholder:text-stone-400"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">Auto-Save</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                    Automatically save your work
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div 
                      onClick={() => updateSettings({ autoSave: !settings.autoSave })}
                      className={cn(
                        "w-10 h-6 rounded-full transition-colors relative",
                        settings.autoSave ? 'bg-stone-900 dark:bg-white' : 'bg-stone-200 dark:bg-stone-700'
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white dark:bg-stone-900 absolute top-1 transition-all",
                        settings.autoSave ? 'left-5' : 'left-1'
                      )} />
                    </div>
                    <span className="text-sm text-stone-600 dark:text-stone-300">
                      {settings.autoSave ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">Word & Page Count</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                    Show statistics in the editor
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showWordCount}
                        onChange={(e) => updateSettings({ showWordCount: e.target.checked })}
                        className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-stone-900 dark:text-white focus:ring-stone-900/10"
                      />
                      <span className="text-sm text-stone-600 dark:text-stone-300">Show word count</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showPageCount}
                        onChange={(e) => updateSettings({ showPageCount: e.target.checked })}
                        className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-stone-900 dark:text-white focus:ring-stone-900/10"
                      />
                      <span className="text-sm text-stone-600 dark:text-stone-300">Show page estimate</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">Theme</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                    Choose your preferred color scheme
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: 'Light', icon: <Sun size={18} /> },
                      { id: 'dark', label: 'Dark', icon: <Moon size={18} /> },
                      { id: 'system', label: 'System', icon: <Monitor size={18} /> },
                    ].map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => updateSettings({ theme: theme.id as 'light' | 'dark' | 'system' })}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                          settings.theme === theme.id
                            ? 'border-stone-900 dark:border-white bg-stone-50 dark:bg-stone-800'
                            : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                        )}
                      >
                        <div className="text-stone-600 dark:text-stone-300">{theme.icon}</div>
                        <span className="text-xs font-medium text-stone-900 dark:text-white">{theme.label}</span>
                        {settings.theme === theme.id && (
                          <Check size={14} className="text-stone-900 dark:text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">Font Size</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
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
                            ? 'border-stone-900 dark:border-white bg-stone-50 dark:bg-stone-800'
                            : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                        )}
                      >
                        <span className={cn(
                          "font-mono text-stone-900 dark:text-white",
                          size.id === 'small' && 'text-sm',
                          size.id === 'medium' && 'text-base',
                          size.id === 'large' && 'text-lg'
                        )}>
                          {size.preview}
                        </span>
                        <span className="text-xs font-medium text-stone-600 dark:text-stone-300">{size.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">Font Family</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
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
                            ? 'border-stone-900 dark:border-white bg-stone-50 dark:bg-stone-800'
                            : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                        )}
                      >
                        <span className={cn("text-stone-900 dark:text-white", font.font)}>Abc</span>
                        <span className="text-xs font-medium text-stone-600 dark:text-stone-300">{font.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
                  Keyboard shortcuts to boost your productivity
                </p>
                <div className="space-y-3">
                  {Object.entries(settings.keyboardShortcuts).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                      <span className="text-sm text-stone-600 dark:text-stone-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <kbd className="px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-mono rounded-md border border-stone-200 dark:border-stone-700">
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
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Your Projects</h4>
                  <div className="space-y-2 mb-4">
                    {projects.map(project => (
                      <div 
                        key={project.id}
                        className={cn(
                          "p-3 rounded-xl border transition-all flex items-center justify-between group",
                          project.id === currentProject?.id
                            ? 'border-stone-900 dark:border-white bg-stone-50 dark:bg-stone-800'
                            : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                        )}
                      >
                        <button
                          onClick={() => selectProject(project.id)}
                          className="flex-1 text-left"
                        >
                          <div className="font-medium text-sm text-stone-900 dark:text-white">
                            {project.name}
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400">
                            {project.sources.length} sources · {project.scripts.length} scripts
                          </div>
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => duplicateProject(project.id)}
                            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
                          {projects.length > 1 && (
                            <button
                              onClick={() => deleteProject(project.id)}
                              className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"
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
                      className="flex-1 h-10 px-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 focus:border-stone-400 dark:focus:border-stone-600 outline-none text-sm transition-all placeholder:text-stone-400"
                    />
                    <button
                      onClick={() => {
                        if (newProjectName.trim()) {
                          createProject(newProjectName.trim());
                          setNewProjectName('');
                        }
                      }}
                      disabled={!newProjectName.trim()}
                      className="h-10 px-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-medium text-sm hover:bg-stone-800 dark:hover:bg-stone-100 disabled:opacity-40 transition-all"
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
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">Export Project</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
                    Download your project in various formats
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => exportProject('json')}
                      className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-all flex flex-col items-center gap-2 hover:bg-stone-50 dark:hover:bg-stone-800"
                    >
                      <Download size={20} className="text-stone-600 dark:text-stone-300" />
                      <span className="text-xs font-medium text-stone-900 dark:text-white">JSON</span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400">Full backup</span>
                    </button>
                    <button
                      onClick={() => exportProject('fountain')}
                      className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-all flex flex-col items-center gap-2 hover:bg-stone-50 dark:hover:bg-stone-800"
                    >
                      <Download size={20} className="text-stone-600 dark:text-stone-300" />
                      <span className="text-xs font-medium text-stone-900 dark:text-white">Fountain</span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400">Script only</span>
                    </button>
                    <button
                      onClick={() => exportProject('pdf')}
                      className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-all flex flex-col items-center gap-2 hover:bg-stone-50 dark:hover:bg-stone-800"
                    >
                      <Download size={20} className="text-stone-600 dark:text-stone-300" />
                      <span className="text-xs font-medium text-stone-900 dark:text-white">PDF</span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400">Printable</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">Import Project</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
                    Load a previously exported project
                  </p>
                  <button
                    onClick={handleImport}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-all flex flex-col items-center gap-2 hover:bg-stone-50 dark:hover:bg-stone-800"
                  >
                    <Upload size={20} className="text-stone-400" />
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
                      Choose JSON file
                    </span>
                  </button>
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

