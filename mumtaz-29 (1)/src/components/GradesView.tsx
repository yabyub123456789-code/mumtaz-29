/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Grade, Student, Subject, Class, Profile } from '../types';
import { 
  BookOpen, Layers, Save, Printer, FileDown, CheckCircle, AlertCircle, Info 
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportHelpers';

interface GradesViewProps {
  grades: Grade[];
  setGrades: React.Dispatch<React.SetStateAction<Grade[]>>;
  students: Student[];
  subjects: Subject[];
  classes: Class[];
  addActivity: (action: string, module: string, details: string) => void;
  profile?: Profile | null;
  darkMode: boolean;
}

export default function GradesView({
  grades,
  setGrades,
  students,
  subjects,
  classes,
  addActivity,
  profile,
  darkMode
}: GradesViewProps) {
  
  // Filtering states
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  
  // Editable form state for current grid
  // Map of studentId -> grade fields
  const [gridValues, setGridValues] = useState<Record<string, {
    assignment: number;
    daily: number;
    pts: number;
    pas: number;
  }>>({});

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

  // Load / Sync grid values when selection changes
  useEffect(() => {
    if (!selectedSubjectId || !selectedClassId) return;

    // Filter students for the active class
    const classStudents = students.filter(s => s.classId === selectedClassId);
    
    const newGrid: typeof gridValues = {};
    classStudents.forEach(student => {
      // Find existing grade record
      const existing = grades.find(g => g.studentId === student.id && g.subjectId === selectedSubjectId);
      newGrid[student.id] = {
        assignment: existing ? existing.assignment : 0,
        daily: existing ? existing.daily : 0,
        pts: existing ? existing.pts : 0,
        pas: existing ? existing.pas : 0,
      };
    });

    setGridValues(newGrid);
    setAlertMsg(null);
  }, [selectedSubjectId, selectedClassId, grades, students]);

  // Calculate final grade & predicate
  const calculateFinal = (asg: number, dly: number, pts: number, pas: number) => {
    return parseFloat(((dly * 0.60) + (pts * 0.20) + (pas * 0.20)).toFixed(2));
  };

  const getPredicate = (final: number): 'A' | 'B' | 'C' | 'D' | 'E' => {
    if (final >= 88) return 'A';
    if (final >= 78) return 'B';
    if (final >= 68) return 'C';
    if (final >= 55) return 'D';
    return 'E';
  };

  // Handle direct field change
  const handleValueChange = (studentId: string, field: 'assignment' | 'daily' | 'pts' | 'pas', value: string) => {
    // Parse to clean number between 0 and 100
    let num = parseFloat(value);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > 100) num = 100;

    setGridValues(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: num
      }
    }));
  };

  // Bulk Save
  const handleSaveAll = () => {
    if (!selectedSubjectId || !selectedClassId) {
      setAlertMsg({ type: 'error', text: 'Silakan pilih Mata Pelajaran dan Kelas terlebih dahulu.' });
      return;
    }

    const classStudents = students.filter(s => s.classId === selectedClassId);
    
    setGrades(prev => {
      // Filter out existing ones to prevent duplicates
      const filtered = prev.filter(g => !(g.classId === selectedClassId && g.subjectId === selectedSubjectId));
      
      const updatedGrades: Grade[] = classStudents.map(student => {
        const vals = gridValues[student.id] || { assignment: 0, daily: 0, pts: 0, pas: 0 };
        const finalGrade = calculateFinal(0, vals.daily, vals.pts, vals.pas);
        const predicate = getPredicate(finalGrade);

        return {
          id: `gr-${selectedClassId}-${selectedSubjectId}-${student.id}`,
          studentId: student.id,
          subjectId: selectedSubjectId,
          classId: selectedClassId,
          assignment: 0,
          daily: vals.daily,
          pts: vals.pts,
          pas: vals.pas,
          finalGrade,
          predicate
        };
      });

      return [...filtered, ...updatedGrades];
    });

    const activeSub = subjects.find(s => s.id === selectedSubjectId);
    const activeCls = classes.find(c => c.id === selectedClassId);
    addActivity('Input Nilai', 'Akademik', `Menyimpan rekap nilai mapel ${activeSub?.name} kelas ${activeCls?.name}`);

    setAlertMsg({ type: 'success', text: 'Seluruh nilai berhasil disimpan ke database Supabase!' });
    setTimeout(() => setAlertMsg(null), 3000);
  };

  // Export reports
  const activeSubject = subjects.find(s => s.id === selectedSubjectId);
  const activeClass = classes.find(c => c.id === selectedClassId);
  const classStudents = students.filter(s => s.classId === selectedClassId);

  const getExportData = () => {
    return classStudents.map((stud, idx) => {
      const vals = gridValues[stud.id] || { assignment: 0, daily: 0, pts: 0, pas: 0 };
      const finalGrade = calculateFinal(0, vals.daily, vals.pts, vals.pas);
      const predicate = getPredicate(finalGrade);
      return {
        no: idx + 1,
        nis: stud.nis,
        nama: stud.fullName,
        harian: vals.daily,
        pts: vals.pts,
        pas: vals.pas,
        akhir: finalGrade,
        predikat: predicate
      };
    });
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const headers = ['No', 'NIS', 'Nama Siswa', 'Nilai Harian (60%)', 'Nilai STS (20%)', 'Nilai PAS/PSAT (20%)', 'Nilai Akhir', 'Predikat'];
    const rows = data.map(d => [d.no, d.nis, d.nama, d.harian, d.pts, d.pas, d.akhir, d.predikat]);
    
    exportToExcel(
      `Rekap_Nilai_${activeSubject?.name}_${activeClass?.name}`,
      headers,
      rows
    );
  };

  const handleExportPDF = () => {
    const data = getExportData();
    const headers = ['No', 'NIS', 'Nama Siswa', 'Harian (60%)', 'STS (20%)', 'PAS/PSAT (20%)', 'Nilai Akhir', 'Predikat'];
    const rows = data.map(d => [d.no, d.nis, d.nama, d.harian, d.pts, d.pas, d.akhir, d.predikat]);
    
    exportToPDF(
      `Rekap Nilai Siswa per Mata Pelajaran`,
      headers,
      rows,
      {
        'Mata Pelajaran': activeSubject?.name || '-',
        'Kelas / Tingkat': activeClass?.name || '-',
        'Tahun Ajaran': activeClass?.academicYear || '-',
        'Total Siswa': classStudents.length.toString(),
        'Rumusan': 'Harian (60%) | STS (20%) | PAS/PSAT (20%)',
        'Nama Guru': profile?.fullName || 'Guru Mapel'
      },
      'Guru Mapel'
    );
  };

  const cardBg = darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100';
  const textTitle = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-6">
      
      {/* Subject and Class Filters Card */}
      <div className={`p-5 rounded-xl border shadow-xs ${cardBg}`}>
        <div className="flex flex-col md:flex-row items-end gap-4">
          
          <div className="flex-1 w-full">
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Mata Pelajaran</label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] transition-all cursor-pointer"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 w-full">
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Kelas Mengajar</label>
            <div className="relative">
              <Layers className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] transition-all cursor-pointer"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - Tingkat {c.level} ({c.academicYear})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-200/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4" /> Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg border border-indigo-200/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Cetak PDF
            </button>
          </div>

        </div>
      </div>

      {/* Main interactive Marks entry table card */}
      <div className={`p-5 rounded-xl border shadow-xs flex flex-col ${cardBg}`}>
        
        {/* Table Title and controls */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
          <div>
            <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>Lembar Pengisian Nilai Siswa</h3>
            <p className="text-[11px] text-gray-400">
              Kalkulasi: <strong>Harian (60%) + STS (20%) + PAS/PSAT (20%)</strong>. Berikan nilai 0-100.
            </p>
          </div>
          
          <button
            onClick={handleSaveAll}
            className="px-4 py-2 bg-[#696cff] hover:bg-[#5f61e6] text-white text-xs font-bold rounded-lg shadow-sm shadow-[#696cff]/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Simpan Semua Nilai
          </button>
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

        {/* Real-time Marks Ledger Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-28">NIS</th>
                <th className="py-3 px-4 min-w-[150px]">Nama Siswa</th>
                <th className="py-3 px-4 w-24 text-center">Harian (60%)</th>
                <th className="py-3 px-4 w-24 text-center">STS (20%)</th>
                <th className="py-3 px-4 w-24 text-center">PAS/PSAT (20%)</th>
                <th className="py-3 px-4 w-28 text-center bg-gray-50/50 dark:bg-black/10">Nilai Akhir</th>
                <th className="py-3 px-4 w-20 text-center">Predikat</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((stud, idx) => {
                const vals = gridValues[stud.id] || { assignment: 0, daily: 0, pts: 0, pas: 0 };
                const finalGrade = calculateFinal(vals.assignment, vals.daily, vals.pts, vals.pas);
                const predicate = getPredicate(finalGrade);

                // Styling predicate
                const predColors = {
                  A: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
                  B: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400',
                  C: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
                  D: 'bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400',
                  E: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400',
                };

                return (
                  <tr 
                    key={stud.id}
                    className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/10 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <td className="py-3 px-4 text-center font-mono text-gray-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono text-gray-500 font-medium">{stud.nis}</td>
                    <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-100">{stud.fullName}</td>
                    
                    {/* Inline input Harian */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={vals.daily}
                        onChange={(e) => handleValueChange(stud.id, 'daily', e.target.value)}
                        className="w-16 px-1.5 py-1 text-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:border-[#696cff] font-mono text-xs text-gray-800 dark:text-gray-100"
                      />
                    </td>

                    {/* Inline input STS */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={vals.pts}
                        onChange={(e) => handleValueChange(stud.id, 'pts', e.target.value)}
                        className="w-16 px-1.5 py-1 text-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:border-[#696cff] font-mono text-xs text-gray-800 dark:text-gray-100"
                      />
                    </td>

                    {/* Inline input PAS */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={vals.pas}
                        onChange={(e) => handleValueChange(stud.id, 'pas', e.target.value)}
                        className="w-16 px-1.5 py-1 text-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:border-[#696cff] font-mono text-xs text-gray-800 dark:text-gray-100"
                      />
                    </td>

                    {/* Auto Calculated Final Grade */}
                    <td className="py-3 px-4 text-center font-bold text-sm bg-gray-50/50 dark:bg-black/10 font-mono text-[#696cff] dark:text-[#8587ff]">
                      {finalGrade}
                    </td>

                    {/* Auto calculated Predicate badge */}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-bold ${predColors[predicate]}`}>
                        {predicate}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {classStudents.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Tidak ada siswa di kelas ini. Daftarkan siswa ke kelas ini terlebih dahulu di menu "Siswa".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Warning Information footer */}
        {classStudents.length > 0 && (
          <div className="mt-4 p-3.5 bg-blue-50/50 dark:bg-[#696cff]/5 border border-[#696cff]/10 rounded-lg text-[11px] text-gray-500 dark:text-gray-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-[#696cff] shrink-0 mt-0.5" />
            <div>
              Nilai yang dimasukkan di atas akan dikalkulasi secara instan. Jangan lupa menekan tombol <strong>"Simpan Semua Nilai"</strong> sebelum berganti kelas atau mata pelajaran untuk menyinkronkan data Anda ke dalam database Supabase.
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
