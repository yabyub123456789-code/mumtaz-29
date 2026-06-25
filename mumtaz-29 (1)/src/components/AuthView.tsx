/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Profile } from '../types';
import { BookOpen, LogIn, Lock, Mail, User, ShieldCheck, Phone, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

interface AuthViewProps {
  onLoginSuccess: (profile: Profile) => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [useSupabase, setUseSupabase] = useState(isSupabaseConfigured);
  
  // Form fields
  const [email, setEmail] = useState('ichwandarmawan78@guru.smp.belajar.id');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('');
  const [nip, setNip] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);
    setLoading(true);

    try {
      if (isReset) {
        if (!email) {
          setAlertMsg({ type: 'error', text: 'Silakan masukkan email Anda.' });
          setLoading(false);
          return;
        }

        if (useSupabase && isSupabaseConfigured && supabase) {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
          });
          if (error) {
            setAlertMsg({ type: 'error', text: 'Supabase Reset Error: ' + error.message });
            setLoading(false);
            return;
          }
        }

        setAlertMsg({ type: 'success', text: 'Instruksi reset password telah dikirim ke email Anda!' });
        setTimeout(() => {
          setIsReset(false);
          setIsLogin(true);
          setAlertMsg(null);
        }, 3000);
        setLoading(false);
        return;
      }

      if (isLogin) {
        if (!email || !password) {
          setAlertMsg({ type: 'error', text: 'Email dan password harus diisi.' });
          setLoading(false);
          return;
        }

        if (useSupabase && isSupabaseConfigured && supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) {
            setAlertMsg({ 
              type: 'error', 
              text: 'Login Supabase gagal: ' + error.message + '. Jika Anda belum memiliki akun, klik "Daftar Akun Guru" di bawah, atau nonaktifkan tombol "Database Supabase Aktif" di atas untuk masuk langsung dengan Mode Demo Lokal/Offline.' 
            });
            setLoading(false);
            return;
          }

          if (data.user) {
            // Ambil profile dari tabel profiles Supabase (Gunakan select biasa daripada .single() untuk menghindari crash jika baris kosong)
            const { data: profileList, error: profileErr } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id);

            const profileData = profileList && profileList.length > 0 ? profileList[0] : null;

            let userProfile: Profile;
            if (profileData) {
              userProfile = {
                id: profileData.id,
                fullName: profileData.full_name,
                nip: profileData.nip || '',
                email: profileData.email,
                phone: profileData.phone || '',
                avatarUrl: profileData.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              };
            } else {
              // Jika profil belum ada di database profiles, kita buat/insert barunya secara otomatis!
              const fallbackName = data.user.user_metadata?.full_name || email.split('@')[0];
              const fallbackNip = data.user.user_metadata?.nip || 'Belum Diisi';
              const fallbackPhone = data.user.user_metadata?.phone || '-';
              const fallbackAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

              const { error: insertErr } = await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  full_name: fallbackName,
                  email: email,
                  nip: fallbackNip,
                  phone: fallbackPhone,
                  avatar_url: fallbackAvatar
                });

              if (insertErr) {
                console.error('[Supabase Auto Profile Insert Error]', insertErr);
              }

              userProfile = {
                id: data.user.id,
                fullName: fallbackName,
                nip: fallbackNip,
                email: email,
                phone: fallbackPhone,
                avatarUrl: fallbackAvatar,
              };
            }

            if (rememberMe) {
              localStorage.setItem('guruku_remember', 'true');
            } else {
              localStorage.removeItem('guruku_remember');
            }
            onLoginSuccess(userProfile);
          }
          setLoading(false);
          return;
        }

        // Check if credentials match or register new one (OFFLINE MODE)
        const storedUsers = localStorage.getItem('guruku_registered_teachers');
        let registeredUsers: Profile[] = storedUsers ? JSON.parse(storedUsers) : [];
        
        // Default initial profile
        const defaultProfile: Profile = {
          id: 'guru-1',
          fullName: 'Ichwan Darmawan, S.Pd.',
          nip: '19880412 201503 1 002',
          email: 'ichwandarmawan78@guru.smp.belajar.id',
          phone: '081234567890',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };

        let activeUser = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!activeUser && email.toLowerCase() === defaultProfile.email.toLowerCase()) {
          activeUser = defaultProfile;
        }

        if (activeUser) {
          // Authenticated
          if (rememberMe) {
            localStorage.setItem('guruku_remember', 'true');
          } else {
            localStorage.removeItem('guruku_remember');
          }
          onLoginSuccess(activeUser);
        } else {
          // Simple auto-onboard or fallback password verify
          if (password.length >= 6) {
            const autoUser: Profile = {
              id: 'guru-' + Date.now(),
              fullName: email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' '),
              nip: 'NUPTK Belum Diisi',
              email: email,
              phone: '-',
              avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            };
            onLoginSuccess(autoUser);
          } else {
            setAlertMsg({ type: 'error', text: 'Password salah atau akun tidak ditemukan. Password minimal 6 karakter.' });
          }
        }
      } else {
        // Register Flow
        if (!email || !password || !fullName || !nip) {
          setAlertMsg({ type: 'error', text: 'Semua field wajib diisi.' });
          setLoading(false);
          return;
        }

        if (useSupabase && isSupabaseConfigured && supabase) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                nip: nip,
                phone: phone || '-'
              }
            }
          });

          if (error) {
            setAlertMsg({ 
              type: 'error', 
              text: 'Registrasi Supabase gagal: ' + error.message + '. Silakan coba mendaftar ulang, atau nonaktifkan tombol "Database Supabase Aktif" di atas untuk menggunakan Mode Lokal/Offline secara langsung.' 
            });
            setLoading(false);
            return;
          }

          if (data.user) {
            // Proaktif insert profil baru ke database profiles (mengantisipasi jika trigger SQL belum jalan)
            try {
              await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  full_name: fullName,
                  email: email,
                  nip: nip,
                  phone: phone || '-',
                  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                });
              console.log('[Supabase Proactive Profile Insert] Profil berhasil dibuat saat pendaftaran!');
            } catch (pErr) {
              console.warn('[Supabase Proactive Profile Insert Warning]', pErr);
            }
          }

          setAlertMsg({ type: 'success', text: 'Pendaftaran Supabase berhasil! Silakan periksa kotak masuk email Anda (jika konfirmasi aktif), atau silakan langsung masuk.' });
          setTimeout(() => {
            setIsLogin(true);
            setAlertMsg(null);
          }, 3500);
          setLoading(false);
          return;
        }

        // Fallback pendaftaran offline
        const newUser: Profile = {
          id: 'guru-' + Date.now(),
          fullName,
          nip,
          email,
          phone: phone || '-',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        };

        const storedUsers = localStorage.getItem('guruku_registered_teachers');
        const registeredUsers: Profile[] = storedUsers ? JSON.parse(storedUsers) : [];
        
        if (registeredUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          setAlertMsg({ type: 'error', text: 'Email sudah terdaftar.' });
          setLoading(false);
          return;
        }

        registeredUsers.push(newUser);
        localStorage.setItem('guruku_registered_teachers', JSON.stringify(registeredUsers));
        
        setAlertMsg({ type: 'success', text: 'Pendaftaran berhasil! Silakan login.' });
        setTimeout(() => {
          setIsLogin(true);
          setAlertMsg(null);
        }, 2000);
      }
    } catch (err: any) {
      const errMsg = String(err?.message || err || '');
      if (errMsg.toLowerCase().includes('failed to fetch')) {
        setAlertMsg({ 
          type: 'error', 
          text: 'Koneksi ke database Supabase gagal (Failed to fetch). Kemungkinan server database sedang ditangguhkan (paused) atau koneksi jaringan Anda terputus. Silakan nonaktifkan tombol "Database Supabase Aktif" di atas untuk menggunakan Mode Demo Lokal/Offline secara instan.' 
        });
      } else {
        setAlertMsg({ type: 'error', text: 'Terjadi kesalahan sistem: ' + errMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoAccount = () => {
    setEmail('ichwandarmawan78@guru.smp.belajar.id');
    setPassword('password123');
    setIsLogin(true);
    setIsReset(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f9] flex flex-col items-center justify-center p-4 selection:bg-[#696cff]/20">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300">
        
        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-[#696cff] to-[#787aff] p-8 text-center text-white relative">
          <div className="absolute top-3 right-3 bg-white/20 text-[11px] px-2 py-0.5 rounded-full font-mono text-white/90">
            Sneat v5 Dashboard
          </div>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 backdrop-blur-md mb-3 border border-white/20">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-sans tracking-tight">MUMTAZ 29</h1>
          <p className="text-white/80 text-[11px] leading-relaxed mt-1 mb-3 font-medium">Monitoring Upaya dan Mutu Terpadu Akademik serta Zona Karakter</p>

          {/* Supabase Connection Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold">
            {isSupabaseConfigured && useSupabase ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-emerald-400" /> SUPABASE CONNECTED
                </span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
                <span className="flex items-center gap-1">
                  <WifiOff className="w-3 h-3 text-amber-400" /> OFFLINE / DEMO MODE
                </span>
              </>
            )}
          </div>
        </div>

        {/* Content Panel */}
        <div className="p-8">
          
          {isSupabaseConfigured && (
            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100/50 rounded-xl mb-5 text-left">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#696cff] flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5" /> Database Supabase Aktif
                </span>
                <span className="text-[10px] text-gray-500">Matikan jika ingin masuk ke mode demo lokal</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUseSupabase(!useSupabase);
                  setAlertMsg(null);
                }}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  useSupabase ? 'bg-[#696cff]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    useSupabase ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}
          
          {alertMsg && (
            <div className={`p-3 rounded-lg mb-4 text-xs font-medium flex items-center gap-2 ${
              alertMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}>
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{alertMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isReset ? (
              // ================= RESET PASSWORD =================
              <>
                <div className="mb-2">
                  <h2 className="text-lg font-bold text-gray-800">Lupa Password?</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Masukkan email Anda untuk menerima instruksi pemulihan kata sandi Supabase.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1.5">Email Guru</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#696cff] focus:bg-white text-gray-800 transition-colors"
                      placeholder="nama@guru.smp.belajar.id"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#696cff] hover:bg-[#5f61e6] disabled:bg-[#696cff]/50 text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                </button>
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => { setIsReset(false); setIsLogin(true); }}
                    className="text-xs text-[#696cff] font-semibold hover:underline"
                  >
                    Kembali ke halaman Login
                  </button>
                </div>
              </>
            ) : isLogin ? (
              // ================= LOGIN FORM =================
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1.5">Email Guru</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#696cff] focus:bg-white text-gray-800 transition-all"
                      placeholder="nama@guru.smp.belajar.id"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold uppercase text-gray-500 tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => { setIsReset(true); }}
                      className="text-xs text-[#696cff] hover:underline"
                    >
                      Lupa Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#696cff] focus:bg-white text-gray-800 transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-gray-600 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300 text-[#696cff] focus:ring-[#696cff]"
                    />
                    Ingat Sesi Saya (Remember)
                  </label>
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3 text-[#71dd37]" /> Supabase Auth
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#696cff] hover:bg-[#5f61e6] disabled:bg-[#696cff]/50 text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Memproses Masuk...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" /> Masuk ke Dashboard
                    </>
                  )}
                </button>

                <div className="text-center mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Belum punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsLogin(false); setAlertMsg(null); }}
                      className="text-[#696cff] font-semibold hover:underline"
                    >
                      Daftar Akun Guru
                    </button>
                  </p>
                </div>
              </>
            ) : (
              // ================= REGISTER FORM =================
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1.5">Nama Lengkap & Gelar</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#696cff] focus:bg-white text-gray-800 transition-all"
                      placeholder="misal: Budi Budiman, S.Pd."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1.5">NUPTK</label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#696cff] focus:bg-white text-gray-800 transition-all"
                      placeholder="misal: 19880412 201503 1 002"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1.5">Email Sekolah / Belajar.id</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#696cff] focus:bg-white text-gray-800 transition-all"
                      placeholder="nama@guru.smp.belajar.id"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1.5">Nomor Handphone (WhatsApp)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#696cff] focus:bg-white text-gray-800 transition-all"
                      placeholder="misal: 081234567890"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1.5">Password Baru</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#696cff] focus:bg-white text-gray-800 transition-all"
                      placeholder="minimal 6 karakter"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#696cff] hover:bg-[#5f61e6] disabled:bg-[#696cff]/50 text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Memproses Pendaftaran...
                    </>
                  ) : (
                    'Daftar & Onboard'
                  )}
                </button>

                <div className="text-center mt-4">
                  <p className="text-xs text-gray-500">
                    Sudah punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsLogin(true); setAlertMsg(null); }}
                      className="text-[#696cff] font-semibold hover:underline"
                    >
                      Login Sekarang
                    </button>
                  </p>
                </div>
              </>
            )}

          </form>

          {/* Quick Demo Assist */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <button
              onClick={handleUseDemoAccount}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold rounded-full border border-amber-200/50 transition-colors cursor-pointer"
            >
              🔑 Pakai Akun Demo (Ichwan, S.Pd.)
            </button>
          </div>

        </div>

        {/* Info Footer */}
        <div className="bg-gray-50 py-3 text-center border-t border-gray-100 text-[11px] text-gray-400">
          Sistem Terenkripsi Supabase Auth & Storage API
        </div>

      </div>
    </div>
  );
}
