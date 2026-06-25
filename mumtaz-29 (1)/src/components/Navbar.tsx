/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, Sun, Moon, Search, Bell, Shield, Cloud } from 'lucide-react';
import { Profile } from '../types';

interface NavbarProps {
  profile: Profile;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  activeTab: string;
  setIsMobileOpen: (open: boolean) => void;
}

export default function Navbar({ 
  profile, 
  darkMode, 
  setDarkMode, 
  activeTab, 
  setIsMobileOpen 
}: NavbarProps) {
  
  // Get active menu label
  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'Beranda Dashboard';
      case 'subjects': return 'Kelola Mata Pelajaran';
      case 'classes': return 'Kelola Daftar Kelas';
      case 'students': return 'Data Seluruh Siswa';
      case 'grades': return 'Input & Rekap Nilai Siswa';
      case 'attendance': return 'Daftar Hadir / Absensi';
      case 'journals': return 'Jurnal Mengajar Guru';
      case 'reports': return 'Penyusunan & Cetak Laporan';
      case 'profile': return 'Profil Pengguna';
      case 'sql_schema': return 'Integrasi Supabase & aaPanel';
      default: return 'MUMTAZ 29 Dashboard';
    }
  };

  const navBg = darkMode ? 'bg-[#1c1c24]/90 border-b border-[#2d2d3a]' : 'bg-white/90 border-b border-gray-100';

  return (
    <nav className={`sticky top-0 z-30 flex items-center justify-between h-[70px] px-6 backdrop-blur-md transition-colors ${navBg}`}>
      
      {/* Left side: Hamburger (mobile) + View Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div>
          <h1 className={`font-bold text-base md:text-lg tracking-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {getTabLabel()}
          </h1>
          <div className="hidden sm:flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
            <span className="flex items-center gap-1 font-mono">
              <Cloud className="w-3.5 h-3.5 text-blue-500" /> Cloud Sync: OK
            </span>
            <span>•</span>
            <span className="font-semibold text-[#696cff] uppercase">Aktif</span>
          </div>
        </div>
      </div>

      {/* Right side: Search + Mode toggle + Profile drop */}
      <div className="flex items-center gap-3 md:gap-4">
        
        {/* Connection Mode Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#696cff]/5 border border-[#696cff]/15">
          <div className="w-2 h-2 rounded-full bg-[#71dd37] animate-pulse"></div>
          <span className="text-[11px] font-semibold text-[#696cff]">Supabase Online</span>
        </div>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          className={`p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
            darkMode ? 'text-amber-400' : 'text-indigo-600'
          }`}
        >
          {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Vertical Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>

        {/* Simple Profile Pill */}
        <div className="flex items-center gap-3 pl-1">
          <div className="hidden sm:block text-right">
            <div className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {profile.fullName}
            </div>
            <div className="text-[10px] text-gray-400 font-medium">
              NUPTK: {profile.nip || '-'}
            </div>
          </div>
          
          <div className="relative group">
            <img
              src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={profile.fullName}
              onError={(e) => {
                // Fallback image
                e.currentTarget.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";
              }}
              className="w-10 h-10 rounded-full border-2 border-[#696cff]/20 hover:border-[#696cff] transition-colors cursor-pointer object-cover"
            />
            {/* Hover Tooltip / Badging */}
            <div className="absolute right-0 bottom-0 bg-[#696cff] p-0.5 rounded-full border border-white">
              <Shield className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        </div>

      </div>

    </nav>
  );
}
