/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Class } from '../types';
import { Plus, Edit2, Trash2, Search, Layers, AlertCircle } from 'lucide-react';

interface ClassesViewProps {
  classes: Class[];
  setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
  addActivity: (action: string, module: string, details: string) => void;
  darkMode: boolean;
}

export default function ClassesView({ classes, setClasses, addActivity, darkMode }: ClassesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals / Form editing states
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('7');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [errorMsg, setErrorMsg] = useState('');

  // Custom Delete Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  // Reset form
  const resetForm = () => {
    setName('');
    setLevel('7');
    setAcademicYear('2025/2026');
    setSelectedId(null);
    setIsEditing(false);
    setErrorMsg('');
  };

  // Create or Update
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !level || !academicYear) {
      setErrorMsg('Semua kolom harus diisi.');
      return;
    }

    // Check duplicate class name under same academic year
    const isDuplicate = classes.some(
      c => c.name.toLowerCase() === name.toLowerCase() && 
      c.academicYear === academicYear && 
      c.id !== selectedId
    );
    if (isDuplicate) {
      setErrorMsg(`Kelas ${name} pada Tahun Ajaran ${academicYear} sudah terdaftar.`);
      return;
    }

    if (selectedId) {
      // Update
      setClasses(prev => prev.map(c => c.id === selectedId ? { ...c, name, level, academicYear } : c));
      addActivity('Edit Kelas', 'Data Master', `Mengubah kelas ${name} (${academicYear})`);
    } else {
      // Create
      const newClass: Class = {
        id: 'class-' + Date.now(),
        name,
        level,
        academicYear
      };
      setClasses(prev => [...prev, newClass]);
      addActivity('Tambah Kelas', 'Data Master', `Menambahkan kelas baru ${name} (${academicYear})`);
    }

    resetForm();
  };

  // Edit action
  const handleEdit = (cls: Class) => {
    setSelectedId(cls.id);
    setName(cls.name);
    setLevel(cls.level);
    setAcademicYear(cls.academicYear);
    setIsEditing(true);
  };

  // Delete action
  const handleDelete = (id: string, className: string) => {
    setDeleteId(id);
    setDeleteName(className);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setClasses(prev => prev.filter(c => c.id !== deleteId));
      addActivity('Hapus Kelas', 'Data Master', `Menghapus kelas ${deleteName}`);
      setDeleteId(null);
      setDeleteName('');
    }
  };

  // Filter list
  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.academicYear.includes(searchQuery) ||
    cls.level.includes(searchQuery)
  );

  const cardBg = darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100';
  const textTitle = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Class Creator / Editor Card */}
      <div className={`p-5 rounded-xl border shadow-xs h-fit ${cardBg}`}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
          <div className="p-2 bg-[#03c3ec]/10 text-[#03c3ec] rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>
              {selectedId ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
            </h3>
            <p className="text-[11px] text-gray-400">Tentukan daftar kelas mengajar aktif</p>
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
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textSub}`}>Tingkat Sekolah</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] transition-all cursor-pointer"
            >
              <option value="7">Kelas VII (7)</option>
              <option value="8">Kelas VIII (8)</option>
              <option value="9">Kelas IX (9)</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textSub}`}>Nama Kelas</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] transition-colors"
              placeholder="e.g. VII-A atau VII-A1"
              required
            />
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textSub}`}>Tahun Ajaran</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] transition-colors"
              placeholder="e.g. 2025/2026"
              required
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-[#03c3ec] hover:bg-[#02afd4] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {selectedId ? 'Simpan Kelas' : 'Tambah Kelas'}
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

      {/* Class list table card */}
      <div className={`p-5 rounded-xl border shadow-xs lg:col-span-2 flex flex-col ${cardBg}`}>
        
        {/* Header Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
          <div>
            <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>Daftar Kelas Mengajar</h3>
            <p className="text-[11px] text-gray-400">Total {filteredClasses.length} Kelas terdaftar</p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-full sm:w-60 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
            />
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Tingkat</th>
                <th className="py-3 px-4">Nama Kelas</th>
                <th className="py-3 px-4">Tahun Ajaran</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map((cls) => (
                <tr 
                  key={cls.id}
                  className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-all text-gray-700 dark:text-gray-300"
                >
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-[#03c3ec]/10 text-[#03c3ec] font-bold">
                      Kelas {cls.level}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold">{cls.name}</td>
                  <td className="py-3 px-4 text-gray-400 font-mono font-medium">{cls.academicYear}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex gap-1.5">
                      <button
                        onClick={() => handleEdit(cls)}
                        className="p-1.5 bg-[#03c3ec]/10 hover:bg-[#03c3ec]/20 text-[#03c3ec] rounded-lg transition-colors cursor-pointer"
                        title="Edit kelas"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id, cls.name)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer dark:bg-rose-950/20 dark:text-rose-400"
                        title="Hapus kelas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredClasses.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    Tidak ada kelas ditemukan.
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
              Konfirmasi Hapus Kelas
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus kelas <strong className={darkMode ? 'text-white' : 'text-gray-800'}>"{deleteName}"</strong>? Semua data siswa dan nilai di kelas ini akan kehilangan relasinya. Tindakan ini tidak dapat dibatalkan.
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
