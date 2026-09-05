import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search as SearchIcon, ChevronRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { SearchModal } from '../../components/docs/SearchModal';
import { DOCS_NAV, Role, getAllNavItems } from '../../lib/docs-nav';

// Import all documentation sections
import Introduction from './Introduction';
import HowItWorks from './HowItWorks';
import QuickSetup from './QuickSetup';
import AliasSystem from './AliasSystem';
import MessagingFlow from './MessagingFlow';
import InboxSystem from './Inbox';
import UserGuide from './UserGuide';
import AdminGuide from './AdminGuide';
import UseCases from './UseCases';
import BotWorkflows from './BotWorkflows';
import ApiReference from './ApiReference';
import WebhooksDocs from './Webhooks';
import ConfigDocs from './ConfigDocs';
import SecurityDocs from './Security';
import ScalingDocs from './Scaling';
import Faq from './Faq';

// 🖼️ Custom Emoji Assets
import verifiedStaticPng from '../../assets/docs/emojis/verified-static.png';
import starPng from '../../assets/docs/emojis/star.png';
import mailPng from '../../assets/docs/emojis/mail.png';
import boltPng from '../../assets/docs/emojis/bolt.png';
import billingPng from '../../assets/docs/emojis/billing.png';
import securityPng from '../../assets/docs/emojis/locked.png';
import developerPng from '../../assets/docs/emojis/developer.png';

const EMOJI_MAP: Record<string, string> = {
  'introduction': starPng,
  'inbox': mailPng,
  'setup': boltPng,
  'billing': billingPng,
  'security': securityPng,
  'api': developerPng,
};

const DOC_COMPONENTS: Record<string, React.ComponentType> = {
  'introduction': Introduction,
  'how-it-works': HowItWorks,
  'setup': QuickSetup,
  'alias-system': AliasSystem,
  'messaging-flow': MessagingFlow,
  'inbox': InboxSystem,
  'user-guide': UserGuide,
  'admin-guide': AdminGuide,
  'use-cases': UseCases,
  'bot-workflows': BotWorkflows,
  'api': ApiReference,
  'webhooks': WebhooksDocs,
  'config': ConfigDocs,
  'security': SecurityDocs,
  'billing': ScalingDocs,
  'faq': Faq,
};

