/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { 
  Settings, User, Phone, Mail, ShieldCheck, Camera, Key, CheckCircle, AlertCircle 
} from 'lucide-react';

interface ProfileViewProps {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  addActivity: (action: string, module: string, details: string) => void;
  darkMode: boolean;
}

export default function ProfileView({
  profile,
  setProfile,
  addActivity,
  darkMode
}: ProfileViewProps) {
  
  // Profile form states
  const [fullName, setFullName] = useState(profile.fullName);
  const [nip, setNip] = useState(profile.nip);
  const [phone, setPhone] = useState(profile.phone);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);

  // Keep state synced with profile prop updates
  useEffect(() => {
    setFullName(profile.fullName);
    setNip(profile.nip);
    setPhone(profile.phone);
    setAvatarUrl(profile.avatarUrl);
  }, [profile]);

  // Password modification state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileAlert, setProfileAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordAlert, setPasswordAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preset teacher avatars for easy click selection
  const presetAvatars = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', // Female teacher
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', // Female teacher 2
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', // Female teacher 3
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', // Male teacher
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', // Male teacher 2
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', // Male teacher 3
  ];

  // Handle local image file upload and conversion to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB size limit
        setProfileAlert({ type: 'error', text: 'Ukuran file foto maksimal adalah 2MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
          setProfileAlert({ type: 'success', text: 'Foto berhasil dipilih! Klik tombol "Simpan Profil Guru" di bawah untuk menyimpan perubahan secara permanen.' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileAlert(null);

    if (!fullName || !nip) {
      setProfileAlert({ type: 'error', text: 'Nama Lengkap dan NUPTK wajib diisi.' });
      return;
    }

    const updated = {
      ...profile,
      fullName,
      nip,
      phone,
      avatarUrl
    };

    setProfile(updated);
    addActivity('Ubah Profil', 'Pengaturan', 'Mengubah profil biodata pribadi');
    
    setProfileAlert({ type: 'success', text: 'Profil pribadi Anda berhasil diperbarui di Supabase!' });
    setTimeout(() => setProfileAlert(null), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordAlert(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordAlert({ type: 'error', text: 'Semua kolom kata sandi wajib diisi.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordAlert({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordAlert({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    // Success Simulation
    addActivity('Ubah Password', 'Pengaturan', 'Melakukan pembaruan kata sandi akun');
    setPasswordAlert({ type: 'success', text: 'Kata sandi berhasil diperbarui via Supabase auth.users!' });
    
    // Reset forms
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordAlert(null), 3000);
  };

  const cardBg = darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100';
  const textTitle = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Profile Picture Card Selector */}
      <div className={`p-5 rounded-xl border shadow-xs h-fit text-center ${cardBg}`}>
        <div className="relative inline-block mx-auto mb-4">
          <img
            src={avatarUrl}
            alt={profile.fullName}
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";
            }}
            className="w-24 h-24 rounded-full border-4 border-[#696cff]/20 mx-auto object-cover"
          />
          <label className="absolute bottom-0 right-1 bg-[#696cff] p-1.5 rounded-full text-white border-2 border-white dark:border-[#1c1c24] cursor-pointer hover:bg-[#5f61e6] transition-colors" title="Pilih Foto dari Perangkat">
            <Camera className="w-3.5 h-3.5" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        <h3 className={`font-extrabold text-base ${textTitle}`}>{profile.fullName}</h3>
        <span className="inline-block px-2.5 py-1 rounded-full bg-[#696cff]/10 text-[#696cff] text-[10px] font-bold mt-2 uppercase tracking-wider">
          NUPTK: {profile.nip || 'Belum Diisi'}
        </span>
      </div>

      {/* Profile Info Form (2 columns) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Profile details form */}
        <div className={`p-5 rounded-xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
            <User className="w-5 h-5 text-[#696cff]" />
            <div>
              <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>Ubah Informasi Profil</h3>
              <p className="text-[11px] text-gray-400">Sesuaikan data NUPTK dan kontak resmi sekolah Anda</p>
            </div>
          </div>

          {profileAlert && (
            <div className={`p-3 rounded-lg mb-4 text-xs font-semibold flex items-center gap-2 ${
              profileAlert.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {profileAlert.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{profileAlert.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
                  required
                />
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>NUPTK</label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Email Guru (Read-Only)</label>
                <input
                  type="email"
                  value={profile.email}
                  className="w-full px-3.5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none cursor-not-allowed"
                  disabled
                />
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Nomor Handphone (WhatsApp)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
                />
              </div>
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Link Foto Profil (URL)</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#696cff] hover:bg-[#5f61e6] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Simpan Profil Guru
              </button>
            </div>
          </form>
        </div>

        {/* Change password security form */}
        <div className={`p-5 rounded-xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
            <Key className="w-5 h-5 text-[#ffab00]" />
            <div>
              <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>Ubah Kata Sandi Supabase</h3>
              <p className="text-[11px] text-gray-400 font-medium">Ubah kata sandi login auth.users Anda</p>
            </div>
          </div>

          {passwordAlert && (
            <div className={`p-3 rounded-lg mb-4 text-xs font-semibold flex items-center gap-2 ${
              passwordAlert.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {passwordAlert.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{passwordAlert.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Password Saat Ini</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
                placeholder="Masukkan kata sandi lama Anda"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
                  placeholder="Min 6 karakter"
                  required
                />
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
                  placeholder="Ketik ulang password baru"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#ffab00] hover:bg-[#e09600] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Ubah Password
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
