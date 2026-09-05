import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DOCS_NAV, getAllNavItems, NavItem } from '../../lib/docs-nav';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NavItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const allItems = getAllNavItems();
    
    const matched = allItems.filter(item => 
      item.label.toLowerCase().includes(lowerQuery) || 
      item.keywords?.some(kw => kw.toLowerCase().includes(lowerQuery))
    );

    setResults(matched);
    setSelectedIndex(0);

    // Analytics hook
    if (query.length > 2) {
      console.log('[Analytics] Searched for:', query);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (item: NavItem) => {
    navigate(item.path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden mx-4">
        <div className="flex items-center px-4 py-4 border-b border-neutral-800">
          <Search className="w-5 h-5 text-neutral-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-neutral-500 text-lg"
            placeholder="Search documentation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-800 text-neutral-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.trim() && results.length === 0 && (
            <div className="py-12 text-center text-neutral-500">
              No results found for "{query}"
            </div>
          )}

          {results.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-colors ${
                index === selectedIndex ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <FileText className="w-4 h-4 mr-3 opacity-50" />
              <span>{item.label}</span>
            </button>
          ))}

          {!query.trim() && (
            <div className="py-8 text-center text-neutral-500 text-sm">
              Type to start searching...
            </div>
          )}
        </div>
        
        <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-900/50 text-xs text-neutral-500 flex justify-between">
          <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">↑</kbd> <kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">↓</kbd> to navigate</span>
          <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">Enter</kbd> to select</span>
          <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};
