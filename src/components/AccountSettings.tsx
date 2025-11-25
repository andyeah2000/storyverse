import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks';
import { 
  ArrowLeft, User, Key, Bell, Shield, Trash2, LogOut, 
  Eye, EyeOff, Check, Loader2, AlertTriangle, Download, Moon, Sun
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

const AccountSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isDark = theme === 'dark';
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'data'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [notifications, setNotifications] = useState({
    productUpdates: true,
    tips: false,
    newsletter: false,
  });

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, email: user.email });
    }
  }, [user]);

  const toggleTheme = () => {
    const current = localStorage.getItem('storyverse_settings');
    const settings = current ? JSON.parse(current) : {};
    const newTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('storyverse_settings', JSON.stringify({ ...settings, theme: newTheme }));
    window.location.reload();
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const userData = localStorage.getItem('storyverse_user');
    if (userData) {
      const parsed = JSON.parse(userData);
      parsed.name = profile.name;
      localStorage.setItem('storyverse_user', JSON.stringify(parsed));
    }
    
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      alert('Passwords do not match');
      return;
    }
    if (passwords.new.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setPasswords({ current: '', new: '', confirm: '' });
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleExportData = () => {
    const data = {
      user: user,
      settings: localStorage.getItem('storyverse_settings'),
      projects: localStorage.getItem('storyverse_projects'),
      currentProject: localStorage.getItem('storyverse_current_project'),
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyverse-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    localStorage.removeItem('storyverse_user');
    localStorage.removeItem('storyverse_session');
    localStorage.removeItem('storyverse_settings');
    localStorage.removeItem('storyverse_projects');
    localStorage.removeItem('storyverse_current_project');
    logout();
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data & Privacy', icon: Shield },
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-[#0c0a09]' : 'bg-[#FAFAF9]'
    }`}>
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg animate-in slide-in-from-top duration-300">
          <Check size={18} />
          Changes saved successfully
        </div>
      )}

      {/* Header */}
      <header className={`border-b shrink-0 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link 
            to="/app" 
            className={`inline-flex items-center gap-2 text-sm transition-colors group ${
              isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to App
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
        <div className="max-w-4xl mx-auto">
          <h1 className={`text-2xl font-bold mb-8 ${isDark ? 'text-white' : 'text-stone-900'}`}>
            Account Settings
          </h1>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? isDark 
                          ? 'bg-white text-stone-900'
                          : 'bg-stone-900 text-white'
                        : isDark
                          ? 'text-stone-400 hover:bg-stone-800 hover:text-white'
                          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className={`mt-8 pt-8 border-t ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 transition-colors ${
                    isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                  }`}
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className={`rounded-2xl border p-6 lg:p-8 ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}>
                  <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    Profile Information
                  </h2>
                  
                  <div className="space-y-5">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-stone-300' : 'text-stone-900'
                      }`}>Full Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                        className={`w-full h-12 px-4 rounded-xl border outline-none transition-all ${
                          isDark
                            ? 'bg-stone-800 border-stone-700 text-white focus:border-stone-600 focus:ring-2 focus:ring-white/5'
                            : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-stone-300' : 'text-stone-900'
                      }`}>Email Address</label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className={`w-full h-12 px-4 rounded-xl border cursor-not-allowed ${
                          isDark
                            ? 'bg-stone-800 border-stone-700 text-stone-500'
                            : 'bg-stone-100 border-stone-200 text-stone-500'
                        }`}
                      />
                      <p className={`mt-2 text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        Contact support to change your email address.
                      </p>
                    </div>
                  </div>

                  <div className={`mt-8 pt-6 border-t flex justify-end ${
                    isDark ? 'border-stone-800' : 'border-stone-200'
                  }`}>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className={`h-12 px-6 font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98] ${
                        isDark 
                          ? 'bg-white text-stone-900 hover:bg-stone-100' 
                          : 'bg-stone-900 text-white hover:bg-stone-800'
                      }`}
                    >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className={`rounded-2xl border p-6 lg:p-8 ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}>
                  <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    Change Password
                  </h2>
                  
                  <div className="space-y-5">
                    {(['current', 'new', 'confirm'] as const).map((field) => (
                      <div key={field}>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-stone-300' : 'text-stone-900'
                        }`}>
                          {field === 'current' ? 'Current Password' : field === 'new' ? 'New Password' : 'Confirm New Password'}
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords[field] ? 'text' : 'password'}
                            value={passwords[field]}
                            onChange={(e) => setPasswords(p => ({ ...p, [field]: e.target.value }))}
                            className={`w-full h-12 px-4 pr-12 rounded-xl border outline-none transition-all ${
                              isDark
                                ? 'bg-stone-800 border-stone-700 text-white focus:border-stone-600 focus:ring-2 focus:ring-white/5'
                                : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(s => ({ ...s, [field]: !s[field] }))}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                              isDark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
                            }`}
                          >
                            {showPasswords[field] ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {field === 'new' && (
                          <p className={`mt-2 text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                            Minimum 8 characters with letters and numbers.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className={`mt-8 pt-6 border-t flex justify-end ${
                    isDark ? 'border-stone-800' : 'border-stone-200'
                  }`}>
                    <button
                      onClick={handleChangePassword}
                      disabled={isSaving || !passwords.current || !passwords.new || !passwords.confirm}
                      className={`h-12 px-6 font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98] ${
                        isDark 
                          ? 'bg-white text-stone-900 hover:bg-stone-100' 
                          : 'bg-stone-900 text-white hover:bg-stone-800'
                      }`}
                    >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />}
                      Update Password
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className={`rounded-2xl border p-6 lg:p-8 ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}>
                  <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    Email Notifications
                  </h2>
                  
                  <div className={`divide-y ${isDark ? 'divide-stone-800' : 'divide-stone-200'}`}>
                    {[
                      { key: 'productUpdates', label: 'Product Updates', description: 'New features and improvements' },
                      { key: 'tips', label: 'Tips & Tutorials', description: 'Writing tips and how-to guides' },
                      { key: 'newsletter', label: 'Newsletter', description: 'Monthly newsletter with industry news' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-stone-900'}`}>
                            {item.label}
                          </p>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                            {item.description}
                          </p>
                        </div>
                        <button
                          onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof notifications] }))}
                          className={`w-11 h-6 rounded-full relative transition-colors ${
                            notifications[item.key as keyof typeof notifications] 
                              ? isDark ? 'bg-white' : 'bg-stone-900'
                              : isDark ? 'bg-stone-700' : 'bg-stone-300'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full shadow-sm transition-all ${
                            notifications[item.key as keyof typeof notifications] 
                              ? `right-1 ${isDark ? 'bg-stone-900' : 'bg-white'}`
                              : `left-1 ${isDark ? 'bg-stone-400' : 'bg-white'}`
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data & Privacy Tab */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div className={`rounded-2xl border p-6 lg:p-8 ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}>
                    <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                      Export Your Data
                    </h2>
                    <p className={`text-sm mb-5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      Download a copy of all your data including projects, settings, and account information.
                    </p>
                    <button
                      onClick={handleExportData}
                      className={`h-12 px-6 font-medium rounded-xl flex items-center gap-2 transition-colors ${
                        isDark 
                          ? 'border border-stone-700 text-white hover:bg-stone-800' 
                          : 'border border-stone-200 text-stone-900 hover:bg-stone-50'
                      }`}
                    >
                      <Download size={18} />
                      Export Data
                    </button>
                  </div>

                  <div className={`rounded-2xl border p-6 lg:p-8 ${
                    isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
                  }`}>
                    <h2 className={`text-lg font-semibold mb-2 flex items-center gap-2 ${
                      isDark ? 'text-red-400' : 'text-red-700'
                    }`}>
                      <AlertTriangle size={20} />
                      Delete Account
                    </h2>
                    <p className={`text-sm mb-5 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                      This action is irreversible. All your data, projects, and settings will be permanently deleted.
                    </p>
                    
                    {showDeleteConfirm ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={handleDeleteAccount}
                          className="h-12 px-6 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                        >
                          Yes, Delete My Account
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className={`h-12 px-6 font-medium rounded-xl transition-colors ${
                            isDark 
                              ? 'border border-red-500/30 text-red-400 hover:bg-red-500/10' 
                              : 'border border-red-300 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className={`h-12 px-6 font-medium rounded-xl flex items-center gap-2 transition-colors ${
                          isDark 
                            ? 'border border-red-500/30 text-red-400 hover:bg-red-500/10' 
                            : 'border border-red-300 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        <Trash2 size={18} />
                        Delete Account
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t shrink-0 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
        <div className={`max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm ${
          isDark ? 'text-stone-500' : 'text-stone-400'
        }`}>
          <span>© 2025 StoryVerse</span>
          <div className="flex gap-6">
            <Link to="/privacy" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Privacy</Link>
            <Link to="/terms" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AccountSettings;
