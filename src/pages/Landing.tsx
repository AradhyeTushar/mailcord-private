import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Shield, Zap, MessageSquare, Users, Settings, Lock, FileText } from 'lucide-react';
import Layout from '../components/Layout';

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('discord_token', token);
      window.history.replaceState({}, document.title, '/');
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <Layout>
      <main className="flex-1">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-8 border border-indigo-500/20"
          >
            <Shield className="w-4 h-4" />
            <span>Secure & Anonymous</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-[1.1]"
          >
            Private Messaging System <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              for Your Discord Server
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-neutral-400 mb-10 max-w-2xl mx-auto"
          >
            Let users create aliases and receive anonymous messages securely inside Discord. Perfect for support tickets, confessions, and private feedback.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a href="https://discord.com/api/oauth2/authorize?client_id=1489402992393453678&permissions=8&scope=bot%20applications.commands" target="_blank" rel="noreferrer" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-all shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]">
              Add Bot
            </a>
            <Link to="/commands" className="w-full sm:w-auto px-8 py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full font-medium transition-all border border-neutral-800 text-center">
              View Commands
            </Link>
          </motion.div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="max-w-7xl mx-auto px-6 mt-20 pt-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">A seamless, private messaging experience built entirely within Discord.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "User creates alias",
                description: "A user generates a unique, anonymous alias using a simple slash command.",
                icon: <Settings className="w-6 h-6 text-indigo-400" />
              },
              {
                step: "02",
                title: "Others send messages",
                description: "Community members send messages to that alias without knowing the real identity.",
                icon: <MessageSquare className="w-6 h-6 text-blue-400" />
              },
              {
                step: "03",
                title: "Delivered privately",
                description: "Messages are routed directly to the alias owner's private inbox channel.",
                icon: <Lock className="w-6 h-6 text-emerald-400" />
              },
              {
                step: "04",
                title: "Admins monitor",
                description: "Server admins can monitor logs and moderate content if necessary.",
                icon: <Shield className="w-6 h-6 text-amber-400" />
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800 flex flex-col items-center text-center"
              >
                <div className="absolute -top-4 bg-neutral-950 border border-neutral-800 text-neutral-400 font-mono text-sm px-3 py-1 rounded-full">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mb-4 mt-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="max-w-7xl mx-auto px-6 mt-32 pt-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Features</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">Everything you need to run a secure, anonymous messaging system.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Users className="w-6 h-6 text-indigo-400" />,
                title: "Alias Creation System",
                description: "Users can instantly generate and manage multiple anonymous aliases for different purposes."
              },
              {
                icon: <Lock className="w-6 h-6 text-emerald-400" />,
                title: "Anonymous Messaging",
                description: "Send and receive messages without ever exposing your real Discord username or tag."
              },
              {
                icon: <Mail className="w-6 h-6 text-blue-400" />,
                title: "Inbox Management",
                description: "Each alias gets a dedicated private channel acting as an inbox for easy organization."
              },
              {
                icon: <Settings className="w-6 h-6 text-purple-400" />,
                title: "Admin Controls",
                description: "Powerful configuration options to restrict alias creation, set limits, and manage roles."
              },
              {
                icon: <Shield className="w-6 h-6 text-amber-400" />,
                title: "Anti-Spam Protection",
                description: "Built-in rate limiting and filtering to prevent abuse and keep your server clean."
              },
              {
                icon: <FileText className="w-6 h-6 text-cyan-400" />,
                title: "Logging & Moderation",
                description: "Comprehensive audit logs allow moderators to track abuse while respecting privacy."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800 hover:bg-neutral-900 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Use Cases Section */}
        <div id="use-cases" className="max-w-7xl mx-auto px-6 mt-32 pt-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Perfect For Any Community</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">Adapt MailCord to fit your server's unique needs.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-indigo-900/20 to-neutral-900/50 border border-indigo-500/20 rounded-3xl p-8">
              <MessageSquare className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Confession Systems</h3>
              <p className="text-neutral-400 leading-relaxed">
                Allow users to submit anonymous confessions or stories safely. Moderators can review submissions before they go public, ensuring a healthy environment.
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-neutral-900/50 border border-emerald-500/20 rounded-3xl p-8">
              <Shield className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Support Tickets</h3>
              <p className="text-neutral-400 leading-relaxed">
                Create a private channel for users to contact server staff anonymously. Great for reporting sensitive issues or harassment without fear of retaliation.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-neutral-900/50 border border-blue-500/20 rounded-3xl p-8">
              <FileText className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Feedback Collection</h3>
              <p className="text-neutral-400 leading-relaxed">
                Gather honest, unfiltered feedback about your server, events, or staff. Users are more likely to share constructive criticism when their identity is protected.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/20 to-neutral-900/50 border border-purple-500/20 rounded-3xl p-8">
              <Lock className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Private Communication</h3>
              <p className="text-neutral-400 leading-relaxed">
                Enable roleplay servers, gaming clans, or large communities to have in-character or compartmentalized communication streams using aliases.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-6 mt-32 mb-32">
          <div className="bg-indigo-600 rounded-[3rem] p-12 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to upgrade your server?</h2>
              <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">
                Join thousands of communities using MailCord to manage private, anonymous communication safely.
              </p>
              <a href="https://discord.com/api/oauth2/authorize?client_id=1489402992393453678&permissions=8&scope=bot%20applications.commands" target="_blank" rel="noreferrer" className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl">
                Add Bot to Server
              </a>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
