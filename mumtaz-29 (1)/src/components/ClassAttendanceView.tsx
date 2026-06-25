/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Student, Class, ClassAttendance } from '../types';
import { 
  Calendar, Layers, Save, Printer, CheckCircle, AlertCircle, TrendingUp, Info, Users, 
  Search, Eye, Award, Check, X, Shield, Clock, BookOpen, UserCheck
} from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportHelpers';

interface ClassAttendanceViewProps {
  students: Student[];
  classes: Class[];
  addActivity: (action: string, module: string, details: string) => void;
  darkMode: boolean;
  profile: any;
}

export default function ClassAttendanceView({
  students,
  classes,
  addActivity,
  darkMode,
  profile
}: ClassAttendanceViewProps) {
  // State for class attendance records
  const [classAttendanceList, setClassAttendanceList] = useState<ClassAttendance[]>([]);
  
  // Tab states: 'daily' | 'monthly' | 'semester'
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'monthly' | 'semester'>('daily');
  
  // Selection states
  const [selectedClassId, setSelectedClassId] = useState('');
  
  // Default to today's date in local time (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  });

  // Monthly filters
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  // Semester filter: 1 = Ganjil (Jul-Dec), 2 = Genap (Jan-Jun)
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(() => {
    const month = new Date().getMonth() + 1;
    return month >= 7 && month <= 12 ? 1 : 2;
  });

  // Daily entry states
  const [gridStatuses, setGridStatuses] = useState<Record<string, 'Hadir' | 'Izin' | 'Sakit' | 'Alfa'>>({});
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search states for reports
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected student for personal detailed analysis modal
  const [detailedStudentId, setDetailedStudentId] = useState<string | null>(null);

  // Initialize and seed data if not present
  useEffect(() => {
    const stored = localStorage.getItem('guruku_class_attendance');
    if (stored) {
      try {
        setClassAttendanceList(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing class attendance", e);
      }
    } else if (students.length > 0) {
      // Seed data for the past 3 months to make reporting beautiful on load
      const seeded = seedClassAttendance(students);
      setClassAttendanceList(seeded);
      localStorage.setItem('guruku_class_attendance', JSON.stringify(seeded));
    }
  }, [students]);

  // Set default class
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes]);

  // Sync daily entry grid when selection changes
  useEffect(() => {
    if (!selectedClassId || !selectedDate) return;

    const classStudents = students.filter(s => s.classId === selectedClassId);
    const newStatuses: typeof gridStatuses = {};

    classStudents.forEach(student => {
      const existing = classAttendanceList.find(
        a => a.studentId === student.id && 
        a.classId === selectedClassId && 
        a.date === selectedDate
      );
      newStatuses[student.id] = existing ? existing.status : 'Hadir'; // Default to Hadir
    });

    setGridStatuses(newStatuses);
    setAlertMsg(null);
  }, [selectedClassId, selectedDate, classAttendanceList, students]);

  // Helper to seed realistic history
  const seedClassAttendance = (allStudents: Student[]): ClassAttendance[] => {
    const list: ClassAttendance[] = [];
    const today = new Date();
    
    // Seed for the last 60 calendar days
    for (let i = 60; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends
      
      const dateStr = d.toISOString().split('T')[0];
      allStudents.forEach(stud => {
        // High likelihood of being Present (Hadir)
        let status: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa' = 'Hadir';
        const rand = Math.random();
        
        // Give each student a slightly unique signature
        const hash = stud.fullName.charCodeAt(0) % 10;
        const absentThreshold = 0.94 + (hash * 0.005); // 94% to 99% present
        
        if (rand > absentThreshold) {
          const randType = Math.random();
          if (randType > 0.6) {
            status = 'Izin';
          } else if (randType > 0.2) {
            status = 'Sakit';
          } else {
            status = 'Alfa';
          }
        }
        
        list.push({
          id: `catt-${stud.classId}-${dateStr}-${stud.id}`,
          studentId: stud.id,
          classId: stud.classId,
          date: dateStr,
          status
        });
      });
    }
    return list;
  };

  // Save Daily Attendance
  const handleSaveDaily = () => {
    if (!selectedClassId || !selectedDate) {
      setAlertMsg({ type: 'error', text: 'Kelas dan Tanggal wajib dipilih.' });
      return;
    }

    const classStudents = students.filter(s => s.classId === selectedClassId);

    const updatedList = classAttendanceList.filter(
      a => !(a.classId === selectedClassId && a.date === selectedDate)
    );

    const newRecords: ClassAttendance[] = classStudents.map(stud => ({
      id: `catt-${selectedClassId}-${selectedDate}-${stud.id}`,
      studentId: stud.id,
      classId: selectedClassId,
      date: selectedDate,
      status: gridStatuses[stud.id] || 'Hadir'
    }));

    const finalRecords = [...updatedList, ...newRecords];
    setClassAttendanceList(finalRecords);
    localStorage.setItem('guruku_class_attendance', JSON.stringify(finalRecords));

    const activeCls = classes.find(c => c.id === selectedClassId);
    addActivity(
      'Absensi Kelas',
      'Wali Kelas',
      `Mencatat absensi kelas ${activeCls?.name} tanggal ${selectedDate}`
    );

    setAlertMsg({ type: 'success', text: 'Absensi kelas hari ini berhasil disimpan!' });
    setTimeout(() => setAlertMsg(null), 3000);
  };

  // Quick Action: Set all students to Hadir
  const setAllToHadir = () => {
    const classStudents = students.filter(s => s.classId === selectedClassId);
    const updated: typeof gridStatuses = {};
    classStudents.forEach(stud => {
      updated[stud.id] = 'Hadir';
    });
    setGridStatuses(updated);
  };

  // Months name array
  const monthsIndo = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
  ];

  // Get active class details
  const activeClass = classes.find(c => c.id === selectedClassId);
  const classStudents = students.filter(s => s.classId === selectedClassId);

  // Helper: Filter records for active class and selected month
  const getMonthlyRecords = () => {
    return classAttendanceList.filter(a => {
      if (a.classId !== selectedClassId) return false;
      const recordDate = new Date(a.date);
      const m = recordDate.getMonth() + 1;
      const y = recordDate.getFullYear();
      return m === selectedMonth && y === selectedYear;
    });
  };

  // Helper: Filter records for active class and selected semester
  const getSemesterRecords = () => {
    return classAttendanceList.filter(a => {
      if (a.classId !== selectedClassId) return false;
      const recordDate = new Date(a.date);
      const m = recordDate.getMonth() + 1;
      
      // Semester 1: July (7) - December (12)
      // Semester 2: January (1) - June (6)
      if (selectedSemester === 1) {
        return m >= 7 && m <= 12;
      } else {
        return m >= 1 && m <= 6;
      }
    });
  };

  // Calculate stats per student (for a set of attendance records)
  const calculateStudentStats = (studentId: string, records: ClassAttendance[]) => {
    const studRecs = records.filter(r => r.studentId === studentId);
    const total = studRecs.length;
    
    const count = { Hadir: 0, Izin: 0, Sakit: 0, Alfa: 0 };
    studRecs.forEach(r => {
      count[r.status]++;
    });

    const percent = total > 0 
      ? Math.round((count.Hadir / total) * 100) 
      : 100;

    return {
      ...count,
      totalDays: total,
      attendancePercentage: percent
    };
  };

  // Calculate overall class stats
  const calculateClassStats = (records: ClassAttendance[]) => {
    const total = records.length;
    if (total === 0) return { Hadir: 100, Izin: 0, Sakit: 0, Alfa: 0, raw: { Hadir: 0, Izin: 0, Sakit: 0, Alfa: 0 } };

    const count = { Hadir: 0, Izin: 0, Sakit: 0, Alfa: 0 };
    records.forEach(r => {
      count[r.status]++;
    });

    return {
      Hadir: Math.round((count.Hadir / total) * 100),
      Izin: Math.round((count.Izin / total) * 100),
      Sakit: Math.round((count.Sakit / total) * 100),
      Alfa: Math.round((count.Alfa / total) * 100),
      raw: count
    };
  };

  // Export Monthly report to PDF
  const handleExportMonthlyPDF = () => {
    const records = getMonthlyRecords();
    const monthLabel = monthsIndo.find(m => m.value === selectedMonth)?.label || '';
    
    const headers = ['No', 'NIS', 'Nama Lengkap', 'Gender', 'Hadir (H)', 'Sakit (S)', 'Izin (I)', 'Alfa (A)', 'Persentase %'];
    const rows = classStudents.map((stud, idx) => {
      const stats = calculateStudentStats(stud.id, records);
      return [
        idx + 1,
        stud.nis,
        stud.fullName,
        stud.gender === 'Laki-laki' ? 'L' : 'P',
        stats.Hadir,
        stats.Sakit,
        stats.Izin,
        stats.Alfa,
        `${stats.attendancePercentage}%`
      ];
    });

    const classStats = calculateClassStats(records);

    exportToPDF(
      `Laporan Bulanan Absensi Kelas`,
      headers,
      rows,
      {
        'Kelas / Tingkat': activeClass?.name || '-',
        'Tahun Ajaran': activeClass?.academicYear || '-',
        'Bulan / Periode': `${monthLabel} ${selectedYear}`,
        'Wali Kelas': profile?.fullName || 'Guru Wali Kelas',
        'NUPTK Wali Kelas': profile?.nip || 'Belum Diisi',
        'Rata-Rata Kehadiran Kelas': `${classStats.Hadir}%`,
        'Persentase Sakit': `${classStats.Sakit}%`,
        'Persentase Izin': `${classStats.Izin}%`,
        'Persentase Alfa': `${classStats.Alfa}%`
      },
      'Wali Kelas'
    );
  };

  // Export Semester report to PDF
  const handleExportSemesterPDF = () => {
    const records = getSemesterRecords();
    const semLabel = selectedSemester === 1 ? 'Ganjil (Juli - Desember)' : 'Genap (Januari - Juni)';
    
    const headers = ['No', 'NIS', 'Nama Lengkap', 'Gender', 'Hadir (H)', 'Sakit (S)', 'Izin (I)', 'Alfa (A)', 'Persentase %'];
    const rows = classStudents.map((stud, idx) => {
      const stats = calculateStudentStats(stud.id, records);
      return [
        idx + 1,
        stud.nis,
        stud.fullName,
        stud.gender === 'Laki-laki' ? 'L' : 'P',
        stats.Hadir,
        stats.Sakit,
        stats.Izin,
        stats.Alfa,
        `${stats.attendancePercentage}%`
      ];
    });

    const classStats = calculateClassStats(records);

    exportToPDF(
      `Laporan Semester Absensi Kelas`,
      headers,
      rows,
      {
        'Kelas / Tingkat': activeClass?.name || '-',
        'Tahun Ajaran': activeClass?.academicYear || '-',
        'Semester': semLabel,
        'Wali Kelas': profile?.fullName || 'Guru Wali Kelas',
        'NUPTK Wali Kelas': profile?.nip || 'Belum Diisi',
        'Rata-Rata Kehadiran Kelas': `${classStats.Hadir}%`,
        'Persentase Sakit': `${classStats.Sakit}%`,
        'Persentase Izin': `${classStats.Izin}%`,
        'Persentase Alfa': `${classStats.Alfa}%`
      },
      'Wali Kelas'
    );
  };

  // Personal detailed view download PDF
  const handleExportPersonalPDF = (stud: Student, isSemester: boolean) => {
    const records = isSemester ? getSemesterRecords() : getMonthlyRecords();
    const periodLabel = isSemester 
      ? (selectedSemester === 1 ? 'Semester Ganjil' : 'Semester Genap') 
      : `${monthsIndo.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;

    const studRecs = records.filter(r => r.studentId === stud.id);
    const stats = calculateStudentStats(stud.id, records);

    // Create daily lists for this student
    const headers = ['No', 'Hari/Tanggal', 'Status Kehadiran', 'Keterangan'];
    const rows = studRecs.sort((a,b) => a.date.localeCompare(b.date)).map((r, idx) => {
      const d = new Date(r.date);
      const indDate = d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return [
        idx + 1,
        indDate,
        r.status,
        r.status === 'Hadir' ? 'Hadir tepat waktu' : r.status
      ];
    });

    exportToPDF(
      `Laporan Detail Presensi Siswa Personal`,
      headers,
      rows,
      {
        'Nama Siswa': stud.fullName,
        'NIS Siswa': stud.nis,
        'Kelas': activeClass?.name || '-',
        'Periode': periodLabel,
        'Kehadiran (H)': `${stats.Hadir} Hari`,
        'Izin (I)': `${stats.Izin} Hari`,
        'Sakit (S)': `${stats.Sakit} Hari`,
        'Alfa (A)': `${stats.Alfa} Hari`,
        'Persentase Kehadiran': `${stats.attendancePercentage}%`
      },
      'Wali Kelas'
    );
  };

  // Calculate current active state for class summaries
  const monthlyRecords = getMonthlyRecords();
  const semesterRecords = getSemesterRecords();
  
  const currentMonthlyStats = calculateClassStats(monthlyRecords);
  const currentSemesterStats = calculateClassStats(semesterRecords);

  // Daily summary count
  const dailyCounts = { Hadir: 0, Izin: 0, Sakit: 0, Alfa: 0 };
  classStudents.forEach(s => {
    const stat = gridStatuses[s.id] || 'Hadir';
    dailyCounts[stat]++;
  });

  const cardBg = darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100';
  const textTitle = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-6">
      
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-black tracking-tight flex items-center gap-2 ${textTitle}`}>
            <UserCheck className="w-6 h-6 text-[#696cff]" />
            Absensi Kelas (Layanan Wali Kelas)
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Kelola absensi harian kelas Anda dan pantau persentase kehadiran secara berkala (Bulanan & Semester).
          </p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-lg text-xs font-semibold shrink-0 gap-1">
          <button
            onClick={() => setActiveSubTab('daily')}
            className={`px-4 py-2 rounded-md transition-all cursor-pointer ${
              activeSubTab === 'daily' 
                ? 'bg-white dark:bg-gray-700 shadow-xs text-[#696cff] dark:text-white font-bold' 
                : 'text-gray-500 hover:text-[#696cff]'
            }`}
          >
            Pencatatan Harian
          </button>
          <button
            onClick={() => setActiveSubTab('monthly')}
            className={`px-4 py-2 rounded-md transition-all cursor-pointer ${
              activeSubTab === 'monthly' 
                ? 'bg-white dark:bg-gray-700 shadow-xs text-[#696cff] dark:text-white font-bold' 
                : 'text-gray-500 hover:text-[#696cff]'
            }`}
          >
            Rekap Bulanan
          </button>
          <button
            onClick={() => setActiveSubTab('semester')}
            className={`px-4 py-2 rounded-md transition-all cursor-pointer ${
              activeSubTab === 'semester' 
                ? 'bg-white dark:bg-gray-700 shadow-xs text-[#696cff] dark:text-white font-bold' 
                : 'text-gray-500 hover:text-[#696cff]'
            }`}
          >
            Rekap Semester
          </button>
        </div>
      </div>

      {/* Primary Selector Bar Card */}
      <div className={`p-5 rounded-xl border shadow-xs ${cardBg}`}>
        <div className="flex flex-col md:flex-row items-end gap-4">
          
          <div className="flex-1 w-full">
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Pilih Kelas Anda (Wali Kelas)</label>
            <div className="relative">
              <Layers className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] cursor-pointer font-medium"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - Tingkat {c.level} (TA: {c.academicYear})</option>
                ))}
              </select>
            </div>
          </div>

          {activeSubTab === 'daily' && (
            <div className="flex-1 w-full">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Tanggal Kehadiran Hari Ini</label>
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
          )}

          {activeSubTab === 'monthly' && (
            <>
              <div className="flex-1 w-full">
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Pilih Bulan</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] cursor-pointer font-medium"
                >
                  {monthsIndo.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-32">
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Pilih Tahun</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] cursor-pointer font-medium"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
            </>
          )}

          {activeSubTab === 'semester' && (
            <div className="flex-1 w-full">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Pilih Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value) as any)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] cursor-pointer font-medium"
              >
                <option value={1}>Semester Ganjil (Juli - Desember)</option>
                <option value={2}>Semester Genap (Januari - Juni)</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 w-full md:w-auto">
            {activeSubTab === 'monthly' && (
              <button
                onClick={handleExportMonthlyPDF}
                className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg border border-indigo-200/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full md:w-auto shrink-0"
              >
                <Printer className="w-4 h-4" /> Download Rekap Bulanan PDF
              </button>
            )}
            {activeSubTab === 'semester' && (
              <button
                onClick={handleExportSemesterPDF}
                className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg border border-indigo-200/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full md:w-auto shrink-0"
              >
                <Printer className="w-4 h-4" /> Download Rekap Semester PDF
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Stats Cards Breakdown */}
      {activeSubTab === 'daily' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Hadir (H)', count: dailyCounts.Hadir, color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40' },
            { label: 'Izin (I)', count: dailyCounts.Izin, color: 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/40' },
            { label: 'Sakit (S)', count: dailyCounts.Sakit, color: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40' },
            { label: 'Alfa (A)', count: dailyCounts.Alfa, color: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40' },
          ].map((stat, idx) => (
            <div key={idx} className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center ${stat.color}`}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest">{stat.label}</span>
              <span className="text-xl md:text-2xl font-black font-sans mt-0.5">{stat.count}</span>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'monthly' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Kehadiran Kelas %', count: `${currentMonthlyStats.Hadir}%`, color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40' },
            { label: 'Sakit (S)', count: `${currentMonthlyStats.Sakit}%`, color: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40' },
            { label: 'Izin (I)', count: `${currentMonthlyStats.Izin}%`, color: 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/40' },
            { label: 'Alfa (A)', count: `${currentMonthlyStats.Alfa}%`, color: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40' },
          ].map((stat, idx) => (
            <div key={idx} className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center ${stat.color}`}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest">{stat.label}</span>
              <span className="text-xl md:text-2xl font-black font-sans mt-0.5">{stat.count}</span>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'semester' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Kehadiran Semester %', count: `${currentSemesterStats.Hadir}%`, color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40' },
            { label: 'Sakit (S)', count: `${currentSemesterStats.Sakit}%`, color: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40' },
            { label: 'Izin (I)', count: `${currentSemesterStats.Izin}%`, color: 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/40' },
            { label: 'Alfa (A)', count: `${currentSemesterStats.Alfa}%`, color: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40' },
          ].map((stat, idx) => (
            <div key={idx} className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center ${stat.color}`}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest">{stat.label}</span>
              <span className="text-xl md:text-2xl font-black font-sans mt-0.5">{stat.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Interactive Attendance Card */}
      <div className={`p-5 rounded-xl border shadow-xs flex flex-col ${cardBg}`}>
        
        {activeSubTab === 'daily' ? (
          <>
            {/* Daily Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
              <div>
                <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>Lembar Pencatatan Absensi Kelas</h3>
                <p className="text-[11px] text-gray-400">Pilih status absensi harian umum untuk seluruh siswa kelas Anda</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={setAllToHadir}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-200/50 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Award className="w-3.5 h-3.5" /> Setel Semua Hadir
                </button>
                <button
                  onClick={handleSaveDaily}
                  className="px-4 py-1.5 bg-[#696cff] hover:bg-[#5f61e6] text-white text-xs font-bold rounded-lg shadow-sm shadow-[#696cff]/30 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" /> Simpan Absensi Kelas
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

            {/* Daily Table List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-28">NIS</th>
                    <th className="py-3 px-4 min-w-[150px]">Nama Siswa</th>
                    <th className="py-3 px-4 w-16 text-center">Gender</th>
                    <th className="py-3 px-4 text-center">Pencatatan Kehadiran Harian</th>
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
                        
                        <td className="py-2 px-4">
                          <div className="flex justify-center items-center gap-1.5 md:gap-3">
                            {[
                              { key: 'Hadir', label: 'Hadir', color: 'peer-checked:bg-emerald-500 peer-checked:text-white dark:peer-checked:bg-emerald-600 bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700/50' },
                              { key: 'Izin', label: 'Izin', color: 'peer-checked:bg-sky-500 peer-checked:text-white dark:peer-checked:bg-sky-600 bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700/50' },
                              { key: 'Sakit', label: 'Sakit', color: 'peer-checked:bg-amber-500 peer-checked:text-white dark:peer-checked:bg-amber-600 bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700/50' },
                              { key: 'Alfa', label: 'Alfa', color: 'peer-checked:bg-rose-500 peer-checked:text-white dark:peer-checked:bg-rose-600 bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700/50' },
                            ].map((btn) => (
                              <label key={btn.key} className="relative block cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name={`class-attendance-${stud.id}`}
                                  checked={currentStatus === btn.key}
                                  onChange={() => setGridStatuses(prev => ({ ...prev, [stud.id]: btn.key as any }))}
                                  className="sr-only peer"
                                />
                                <div className={`px-3 py-1 text-[11px] font-bold rounded-lg text-center transition-all duration-150 ${btn.color}`}>
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
                        Tidak ada data siswa dalam kelas ini. Daftarkan siswa terlebih dahulu di menu Siswa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            {/* Reports headers */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
              <div>
                <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>
                  {activeSubTab === 'monthly' ? 'Rekapitulasi Kehadiran Bulanan' : 'Rekapitulasi Kehadiran Semester'}
                </h3>
                <p className="text-[11px] text-gray-400">
                  Berikut persentase kehadiran personal siswa dan akumulasi hari (H, S, I, A) selama periode ini.
                </p>
              </div>

              {/* Live search input */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-850/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:border-[#696cff]"
                />
              </div>
            </div>

            {/* Recapitulation Table Grid */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-28">NIS</th>
                    <th className="py-3 px-4 min-w-[150px]">Nama Siswa</th>
                    <th className="py-3 px-4 w-16 text-center">L/P</th>
                    <th className="py-3 px-4 text-center text-emerald-500 bg-emerald-50/10">Hadir (H)</th>
                    <th className="py-3 px-4 text-center text-amber-500 bg-amber-50/10">Sakit (S)</th>
                    <th className="py-3 px-4 text-center text-sky-500 bg-sky-50/10">Izin (I)</th>
                    <th className="py-3 px-4 text-center text-rose-500 bg-rose-50/10">Alfa (A)</th>
                    <th className="py-3 px-4 text-center font-bold">Total KBM</th>
                    <th className="py-3 px-4 text-center bg-gray-50/50 dark:bg-black/10 font-bold w-28">Persentase</th>
                    <th className="py-3 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents
                    .filter(s => s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.includes(searchQuery))
                    .map((stud, idx) => {
                      const records = activeSubTab === 'monthly' ? monthlyRecords : semesterRecords;
                      const stats = calculateStudentStats(stud.id, records);
                      
                      // Color mapping for student percentages
                      let percentColor = 'text-rose-500';
                      if (stats.attendancePercentage >= 90) percentColor = 'text-emerald-500';
                      else if (stats.attendancePercentage >= 75) percentColor = 'text-blue-500';
                      else if (stats.attendancePercentage >= 60) percentColor = 'text-amber-500';

                      return (
                        <tr key={stud.id} className="border-b border-gray-50 dark:border-gray-800/40 text-gray-700 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/5">
                          <td className="py-3 px-4 text-center font-mono text-gray-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-medium">{stud.nis}</td>
                          <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-100">{stud.fullName}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] ${
                              stud.gender === 'Laki-laki' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20' : 'bg-pink-50 text-pink-600 dark:bg-pink-950/20'
                            }`}>
                              {stud.gender === 'Laki-laki' ? 'L' : 'P'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/10 font-mono">{stats.Hadir}</td>
                          <td className="py-3 px-4 text-center font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/10 font-mono">{stats.Sakit}</td>
                          <td className="py-3 px-4 text-center font-semibold text-sky-600 dark:text-sky-400 bg-sky-50/10 font-mono">{stats.Izin}</td>
                          <td className="py-3 px-4 text-center font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/10 font-mono">{stats.Alfa}</td>
                          <td className="py-3 px-4 text-center font-bold text-gray-500 dark:text-gray-400 font-mono">{stats.totalDays}</td>
                          <td className="py-3 px-4 text-center font-black font-mono text-sm bg-gray-50/30 dark:bg-black/5">
                            <span className={percentColor}>{stats.attendancePercentage}%</span>
                          </td>
                          <td className="py-2 px-4 text-center">
                            <div className="flex justify-center gap-1.5">
                              <button
                                onClick={() => setDetailedStudentId(stud.id)}
                                className="p-1 px-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md flex items-center gap-1 transition-all text-[10px] font-bold cursor-pointer"
                                title="Lihat rincian riwayat kehadiran"
                              >
                                <Eye className="w-3.5 h-3.5" /> Detil
                              </button>
                              <button
                                onClick={() => handleExportPersonalPDF(stud, activeSubTab === 'semester')}
                                className="p-1 px-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md flex items-center gap-1 transition-all text-[10px] font-bold cursor-pointer"
                                title="Unduh laporan kehadiran individual"
                              >
                                <Printer className="w-3.5 h-3.5" /> PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {classStudents.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-gray-400">
                        Tidak ada siswa dalam kelas ini. Daftarkan siswa di menu Siswa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>

      {/* Individual Detailed History Modal Overlay */}
      {detailedStudentId && (() => {
        const stud = students.find(s => s.id === detailedStudentId);
        if (!stud) return null;

        const records = activeSubTab === 'monthly' ? monthlyRecords : semesterRecords;
        const studRecs = records.filter(r => r.studentId === stud.id).sort((a,b) => b.date.localeCompare(a.date));
        const stats = calculateStudentStats(stud.id, records);
        const monthLabel = monthsIndo.find(m => m.value === selectedMonth)?.label || '';
        const periodTitle = activeSubTab === 'monthly' 
          ? `Bulan ${monthLabel} ${selectedYear}` 
          : `Semester ${selectedSemester === 1 ? 'Ganjil' : 'Genap'}`;

        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className={`w-full max-w-xl rounded-xl shadow-2xl border flex flex-col overflow-hidden animate-fade-in ${darkMode ? 'bg-[#1c1c24] border-gray-800 text-gray-100' : 'bg-white border-gray-100 text-gray-800'}`}>
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800/80 bg-[#696cff]/5">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#696cff]" />
                  <div>
                    <h3 className="font-bold text-sm tracking-tight">Rincian Kehadiran Personal</h3>
                    <p className="text-[10px] text-gray-400">Riwayat detil absensi harian kelas</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailedStudentId(null)}
                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4 max-h-[70vh]">
                
                {/* Student Meta Profile Card */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <div className="font-extrabold text-sm">{stud.fullName}</div>
                    <div className="text-gray-400 font-mono mt-0.5">NIS: {stud.nis} | Kelas: {activeClass?.name}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Persentase</span>
                    <span className="font-sans font-black text-lg text-[#696cff]">{stats.attendancePercentage}%</span>
                  </div>
                </div>

                {/* Individual Stats counts boxes */}
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { label: 'Hadir', val: stats.Hadir, color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' },
                    { label: 'Sakit', val: stats.Sakit, color: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' },
                    { label: 'Izin', val: stats.Izin, color: 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30' },
                    { label: 'Alfa', val: stats.Alfa, color: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30' },
                  ].map((st, i) => (
                    <div key={i} className={`p-2.5 rounded-lg border flex flex-col ${st.color}`}>
                      <span className="text-[9px] uppercase font-bold tracking-wider">{st.label}</span>
                      <span className="text-lg font-black mt-0.5">{st.val} <span className="text-[9px] font-medium text-gray-400">Hari</span></span>
                    </div>
                  ))}
                </div>

                {/* Daily log list */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-wider">Log Catatan Harian ({periodTitle})</h4>
                  
                  <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden text-[11px]">
                    <div className="grid grid-cols-3 font-semibold uppercase bg-gray-50 dark:bg-gray-800/80 p-2 border-b border-gray-100 dark:border-gray-800 text-gray-400 text-[9px] tracking-wider">
                      <div>No</div>
                      <div>Tanggal</div>
                      <div className="text-center">Status</div>
                    </div>

                    <div className="divide-y divide-gray-50 dark:divide-gray-800/50 max-h-44 overflow-y-auto">
                      {studRecs.map((r, idx) => {
                        const recDate = new Date(r.date);
                        const dayName = recDate.toLocaleDateString('id-ID', { weekday: 'short' });
                        const dFormat = `${dayName}, ${r.date}`;

                        let badgeColor = 'bg-emerald-500/10 text-emerald-500';
                        if (r.status === 'Sakit') badgeColor = 'bg-amber-500/10 text-amber-500';
                        else if (r.status === 'Izin') badgeColor = 'bg-sky-500/10 text-sky-500';
                        else if (r.status === 'Alfa') badgeColor = 'bg-rose-500/10 text-rose-500';

                        return (
                          <div key={r.id} className="grid grid-cols-3 p-2.5 items-center text-gray-700 dark:text-gray-300">
                            <div className="font-mono text-gray-400">{idx + 1}</div>
                            <div className="font-medium font-sans">{dFormat}</div>
                            <div className="text-center">
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase ${badgeColor}`}>
                                {r.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {studRecs.length === 0 && (
                        <div className="p-6 text-center text-gray-400">
                          Belum ada catatan kehadiran untuk siswa ini di periode ini.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2 bg-gray-50/50 dark:bg-black/10">
                <button
                  onClick={() => setDetailedStudentId(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-semibold rounded-lg text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={() => handleExportPersonalPDF(stud, activeSubTab === 'semester')}
                  className="px-4 py-2 bg-[#696cff] hover:bg-[#5f61e6] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-[#696cff]/20"
                >
                  <Printer className="w-4 h-4" /> Cetak PDF Rincian
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
