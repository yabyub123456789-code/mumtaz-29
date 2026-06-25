/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TeachingJournal, Subject, Class } from '../types';
import { 
  FileText, Calendar, BookOpen, Layers, Clock, Settings, Plus, Trash2, 
  Paperclip, Search, ChevronRight, FileDown, AlertCircle, Sparkles, CheckCircle
} from 'lucide-react';

interface JournalsViewProps {
  journals: TeachingJournal[];
  setJournals: React.Dispatch<React.SetStateAction<TeachingJournal[]>>;
  subjects: Subject[];
  classes: Class[];
  addActivity: (action: string, module: string, details: string) => void;
  darkMode: boolean;
}

export default function JournalsView({
  journals,
  setJournals,
  subjects,
  classes,
  addActivity,
  darkMode
}: JournalsViewProps) {
  
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [date, setDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  });
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [period, setPeriod] = useState('1-2');
  const [topic, setTopic] = useState('');
  const [method, setMethod] = useState('');
  const [presentCount, setPresentCount] = useState(25);
  const [notes, setNotes] = useState('');
  
  // Simulated file attachment state
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Custom Delete Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  // Default dropdown selections on mount
  useEffect(() => {
    if (subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
    if (classes.length > 0 && !classId) {
      setClassId(classes[0].id);
    }
  }, [subjects, classes]);

  // Handle simulated file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedFileName(e.target.files[0].name);
    }
  };

  // Reset Form
  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    if (subjects.length > 0) setSubjectId(subjects[0].id);
    if (classes.length > 0) setClassId(classes[0].id);
    setPeriod('1-2');
    setTopic('');
    setMethod('');
    setPresentCount(25);
    setNotes('');
    setAttachedFileName(null);
    setErrorMsg('');
  };

  // Submit Journal Entry
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!date || !subjectId || !classId || !topic || !method) {
      setErrorMsg('Semua kolom berlabel bintang (*) wajib diisi.');
      return;
    }

    const newJournal: TeachingJournal = {
      id: 'jr-' + Date.now(),
      date,
      subjectId,
      classId,
      period,
      topic,
      method,
      presentCount: Number(presentCount),
      notes,
      attachmentName: attachedFileName || undefined
    };

    setJournals(prev => [newJournal, ...prev]);
    
    const activeSub = subjects.find(s => s.id === subjectId);
    const activeCls = classes.find(c => c.id === classId);
    addActivity(
      'Jurnal Mengajar', 
      'Akademik', 
      `Menginput jurnal mengajar mapel ${activeSub?.name} kelas ${activeCls?.name}`
    );

    setAlertMsg({ type: 'success', text: 'Jurnal KBM harian berhasil didokumentasikan!' });
    setTimeout(() => setAlertMsg(null), 3000);
    resetForm();
  };

  // Delete journal entry
  const handleDelete = (id: string, journalTopic: string) => {
    setDeleteId(id);
    setDeleteName(journalTopic);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setJournals(prev => prev.filter(j => j.id !== deleteId));
      addActivity('Hapus Jurnal', 'Akademik', `Menghapus entri jurnal mengajar "${deleteName}"`);
      setDeleteId(null);
      setDeleteName('');
    }
  };

  // Filter journals based on search query
  const filteredJournals = journals.filter(j => {
    const sub = subjects.find(s => s.id === j.subjectId);
    const cls = classes.find(c => c.id === j.classId);
    
    const query = searchQuery.toLowerCase();
    return (
      j.topic.toLowerCase().includes(query) ||
      j.method.toLowerCase().includes(query) ||
      (j.notes && j.notes.toLowerCase().includes(query)) ||
      (sub && sub.name.toLowerCase().includes(query)) ||
      (cls && cls.name.toLowerCase().includes(query))
    );
  });

  const cardBg = darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100';
  const textTitle = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* Journal Creation Input Form (1 Column) */}
      <div className={`p-5 rounded-xl border shadow-xs h-fit ${cardBg}`}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
          <div className="p-2 bg-[#ffab00]/10 text-[#ffab00] rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>Input Jurnal Mengajar</h3>
            <p className="text-[11px] text-gray-400">Dokumentasikan kegiatan belajar harian Anda</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {alertMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4" />
            <span>{alertMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${textSub}`}>Tanggal KBM *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
                required
              />
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${textSub}`}>Jam Pelajaran *</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-2.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] cursor-pointer"
              >
                <option value="1-2">Jam ke 1 - 2 (07:30 - 09:00)</option>
                <option value="3-4">Jam ke 3 - 4 (09:15 - 10:45)</option>
                <option value="Istirahat">Istirahat (10:45 - 11:15)</option>
                <option value="5-6">Jam ke 5 - 6 (11:15 - 12:45)</option>
                <option value="7-8">Jam ke 7 - 8 (13:00 - 14:30)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${textSub}`}>Mata Pelajaran *</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-2.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
                required
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${textSub}`}>Kelas Diajar *</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-2.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
                required
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${textSub}`}>Materi Pembelajaran *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
              placeholder="e.g. Pembahasan Relasi & Fungsi Linier"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${textSub}`}>Metode Pembelajaran *</label>
              <input
                type="text"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
                placeholder="e.g. Diskusi Kelompok"
                required
              />
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${textSub}`}>Jumlah Siswa Hadir *</label>
              <input
                type="number"
                min="0"
                value={presentCount}
                onChange={(e) => setPresentCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${textSub}`}>Catatan & Hambatan Guru (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
              placeholder="Tulis hambatan, PR, atau remedial hari ini..."
            />
          </div>

          {/* Attachment upload box */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${textSub}`}>Upload File RPP / Lampiran</label>
            <div className="relative flex items-center justify-center p-3.5 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="text-center">
                <Paperclip className="w-4 h-4 text-[#ffab00] mx-auto mb-1" />
                <span className="text-[10px] text-gray-400 font-bold block">
                  {attachedFileName ? `Lampiran: ${attachedFileName}` : 'Klik / Tarik File ke sini'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#ffab00] hover:bg-[#e09600] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Dokumentasikan Jurnal
          </button>
        </form>
      </div>

      {/* History log Jurnal Mengajar (2 Columns) */}
      <div className={`p-5 rounded-xl border shadow-xs xl:col-span-2 flex flex-col ${cardBg}`}>
        
        {/* Table Filter Top */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
          <div>
            <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>Riwayat Jurnal Pembelajaran</h3>
            <p className="text-[11px] text-gray-400">Total {filteredJournals.length} catatan KBM terdokumentasi</p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari materi / metode / mapel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-full sm:w-60 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none"
            />
          </div>
        </div>

        {/* List layout scrollable cards for extreme mobile-friendly UI */}
        <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
          {filteredJournals.map((jr) => {
            const sub = subjects.find(s => s.id === jr.subjectId);
            const cls = classes.find(c => c.id === jr.classId);

            return (
              <div 
                key={jr.id}
                className="p-4 rounded-xl border border-gray-100 dark:border-gray-800/60 bg-gray-50/30 dark:bg-[#1a1a24] hover:shadow-xs transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#ffab00]/10 text-[#ffab00] font-bold font-mono">
                      <Calendar className="w-3 h-3" /> {new Date(jr.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#696cff]/10 text-[#696cff] font-bold">
                      <BookOpen className="w-3 h-3" /> {sub ? sub.name : 'Unknown Subject'}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#03c3ec]/10 text-[#03c3ec] font-bold">
                      <Layers className="w-3 h-3" /> Kelas {cls ? cls.name : 'Unknown Class'}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold font-mono">
                      <Clock className="w-3 h-3" /> Jam: {jr.period}
                    </span>
                  </div>

                  <div>
                    <h4 className={`font-extrabold text-sm ${textTitle}`}>{jr.topic}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      Metode: <strong className="font-semibold text-gray-600 dark:text-gray-300">{jr.method}</strong> | Siswa Hadir: <strong className="text-emerald-500">{jr.presentCount} anak</strong>
                    </p>
                  </div>

                  {jr.notes && (
                    <div className="text-[11px] bg-white dark:bg-black/25 p-2 rounded-lg text-gray-500 dark:text-gray-400 border border-gray-100/50 dark:border-gray-800 italic">
                      Catatan: "{jr.notes}"
                    </div>
                  )}

                  {jr.attachmentName && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      <Paperclip className="w-3 h-3" />
                      <span>{jr.attachmentName}</span>
                      <span className="text-[8px] text-emerald-400 underline cursor-pointer">(Simulasi Unduh)</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-right md:self-center">
                  <button
                    onClick={() => handleDelete(jr.id, jr.topic)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors cursor-pointer dark:bg-rose-950/20"
                    title="Hapus jurnal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredJournals.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-xs">
              Belum ada jurnal mengajar terdaftar. Gunakan panel kiri untuk merekam KBM pertama Anda!
            </div>
          )}
        </div>

      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-xl border shadow-xl ${darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-base font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Konfirmasi Hapus Jurnal Mengajar
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus jurnal mengajar dengan topik <strong className={darkMode ? 'text-white' : 'text-gray-800'}>"{deleteName}"</strong>? Tindakan ini tidak dapat dibatalkan.
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
