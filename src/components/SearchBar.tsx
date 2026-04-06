'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { Initiatief } from '@/lib/types';

interface SearchBarProps {
  initiatieven: Initiatief[];
  onSelect: (initiatief: Initiatief) => void;
  placeholder?: string;
  large?: boolean;
}

export default function SearchBar({
  initiatieven,
  onSelect,
  placeholder = 'Zoek een initiatief, categorie of plaats...',
  large = false,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Initiatief[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(initiatieven, {
        keys: [
          { name: 'naam', weight: 3 },
          { name: 'categorie', weight: 2 },
          { name: 'gemeente', weight: 2 },
          { name: 'type', weight: 1.5 },
          { name: 'beschrijving', weight: 1 },
        ],
        threshold: 0.35,
        includeScore: true,
      }),
    [initiatieven]
  );

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const hits = fuse.search(query).slice(0, 8).map((r) => r.item);
    setResults(hits);
    setIsOpen(hits.length > 0);
    setSelectedIndex(-1);
  }, [query, fuse]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      onSelect(results[selectedIndex]);
      setQuery('');
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const el = listRef.current.children[selectedIndex] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div className="relative w-full">
      <div
        className={`relative flex items-center ${
          large ? 'h-14 sm:h-16' : 'h-11'
        }`}
      >
        {/* Search icon */}
        <svg
          className={`absolute left-4 text-[#9cc47c] ${large ? 'w-5 h-5' : 'w-4 h-4'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full h-full bg-white border-2 border-gray-200 rounded-2xl
            focus:border-[#9cc47c] focus:ring-4 focus:ring-[#9cc47c]/20 focus:outline-none
            transition-all duration-200 placeholder:text-gray-400
            ${large ? 'pl-12 pr-4 text-base sm:text-lg' : 'pl-10 pr-4 text-sm'}`}
        />

        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto"
        >
          {results.map((item, idx) => (
            <li
              key={item.id}
              onMouseDown={() => {
                onSelect(item);
                setQuery('');
                setIsOpen(false);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                idx === selectedIndex ? 'bg-[#9cc47c]/10' : 'hover:bg-gray-50'
              } ${idx > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <div className="font-medium text-[#829362] text-left">{item.naam}</div>
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 text-left">
                <span className="inline-block bg-[#9cc47c]/10 text-[#9cc47c] px-2 py-0.5 rounded-full">
                  {item.type}
                </span>
                <span>{item.gemeente}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