export default function DocsLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [role, setRole] = useState<Role>('user');
  const [activeSection, setActiveSection] = useState<string>('introduction');
  const location = useLocation();
  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver | null>(null);
  const isScrollingRef = useRef(false);

  // Load persisted role
  useEffect(() => {
    const savedRole = localStorage.getItem('docs-role') as Role;
    if (savedRole && ['user', 'admin', 'developer'].includes(savedRole)) {
      setRole(savedRole);
    }
  }, []);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    localStorage.setItem('docs-role', newRole);
  };

  // Intersection Observer for Continuous Scroll
  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            const sectionId = entry.target.id;
            setActiveSection(sectionId);
            
            // Update URL without full navigation
            const newPath = `/docs/${sectionId}`;
            if (window.location.pathname !== newPath) {
              window.history.replaceState(null, '', newPath);
              localStorage.setItem('docs-last-visited', newPath);
            }
          }
        });
      },
      { threshold: [0.3, 0.5], rootMargin: '-80px 0px -20% 0px' }
    );

    const sections = document.querySelectorAll('section[data-doc-section]');
    sections.forEach((s) => observer.current?.observe(s));

    return () => observer.current?.disconnect();
  }, []);

  // Initial Scroll based on URL
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const sectionId = pathParts[pathParts.length - 1];
    if (sectionId && sectionId !== 'docs' && DOC_COMPONENTS[sectionId]) {
      const element = document.getElementById(sectionId);
      if (element) {
        isScrollingRef.current = true;
        element.scrollIntoView({ behavior: 'auto' });
        setActiveSection(sectionId);
        setTimeout(() => { isScrollingRef.current = false; }, 1000);
      }
    }
  }, []);

  const handleNavClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      isScrollingRef.current = true;
      setActiveSection(sectionId);
      setIsMobileMenuOpen(false);
      element.scrollIntoView({ behavior: 'smooth' });
      
      const newPath = `/docs/${sectionId}`;
      window.history.pushState(null, '', newPath);
      localStorage.setItem('docs-last-visited', newPath);
      
      setTimeout(() => { isScrollingRef.current = false; }, 1000);
    }
  };

  const allItems = getAllNavItems();
  const currentItem = allItems.find(i => i.id === activeSection);
  
  let currentSectionTitle = '';
  for (const section of DOCS_NAV) {
    if (section.items.some(i => i.id === activeSection)) {
      currentSectionTitle = section.title;
      break;
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-400 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col relative">
      {/* Background Nebula Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="sticky top-0 z-50 bg-[#050505]/70 backdrop-blur-xl border-b border-white/5 h-[73px]">
        <Navbar />
      </div>
      
      {/* Top Bar (Breadcrumbs) - Sticky below Navbar */}
      <div className="sticky top-[73px] z-40 bg-[#050505]/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-neutral-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="hidden sm:flex items-center text-sm text-neutral-500">
              <span className="cursor-pointer hover:text-neutral-300 transition-colors" onClick={() => handleNavClick('introduction')}>Docs</span>
              <ChevronRight className="w-4 h-4 mx-1" />
              <span>v2.0</span>
              {currentSectionTitle && (
                <>
                  <ChevronRight className="w-4 h-4 mx-1" />
                  <span>{currentSectionTitle}</span>
                </>
              )}
              {currentItem && (
                <>
                  <ChevronRight className="w-4 h-4 mx-1" />
                  <span className="text-neutral-300">{currentItem.label}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-neutral-900/50 rounded-full p-1 border border-white/5 backdrop-blur-sm">
                {['user', 'admin', 'developer'].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleChange(r as Role)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                      role === r 
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {role === r && <img src={verifiedStaticPng} alt="Verified" className="w-3 h-3 invert" />}
                    {r}
                  </button>
                ))}
            </div>

            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/50 border border-white/5 rounded-xl text-sm text-neutral-400 hover:text-neutral-200 hover:border-white/10 transition-all backdrop-blur-sm group"
            >
              <SearchIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-xs font-medium">Search documentation...</span>
              <kbd className="hidden sm:inline-block ml-2 text-[9px] bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded border border-white/5">⌘ K</kbd>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-[129px] left-0 z-30
          w-64 h-[calc(100vh-129px)] 
          bg-[#050505]/70 lg:bg-transparent
          backdrop-blur-xl lg:backdrop-blur-none
          border-r border-white/5 lg:border-none
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto pb-10 pr-4
        `}>
          <nav className="p-4 lg:p-0 lg:pr-8 py-8">
            {DOCS_NAV.map((section, idx) => {
              const visibleItems = section.items.filter(item => 
                role === 'developer' || item.roles.includes(role)
              );

              if (visibleItems.length === 0) return null;

              return (
                <div key={idx} className="mb-8">
                  <div className="flex items-center gap-2 px-3 mb-3">
                    {section.icon && <section.icon className="w-3.5 h-3.5 text-indigo-500 opacity-60" />}
                    <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                      {section.title}
                    </h3>
                  </div>
                  <ul className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const isActive = activeSection === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => handleNavClick(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all group/item ${
                              isActive 
                                ? 'bg-indigo-500/10 text-white font-bold ring-1 ring-white/10' 
                                : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5'
                            }`}
                          >
                            <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-indigo-500/20 shadow-lg shadow-indigo-500/20' : 'bg-neutral-900 group-hover/item:bg-neutral-800'}`}>
                              {EMOJI_MAP[item.id] ? (
                                <img src={EMOJI_MAP[item.id]} alt="icon" className="w-3.5 h-3.5 object-contain" />
                              ) : (
                                item.icon && <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-neutral-600'}`} />
                              )}
                            </div>
                            {item.label}
                            {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]"></div>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Unified Main Content */}
        <main className="flex-1 min-w-0 py-12 lg:pl-10 xl:pl-14 lg:pr-8 xl:pr-12 space-y-32">
          {DOCS_NAV.map(section => 
            section.items.map(item => {
              const Component = DOC_COMPONENTS[item.id];
              if (!Component) return null;

              // Filter based on role
              if (role !== 'developer' && !item.roles.includes(role)) return null;

              return (
                <section 
                  key={item.id} 
                  id={item.id} 
                  data-doc-section
                  className="scroll-mt-32"
                >
                  <Component />
                </section>
              );
            })
          )}
          <div className="pt-20">
            <Footer />
          </div>
        </main>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
