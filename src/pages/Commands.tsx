import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Terminal, 
  Search, 
  Copy, 
  CheckCircle2, 
  X, 
  Shield, 
  Zap, 
  MessageSquare, 
  ExternalLink, 
  ArrowRight, 
  BookOpen, 
  Bot, 
  Filter,
  Sparkles,
  Command,
  Layers,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { BOT_COMMANDS, BOT_COMMAND_CATEGORIES, BotCommand } from '../data/botCommands';
import { Link } from 'react-router-dom';

export default function Commands() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRole, setSelectedRole] = useState<'all' | 'Everyone' | 'Server Admin' | 'Developer'>('all');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [isDeveloper, setIsDeveloper] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => (res.ok ? res.json() : null))
      .then(user => {
        if (user && (user.isDeveloper || user.id === '560057266942902273')) {
          setIsDeveloper(true);
        }
      })
      .catch(() => {});
  }, []);

  // Command Generator State
  const [testerCommand, setTesterCommand] = useState<string>('!alias create <name>');
  const [testerParamValue, setTesterParamValue] = useState('shopping');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(text);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const accessibleCommands = BOT_COMMANDS.filter((cmd) => {
    if (cmd.category === 'dev' || cmd.role === 'Developer') {
      return isDeveloper;
    }
    return true;
  });

  const filteredCommands = accessibleCommands.filter((cmd) => {
    const matchesCategory = selectedCategory === 'all' || cmd.category === selectedCategory;
    const matchesRole = selectedRole === 'all' || cmd.role === selectedRole;
    
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      cmd.name.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query) ||
      cmd.shortcuts.some(s => s.toLowerCase().includes(query)) ||
      cmd.example.toLowerCase().includes(query) ||
      cmd.params?.some(p => p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query));

    return matchesCategory && matchesRole && matchesQuery;
  });

  const getActiveGeneratedCommand = () => {
    if (testerCommand.includes('<name>') || testerCommand.includes('<old>') || testerCommand.includes('<query>') || testerCommand.includes('<alias>')) {
      return testerCommand.replace(/<[^>]+>/, testerParamValue.trim() || 'my-alias');
    }
    return testerCommand;
  };

  return (
    <Layout>
      <div className="relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 pt-16 pb-24 relative z-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Bot className="w-3.5 h-3.5" />
              <span>MailCord Bot Directory</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Bot Commands Reference
            </h1>
            
            <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
              Complete command directory for MailCord. Manage custom email aliases, private inboxes, security locks, and server settings directly from Discord.
            </p>

            {/* Quick Metrics */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-neutral-200">{accessibleCommands.length} Commands Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Prefix (<code className="text-indigo-300">!</code>) & Slash (<code className="text-indigo-300">/</code>)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Instant Clip &amp; Paste</span>
              </div>
            </div>
          </div>

          {/* Interactive Command Builder Banner */}
          <div className="mb-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 border border-neutral-800 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-md">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Interactive Command Tester</span>
                </div>
                <h3 className="text-xl font-bold text-white">Generate Your Command Instantly</h3>
                <p className="text-xs sm:text-sm text-neutral-400">
                  Select a template, customize your alias or keyword, and copy the ready-to-run Discord string directly.
                </p>
              </div>

              <div className="flex-1 max-w-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">Select Command</label>
                    <div className="relative">
                      <select
                        value={testerCommand}
                        onChange={(e) => setTesterCommand(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-indigo-500 appearance-none pr-8 cursor-pointer"
                      >
                        <option value="!alias create <name>">!alias create &lt;name&gt;</option>
                        <option value="!alias generate">!alias generate</option>
                        <option value="!inbox history <name>">!inbox history &lt;name&gt;</option>
                        <option value="!alias lock <name>">!alias lock &lt;name&gt;</option>
                        <option value="!inbox search <query>">!inbox search &lt;query&gt;</option>
                        <option value="!test <alias>">!test &lt;alias&gt;</option>
                        {isDeveloper && <option value="!listc dev">!listc dev</option>}
                      </select>
                      <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">Parameter Value</label>
                    <input
                      type="text"
                      value={testerParamValue}
                      onChange={(e) => setTesterParamValue(e.target.value)}
                      placeholder="e.g. shopping, otp, netflix"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Output pill with copy */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-neutral-950 border border-indigo-500/30">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-neutral-500 font-mono text-xs select-none">$</span>
                    <code className="text-xs sm:text-sm font-mono text-indigo-300 truncate">
                      {getActiveGeneratedCommand()}
                    </code>
                  </div>
                  <button
                    onClick={() => handleCopy(getActiveGeneratedCommand())}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shrink-0 shadow-sm shadow-indigo-600/30"
                  >
                    {copiedCommand === getActiveGeneratedCommand() ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="space-y-4 mb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-lg">
                <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by command, keyword, shortcut (e.g. create, lock, otp)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl pl-11 pr-10 py-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Role Filter */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-xs text-neutral-500 font-medium">Access:</span>
                {(['all', 'Everyone', 'Server Admin', ...(isDeveloper ? ['Developer' as const] : [])]).map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
                      selectedRole === role
                        ? "bg-neutral-800 text-white border-neutral-700 shadow-sm"
                        : "bg-neutral-900/50 text-neutral-400 border-neutral-800/80 hover:text-neutral-200"
                    )}
                  >
                    {role === 'all' ? 'All Roles' : role}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {BOT_COMMAND_CATEGORIES
                .filter(cat => cat.id !== 'dev' || isDeveloper)
                .map((cat) => {
                  const count = cat.id === 'all'
                    ? accessibleCommands.length
                    : accessibleCommands.filter(c => c.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 border",
                        selectedCategory === cat.id
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                          : "bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:bg-neutral-800/60"
                      )}
                    >
                      <span>{cat.label}</span>
                      <span className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px]",
                        selectedCategory === cat.id ? "bg-indigo-700 text-indigo-100" : "bg-neutral-800 text-neutral-400"
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Results Counter */}
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-6 px-1">
            <span>Showing <strong className="text-neutral-300">{filteredCommands.length}</strong> commands</span>
            {(searchQuery || selectedCategory !== 'all' || selectedRole !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedRole('all');
                }}
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Commands Grid */}
          {filteredCommands.length === 0 ? (
            <div className="text-center py-20 bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 space-y-3">
              <Terminal className="w-12 h-12 text-neutral-600 mx-auto" />
              <h3 className="text-lg font-semibold text-neutral-300">No commands found</h3>
              <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                No commands matched "{searchQuery}". Try searching for aliases, history, locks, or reset your filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedRole('all');
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCommands.map((cmd) => (
                <div
                  key={cmd.name}
                  className="bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 rounded-3xl p-6 transition-all flex flex-col justify-between group space-y-5 shadow-lg backdrop-blur-sm"
                >
                  <div className="space-y-4">
                    {/* Top Row: Command name & Role badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-indigo-400 font-mono text-sm sm:text-base font-bold bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
                          {cmd.name}
                        </code>
                        <span className={cn(
                          "text-[10px] px-2.5 py-0.5 rounded-full font-semibold border uppercase tracking-wider",
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
                        onClick={() => handleCopy(cmd.name)}
                        className="text-neutral-500 hover:text-indigo-400 p-2 rounded-xl hover:bg-neutral-800 transition-colors shrink-0"
                        title="Copy syntax"
                      >
                        {copiedCommand === cmd.name ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-neutral-300 text-sm leading-relaxed">
                      {cmd.description}
                    </p>

                    {/* Shortcuts if any */}
                    {cmd.shortcuts.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="text-neutral-500 text-[11px] font-medium">Shortcuts:</span>
                        {cmd.shortcuts.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleCopy(s)}
                            className="bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 font-mono text-[11px] px-2 py-0.5 rounded-md border border-neutral-800 transition-colors"
                            title="Click to copy shortcut"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Parameters Table */}
                    {cmd.params && cmd.params.length > 0 && (
                      <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Parameters</span>
                        <div className="space-y-1.5">
                          {cmd.params.map((p) => (
                            <div key={p.name} className="flex items-baseline gap-2 text-xs">
                              <code className="text-indigo-300 font-mono font-semibold bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 shrink-0">
                                {p.name}
                              </code>
                              <span className="text-neutral-400 text-xs">{p.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Simulated Discord Embed Box */}
                  <div className="pt-3 border-t border-neutral-800/80">
                    <div className="bg-neutral-950 rounded-2xl p-3.5 border border-neutral-800/90 font-mono text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          Discord Example
                        </span>
                        <button
                          onClick={() => handleCopy(cmd.example)}
                          className="hover:text-neutral-300 transition-colors"
                        >
                          {copiedCommand === cmd.example ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="text-neutral-300 pt-0.5">
                        <span className="text-indigo-400">&gt; </span>{cmd.example}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Call To Action */}
          <div className="mt-20 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-900/30 via-neutral-900 to-purple-900/20 border border-neutral-800 text-center space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            
            <div className="max-w-xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Integrate MailCord into Your Discord Server
              </h2>
              <p className="text-sm sm:text-base text-neutral-400">
                Type <code className="text-indigo-300 bg-neutral-950 px-2 py-0.5 rounded">/setup</code> once the bot joins to deploy your interactive email management button.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                <span>Open Web Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/docs"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-medium text-sm transition-all border border-neutral-700 flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Read Full Documentation</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
