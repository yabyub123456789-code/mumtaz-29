/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Subject } from '../types';
import { Plus, Edit2, Trash2, Search, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

interface SubjectsViewProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  addActivity: (action: string, module: string, details: string) => void;
  darkMode: boolean;
}

export default function SubjectsView({ subjects, setSubjects, addActivity, darkMode }: SubjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals / Form editing states
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Custom Delete Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  // Reset form
  const resetForm = () => {
    setCode('');
    setName('');
    setSelectedId(null);
    setIsEditing(false);
    setErrorMsg('');
  };

  // Create or Update
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code || !name) {
      setErrorMsg('Semua kolom harus diisi.');
      return;
    }

    // Check duplicate code
    const isDuplicate = subjects.some(s => s.code.toLowerCase() === code.toLowerCase() && s.id !== selectedId);
    if (isDuplicate) {
      setErrorMsg('Kode Mata Pelajaran sudah terdaftar.');
      return;
    }

    if (selectedId) {
      // Update
      setSubjects(prev => prev.map(s => s.id === selectedId ? { ...s, code, name } : s));
      addActivity('Edit Mata Pelajaran', 'Data Master', `Mengubah mapel ${name} (${code})`);
    } else {
      // Create
      const newSub: Subject = {
        id: 'subj-' + Date.now(),
        code,
        name
      };
      setSubjects(prev => [...prev, newSub]);
      addActivity('Tambah Mata Pelajaran', 'Data Master', `Menambahkan mapel baru ${name} (${code})`);
    }

    resetForm();
  };

  // Edit action
  const handleEdit = (sub: Subject) => {
    setSelectedId(sub.id);
    setCode(sub.code);
    setName(sub.name);
    setIsEditing(true);
  };

  // Delete action
  const handleDelete = (id: string, subName: string) => {
    setDeleteId(id);
    setDeleteName(subName);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setSubjects(prev => prev.filter(s => s.id !== deleteId));
      addActivity('Hapus Mata Pelajaran', 'Data Master', `Menghapus mapel ${deleteName}`);
      setDeleteId(null);
      setDeleteName('');
    }
  };

  // Filter list
  const filteredSubjects = subjects.filter(sub => 
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cardBg = darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100';
  const textTitle = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Subject Creator / Editor Form Card */}
      <div className={`p-5 rounded-xl border shadow-xs h-fit ${cardBg}`}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
          <div className="p-2 bg-[#696cff]/10 text-[#696cff] rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>
              {selectedId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
            </h3>
            <p className="text-[11px] text-gray-400">Kelola master kurikulum yang Anda ampu</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textSub}`}>Kode Mapel</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] dark:focus:border-[#696cff] focus:bg-white dark:focus:bg-gray-800 transition-colors uppercase font-mono"
              placeholder="e.g. MAT-7A"
              required
            />
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textSub}`}>Nama Mata Pelajaran</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] dark:focus:border-[#696cff] focus:bg-white dark:focus:bg-gray-800 transition-colors"
              placeholder="e.g. Matematika"
              required
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-[#696cff] hover:bg-[#5f61e6] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {selectedId ? 'Simpan Perubahan' : 'Tambah Mapel'}
            </button>
            {selectedId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Subject list Table Card */}
      <div className={`p-5 rounded-xl border shadow-xs lg:col-span-2 flex flex-col ${cardBg}`}>
        
        {/* Header Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
          <div>
            <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>Daftar Mata Pelajaran</h3>
            <p className="text-[11px] text-gray-400">Total {filteredSubjects.length} Mata Pelajaran terdaftar</p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari mapel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-full sm:w-60 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Kode Mapel</th>
                <th className="py-3 px-4">Nama Mata Pelajaran</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((sub) => (
                <tr 
                  key={sub.id}
                  className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-all text-gray-700 dark:text-gray-300"
                >
                  <td className="py-3 px-4 font-mono font-bold text-[#696cff] dark:text-[#8587ff]">{sub.code}</td>
                  <td className="py-3 px-4 font-semibold">{sub.name}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex gap-1.5">
                      <button
                        onClick={() => handleEdit(sub)}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors cursor-pointer dark:bg-indigo-950/20 dark:text-indigo-400"
                        title="Edit mapel"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id, sub.name)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer dark:bg-rose-950/20 dark:text-rose-400"
                        title="Hapus mapel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSubjects.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-400">
                    Tidak ada mata pelajaran ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-xl border shadow-xl ${darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-base font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Konfirmasi Hapus Mata Pelajaran
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus mata pelajaran <strong className={darkMode ? 'text-white' : 'text-gray-800'}>"{deleteName}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteId(null);
                  setDeleteName('');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
