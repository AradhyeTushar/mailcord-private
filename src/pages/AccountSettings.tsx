import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Settings, 
  Bell, 
  ShieldCheck, 
  User, 
  Tag, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Lock, 
  Smartphone, 
  Mail, 
  Save, 
  ArrowRight,
  LogOut,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function AccountSettings() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Settings state
  const [settings, setSettings] = useState({
    notify: true,
    notifyKeywords: [] as string[],
    privacyMode: false,
    recoveryEmail: '',
    recoveryPhone: '',
    privateAliasDestination: '',
    plan: 'free'
  });

  const [newKeyword, setNewKeyword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);

          // Fetch user settings
          const settingsRes = await fetch('/api/user/settings');
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            setSettings({
              notify: settingsData.notify !== false,
              notifyKeywords: Array.isArray(settingsData.notifyKeywords) ? settingsData.notifyKeywords : [],
              privacyMode: !!settingsData.privacyMode,
              recoveryEmail: settingsData.recoveryEmail || '',
              recoveryPhone: settingsData.recoveryPhone || '',
              privateAliasDestination: settingsData.privateAliasDestination || '',
              plan: settingsData.plan || userData.plan || 'free'
            });
          }
        }
      } catch (err) {
        console.error('Error fetching account settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/discord/url');
      if (!res.ok) throw new Error('Failed to get auth URL');
      const { url } = await res.json();
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Please allow popups to sign in with Discord.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to initiate login.');
    }
  };

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (!trimmed) return;
    if (!settings.notifyKeywords.includes(trimmed)) {
      setSettings(prev => ({
        ...prev,
        notifyKeywords: [...prev.notifyKeywords, trimmed]
      }));
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      notifyKeywords: prev.notifyKeywords.filter(k => k !== kwToRemove)
    }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMessage(data.error || 'Failed to save settings. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    navigate('/');
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      </Layout>
    );
  }

  // If not logged in
  if (!user) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-6 py-28 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-xl">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white">Account Settings</h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Connect your Discord account to customize your DM alert triggers, keyword notifications, strict privacy routing, and backup contacts.
            </p>
          </div>
          <button
            onClick={handleLogin}
            className="px-8 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 hover:scale-105"
          >
            Connect Discord Account
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-20 right-1/4 w-[500px] h-[300px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 pt-12 pb-24 relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-neutral-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
                <Settings className="w-3.5 h-3.5" />
                <span>Account Configuration</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Account Settings
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                Manage your Discord alerts, delivery routing, and security preferences.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-200 hover:text-white transition-colors flex items-center gap-2"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/30 text-xs font-medium text-neutral-400 hover:text-red-400 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Alert Banners */}
          {saveSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Your settings have been saved successfully and applied across all your aliases!</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            {/* Section 1: Profile & Plan Overview */}
            <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 shadow-xl backdrop-blur-md space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                <User className="w-5 h-5 text-indigo-400" />
                <span>Discord Profile &amp; Plan</span>
              </h2>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-5 rounded-2xl bg-neutral-950 border border-neutral-800/90">
                <div className="flex items-center gap-4">
                  {user.avatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                      className="w-14 h-14 rounded-2xl border border-neutral-700 shadow-md"
                      alt={user.username}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/30">
                      {user.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-white text-base">{user.username}</span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {settings.plan || user.plan || 'free'} Plan
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 font-mono">
                      Snowflake ID: {user.id}
                    </div>
                  </div>
                </div>

                <Link
                  to="/pricing"
                  className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-semibold border border-neutral-700 transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
                >
                  <span>Upgrade / Manage Plan</span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                </Link>
              </div>
            </div>

            {/* Section 2: Discord Notifications */}
            <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 shadow-xl backdrop-blur-md space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                  <Bell className="w-5 h-5 text-indigo-400" />
                  <span>Discord Notification Engine</span>
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400">
                  Control when and how the MailCord Discord bot alerts you of newly received emails.
                </p>
              </div>

              {/* Toggle 1: Direct DMs */}
              <div className="flex items-center justify-between p-5 rounded-2xl bg-neutral-950 border border-neutral-800">
                <div className="space-y-1 pr-4">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>Direct Discord DM Alerts</span>
                    {settings.notify ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Active</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 font-medium">Muted</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400">
                    Receive instant DM notifications from MailCord Bot as soon as emails land in any of your aliases.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.notify}
                  onClick={() => setSettings(prev => ({ ...prev, notify: !prev.notify }))}
                  className={cn(
                    "w-12 h-6.5 rounded-full transition-colors relative shrink-0 p-1 flex items-center cursor-pointer border focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
                    settings.notify ? "bg-indigo-600 border-indigo-500 shadow-sm shadow-indigo-600/30" : "bg-neutral-800 border-neutral-700"
                  )}
                >
                  <span 
                    className="w-4.5 h-4.5 rounded-full bg-white shadow-md block pointer-events-none transition-transform duration-200 ease-in-out"
                    style={{
                      transform: settings.notify ? 'translateX(22px)' : 'translateX(0px)'
                    }}
                  />
                </button>
              </div>

              {/* Keyword Alert Tags */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Priority Keyword Triggers
                </label>
                <p className="text-xs text-neutral-400">
                  Add tags such as <code className="text-indigo-400 font-mono">otp</code>, <code className="text-indigo-400 font-mono">urgent</code>, <code className="text-indigo-400 font-mono">invoice</code>, <code className="text-indigo-400 font-mono">verification</code>. Emails matching these keywords trigger priority badges.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
                    placeholder="Type a trigger word (e.g. otp, alert, receipt)..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors border border-neutral-700 shrink-0"
                  >
                    Add Trigger
                  </button>
                </div>

                {/* Tag Chips */}
                <div className="flex flex-wrap gap-2 pt-1 min-h-[36px]">
                  {settings.notifyKeywords.length === 0 ? (
                    <span className="text-xs text-neutral-500 italic py-1">
                      No custom keyword triggers added yet. All emails are treated with standard priority.
                    </span>
                  ) : (
                    settings.notifyKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-sm"
                      >
                        <Tag className="w-3 h-3 text-indigo-400" />
                        <span>{kw}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(kw)}
                          className="text-neutral-400 hover:text-white ml-1 p-0.5 hover:bg-indigo-500/20 rounded transition-colors"
                          title="Remove tag"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Delivery Privacy & Route Control */}
            <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 shadow-xl backdrop-blur-md space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span>Privacy Mode &amp; Delivery Guard</span>
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400">
                  Configure privacy isolation to protect sensitive emails from Discord server channels.
                </p>
              </div>

              {/* Strict Privacy Mode Toggle */}
              <div className="flex items-center justify-between p-5 rounded-2xl bg-neutral-950 border border-neutral-800">
                <div className="space-y-1 pr-4">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>Strict Privacy Mode</span>
                    {settings.privacyMode ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">Private DM Only</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 font-medium">Standard</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400">
                    Bypasses all server category channels. All incoming emails for your aliases deliver exclusively into your direct private Discord DM.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.privacyMode}
                  onClick={() => setSettings(prev => ({ ...prev, privacyMode: !prev.privacyMode }))}
                  className={cn(
                    "w-12 h-6.5 rounded-full transition-colors relative shrink-0 p-1 flex items-center cursor-pointer border focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
                    settings.privacyMode ? "bg-indigo-600 border-indigo-500 shadow-sm shadow-indigo-600/30" : "bg-neutral-800 border-neutral-700"
                  )}
                >
                  <span 
                    className="w-4.5 h-4.5 rounded-full bg-white shadow-md block pointer-events-none transition-transform duration-200 ease-in-out"
                    style={{
                      transform: settings.privacyMode ? 'translateX(22px)' : 'translateX(0px)'
                    }}
                  />
                </button>
              </div>

              {/* Private Alias Destination / Webhook */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Private Forwarding Destination (Optional)
                </label>
                <p className="text-xs text-neutral-400">
                  Specify an external backup email or webhook endpoint to forward all incoming emails.
                </p>
                <input
                  type="text"
                  value={settings.privateAliasDestination}
                  onChange={(e) => setSettings(prev => ({ ...prev, privateAliasDestination: e.target.value }))}
                  placeholder="e.g. backup@mydomain.com or https://hooks.zapier.com/..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Section 4: Backup & Security Contact */}
            <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 shadow-xl backdrop-blur-md space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                  <Lock className="w-5 h-5 text-indigo-400" />
                  <span>Backup &amp; Emergency Contacts</span>
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400">
                  Used for account verification, domain migration, and emergency alias recovery.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Recovery Email</span>
                  </label>
                  <input
                    type="email"
                    value={settings.recoveryEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, recoveryEmail: e.target.value }))}
                    placeholder="recovery@example.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Emergency Phone / Contact</span>
                  </label>
                  <input
                    type="tel"
                    value={settings.recoveryPhone}
                    onChange={(e) => setSettings(prev => ({ ...prev, recoveryPhone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <div className="text-xs text-neutral-500 text-center sm:text-left">
                All changes take effect immediately across all active email aliases and bot webhooks.
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  to="/dashboard"
                  className="w-1/2 sm:w-auto px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-semibold transition-colors text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-1/2 sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Preferences</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
