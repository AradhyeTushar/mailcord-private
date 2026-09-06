import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Mail, 
  Settings, 
  Plus, 
  Trash2, 
  Copy, 
  CheckCircle2,
  LogOut,
  Server,
  Inbox,
  BarChart3,
  Shield,
  CreditCard,
  X,
  AlertCircle,
  User,
  Check,
  Clock,
  Eye,
  Sparkles,
  Filter,
  MessageSquare,
  ChevronDown,
  History,
  CornerDownRight,
  Bell,
  BellOff,
  Terminal,
  Search,
  Zap,
  BookOpen,
  Tag,
  ShieldCheck,
  ExternalLink,
  Lock,
  Smartphone,
  Globe,
  Key,
  Cpu,
  Layers,
  RefreshCw,
  Sliders,
  Database,
  Users,
  CheckCheck,
  TrendingUp,
  PlusCircle,
  HardDrive,
  CheckSquare,
  XCircle,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { splitEmailBody } from '../lib/emailUtils';
import { BOT_COMMANDS, BOT_COMMAND_CATEGORIES } from '../data/botCommands';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('aliases');
  const [aliasFilter, setAliasFilter] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [aliases, setAliases] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeCount: 0, totalEmails: 0 });
  const [loading, setLoading] = useState(true);

  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [viewHtml, setViewHtml] = useState(false);
  const [showQuotedText, setShowQuotedText] = useState(false);

  // Account Settings State
  const [userSettings, setUserSettings] = useState({
    notify: true,
    notifyKeywords: [] as string[],
    privacyMode: false,
    recoveryEmail: '',
    recoveryPhone: '',
    privateAliasDestination: '',
    plan: 'free'
  });
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  // Bot Commands State
  const [commandSearch, setCommandSearch] = useState('');
  const [selectedCommandCategory, setSelectedCommandCategory] = useState('all');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>('');
  const [selectedGuildPlan, setSelectedGuildPlan] = useState<string>('free');
  const [isPreparingGateway, setIsPreparingGateway] = useState(false);
  const [processingCancel, setProcessingCancel] = useState(false);

  // --- Multi-Domain State ---
  const [systemDomains, setSystemDomains] = useState<any[]>([]);
  const [userDomains, setUserDomains] = useState<any[]>([]);
  const [newCustomDomain, setNewCustomDomain] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);
  const [domainStatusMessage, setDomainStatusMessage] = useState<string | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);

  // --- Web Alias Creation State ---
  const [showCreateAliasModal, setShowCreateAliasModal] = useState(false);
  const [newAliasName, setNewAliasName] = useState('');
  const [selectedAliasDomain, setSelectedAliasDomain] = useState('bot.devtushar.uk');
  const [isCreatingAlias, setIsCreatingAlias] = useState(false);
  const [aliasCreateError, setAliasCreateError] = useState<string | null>(null);
  const [aliasCreateSuccess, setAliasCreateSuccess] = useState(false);

  // --- Developer Control Center State ---
  const [devOverview, setDevOverview] = useState<any>(null);
  const [devUsers, setDevUsers] = useState<any[]>([]);
  const [devUserSearch, setDevUserSearch] = useState('');
  const [devKeys, setDevKeys] = useState<any[]>([]);
  const [devKeyFilter, setDevKeyFilter] = useState<'unused' | 'all'>('unused');
  const [devKeyPlan, setDevKeyPlan] = useState<'premium' | 'supreme' | 'enterprise'>('premium');
  const [devKeyDuration, setDevKeyDuration] = useState<number>(30);
  const [devServerGuildId, setDevServerGuildId] = useState('');
  const [devServerPlan, setDevServerPlan] = useState<'free' | 'pro' | 'enterprise'>('enterprise');
  const [devServerDays, setDevServerDays] = useState<number>(30);
  const [devNewSysDomain, setDevNewSysDomain] = useState('');
  const [devSelectedUser, setDevSelectedUser] = useState<any | null>(null);
  const [devUserNewPlan, setDevUserNewPlan] = useState('premium');
  const [devUserNewDays, setDevUserNewDays] = useState<number>(30);
  const [devLoading, setDevLoading] = useState(false);
  const [devActionMsg, setDevActionMsg] = useState<string | null>(null);
  const [devSubTab, setDevSubTab] = useState<'overview' | 'users' | 'keys' | 'domains' | 'servers'>('overview');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedEmail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch settings on tab switch to 'settings'
  useEffect(() => {
    if (activeTab === 'settings') {
      fetch('/api/user/settings')
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setUserSettings(prev => ({
              ...prev,
              ...data,
              notifyKeywords: Array.isArray(data.notifyKeywords) ? data.notifyKeywords : []
            }));
          }
        })
        .catch(err => console.error('Failed to load user settings:', err));
    }
  }, [activeTab]);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSavedSuccess(false);
    setSettingsError('');
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userSettings)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettingsSavedSuccess(true);
        setTimeout(() => setSettingsSavedSuccess(false), 3500);
      } else {
        setSettingsError(data.error || 'Failed to save settings');
      }
    } catch (err: any) {
      setSettingsError(err.message || 'Network error saving settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddKeyword = () => {
    const trimmed = newKeywordInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!userSettings.notifyKeywords.includes(trimmed)) {
      setUserSettings(prev => ({
        ...prev,
        notifyKeywords: [...prev.notifyKeywords, trimmed]
      }));
    }
    setNewKeywordInput('');
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setUserSettings(prev => ({
      ...prev,
      notifyKeywords: prev.notifyKeywords.filter(k => k !== kwToRemove)
    }));
  };

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(cmd);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  // --- Domains & Dev API Callbacks ---
  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/domains');
      if (res.ok) {
        const data = await res.json();
        setSystemDomains(data.systemDomains || []);
        setUserDomains(data.userDomains || []);
        if (data.systemDomains && data.systemDomains.length > 0) {
          setSelectedAliasDomain(data.systemDomains[0].domain);
        }
      }
    } catch (e) {
      console.error('Failed to fetch domains', e);
    }
  };

  const fetchDevOverview = async () => {
    try {
      setDevLoading(true);
      const res = await fetch('/api/dev/overview');
      if (res.ok) {
        const data = await res.json();
        setDevOverview(data);
      }
    } catch (e) {
      console.error('Failed to fetch dev overview', e);
    } finally {
      setDevLoading(false);
    }
  };

  const fetchDevUsers = async () => {
    try {
      setDevLoading(true);
      const res = await fetch('/api/dev/users' + (devUserSearch ? `?search=${encodeURIComponent(devUserSearch)}` : ''));
      if (res.ok) {
        const data = await res.json();
        setDevUsers(data.users || []);
      }
    } catch (e) {
      console.error('Failed to fetch dev users', e);
    } finally {
      setDevLoading(false);
    }
  };

  const fetchDevKeys = async () => {
    try {
      setDevLoading(true);
      const res = await fetch(`/api/dev/keys?filter=${devKeyFilter}`);
      if (res.ok) {
        const data = await res.json();
        setDevKeys(data.keys || []);
      }
    } catch (e) {
      console.error('Failed to fetch dev keys', e);
    } finally {
      setDevLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'domains' || activeTab === 'aliases') {
      fetchDomains();
    }
    if (activeTab === 'developer') {
      fetchDevOverview();
      fetchDevUsers();
      fetchDevKeys();
      fetchDomains();
    }
  }, [activeTab]);

  const handleCreateAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingAlias(true);
    setAliasCreateError(null);
    setAliasCreateSuccess(false);
    try {
      const res = await fetch('/api/aliases/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAliasName, domain: selectedAliasDomain })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAliasCreateSuccess(true);
        setAliases(prev => [data.alias, ...prev]);
        setStats(prev => ({ ...prev, activeCount: prev.activeCount + 1 }));
        setTimeout(() => {
          setShowCreateAliasModal(false);
          setNewAliasName('');
          setAliasCreateSuccess(false);
        }, 1200);
      } else {
        setAliasCreateError(data.error || 'Failed to create alias');
      }
    } catch (err: any) {
      setAliasCreateError(err.message || 'Network error');
    } finally {
      setIsCreatingAlias(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomDomain.trim()) return;
    setIsAddingDomain(true);
    setDomainError(null);
    setDomainStatusMessage(null);
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newCustomDomain })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewCustomDomain('');
        setDomainStatusMessage('Domain added! Please configure your DNS MX & TXT records below and verify.');
        fetchDomains();
      } else {
        setDomainError(data.error || 'Failed to add domain');
      }
    } catch (err: any) {
      setDomainError(err.message || 'Network error');
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleVerifyDomain = async (id: string) => {
    setVerifyingDomainId(id);
    setDomainError(null);
    setDomainStatusMessage(null);
    try {
      const res = await fetch(`/api/domains/${id}/verify`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setDomainStatusMessage(data.message);
        fetchDomains();
      } else {
        setDomainError(data.error || data.message || 'Verification failed');
      }
    } catch (err: any) {
      setDomainError(err.message || 'Network error');
    } finally {
      setVerifyingDomainId(null);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    if (!confirm('Are you sure you want to remove this domain?')) return;
    try {
      const res = await fetch(`/api/domains/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDomains();
      }
    } catch (e) {
      console.error('Delete domain error', e);
    }
  };

  const handleGenerateDevKey = async () => {
    try {
      setDevLoading(true);
      const res = await fetch('/api/dev/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: devKeyPlan, durationDays: devKeyDuration })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDevActionMsg(`Generated key: ${data.key.code}`);
        fetchDevKeys();
        setTimeout(() => setDevActionMsg(null), 5000);
      }
    } catch (e) {
      console.error('Gen key error', e);
    } finally {
      setDevLoading(false);
    }
  };

  const handleDeleteDevKey = async (code: string) => {
    if (!confirm(`Revoke key ${code}?`)) return;
    try {
      const res = await fetch(`/api/dev/keys/${encodeURIComponent(code)}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDevKeys();
      }
    } catch (e) {
      console.error('Delete key error', e);
    }
  };

  const handleUpdateUserPlan = async (userId: string, plan: string, days: number) => {
    try {
      setDevLoading(true);
      const res = await fetch(`/api/dev/users/${userId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, days })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDevActionMsg(`Updated user ${userId} to ${plan.toUpperCase()}`);
        setDevSelectedUser(null);
        fetchDevUsers();
        setTimeout(() => setDevActionMsg(null), 4000);
      }
    } catch (e) {
      console.error('Update plan error', e);
    } finally {
      setDevLoading(false);
    }
  };

  const handleResetDevUser = async (userId: string) => {
    if (!confirm(`Reset user ${userId} to FREE tier?`)) return;
    try {
      const res = await fetch(`/api/dev/users/${userId}/reset`, { method: 'POST' });
      if (res.ok) {
        setDevActionMsg(`Reset user ${userId} to Free tier.`);
        fetchDevUsers();
        setTimeout(() => setDevActionMsg(null), 4000);
      }
    } catch (e) {
      console.error('Reset user error', e);
    }
  };

  const handleUpdateServerPlan = async () => {
    if (!devServerGuildId.trim()) return;
    try {
      setDevLoading(true);
      const res = await fetch('/api/dev/server-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId: devServerGuildId.trim(), plan: devServerPlan, days: devServerDays })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDevActionMsg(`Server ${devServerGuildId} updated to ${devServerPlan.toUpperCase()}`);
        setDevServerGuildId('');
        setTimeout(() => setDevActionMsg(null), 4000);
      }
    } catch (e) {
      console.error('Server plan error', e);
    } finally {
      setDevLoading(false);
    }
  };

  const handleAddSystemDomain = async () => {
    if (!devNewSysDomain.trim()) return;
    try {
      setDevLoading(true);
      const res = await fetch('/api/dev/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: devNewSysDomain.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDevActionMsg(`System domain ${devNewSysDomain} added!`);
        setDevNewSysDomain('');
        fetchDomains();
        setTimeout(() => setDevActionMsg(null), 4000);
      }
    } catch (e) {
      console.error('System domain error', e);
    } finally {
      setDevLoading(false);
    }
  };

  useEffect(() => {
    // Read URL parameters or subpath for auto-navigation from Discord Dashboard Links
    const pathname = window.location.pathname.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab === 'server' ? 'commands' : tab);
    } else if (pathname.includes('/dashboard/settings')) {
      setActiveTab('settings');
    } else if (pathname.includes('/dashboard/commands')) {
      setActiveTab('commands');
    } else if (pathname.includes('/dashboard/inbox')) {
      setActiveTab('inbox');
    } else if (pathname.includes('/dashboard/analytics')) {
      setActiveTab('analytics');
    } else if (pathname.includes('/dashboard/billing')) {
      setActiveTab('billing');
    }

    const action = searchParams.get('action');
    const plan = searchParams.get('plan');
    const type = searchParams.get('type');
    const targetId = searchParams.get('targetId') || undefined;

    const fetchData = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
           window.location.href = '/';
           return;
        }
        const userData = await userRes.json();
        setUser(userData);

        const [aliasesRes, emailsRes, statsRes, invoicesRes] = await Promise.all([
          fetch('/api/aliases'),
          fetch('/api/emails'),
          fetch('/api/stats'),
          fetch('/api/payment/invoices')
        ]);

        if (aliasesRes.ok) setAliases(await aliasesRes.json());
        if (emailsRes.ok) setEmails(await emailsRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
        if (invoicesRes.ok) setInvoices(await invoicesRes.json());
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const socket = io();
    socket.on('new_email', (data) => {
      // If the email belongs to the current user, update state
      setEmails(prev => [data.email, ...prev]);
      setStats(prev => ({ ...prev, totalEmails: prev.totalEmails + 1 }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Use a separate effect to trigger the upgrade action after the user is loaded
  useEffect(() => {
    if (!loading && user) {
      const searchParams = new URLSearchParams(window.location.search);
      const action = searchParams.get('action');
      const plan = searchParams.get('plan');
      const type = searchParams.get('type');
      const targetId = searchParams.get('targetId') || undefined;
      
      if (action === 'upgrade' && plan && type) {
        handleUpgrade(plan, type, targetId);
      }
    }
  }, [loading, user]);

  useEffect(() => {
    const fetchGuildPlan = async () => {
      if (!selectedGuildId) {
        setSelectedGuildPlan('free');
        return;
      }
      try {
        const res = await fetch(`/api/guild/${selectedGuildId}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedGuildPlan(data.plan || 'free');
        } else {
          setSelectedGuildPlan('free');
        }
      } catch (err) {
        console.error('Failed to fetch guild plan', err);
        setSelectedGuildPlan('free');
      }
    };
    fetchGuildPlan();
  }, [selectedGuildId]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const handleUpgrade = async (plan: string, type: string, targetId?: string) => {
    console.log(`[DEBUG] handleUpgrade called: plan=${plan}, type=${type}, targetId=${targetId}`);
    setIsPreparingGateway(true);
    try {
      // Check if Razorpay is blocked/missing
      // @ts-ignore
      const isRazorpayAvailable = typeof window !== 'undefined' && !!window.Razorpay;
      
      const planId = type === 'user' ? `user_${plan}` : `guild_${plan}`;
      
      const res = await fetch('/api/billing/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan_id: planId, 
          target_type: type, 
          target_id: targetId || user.id 
        })
      });
      
      if (!res.ok) {
        setIsPreparingGateway(false);
        const errorData = await res.json().catch(() => ({ error: 'Server returned error ' + res.status }));
        return alert(errorData.error || 'Failed to initiate gateway.');
      }

      const data = await res.json();
      console.log('[DEBUG] Subscription response:', data);
      
      if (data.error) {
        setIsPreparingGateway(false);
        return alert(data.error);
      }

      if (data.checkoutUrl) {
        console.log('[DEBUG] Redirecting to Razorpay checkout:', data.checkoutUrl);
        window.location.href = data.checkoutUrl;
        return;
      }

      if (!isRazorpayAvailable) {
        return alert('Razorpay gateway is blocked by your browser. Please disable your ad-blocker or visit the payment link directly.');
      }

      console.log('[DEBUG] Opening Razorpay modal (fallback)');
      const options = {
        key: data.keyId || 'rzp_test_placeholder',
        subscription_id: data.subscriptionId,
        name: 'MailCord',
        description: `Upgrade to ${plan} plan`,
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan,
              type,
              targetId
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert('Payment successful! Your plan has been upgraded instantly.');
            // Clear URL
            window.history.replaceState(null, '', window.location.pathname + '?tab=billing');
            window.location.reload();
          } else {
            alert('Verification failed: ' + (verifyData.error || 'Unknown error'));
          }
        },
        prefill: {
          name: user?.username,
        },
        theme: {
          color: '#4f46e5'
        }
      };
      
      // @ts-ignore
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response: any){
        console.error("Razorpay Payment Failed:", response.error);
        alert(`Payment Failed: ${response.error.description}`);
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      setIsPreparingGateway(false);
      alert('Failed to initiate payment.');
    }
  };

  const handleCancelPlan = async (type: 'user' | 'guild', targetId?: string) => {
    if (!window.confirm('Are you sure you want to cancel this plan? You will lose access to premium features immediately.')) return;
    
    setProcessingCancel(true);
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: type, target_id: targetId || user.id })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Cancellation failed:', res.status, errorText);
        throw new Error(`Server returned ${res.status}: ${errorText || 'Unknown error'}`);
      }

      const data = await res.json();
      if (data.success) {
        // Success notification
        setIsPreparingGateway(true); // Re-use overlay for "Updating..."
        setTimeout(() => {
           window.location.reload();
        }, 800);
      } else {
        alert(data.error || 'Failed to cancel plan. Please try again.');
      }
    } catch (err: any) {
      console.error('Cancellation error:', err);
      alert(err.message || 'Network error: Failed to connect to the server for cancellation.');
    } finally {
      setProcessingCancel(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-neutral-950 text-white">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-950/50 backdrop-blur-xl flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">MailCord</span>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800">
            {user?.avatar ? (
              <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} className="w-8 h-8 rounded-full" alt="avatar" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-medium">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user?.username || 'User'}</span>
              <span className="text-xs text-neutral-500 truncate">{user?.id}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {[
            { id: 'aliases', icon: Mail, label: 'Email Aliases' },
            { id: 'inbox', icon: Inbox, label: 'Inbox History' },
            { id: 'domains', icon: Globe, label: 'Custom Domains', badge: (user?.plan === 'supreme' || user?.isDeveloper) ? 'Active' : 'Pro' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'commands', icon: Terminal, label: 'Bot Commands' },
            { id: 'billing', icon: CreditCard, label: 'Billing & Plans' },
            { id: 'settings', icon: Settings, label: 'Account Settings' },
            ...(user?.isDeveloper ? [{ id: 'developer', icon: ShieldCheck, label: 'Developer Control', badge: 'DEV', isDev: true }] : [])
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                (activeTab === item.id || (item.id === 'commands' && activeTab === 'server'))
                  ? (item.isDev ? "bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]" : "bg-indigo-500/10 text-indigo-400 font-semibold")
                  : (item.isDev ? "text-purple-400/80 hover:bg-purple-950/30 hover:text-purple-200" : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200")
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-4 h-4", item.isDev ? "text-purple-400" : "")} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider",
                  item.isDev ? "bg-purple-500 text-white shadow-sm" : (item.badge === 'Active' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-neutral-800 text-neutral-400")
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-800 space-y-1">
          <a 
            href="/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 transition-all"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Documentation</span>
            <ExternalLink className="w-3 h-3 ml-auto text-neutral-600" />
          </a>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:bg-neutral-900 hover:text-red-400 transition-all">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
          <div className="text-[11px] text-neutral-600 text-center pt-2">
            © 2026 MailCord
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-neutral-950">
        <div className="max-w-5xl mx-auto p-8">
          {activeTab === 'aliases' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
                  <h3 className="text-neutral-400 text-sm font-medium mb-1">Active Aliases</h3>
                  <p className="text-3xl font-semibold">{stats.activeCount}</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
                  <h3 className="text-neutral-400 text-sm font-medium mb-1">Total Emails Received</h3>
                  <p className="text-3xl font-semibold">{stats.totalEmails}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold mb-1">Email Aliases</h1>
                  <p className="text-neutral-400 text-sm">Manage your custom domain email addresses.</p>
                </div>
                <button
                  onClick={() => setShowCreateAliasModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 w-fit"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Alias</span>
                </button>
              </div>

              {/* Create Alias Modal */}
              {showCreateAliasModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <div className="flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-indigo-400" />
                        <h3 className="font-semibold text-lg text-white">Create New Alias</h3>
                      </div>
                      <button
                        onClick={() => setShowCreateAliasModal(false)}
                        className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {aliasCreateError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{aliasCreateError}</span>
                      </div>
                    )}

                    {aliasCreateSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Alias created successfully!</span>
                      </div>
                    )}

                    <form onSubmit={handleCreateAlias} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1.5">Alias Prefix</label>
                        <input
                          type="text"
                          required
                          value={newAliasName}
                          onChange={(e) => setNewAliasName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                          placeholder="e.g. shopping, contact, alex"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1.5">Select Domain</label>
                        <select
                          value={selectedAliasDomain}
                          onChange={(e) => setSelectedAliasDomain(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        >
                          {systemDomains.map((d: any) => (
                            <option key={d.domain} value={d.domain}>
                              @{d.domain} (System Default)
                            </option>
                          ))}
                          {userDomains.filter((d: any) => d.verified).map((d: any) => (
                            <option key={d.domain} value={d.domain}>
                              @{d.domain} (Your Custom Domain)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-400">
                        Preview: <span className="text-indigo-300 font-mono font-medium">{newAliasName || 'yourname'}@{selectedAliasDomain}</span>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowCreateAliasModal(false)}
                          className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isCreatingAlias || !newAliasName}
                          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
                        >
                          {isCreatingAlias ? 'Creating...' : 'Create Address'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-950/50 text-neutral-400 border-b border-neutral-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">Alias</th>
                      <th className="px-6 py-4 font-medium">Domain</th>
                      <th className="px-6 py-4 font-medium">Emails Received</th>
                      <th className="px-6 py-4 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {aliases.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                          No aliases found. Click "Create Alias" above or use the Discord bot!
                        </td>
                      </tr>
                    )}
                    {aliases.map((alias) => {
                      const domainName = alias.domain || 'bot.devtushar.uk';
                      const fullEmail = `${alias.name}@${domainName}`;
                      return (
                        <tr key={alias._id} className="hover:bg-neutral-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-neutral-200">{fullEmail}</span>
                              <button 
                                onClick={() => handleCopy(fullEmail, alias._id)}
                                className="text-neutral-500 hover:text-neutral-300 transition-colors"
                                title="Copy"
                              >
                                {copiedId === alias._id ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => { setAliasFilter(alias.name); setActiveTab('inbox'); }}
                                className="px-2 py-0.5 bg-neutral-800 hover:bg-indigo-600/20 text-neutral-400 hover:text-indigo-300 rounded text-xs transition-colors flex items-center gap-1 border border-neutral-700/60"
                                title={`Open Inbox for ${alias.name}`}
                              >
                                <Inbox className="w-3.5 h-3.5" />
                                <span>Inbox</span>
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded font-mono border",
                              domainName === 'bot.devtushar.uk' ? "bg-neutral-800/60 text-neutral-400 border-neutral-700" : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                            )}>
                              @{domainName}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-neutral-400">
                            {alias.emailsReceived || 0}
                          </td>
                          <td className="px-6 py-4 text-neutral-400">{new Date(alias.createdAt).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'inbox' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2">
                    <Inbox className="w-6 h-6 text-indigo-400" />
                    {aliasFilter ? `Inbox: ${aliasFilter}` : 'Inbox History'}
                  </h1>
                  <p className="text-neutral-400 text-sm">
                    {aliasFilter ? `Showing emails received for ${aliasFilter}@bot.devtushar.uk` : 'Recent emails received across all your aliases. Click any email to view full content.'}
                  </p>
                </div>
                {aliasFilter && (
                  <button 
                    onClick={() => setAliasFilter(null)} 
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-sm transition-colors flex items-center gap-2 border border-neutral-700/60 self-start sm:self-auto"
                  >
                    <Filter className="w-4 h-4 text-neutral-400" />
                    <span>Show All Aliases</span>
                  </button>
                )}
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-950/60 text-neutral-400 border-b border-neutral-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">Alias</th>
                      <th className="px-6 py-4 font-medium">From</th>
                      <th className="px-6 py-4 font-medium">Subject</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {(aliasFilter ? emails.filter(e => e.alias === aliasFilter) : emails).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-neutral-500">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Mail className="w-8 h-8 text-neutral-600 mb-1" />
                            <p className="font-medium text-neutral-400">No emails found.</p>
                            <p className="text-xs text-neutral-500">Emails sent to your aliases will appear here in real-time.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {(aliasFilter ? emails.filter(e => e.alias === aliasFilter) : emails).map((email) => (
                      <tr 
                        key={email._id} 
                        onClick={() => { setSelectedEmail(email); setEmailCopied(false); setViewHtml(false); setShowQuotedText(false); }}
                        className="hover:bg-neutral-800/60 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium whitespace-nowrap">
                            {email.alias}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-neutral-300 font-medium truncate max-w-[200px]">
                          {email.from}
                        </td>
                        <td className="px-6 py-4 text-neutral-200 max-w-[340px]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {email.subject?.toLowerCase().startsWith('re:') && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                                  <CornerDownRight className="w-2.5 h-2.5" />
                                  Reply
                                </span>
                              )}
                              <span className="group-hover:text-indigo-300 transition-colors font-medium truncate">
                                {email.subject || '(No Subject)'}
                              </span>
                              {email.category && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 capitalize shrink-0">
                                  {email.category}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-400 truncate line-clamp-1">
                              {splitEmailBody(email.body).mainText}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-neutral-400 whitespace-nowrap text-xs">
                          {new Date(email.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmail(email);
                              setEmailCopied(false);
                              setViewHtml(false);
                              setShowQuotedText(false);
                            }}
                            className="px-3 py-1.5 bg-neutral-800/80 group-hover:bg-indigo-600 text-neutral-300 group-hover:text-white rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5 border border-neutral-700/50 group-hover:border-indigo-500 shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Open</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold mb-1">Analytics</h1>
                  <p className="text-neutral-400 text-sm">Visualize your email traffic and spam trends.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Email Volume Chart */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
                  <h3 className="text-lg font-medium mb-4">Email Volume (Last 7 Days)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={
                        // Group emails by date
                        Object.values(emails.reduce((acc: any, email: any) => {
                          const date = new Date(email.timestamp).toLocaleDateString();
                          if (!acc[date]) acc[date] = { date, count: 0 };
                          acc[date].count += 1;
                          return acc;
                        }, {})).slice(-7) // Last 7 days
                      }>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #333' }} />
                        <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Breakdown Chart */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
                  <h3 className="text-lg font-medium mb-4">Email Categories</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={
                        // Group emails by category
                        Object.values(emails.reduce((acc: any, email: any) => {
                          const category = email.category || 'Uncategorized';
                          if (!acc[category]) acc[category] = { category, count: 0 };
                          acc[category].count += 1;
                          return acc;
                        }, {}))
                      }>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="category" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #333' }} />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {(activeTab === 'commands' || activeTab === 'server') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2.5">
                    <Terminal className="w-6 h-6 text-indigo-400" />
                    Bot Commands Directory
                  </h1>
                  <p className="text-neutral-400 text-sm">
                    Interactive reference for all MailCord Discord slash commands and prefix commands.
                  </p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search commands, shortcuts, dev..."
                    value={commandSearch}
                    onChange={(e) => setCommandSearch(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
                  />
                  {commandSearch && (
                    <button
                      onClick={() => setCommandSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {BOT_COMMAND_CATEGORIES
                  .filter(cat => cat.id !== 'dev' || (user?.isDeveloper || user?.id === '560057266942902273'))
                  .map((cat) => {
                    const isDev = user?.isDeveloper || user?.id === '560057266942902273';
                    const activeList = BOT_COMMANDS.filter(c => c.category !== 'dev' || isDev);
                    const count = cat.id === 'all' 
                      ? activeList.length 
                      : activeList.filter(c => c.category === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCommandCategory(cat.id)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 border",
                          selectedCommandCategory === cat.id
                            ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                            : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:bg-neutral-800/80"
                        )}
                      >
                        <span>{cat.label}</span>
                        <span className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px]",
                          selectedCommandCategory === cat.id ? "bg-indigo-700 text-indigo-100" : "bg-neutral-800 text-neutral-500"
                        )}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>

              {/* Commands Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BOT_COMMANDS
                  .filter(cmd => {
                    const isDev = user?.isDeveloper || user?.id === '560057266942902273';
                    if (cmd.category === 'dev' && !isDev) return false;
                    const matchesCategory = selectedCommandCategory === 'all' || cmd.category === selectedCommandCategory;
                    const query = commandSearch.toLowerCase();
                    const matchesSearch = !query || 
                      cmd.name.toLowerCase().includes(query) || 
                      cmd.description.toLowerCase().includes(query) || 
                      cmd.shortcuts.some(s => s.toLowerCase().includes(query)) ||
                      cmd.example.toLowerCase().includes(query);
                    return matchesCategory && matchesSearch;
                  })
                  .map((cmd) => (
                    <div 
                      key={cmd.name}
                      className="bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700/90 rounded-2xl p-5 transition-all flex flex-col justify-between group space-y-4 shadow-sm hover:shadow-md hover:shadow-indigo-500/5"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="text-indigo-400 font-mono text-sm font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                              {cmd.name}
                            </code>
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-medium border uppercase tracking-wider",
                              cmd.role === 'Server Admin'
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : cmd.role === 'Developer'
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-neutral-800 text-neutral-400 border-neutral-700/60"
                            )}>
                              {cmd.role}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyCommand(cmd.name)}
                            className="text-neutral-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors shrink-0"
                            title="Copy command syntax"
                          >
                            {copiedCommand === cmd.name ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <p className="text-neutral-300 text-sm leading-relaxed">
                          {cmd.description}
                        </p>

                        {cmd.shortcuts.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[11px] text-neutral-500 font-medium">Shortcuts:</span>
                            {cmd.shortcuts.map(s => (
                              <code key={s} className="text-[11px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-800/80 hover:text-neutral-200">
                                {s}
                              </code>
                            ))}
                          </div>
                        )}

                        {cmd.params && cmd.params.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
                            {cmd.params.map(p => (
                              <div key={p.name} className="text-xs text-neutral-400 flex items-baseline gap-2">
                                <span className="font-mono text-indigo-300/90 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 shrink-0 font-medium">{p.name}</span>
                                <span className="text-neutral-500">•</span>
                                <span className="text-neutral-400 leading-snug">{p.desc}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-neutral-800/80">
                        <div className="bg-neutral-950 px-3.5 py-2.5 rounded-xl border border-neutral-800/90 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="text-indigo-400 font-bold shrink-0">$</span>
                            <code className="text-neutral-300 truncate">{cmd.example}</code>
                          </div>
                          <button
                            onClick={() => handleCopyCommand(cmd.example)}
                            className="text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-[11px] transition-colors shrink-0 border border-neutral-800 flex items-center gap-1"
                            title="Copy example"
                          >
                            {copiedCommand === cmd.example ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Copied
                              </span>
                            ) : (
                              <span>Copy</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Empty state for search */}
              {BOT_COMMANDS.filter(cmd => {
                const matchesCategory = selectedCommandCategory === 'all' || cmd.category === selectedCommandCategory;
                const query = commandSearch.toLowerCase();
                return matchesCategory && (!query || cmd.name.toLowerCase().includes(query) || cmd.description.toLowerCase().includes(query));
              }).length === 0 && (
                <div className="text-center py-16 bg-neutral-900 border border-neutral-800 rounded-2xl">
                  <Terminal className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-neutral-300 font-medium">No matching commands found</p>
                  <p className="text-xs text-neutral-500 mt-1">Try clearing your search query or selecting a different category.</p>
                </div>
              )}

              {/* Discord Tips Box */}
              <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Interactive Discord Integration
                  </h4>
                  <p className="text-sm text-neutral-300">
                    Did you know? Server admins can run <code className="bg-neutral-900 px-1.5 py-0.5 rounded text-indigo-300">/setup</code> to deploy interactive Discord buttons so members can generate aliases and manage inboxes without typing commands!
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'billing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12 pb-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500 mb-2">Billing & Upgrades</h1>
                  <p className="text-neutral-400">Unlock the full potential of MailCord with premium features.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-sm font-medium text-indigo-300">Current Plan: <span className="capitalize">{user?.plan || 'Free'}</span></span>
                  </div>
                  {new URLSearchParams(window.location.search).get('payment') === 'success' && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-400">Payment Successful! Your plan is being updated.</span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Personal Plans Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                    <User className="w-5 h-5 text-neutral-400" />
                  </div>
                  <h2 className="text-xl font-bold">Personal Upgrades</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  {/* Free Plan */}
                  <div className={cn(
                    "relative p-8 rounded-[2.5rem] border transition-all duration-300 group overflow-visible",
                    user?.plan === 'free' ? "bg-indigo-600/5 border-indigo-500/30 ring-1 ring-indigo-500/20" : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700"
                  )}>
                    {user?.plan === 'free' && (
                      <span className="absolute -top-3.5 left-8 px-3.5 py-1 rounded-full bg-indigo-600 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-indigo-600/30 z-20">Current</span>
                    )}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-neutral-400">Basic</h3>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-4xl font-black text-white">Free</span>
                        </div>
                      </div>
                      <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-sm text-neutral-300">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>1 Active Alias</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-neutral-300">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>Global Shared Inboxes</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-neutral-500 strikeout">
                          <X className="w-4 h-4" />
                          <span>No Smart OTP Detection</span>
                        </li>
                      </ul>
                      <button disabled className="w-full py-3 rounded-2xl bg-neutral-800 text-neutral-500 text-sm font-bold cursor-not-allowed">
                        {user?.plan === 'free' ? 'Default Plan' : 'Free Forever'}
                      </button>
                    </div>
                  </div>

                  {/* Premium Plan */}
                  <div className={cn(
                    "relative p-8 rounded-[2.5rem] border transition-all duration-300 group overflow-visible",
                    user?.plan === 'premium' ? "bg-indigo-600/5 border-indigo-500/30 ring-1 ring-indigo-500/20" : "bg-neutral-900/50 border-neutral-800 hover:border-indigo-500/50"
                  )}>
                    {user?.plan === 'premium' ? (
                      <span className="absolute -top-3.5 left-8 px-3.5 py-1 rounded-full bg-indigo-600 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-indigo-600/30 z-20">Current</span>
                    ) : (
                      <span className="absolute -top-3.5 right-8 px-3.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-[10px] font-bold uppercase tracking-wider text-neutral-300 shadow-md z-20">Popular</span>
                    )}
                    <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-indigo-600/20 transition-all" />
                    </div>
                    <div className="relative space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-indigo-400">Premium</h3>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-4xl font-black text-white">₹199</span>
                          <span className="text-neutral-500 font-medium">/mo</span>
                        </div>
                      </div>
                      <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-sm text-neutral-200">
                          <Check className="w-4 h-4 text-indigo-500" />
                          <span>5 Active Aliases</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-neutral-200">
                          <Check className="w-4 h-4 text-indigo-500" />
                          <span>Smart OTP Highlighting</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-neutral-200">
                          <Check className="w-4 h-4 text-indigo-500" />
                          <span>Ad-Free Experience</span>
                        </li>
                      </ul>
                      {user?.plan === 'premium' ? (
                        <button 
                          onClick={() => handleCancelPlan('user')}
                          className="w-full py-3 rounded-2xl bg-neutral-800 hover:bg-red-500/10 hover:text-red-400 text-neutral-400 text-sm font-bold transition-all"
                        >
                          Cancel Plan
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpgrade('premium', 'user')}
                          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
                        >
                          Upgrade Now
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Supreme Plan */}
                  <div className={cn(
                    "relative p-8 rounded-[2.5rem] border transition-all duration-300 group overflow-visible",
                    user?.plan === 'supreme' ? "bg-purple-600/5 border-purple-500/30 ring-1 ring-purple-500/20" : "bg-neutral-900/50 border-neutral-800 hover:border-purple-500/50"
                  )}>
                    {user?.plan === 'supreme' && (
                      <span className="absolute -top-3.5 left-8 px-3.5 py-1 rounded-full bg-purple-600 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-purple-600/30 z-20">Current</span>
                    )}
                    <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-purple-600/20 transition-all" />
                    </div>
                    <div className="relative space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-purple-400">Supreme</h3>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-4xl font-black text-white">₹499</span>
                          <span className="text-neutral-500 font-medium">/mo</span>
                        </div>
                      </div>
                      <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-sm text-neutral-200">
                          <Check className="w-4 h-4 text-purple-500" />
                          <span>Unlimited Aliases</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-neutral-200">
                          <Check className="w-4 h-4 text-purple-500" />
                          <span>Custom Domains (Coming)</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-neutral-200">
                          <Check className="w-4 h-4 text-purple-500" />
                          <span>Priority Support</span>
                        </li>
                      </ul>
                      {user?.plan === 'supreme' ? (
                        <button 
                          onClick={() => handleCancelPlan('user')}
                          className="w-full py-3 rounded-2xl bg-neutral-800 hover:bg-red-500/10 hover:text-red-400 text-neutral-400 text-sm font-bold transition-all"
                        >
                          Cancel Plan
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpgrade('supreme', 'user')}
                          className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all shadow-lg shadow-purple-500/20"
                        >
                          Go Supreme
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Server Plans Section */}
              <div className="space-y-8 pt-6 border-t border-neutral-800/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                      <Server className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Server Upgrades</h2>
                      <p className="text-sm text-neutral-500">Boost entire Discord communities.</p>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-72">
                    {user?.managedGuilds?.length > 0 ? (
                      <select 
                        value={selectedGuildId}
                        onChange={(e) => setSelectedGuildId(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white appearance-none cursor-pointer"
                      >
                        <option value="">-- Select a Server --</option>
                        {user.managedGuilds.map((g: any) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-xs text-neutral-500 italic p-3 bg-neutral-900/50 rounded-2xl border border-neutral-800 text-center">
                        No servers found to upgrade.
                      </div>
                    )}
                  </div>
                </div>

                {selectedGuildId ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Pro Plan */}
                      <div className={cn(
                        "relative p-8 rounded-[2.5rem] border bg-neutral-900/30 overflow-hidden",
                        selectedGuildPlan === 'pro' ? "border-blue-500/50 ring-1 ring-blue-500/20" : "border-neutral-800 hover:border-blue-500/30 transition-all"
                      )}>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Small Server</span>
                            <h3 className="text-2xl font-black text-white mt-1">Pro Plan</h3>
                          </div>
                          <div className="text-right">
                             <div className="text-2xl font-bold text-white">₹999</div>
                             <div className="text-xs text-neutral-500 font-medium">per month</div>
                          </div>
                        </div>
                        <ul className="grid grid-cols-2 gap-4 mb-8">
                          <li className="flex items-center gap-2 text-sm text-neutral-400">
                             <Check className="w-4 h-4 text-blue-500" />
                             <span>500 Members</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm text-neutral-400">
                             <Check className="w-4 h-4 text-blue-500" />
                             <span>High Priority</span>
                          </li>
                        </ul>
                        <div className="flex gap-3">
                          <button 
                            disabled={selectedGuildPlan === 'pro' || selectedGuildPlan === 'enterprise'}
                            onClick={() => handleUpgrade('pro', 'guild', selectedGuildId)}
                            className={cn(
                              "flex-1 py-4 rounded-2xl font-bold text-sm transition-all",
                              selectedGuildPlan === 'pro' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                            )}
                          >
                            {selectedGuildPlan === 'pro' ? 'Current Plan' : 'Select Pro'}
                          </button>
                          {selectedGuildPlan === 'pro' && (
                             <button 
                                onClick={() => handleCancelPlan('guild', selectedGuildId)}
                                className="p-4 rounded-2xl bg-neutral-800 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                             >
                               <X className="w-5 h-5" />
                             </button>
                          )}
                        </div>
                      </div>

                      {/* Enterprise Plan */}
                      <div className={cn(
                        "relative p-8 rounded-[2.5rem] border bg-neutral-900/30 overflow-hidden",
                        selectedGuildPlan === 'enterprise' ? "border-amber-500/50 ring-1 ring-amber-500/20" : "border-neutral-800 hover:border-amber-500/30 transition-all"
                      )}>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Large Server</span>
                            <h3 className="text-2xl font-black text-white mt-1">Enterprise</h3>
                          </div>
                          <div className="text-right">
                             <div className="text-2xl font-bold text-white">₹2499</div>
                             <div className="text-xs text-neutral-500 font-medium">per month</div>
                          </div>
                        </div>
                        <ul className="grid grid-cols-2 gap-4 mb-8">
                          <li className="flex items-center gap-2 text-sm text-neutral-400">
                             <Check className="w-4 h-4 text-amber-500" />
                             <span>Unlimited Members</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm text-neutral-400">
                             <Check className="w-4 h-4 text-amber-500" />
                             <span>Dedicated Infra</span>
                          </li>
                        </ul>
                        <div className="flex gap-3">
                          <button 
                            disabled={selectedGuildPlan === 'enterprise'}
                            onClick={() => handleUpgrade('enterprise', 'guild', selectedGuildId)}
                            className={cn(
                              "flex-1 py-4 rounded-2xl font-bold text-sm transition-all text-white",
                              selectedGuildPlan === 'enterprise' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-500/20"
                            )}
                          >
                            {selectedGuildPlan === 'enterprise' ? 'Current Plan' : 'Select Enterprise'}
                          </button>
                           {selectedGuildPlan === 'enterprise' && (
                             <button 
                                onClick={() => handleCancelPlan('guild', selectedGuildId)}
                                className="p-4 rounded-2xl bg-neutral-800 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                             >
                               <X className="w-5 h-5" />
                             </button>
                          )}
                        </div>
                      </div>
                   </div>
                ) : (
                  <div className="p-12 text-center rounded-[2.5rem] border border-dashed border-neutral-800 bg-neutral-900/20">
                    <p className="text-neutral-500">Please select a server above to view available upgrades.</p>
                  </div>
                )}
              </div>

              {/* Invoices Section */}
              <div className="pt-12 border-t border-neutral-800/50">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold">Transaction History</h3>
                   <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    <span>Securely stored</span>
                  </div>
                </div>
                {invoices.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl bg-neutral-900/30 border border-neutral-800">
                    <p className="text-neutral-500 text-sm">No recent transactions found.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                      {invoices.map((invoice: any) => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                          <div>
                            <p className="font-medium text-sm">{invoice.plan.toUpperCase()} Plan</p>
                            <p className="text-xs text-neutral-500">{new Date(invoice.date).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">₹{(invoice.amount / 100).toFixed(2)}</span>
                            <span className="text-xs px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 capitalize font-medium">{invoice.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          {/* Settings Tab... */}


          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 max-w-4xl"
            >
              <div>
                <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2.5">
                  <Settings className="w-6 h-6 text-indigo-400" />
                  Account Settings
                </h1>
                <p className="text-neutral-400 text-sm">
                  Customize your personal notification alerts, delivery privacy, and account security.
                </p>
              </div>

              {settingsSavedSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Your preferences have been saved and applied immediately across all your aliases.</span>
                </div>
              )}

              {settingsError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{settingsError}</span>
                </div>
              )}

              <div className="grid gap-6">
                {/* Profile Overview Card */}
                <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                  <h3 className="font-medium text-base text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    Discord Profile & Subscription
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div className="flex items-center gap-3">
                      {user?.avatar ? (
                        <img 
                          src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} 
                          className="w-12 h-12 rounded-full border border-neutral-700 shadow-sm" 
                          alt="avatar" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                          {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{user?.username || 'User'}</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {userSettings.plan || user?.plan || 'free'} Plan
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500 font-mono">ID: {user?.id}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('billing')}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-medium transition-colors border border-neutral-700 self-start sm:self-auto"
                    >
                      Manage Plan in Billing →
                    </button>
                  </div>
                </div>

                {/* Notification Delivery Card */}
                <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-5">
                  <div>
                    <h3 className="font-medium text-base text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-400" />
                      Discord Notifications
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Configure how the MailCord bot notifies you when incoming emails arrive.
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div className="space-y-0.5 pr-4">
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        <span>Direct Discord DM Alerts</span>
                        {userSettings.notify ? (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Enabled</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 font-medium">Muted</span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400">
                        Receive instant notifications from the MailCord bot whenever an email arrives at your aliases.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={userSettings.notify}
                      onClick={() => setUserSettings(prev => ({ ...prev, notify: !prev.notify }))}
                      className={cn(
                        "w-12 h-6.5 rounded-full transition-colors relative shrink-0 p-1 flex items-center cursor-pointer border focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
                        userSettings.notify ? "bg-indigo-600 border-indigo-500 shadow-sm shadow-indigo-600/30" : "bg-neutral-800 border-neutral-700"
                      )}
                    >
                      <span 
                        className="w-4.5 h-4.5 rounded-full bg-white shadow-md block pointer-events-none transition-transform duration-200 ease-in-out"
                        style={{
                          transform: userSettings.notify ? 'translateX(22px)' : 'translateX(0px)'
                        }}
                      />
                    </button>
                  </div>

                  {/* Keyword Alerts */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      High-Priority Keyword Triggers
                    </label>
                    <p className="text-xs text-neutral-400">
                      Add keywords (e.g. <code className="text-indigo-400">otp</code>, <code className="text-indigo-400">urgent</code>, <code className="text-indigo-400">security</code>, <code className="text-indigo-400">invoice</code>). When an email contains these words, you will receive an urgent notification.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a trigger word (e.g. otp, verification)..."
                        value={newKeywordInput}
                        onChange={(e) => setNewKeywordInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-medium transition-colors border border-neutral-700 shrink-0"
                      >
                        Add Tag
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1 min-h-[32px]">
                      {userSettings.notifyKeywords.length === 0 ? (
                        <span className="text-xs text-neutral-500 italic">No keyword alerts configured. You will receive standard notifications.</span>
                      ) : (
                        userSettings.notifyKeywords.map(kw => (
                          <span
                            key={kw}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                          >
                            <Tag className="w-3 h-3 text-indigo-400" />
                            {kw}
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(kw)}
                              className="text-neutral-400 hover:text-white ml-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Privacy & Routing Card */}
                <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                  <h3 className="font-medium text-base text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    Delivery & Privacy Mode
                  </h3>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div className="space-y-0.5 pr-4">
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        <span>Strict Privacy Mode</span>
                        {userSettings.privacyMode ? (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">Private DM Only</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 font-medium">Standard</span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400">
                        When enabled, all incoming emails bypass public/server channels and route strictly to your personal Discord DM.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={userSettings.privacyMode}
                      onClick={() => setUserSettings(prev => ({ ...prev, privacyMode: !prev.privacyMode }))}
                      className={cn(
                        "w-12 h-6.5 rounded-full transition-colors relative shrink-0 p-1 flex items-center cursor-pointer border focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
                        userSettings.privacyMode ? "bg-indigo-600 border-indigo-500 shadow-sm shadow-indigo-600/30" : "bg-neutral-800 border-neutral-700"
                      )}
                    >
                      <span 
                        className="w-4.5 h-4.5 rounded-full bg-white shadow-md block pointer-events-none transition-transform duration-200 ease-in-out"
                        style={{
                          transform: userSettings.privacyMode ? 'translateX(22px)' : 'translateX(0px)'
                        }}
                      />
                    </button>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Custom Webhook Destination (Optional)
                    </label>
                    <p className="text-xs text-neutral-400">
                      Forward raw email JSON payloads to an external Discord Webhook or custom API endpoint.
                    </p>
                    <input
                      type="url"
                      placeholder="https://discord.com/api/webhooks/... or https://api.yourdomain.com/webhook"
                      value={userSettings.privateAliasDestination}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, privateAliasDestination: e.target.value }))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Account Recovery Card */}
                <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                  <h3 className="font-medium text-base text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    Backup Contact & Recovery
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Provide backup contact information used to verify alias recovery requests or restore deleted email identities via <code className="text-indigo-400 font-mono">!alias recover</code>.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-neutral-400">Recovery Email</label>
                      <input
                        type="email"
                        placeholder="your.backup@gmail.com"
                        value={userSettings.recoveryEmail}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, recoveryEmail: e.target.value }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-neutral-400">Recovery Phone</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={userSettings.recoveryPhone}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, recoveryPhone: e.target.value }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Changes Footer */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSaveSettings()}
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                  >
                    {isSavingSettings ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Preferences</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Custom Domains Tab */}
          {activeTab === 'domains' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 max-w-4xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2.5">
                    <Globe className="w-6 h-6 text-indigo-400" />
                    Custom Domains
                  </h1>
                  <p className="text-neutral-400 text-sm">
                    Connect your own custom domains to receive email on branded addresses like <span className="text-indigo-300 font-mono">contact@yourdomain.com</span>.
                  </p>
                </div>
              </div>

              {domainStatusMessage && (
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-indigo-400" />
                  <span>{domainStatusMessage}</span>
                </div>
              )}

              {domainError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{domainError}</span>
                </div>
              )}

              {/* Add Domain Card */}
              <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                <h3 className="font-semibold text-base text-white flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-indigo-400" />
                  Link a New Domain
                </h3>
                <p className="text-xs text-neutral-400">
                  Enter your root domain or subdomain. Supreme tier or Enterprise tier required.
                </p>

                <form onSubmit={handleAddDomain} className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
                    <input
                      type="text"
                      required
                      value={newCustomDomain}
                      onChange={(e) => setNewCustomDomain(e.target.value)}
                      placeholder="e.g. mail.mybrand.com or mycompany.org"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingDomain || !newCustomDomain.trim()}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap"
                  >
                    {isAddingDomain ? 'Registering...' : 'Add Domain'}
                  </button>
                </form>
              </div>

              {/* DNS Instructions Card */}
              <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <h3 className="font-semibold text-base text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  DNS Setup Instructions
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Log into your DNS provider (Cloudflare, Namecheap, GoDaddy, Hostinger, Route53) and add the following records:
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                      <tr>
                        <th className="p-3">Type</th>
                        <th className="p-3">Name / Host</th>
                        <th className="p-3">Value / Target</th>
                        <th className="p-3">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                      <tr>
                        <td className="p-3 font-semibold text-indigo-400">MX</td>
                        <td className="p-3">@ (or subdomain)</td>
                        <td className="p-3 select-all">isaac.mx.cloudflare.net</td>
                        <td className="p-3">10</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-indigo-400">MX</td>
                        <td className="p-3">@ (or subdomain)</td>
                        <td className="p-3 select-all">linda.mx.cloudflare.net</td>
                        <td className="p-3">20</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-indigo-400">TXT</td>
                        <td className="p-3">@ (or subdomain)</td>
                        <td className="p-3 select-all font-mono">v=spf1 include:_spf.mx.cloudflare.net ~all</td>
                        <td className="p-3 text-neutral-600">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Registered Domains Table */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Configured Domains
                </h3>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-950/50 text-neutral-400 border-b border-neutral-800">
                      <tr>
                        <th className="px-6 py-4 font-medium">Domain Name</th>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {/* System Domains */}
                      {systemDomains.map((sys: any) => (
                        <tr key={sys.domain} className="hover:bg-neutral-800/40 transition-colors">
                          <td className="px-6 py-4 font-mono font-medium text-white flex items-center gap-2">
                            <span>@{sys.domain}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">System Default</span>
                          </td>
                          <td className="px-6 py-4 text-neutral-400 text-xs">Shared Infrastructure</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Active & Routed
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-xs text-neutral-500">Global</td>
                        </tr>
                      ))}

                      {/* Custom User Domains */}
                      {userDomains.length === 0 && systemDomains.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-neutral-500 text-sm">
                            No custom domains configured yet.
                          </td>
                        </tr>
                      )}

                      {userDomains.map((domain: any) => (
                        <tr key={domain._id} className="hover:bg-neutral-800/40 transition-colors">
                          <td className="px-6 py-4 font-mono font-medium text-white">
                            @{domain.domain}
                          </td>
                          <td className="px-6 py-4 text-neutral-400 text-xs">Custom Domain</td>
                          <td className="px-6 py-4">
                            {domain.verified ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Clock className="w-3.5 h-3.5" />
                                Pending DNS
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!domain.verified && (
                                <button
                                  onClick={() => handleVerifyDomain(domain._id)}
                                  disabled={verifyingDomainId === domain._id}
                                  className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition-colors"
                                >
                                  {verifyingDomainId === domain._id ? 'Verifying...' : 'Verify DNS'}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteDomain(domain._id)}
                                className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete domain"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Master Developer Control Center Tab */}
          {activeTab === 'developer' && user?.isDeveloper && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-neutral-900 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      MASTER DEVELOPER CONSOLE
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Nebula Engine Intelligence & Control</h1>
                  <p className="text-xs text-neutral-400">
                    Real-time telemetry, user subscription overrides, instant key generation, and cluster routing.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { fetchDevOverview(); fetchDevUsers(); fetchDevKeys(); fetchDomains(); }}
                    disabled={devLoading}
                    className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", devLoading ? "animate-spin" : "")} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {devActionMsg && (
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm flex items-center gap-3 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-purple-400" />
                  <span>{devActionMsg}</span>
                </div>
              )}

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="text-neutral-400 text-xs flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Total Users</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{devOverview?.totalUsers ?? '...'}</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="text-neutral-400 text-xs flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Active Aliases</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{devOverview?.totalAliases ?? '...'}</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="text-neutral-400 text-xs flex items-center gap-1.5">
                    <Inbox className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Inbound Mails</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{devOverview?.totalEmails ?? '...'}</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="text-neutral-400 text-xs flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    <span>Unused Keys</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-300">{devOverview?.activeKeys ?? '...'}</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="text-neutral-400 text-xs flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Domains</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{devOverview?.totalDomains ?? '...'}</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="text-neutral-400 text-xs flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    <span>RAM Heap</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{devOverview?.memory?.heapUsedMb ? `${devOverview.memory.heapUsedMb} MB` : '...'}</div>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto">
                {[
                  { id: 'overview', label: 'User Directory & Tiers', icon: Users },
                  { id: 'keys', label: 'License Keys Minting', icon: Key },
                  { id: 'domains', label: 'Global Domains', icon: Globe },
                  { id: 'servers', label: 'Server Subscriptions', icon: Server }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setDevSubTab(t.id as any)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap",
                      devSubTab === t.id
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                        : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                    )}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Sub Tab: Users */}
              {devSubTab === 'overview' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-500" />
                      <input
                        type="text"
                        value={devUserSearch}
                        onChange={(e) => setDevUserSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchDevUsers()}
                        placeholder="Search by Discord ID or Recovery Email..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                    <button
                      onClick={() => fetchDevUsers()}
                      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-medium border border-neutral-800 flex items-center gap-2"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Search</span>
                    </button>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-950/70 text-neutral-400 border-b border-neutral-800">
                        <tr>
                          <th className="px-5 py-3.5 font-medium">Discord ID</th>
                          <th className="px-5 py-3.5 font-medium">Plan Tier</th>
                          <th className="px-5 py-3.5 font-medium">Expiration</th>
                          <th className="px-5 py-3.5 font-medium">Aliases</th>
                          <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {devUsers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-5 py-8 text-center text-neutral-500">
                              No users found.
                            </td>
                          </tr>
                        )}
                        {devUsers.map((u: any) => (
                          <tr key={u.discordId} className="hover:bg-neutral-800/40 transition-colors">
                            <td className="px-5 py-3.5 font-mono text-neutral-200">
                              <span className="font-semibold text-white">{u.discordId}</span>
                              {u.recoveryEmail && <span className="block text-[10px] text-neutral-500">{u.recoveryEmail}</span>}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={cn(
                                "px-2 py-0.5 rounded font-bold uppercase text-[10px] border",
                                u.plan === 'supreme' ? "bg-purple-500/20 text-purple-300 border-purple-500/40" :
                                u.plan === 'premium' ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" :
                                "bg-neutral-800 text-neutral-400 border-neutral-700"
                              )}>
                                {u.plan}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-neutral-400">
                              {u.expiresAt ? new Date(u.expiresAt).toLocaleDateString() : 'Indefinite / Free'}
                            </td>
                            <td className="px-5 py-3.5 text-neutral-300 font-semibold font-mono">
                              {u.aliasCount} active
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setDevSelectedUser(u);
                                    setDevUserNewPlan(u.plan === 'free' ? 'supreme' : u.plan);
                                  }}
                                  className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-semibold transition-colors"
                                >
                                  Modify Tier
                                </button>
                                <button
                                  onClick={() => handleResetDevUser(u.discordId)}
                                  className="px-2.5 py-1 bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-300 rounded-lg text-[11px] font-medium transition-colors"
                                >
                                  Reset
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Modal for Modifying User Plan */}
                  {devSelectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                          <h3 className="font-semibold text-white text-sm">Override Plan for {devSelectedUser.discordId}</h3>
                          <button onClick={() => setDevSelectedUser(null)} className="text-neutral-400 hover:text-white">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-neutral-400 mb-1 font-medium">Select Plan Tier</label>
                            <select
                              value={devUserNewPlan}
                              onChange={(e) => setDevUserNewPlan(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
                            >
                              <option value="free">Free Tier</option>
                              <option value="premium">Premium Tier</option>
                              <option value="supreme">Supreme Tier</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-neutral-400 mb-1 font-medium">Duration (Days)</label>
                            <input
                              type="number"
                              value={devUserNewDays}
                              onChange={(e) => setDevUserNewDays(parseInt(e.target.value) || 30)}
                              className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            onClick={() => setDevSelectedUser(null)}
                            className="px-3 py-1.5 rounded-xl text-neutral-400 hover:text-white text-xs font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateUserPlan(devSelectedUser.discordId, devUserNewPlan, devUserNewDays)}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                          >
                            Apply Plan
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sub Tab: Keys */}
              {devSubTab === 'keys' && (
                <div className="space-y-6">
                  {/* Mint Card */}
                  <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                    <h3 className="font-semibold text-base text-white flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-purple-400" />
                      Mint License Key
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1.5 font-medium">Plan Tier</label>
                        <select
                          value={devKeyPlan}
                          onChange={(e) => setDevKeyPlan(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
                        >
                          <option value="premium">Premium Tier (Personal)</option>
                          <option value="supreme">Supreme Tier (Pro Identity)</option>
                          <option value="enterprise">Enterprise Tier (Server-Wide)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-neutral-400 mb-1.5 font-medium">Duration (Days)</label>
                        <input
                          type="number"
                          value={devKeyDuration}
                          onChange={(e) => setDevKeyDuration(parseInt(e.target.value) || 30)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={handleGenerateDevKey}
                          disabled={devLoading}
                          className="w-full px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Key className="w-4 h-4" />
                          <span>Mint License Key</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Keys Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-white">Generated Keys Vault</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setDevKeyFilter('unused'); }}
                          className={cn(
                            "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                            devKeyFilter === 'unused' ? "bg-purple-600 text-white" : "bg-neutral-900 text-neutral-400 hover:text-white"
                          )}
                        >
                          Unused Only
                        </button>
                        <button
                          onClick={() => { setDevKeyFilter('all'); }}
                          className={cn(
                            "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                            devKeyFilter === 'all' ? "bg-purple-600 text-white" : "bg-neutral-900 text-neutral-400 hover:text-white"
                          )}
                        >
                          All Keys
                        </button>
                      </div>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-950/70 text-neutral-400 border-b border-neutral-800">
                          <tr>
                            <th className="px-5 py-3.5 font-medium">License Key</th>
                            <th className="px-5 py-3.5 font-medium">Plan</th>
                            <th className="px-5 py-3.5 font-medium">Days</th>
                            <th className="px-5 py-3.5 font-medium">Status</th>
                            <th className="px-5 py-3.5 font-medium text-right">Revoke</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 font-mono">
                          {devKeys.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-5 py-8 text-center text-neutral-500 font-sans">
                                No keys found matching filter.
                              </td>
                            </tr>
                          )}
                          {devKeys.map((k: any) => (
                            <tr key={k.code} className="hover:bg-neutral-800/40 transition-colors">
                              <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                                <span>{k.code}</span>
                                <button
                                  onClick={() => handleCopy(k.code, k.code)}
                                  className="text-neutral-500 hover:text-purple-300"
                                  title="Copy key"
                                >
                                  {copiedId === k.code ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                              <td className="px-5 py-3.5 uppercase font-sans text-neutral-300 font-semibold">
                                {k.plan}
                              </td>
                              <td className="px-5 py-3.5 text-neutral-400">
                                {k.durationDays || 30}d
                              </td>
                              <td className="px-5 py-3.5 font-sans">
                                {k.used ? (
                                  <span className="text-neutral-500">Used by {k.usedBy}</span>
                                ) : (
                                  <span className="text-emerald-400 font-medium">Active / Unredeemed</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-right font-sans">
                                <button
                                  onClick={() => handleDeleteDevKey(k.code)}
                                  className="p-1 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                  title="Delete key"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub Tab: Global Domains */}
              {devSubTab === 'domains' && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                    <h3 className="font-semibold text-base text-white flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-purple-400" />
                      Add Global System Domain
                    </h3>
                    <p className="text-xs text-neutral-400">
                      System domains become available in the alias creation dropdown for all server members and users.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="text"
                        value={devNewSysDomain}
                        onChange={(e) => setDevNewSysDomain(e.target.value)}
                        placeholder="e.g. mail.devtushar.uk"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={handleAddSystemDomain}
                        disabled={devLoading || !devNewSysDomain.trim()}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold whitespace-nowrap shadow-lg shadow-purple-600/20"
                      >
                        Register Global Domain
                      </button>
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-950/70 text-neutral-400 border-b border-neutral-800">
                        <tr>
                          <th className="px-5 py-3.5 font-medium">Domain</th>
                          <th className="px-5 py-3.5 font-medium">Type</th>
                          <th className="px-5 py-3.5 font-medium">Routing Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800 font-mono">
                        {systemDomains.map((d: any) => (
                          <tr key={d.domain} className="hover:bg-neutral-800/40 transition-colors">
                            <td className="px-5 py-3.5 font-bold text-white">@{d.domain}</td>
                            <td className="px-5 py-3.5 text-neutral-400 font-sans">Global System Domain</td>
                            <td className="px-5 py-3.5 text-emerald-400 font-sans font-medium">Active & Enabled</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub Tab: Server Subscriptions */}
              {devSubTab === 'servers' && (
                <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 max-w-xl">
                  <h3 className="font-semibold text-base text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-purple-400" />
                    Server-Wide Plan Override
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Directly elevate any Discord Guild to Pro or Enterprise tier.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1 font-medium">Discord Server / Guild ID</label>
                      <input
                        type="text"
                        value={devServerGuildId}
                        onChange={(e) => setDevServerGuildId(e.target.value)}
                        placeholder="e.g. 879413373261983776"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-400 mb-1 font-medium">Server Plan Tier</label>
                      <select
                        value={devServerPlan}
                        onChange={(e) => setDevServerPlan(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
                      >
                        <option value="free">Free Server</option>
                        <option value="pro">Pro Server</option>
                        <option value="enterprise">Enterprise Server</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-400 mb-1 font-medium">Duration (Days)</label>
                      <input
                        type="number"
                        value={devServerDays}
                        onChange={(e) => setDevServerDays(parseInt(e.target.value) || 30)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <button
                      onClick={handleUpdateServerPlan}
                      disabled={devLoading || !devServerGuildId.trim()}
                      className="w-full px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-lg shadow-purple-600/20"
                    >
                      Update Server Plan
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* Email Reader Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedEmail(null)}
          />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-neutral-800 bg-neutral-950/70">
              <div className="space-y-2 pr-4 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {selectedEmail.alias}@bot.devtushar.uk
                  </span>
                  {selectedEmail.category && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700 capitalize">
                      {selectedEmail.category}
                    </span>
                  )}
                  {selectedEmail.spamScore !== undefined && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      selectedEmail.spamScore > 80 
                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                        : selectedEmail.spamScore > 40
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      Spam Score: {selectedEmail.spamScore}%
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight break-words">
                  {selectedEmail.subject || '(No Subject)'}
                </h2>
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-neutral-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-500 font-medium">From:</span>
                    <span className="text-neutral-200 font-mono bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700/60 select-all">
                      {selectedEmail.from}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-2 text-neutral-400 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 rounded-xl transition-colors shrink-0"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Summary Banner if present */}
            {selectedEmail.summary && (
              <div className="mx-6 mt-4 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    AI Summary & Insights
                  </h4>
                  <p className="text-sm text-neutral-300 leading-relaxed">{selectedEmail.summary}</p>
                </div>
              </div>
            )}

            {/* Body Toolbar */}
            <div className="px-6 pt-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Message Content
              </span>
              <div className="flex items-center gap-2">
                {selectedEmail.body && (selectedEmail.body.includes('<html') || selectedEmail.body.includes('<div') || selectedEmail.body.includes('<p>')) && (
                  <button
                    onClick={() => setViewHtml(!viewHtml)}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs transition-colors border border-neutral-700"
                  >
                    {viewHtml ? 'Show Plain Text' : 'Show Formatted HTML'}
                  </button>
                )}
                <button
                  onClick={() => {
                    const parsed = splitEmailBody(selectedEmail.body);
                    navigator.clipboard.writeText(showQuotedText ? (selectedEmail.body || '') : (parsed.mainText || selectedEmail.body || ''));
                    setEmailCopied(true);
                    setTimeout(() => setEmailCopied(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs transition-colors border border-neutral-700 flex items-center gap-1.5"
                >
                  {emailCopied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Message</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Email Body Content */}
            <div className="p-6 pt-3 overflow-y-auto flex-1">
              {(() => {
                const isHtml = selectedEmail.body && (selectedEmail.body.includes('<html') || selectedEmail.body.includes('<div') || selectedEmail.body.includes('<p>'));
                
                if (viewHtml && isHtml) {
                  return (
                    <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-6 overflow-x-auto min-h-[220px]">
                      <iframe
                        srcDoc={`<!DOCTYPE html><html><head><base target="_blank"><style>body{color:#d4d4d4;font-family:system-ui,-apple-system,sans-serif;margin:0;padding:8px;background:transparent;word-break:break-word;line-height:1.6;}a{color:#818cf8;}</style></head><body>${selectedEmail.body}</body></html>`}
                        sandbox="allow-same-origin"
                        className="w-full min-h-[350px] bg-transparent border-0 rounded-lg"
                        title="Rendered Email Content"
                      />
                    </div>
                  );
                }

                const { mainText, quotedText, isThreadReply } = splitEmailBody(selectedEmail.body);

                return (
                  <div className="space-y-4">
                    {/* Latest Message Card */}
                    <div className="bg-neutral-950/90 border border-neutral-800 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-3 border-b border-neutral-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                            {isThreadReply ? 'Latest Reply' : 'Message Content'}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500">
                          Sender: <span className="text-neutral-300 font-mono">{selectedEmail.from}</span>
                        </span>
                      </div>
                      <div className="text-neutral-100 text-sm font-sans whitespace-pre-wrap break-words leading-relaxed selection:bg-indigo-500/30">
                        {mainText}
                      </div>
                    </div>

                    {/* Quoted Email Thread / History */}
                    {quotedText && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setShowQuotedText(!showQuotedText)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-800/90 hover:bg-neutral-800 text-xs font-medium text-neutral-300 hover:text-white rounded-lg border border-neutral-700/70 transition-all shadow-sm"
                        >
                          <span className="font-mono tracking-widest text-indigo-400 font-bold">•••</span>
                          <span>{showQuotedText ? 'Hide Quoted History' : 'Show Quoted History (Earlier Emails)'}</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-neutral-400 ${showQuotedText ? 'rotate-180' : ''}`} />
                        </button>

                        {showQuotedText && (
                          <div className="mt-3 bg-neutral-950/70 border-l-2 border-indigo-500/60 border-t border-r border-b border-neutral-800 rounded-r-xl p-5 space-y-2">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 pb-2 border-b border-neutral-800/60">
                              <History className="w-3.5 h-3.5 text-indigo-400" />
                              Previous Messages in this Thread
                            </div>
                            <pre className="text-xs text-neutral-400 font-mono whitespace-pre-wrap break-words leading-relaxed overflow-x-auto pt-1">
                              {quotedText}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
              <div className="text-xs text-neutral-500">
                Message ID: <span className="font-mono text-neutral-400">{selectedEmail._id}</span>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Processing Overlay */}
      {isPreparingGateway && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Initializing Gateway</h3>
            <p className="text-neutral-400 text-sm">Please wait while we secure your connection...</p>
          </div>
        </div>
      )}
    </div>
  );
}
