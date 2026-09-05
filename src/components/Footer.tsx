import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 pt-16 pb-8 px-6 text-neutral-50 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg tracking-tight">MailCord</span>
            </div>
            <p className="text-sm text-neutral-400">
              Private Messaging System for Your Discord Server.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-neutral-200">Product</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><Link to="/dashboard" className="hover:text-indigo-400 transition-colors">Dashboard</Link></li>
              <li><Link to="/commands" className="hover:text-indigo-400 transition-colors">Commands</Link></li>
              <li><Link to="/about" className="hover:text-indigo-400 transition-colors">About Us</Link></li>
              <li><Link to="/pricing" className="hover:text-indigo-400 transition-colors">Pricing</Link></li>
              <li><Link to="/changelog" className="hover:text-indigo-400 transition-colors">Changelog</Link></li>
              <li><Link to="/contact" className="hover:text-indigo-400 transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-neutral-200">Resources</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><Link to="/docs" className="hover:text-indigo-400 transition-colors">Documentation</Link></li>
              <li><Link to="/api" className="hover:text-indigo-400 transition-colors">API Reference</Link></li>
              <li><Link to="/status" className="hover:text-indigo-400 transition-colors">System Status</Link></li>
              <li><Link to="/community" className="hover:text-indigo-400 transition-colors">Community</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-neutral-200">Legal</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><Link to="/terms" className="hover:text-indigo-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookie" className="hover:text-indigo-400 transition-colors">Cookie Policy</Link></li>
              <li><Link to="/security" className="hover:text-indigo-400 transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-500">
            © 2026 MailCord. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
