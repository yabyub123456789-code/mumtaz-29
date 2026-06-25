/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabaseSQLSchema } from '../supabaseSchema';
import { Code, Copy, Check, Server, Terminal, ShieldAlert, Sparkles, Wifi, WifiOff, CloudLightning, ArrowUpCircle } from 'lucide-react';

interface SqlSchemaViewProps {
  darkMode: boolean;
  isSupabaseConfigured?: boolean;
  onPushLocalData?: () => Promise<void>;
  supabaseLoading?: boolean;
  supabaseError?: string | null;
}

export default function SqlSchemaView({ 
  darkMode, 
  isSupabaseConfigured = false, 
  onPushLocalData, 
  supabaseLoading = false,
  supabaseError = null
}: SqlSchemaViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(supabaseSQLSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardBg = darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100';
  const textTitle = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-6">
      
      {/* Intro Guide Card */}
      <div className={`p-6 rounded-xl border relative overflow-hidden transition-all ${cardBg}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-[#696cff]/10 text-[#696cff] rounded-xl shrink-0">
              <Server className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className={`font-extrabold text-base ${textTitle}`}>Status Koneksi Database Cloud Supabase</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
                Aplikasi <strong>MUMTAZ 29</strong> menggunakan database cloud <strong>Supabase (PostgreSQL)</strong>. Di bawah ini Anda dapat mengonfigurasi, melihat skema SQL, dan menyinkronkan seluruh data master mengajar Anda secara real-time.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            {isSupabaseConfigured ? (
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-center gap-2 text-xs font-bold shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <Wifi className="w-4 h-4 shrink-0" />
                Database Terkoneksi Aktif
              </div>
            ) : (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-center gap-2 text-xs font-bold shadow-xs">
                <WifiOff className="w-4 h-4 shrink-0" />
                Mode Demo / Offline Lokal
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection & Actions Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Sync panel */}
        <div className={`p-5 rounded-xl border shadow-xs flex flex-col justify-between ${cardBg}`}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <CloudLightning className="w-5 h-5 text-amber-500" />
              <h4 className={`font-extrabold text-sm ${textTitle}`}>Alat Sinkronisasi Data</h4>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Jika Anda baru saja menghubungkan database Supabase Anda atau ingin mengunggah seluruh data Master Sekolah, Siswa, Jurnal Mengajar, Absensi, dan Nilai Anda saat ini dari komputer ke server cloud Supabase, gunakan tombol di bawah ini.
            </p>

            {supabaseError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-lg text-rose-700 dark:text-rose-300 text-[11px] font-semibold">
                ⚠️ Error: {supabaseError}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-50 dark:border-[#2d2d3a] mt-4">
            {isSupabaseConfigured ? (
              <button
                onClick={onPushLocalData}
                disabled={supabaseLoading}
                className="w-full bg-gradient-to-r from-[#696cff] to-[#787aff] hover:from-[#5f61e6] hover:to-[#696cff] disabled:opacity-50 text-white font-bold py-3 rounded-lg text-xs transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {supabaseLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Menyinkronkan data ke cloud...
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="w-4 h-4" /> Unggah & Sinkronisasikan Data Lokal ke Supabase
                  </>
                )}
              </button>
            ) : (
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200/40 text-center leading-relaxed">
                🔒 Hubungkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` terlebih dahulu di setting environment untuk mengaktifkan tombol unggah cloud.
              </div>
            )}
          </div>
        </div>

        {/* Configuration Instructions */}
        <div className={`p-5 rounded-xl border shadow-xs flex flex-col justify-between ${cardBg}`}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-5 h-5 text-[#03c3ec]" />
              <h4 className={`font-extrabold text-sm ${textTitle}`}>Cara Menghubungkan Supabase</h4>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Salin kedua nilai API dari dashboard Supabase Anda di bagian <strong>Settings &gt; API</strong>, lalu masukkan ke dalam panel **Secrets / Environment Variables** di editor AI Studio ini:
            </p>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 space-y-1 font-mono text-[10px] text-gray-600 dark:text-gray-300">
              <div>VITE_SUPABASE_URL = "https://your-proj-id.supabase.co"</div>
              <div>VITE_SUPABASE_ANON_KEY = "your-anon-public-key"</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 pt-3 border-t border-gray-50 dark:border-[#2d2d3a] mt-4">
            *Setelah Anda menaruh variables tersebut di AI Studio, aplikasi akan mendeteksi secara otomatis dan beralih ke Mode Supabase cloud online.
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SQL Schema Codebox Panel (2 Columns) */}
        <div className={`p-5 rounded-xl border shadow-xs lg:col-span-2 flex flex-col ${cardBg}`}>
          
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-500" />
              <div>
                <h4 className={`font-bold text-sm tracking-tight ${textTitle}`}>PostgreSQL DDL Schema Script</h4>
                <p className="text-[11px] text-gray-400">Jalankan script ini di SQL Editor dashboard Supabase Anda</p>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                copied 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy SQL Script
                </>
              )}
            </button>
          </div>

          {/* Code Container */}
          <div className="relative">
            <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-[11px] font-mono overflow-auto max-h-[480px] leading-relaxed custom-scrollbar selection:bg-[#696cff]/30">
              <code>{supabaseSQLSchema}</code>
            </pre>
          </div>
        </div>

        {/* Instructions & aaPanel setup guide (1 Column) */}
        <div className="space-y-6">
          
          {/* Supabase integration card */}
          <div className={`p-5 rounded-xl border shadow-xs ${cardBg}`}>
            <h4 className={`font-bold text-sm mb-3 pb-2 border-b border-gray-50 dark:border-[#2d2d3a] flex items-center gap-1.5 ${textTitle}`}>
              <Sparkles className="w-4 h-4 text-[#ffab00]" /> Langkah di Supabase
            </h4>
            <ol className="space-y-3.5 text-xs text-gray-600 dark:text-gray-400 list-decimal pl-4 leading-relaxed">
              <li>Buat project baru di portal <strong>supabase.com</strong>.</li>
              <li>Buka menu <strong>SQL Editor</strong> di panel samping kiri Supabase.</li>
              <li>Klik <strong>New Query</strong>, paste script SQL di sebelah kiri, lalu tekan tombol <strong>RUN</strong>.</li>
              <li>Tabel, relasi, foreign keys, serta trigger registrasi profil akan terpasang otomatis dengan Row Level Security (RLS) dinonaktifkan.</li>
              <li>Salin <code>SUPABASE_URL</code> dan <code>SUPABASE_ANON_KEY</code> dari menu <strong>Project Settings &gt; API</strong> untuk ditaruh di environment project editor ini.</li>
            </ol>
          </div>

          {/* aaPanel deployment card */}
          <div className={`p-5 rounded-xl border shadow-xs ${cardBg}`}>
            <h4 className={`font-bold text-sm mb-3 pb-2 border-b border-gray-50 dark:border-[#2d2d3a] flex items-center gap-1.5 ${textTitle}`}>
              <Server className="w-4 h-4 text-[#03c3ec]" /> Langkah Deploy aaPanel
            </h4>
            <ol className="space-y-3.5 text-xs text-gray-600 dark:text-gray-400 list-decimal pl-4 leading-relaxed">
              <li>Masuk ke control panel <strong>aaPanel VPS</strong> Anda.</li>
              <li>Install **Node.js Version Manager** dan pilih Node.js v18 atau v20 LTS.</li>
              <li>Gunakan aaPanel **Website Manager &gt; Node Project** untuk membuat wadah hosting web.</li>
              <li>Upload bundle static files folder <code>/dist</code> ke dalam folder public HTML aaPanel, atau jalankan command <code>npm run build</code> langsung di VPS.</li>
              <li>Konfigurasi Reverse Proxy Nginx di aaPanel agar mengarah ke file index html untuk perutean SPA yang mulus.</li>
            </ol>
          </div>

          {/* Security alerts */}
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <strong className="font-extrabold block mb-0.5">RLS Dinonaktifkan (Sesuai Permintaan)</strong>
              Row Level Security dinonaktifkan pada seluruh tabel. Hal ini mempermudah proses sinkronisasi dan pencadangan seluruh data lokal Anda langsung ke cloud Supabase tanpa ada pembatasan kebijakan hak akses pengguna.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

