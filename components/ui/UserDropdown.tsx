'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { ChevronDown, Settings, User as UserIcon, LogOut } from 'lucide-react';

interface UserDropdownProps {
  user: User;
  onSignOut: () => void;
}

export function UserDropdown({ user, onSignOut }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        {/* User Avatar or Initial */}
        <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
          {user.email?.[0].toUpperCase()}
        </div>
        <span className="hidden md:inline-block">{user.email}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-zinc-900 border border-zinc-800 shadow-lg py-1">
          {/* User Info Section */}
          <div className="px-4 py-2 border-b border-zinc-800">
            <p className="text-sm font-medium text-white truncate">
              {user.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              onClick={() => setIsOpen(false)}
            >
              <UserIcon className="mr-3 h-4 w-4" />
              Dashboard
            </Link>

            <Link
              href="/settings/profile"
              className="flex items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              onClick={() => setIsOpen(false)}
            >
              <UserIcon className="mr-3 h-4 w-4" />
              Profile
            </Link>

            <Link
              href="/settings"
              className="flex items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="mr-3 h-4 w-4" />
              Settings
            </Link>

            {/* Sign Out Button */}
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-zinc-800"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
