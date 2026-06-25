/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Attendance, Student, Subject, Class } from '../types';
import { 
  Calendar, Layers, BookOpen, Save, Printer, CheckCircle, AlertCircle, TrendingUp, Info 
} from 'lucide-react';
import { exportToPDF } from '../utils/exportHelpers';

interface AttendanceViewProps {
  attendanceList: Attendance[];
  setAttendanceList: React.Dispatch<React.SetStateAction<Attendance[]>>;
  students: Student[];
  subjects: Subject[];
  classes: Class[];
  addActivity: (action: string, module: string, details: string) => void;
  darkMode: boolean;
}

export default function AttendanceView({
  attendanceList,
  setAttendanceList,
  students,
  subjects,
  classes,
  addActivity,
  darkMode
}: AttendanceViewProps) {
  
  // Date and filter selections
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  
  // Default to today's date in local time (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  });

  // Current attendance grid state
  // Map of studentId -> status ('Hadir' | 'Izin' | 'Sakit' | 'Alfa')
  const [gridStatuses, setGridStatuses] = useState<Record<string, 'Hadir' | 'Izin' | 'Sakit' | 'Alfa'>>({});
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Set default filter on mount
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [subjects, classes]);

  // Load existing attendance on selection change
  useEffect(() => {
    if (!selectedSubjectId || !selectedClassId || !selectedDate) return;

    const classStudents = students.filter(s => s.classId === selectedClassId);
    const newStatuses: typeof gridStatuses = {};

    classStudents.forEach(student => {
      // Find existing record
      const existing = attendanceList.find(
        a => a.studentId === student.id && 
        a.subjectId === selectedSubjectId && 
        a.date === selectedDate
      );
      newStatuses[student.id] = existing ? existing.status : 'Hadir'; // Default to Hadir
    });

    setGridStatuses(newStatuses);
    setAlertMsg(null);
  }, [selectedSubjectId, selectedClassId, selectedDate, attendanceList, students]);

  // Handle single student status change
  const handleStatusChange = (studentId: string, status: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa') => {
    setGridStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Bulk save
  const handleSaveAttendance = () => {
    if (!selectedSubjectId || !selectedClassId || !selectedDate) {
      setAlertMsg({ type: 'error', text: 'Filter harus diisi lengkap.' });
      return;
    }

    const classStudents = students.filter(s => s.classId === selectedClassId);

    setAttendanceList(prev => {
      // Remove existing for this combination
      const filtered = prev.filter(
        a => !(a.classId === selectedClassId && a.subjectId === selectedSubjectId && a.date === selectedDate)
      );

      const updatedRecords: Attendance[] = classStudents.map(student => {
        const status = gridStatuses[student.id] || 'Hadir';
        return {
          id: `att-${selectedClassId}-${selectedSubjectId}-${selectedDate}-${student.id}`,
          studentId: student.id,
          subjectId: selectedSubjectId,
          classId: selectedClassId,
          date: selectedDate,
          status
        };
      });

      return [...filtered, ...updatedRecords];
    });

    const activeSub = subjects.find(s => s.id === selectedSubjectId);
    const activeCls = classes.find(c => c.id === selectedClassId);
    addActivity(
      'Absensi Siswa', 
      'Akademik', 
      `Melakukan absensi mapel ${activeSub?.name} kelas ${activeCls?.name} tanggal ${selectedDate}`
    );

    setAlertMsg({ type: 'success', text: 'Absensi harian berhasil disinkronkan ke Supabase Database!' });
    setTimeout(() => setAlertMsg(null), 3000);
  };

  // Quick Daily Stats Count
  const classStudents = students.filter(s => s.classId === selectedClassId);
  const counts = { Hadir: 0, Izin: 0, Sakit: 0, Alfa: 0 };
  classStudents.forEach(s => {
    const stat = gridStatuses[s.id] || 'Hadir';
    counts[stat]++;
  });

  // Export Daily Attendance Report
  const handlePrintPDF = () => {
    const headers = ['No', 'NIS', 'Nama Siswa', 'Status Kehadiran'];
    const rows = classStudents.map((s, idx) => {
      const stat = gridStatuses[s.id] || 'Hadir';
      return [idx + 1, s.nis, s.fullName, stat];
    });

    const activeSub = subjects.find(s => s.id === selectedSubjectId);
    const activeCls = classes.find(c => c.id === selectedClassId);

    exportToPDF(
      `Laporan Absensi Kehadiran Siswa`,
      headers,
      rows,
      {
        'Mata Pelajaran': activeSub?.name || '-',
        'Kelas / Tingkat': activeCls?.name || '-',
        'Tanggal Absen': new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        'Hadir / Izin / Sakit / Alfa': `${counts.Hadir} / ${counts.Izin} / ${counts.Sakit} / ${counts.Alfa}`
      }
    );
  };

  const cardBg = darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100';
  const textTitle = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-6">
      
      {/* Filtering Row Card */}
      <div className={`p-5 rounded-xl border shadow-xs ${cardBg}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4">
          
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Pilih Mata Pelajaran</label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] cursor-pointer"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Pilih Kelas</label>
            <div className="relative">
              <Layers className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] cursor-pointer"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - Tingkat {c.level}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Tanggal KBM</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] cursor-pointer"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'HADIR (H)', count: counts.Hadir, color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40' },
          { label: 'IZIN (I)', count: counts.Izin, color: 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/40' },
          { label: 'SAKIT (S)', count: counts.Sakit, color: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40' },
          { label: 'ALFA (A)', count: counts.Alfa, color: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40' },
        ].map((stat, idx) => (
          <div key={idx} className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center ${stat.color}`}>
            <span className="text-[10px] font-extrabold uppercase tracking-widest">{stat.label}</span>
            <span className="text-xl md:text-2xl font-black font-sans mt-0.5">{stat.count}</span>
          </div>
        ))}
      </div>

      {/* Interactive Sheet Grid Table */}
      <div className={`p-5 rounded-xl border shadow-xs flex flex-col ${cardBg}`}>
        
        {/* Title row */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
          <div>
            <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>Daftar Presensi Kehadiran</h3>
            <p className="text-[11px] text-gray-400">Pilih salah satu status presensi untuk siswa berikut</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrintPDF}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg border border-indigo-200/50 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" /> Cetak PDF
            </button>
            <button
              onClick={handleSaveAttendance}
              className="px-4 py-2 bg-[#71dd37] hover:bg-[#64c431] text-white text-xs font-bold rounded-lg shadow-sm shadow-[#71dd37]/30 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" /> Simpan Absensi
            </button>
          </div>
        </div>

        {alertMsg && (
          <div className={`p-3 rounded-lg mb-4 text-xs font-medium flex items-center gap-2 ${
            alertMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
              : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}>
            {alertMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{alertMsg.text}</span>
          </div>
        )}

        {/* Ledger */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-28">NIS</th>
                <th className="py-3 px-4 min-w-[150px]">Nama Siswa</th>
                <th className="py-3 px-4 w-16 text-center">L/P</th>
                <th className="py-3 px-4 text-center">Pilih Kehadiran (Hadir / Izin / Sakit / Alfa)</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((stud, idx) => {
                const currentStatus = gridStatuses[stud.id] || 'Hadir';

                return (
                  <tr 
                    key={stud.id}
                    className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/10 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <td className="py-3 px-4 text-center font-mono text-gray-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono text-gray-500 font-semibold">{stud.nis}</td>
                    <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-100">{stud.fullName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] ${
                        stud.gender === 'Laki-laki' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20' : 'bg-pink-50 text-pink-600 dark:bg-pink-950/20'
                      }`}>
                        {stud.gender === 'Laki-laki' ? 'L' : 'P'}
                      </span>
                    </td>
                    
                    {/* Multi-state radio select button group */}
                    <td className="py-2.5 px-4">
                      <div className="flex justify-center items-center gap-2">
                        {[
                          { key: 'Hadir', label: 'Hadir', color: 'peer-checked:bg-emerald-500 peer-checked:text-white dark:peer-checked:bg-emerald-600 bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700/50' },
                          { key: 'Izin', label: 'Izin', color: 'peer-checked:bg-sky-500 peer-checked:text-white dark:peer-checked:bg-sky-600 bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700/50' },
                          { key: 'Sakit', label: 'Sakit', color: 'peer-checked:bg-amber-500 peer-checked:text-white dark:peer-checked:bg-amber-600 bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700/50' },
                          { key: 'Alfa', label: 'Alfa', color: 'peer-checked:bg-rose-500 peer-checked:text-white dark:peer-checked:bg-rose-600 bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700/50' },
                        ].map((btn) => (
                          <label key={btn.key} className="relative block cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`attendance-${stud.id}`}
                              checked={currentStatus === btn.key}
                              onChange={() => handleStatusChange(stud.id, btn.key as any)}
                              className="sr-only peer"
                            />
                            <div className={`px-4 py-1.5 text-[11px] font-bold rounded-lg text-center transition-all duration-150 ${btn.color}`}>
                              {btn.label}
                            </div>
                          </label>
                        ))}
                      </div>
                    </td>

                  </tr>
                );
              })}

              {classStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Tidak ada siswa di kelas ini. Daftarkan siswa ke kelas ini di menu "Siswa".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {classStudents.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50/50 dark:bg-[#696cff]/5 border border-[#696cff]/10 rounded-lg text-[11px] text-gray-500 dark:text-gray-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-[#696cff] shrink-0 mt-0.5" />
            <div>
              Absensi yang dimasukkan akan tersimpan di browser Anda dan disinkronkan ke cloud. Anda dapat melihat dan mencetak rekap bulanan atau rekap harian secara utuh di menu <strong>"Cetak Laporan"</strong>.
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
