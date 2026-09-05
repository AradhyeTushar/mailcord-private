import React, { useState, useEffect } from 'react';
import { Mail, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (err) {
        console.error('Auth check failed', err);
      }
    };
    checkAuth();

    // Listen for login success messages from the popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkAuth();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/discord/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Failed to initiate login. Make sure your Discord Client Secret is set.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto text-neutral-50 font-sans">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0">
        <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight">MailCord</span>
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-400 mx-8">
        <Link to="/commands" className="hover:text-white transition-all hover:scale-105">Commands</Link>
        <Link to="/pricing" className="hover:text-white transition-all hover:scale-105">Pricing</Link>
        <Link to="/docs" className="hover:text-white transition-all hover:scale-105">Docs</Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 shrink-0">
        {user ? (
          <>
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link 
              to="/settings" 
              className="flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button 
              onClick={handleLogout}
              className="group flex items-center gap-2 text-sm font-bold bg-neutral-900 text-neutral-400 px-5 py-2.5 rounded-full hover:bg-neutral-800 hover:text-white transition-all border border-neutral-800"
            >
              <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
              Logout
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={handleLogin} 
              className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Login
            </button>
            <button 
              onClick={handleLogin} 
              className="text-sm font-bold bg-white text-black px-6 py-2.5 rounded-full hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              Get Started
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
