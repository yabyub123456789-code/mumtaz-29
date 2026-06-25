/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Home, BookOpen, Layers, Users, Star, ClipboardCheck, FileText, 
  Settings, LogOut, Code, ChevronRight, X, Sparkles 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  darkMode: boolean;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onLogout, 
  isMobileOpen, 
  setIsMobileOpen,
  darkMode 
}: SidebarProps) {
  
  const menuGroups = [
    {
      title: 'Menu Utama',
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: Home },
      ]
    },
    {
      title: 'Data Master',
      items: [
        { id: 'subjects', name: 'Mata Pelajaran', icon: BookOpen, badge: 'Guru' },
        { id: 'classes', name: 'Kelas', icon: Layers },
        { id: 'students', name: 'Siswa', icon: Users },
      ]
    },
    {
      title: 'Akademik',
      items: [
        { id: 'grades', name: 'Nilai Siswa', icon: Star },
        { id: 'attendance', name: 'Absensi Siswa', icon: ClipboardCheck },
        { id: 'class_attendance', name: 'Absensi Kelas (Wali)', icon: ClipboardCheck, badge: 'Wali' },
        { id: 'journals', name: 'Jurnal Mengajar', icon: FileText, badge: 'Hari Ini' },
      ]
    },
    {
      title: 'Zona Karakter',
      items: [
        { id: 'character', name: 'Zona Karakter', icon: Sparkles, badge: 'MUMTAZ' },
      ]
    },
    {
      title: 'Laporan',
      items: [
        { id: 'reports', name: 'Cetak Laporan', icon: FileText },
      ]
    },
    {
      title: 'Integrasi Database',
      items: [
        { id: 'sql_schema', name: 'Supabase SQL', icon: Code, badge: 'RLS' },
      ]
    },
    {
      title: 'Pengaturan',
      items: [
        { id: 'profile', name: 'Profil Guru', icon: Settings },
      ]
    }
  ];

  const handleItemClick = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  const sidebarBg = darkMode 
    ? 'bg-[#1c1c24] border-r border-[#2d2d3a] text-gray-300' 
    : 'bg-white border-r border-gray-100 text-[#566a7f]';

  const groupTitleColor = darkMode ? 'text-gray-500' : 'text-[#a1acb8]';

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 lg:static flex flex-col w-[260px] h-screen transition-transform duration-300 transform 
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarBg}
      `}>
        
        {/* Sidebar Brand Header */}
        <div className={`flex items-center justify-between h-[70px] px-6 border-b ${darkMode ? 'border-[#2d2d3a]' : 'border-gray-50'}`}>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#696cff] text-white font-bold text-lg shadow-sm shadow-[#696cff]/30">
              M
            </div>
            <div>
              <h2 className={`font-bold font-sans text-lg tracking-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>MUMTAZ 29</h2>
              <span className="text-[10px] text-gray-400 block -mt-1 font-medium uppercase tracking-wider">Dashboard Guru v5</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsMobileOpen(false)}
            className={`p-1 rounded-md hover:bg-gray-100 lg:hidden ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'text-gray-400'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-scrollbar">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {/* Group Title */}
              <div className={`px-3 text-[11px] font-bold uppercase tracking-wider ${groupTitleColor}`}>
                {group.title}
              </div>
              
              {/* Group Items */}
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  
                  // Active styling matching Sneat exactly
                  const itemClass = isActive
                    ? 'bg-[#696cff]/10 text-[#696cff] font-semibold border-l-4 border-[#696cff]'
                    : `border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-[#696cff] transition-all`;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-r-lg text-sm text-left cursor-pointer ${itemClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#696cff]' : 'text-gray-400'}`} />
                        <span>{item.name}</span>
                      </div>
                      
                      {item.badge ? (
                        <span className="text-[10px] px-1.5 py-0.5 font-bold rounded-md bg-[#71dd37]/10 text-[#71dd37] uppercase">
                          {item.badge}
                        </span>
                      ) : (
                        isActive && <ChevronRight className="w-4 h-4 text-[#696cff]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer Account Logout */}
        <div className={`p-4 border-t ${darkMode ? 'border-[#2d2d3a] bg-black/10' : 'border-gray-50 bg-gray-50/50'}`}>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Keluar (Logout)</span>
          </button>
        </div>

      </aside>
    </>
  );
}
