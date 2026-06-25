/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Subject, Class, Student, Grade, Attendance, TeachingJournal, Profile } from '../types';
import { 
  FileText, Calendar, BookOpen, Layers, Printer, FileDown, Search, Filter 
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportHelpers';

interface ReportsViewProps {
  subjects: Subject[];
  classes: Class[];
  students: Student[];
  grades: Grade[];
  attendanceList: Attendance[];
  journals: TeachingJournal[];
  profile?: Profile | null;
  darkMode: boolean;
}

type ReportType = 'grades' | 'attendance' | 'journals';

export default function ReportsView({
  subjects,
  classes,
  students,
  grades,
  attendanceList,
  journals,
  profile,
  darkMode
}: ReportsViewProps) {
  
  const [activeReportTab, setActiveReportTab] = useState<ReportType>('grades');

  // Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [selectedClassId, setSelectedClassId] = useState('all');
  
  // Date Filters
  const [startDate, setStartDate] = useState(() => {
    // 30 days ago
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Default setup
  useEffect(() => {
    if (subjects.length > 0 && selectedSubjectId === 'all') {
      setSelectedSubjectId(subjects[0].id);
    }
    if (classes.length > 0 && selectedClassId === 'all') {
      setSelectedClassId(classes[0].id);
    }
  }, [subjects, classes]);

  // Calculations for Grades report
  const activeSubject = subjects.find(s => s.id === selectedSubjectId);
  const activeClass = classes.find(c => c.id === selectedClassId);
  const classStudents = selectedClassId === 'all' 
    ? students 
    : students.filter(s => s.classId === selectedClassId);

  // 1. FILTER GRADES
  const getGradesReportData = () => {
    return classStudents.map((stud, idx) => {
      const g = grades.find(
        val => val.studentId === stud.id && 
        (selectedSubjectId === 'all' || val.subjectId === selectedSubjectId)
      );

      const sClass = classes.find(c => c.id === stud.classId);
      const sSub = subjects.find(s => s.id === (g ? g.subjectId : selectedSubjectId));

      return {
        no: idx + 1,
        nis: stud.nis,
        nama: stud.fullName,
        kelas: sClass ? sClass.name : '-',
        mapel: sSub ? sSub.name : '-',
        harian: g ? g.daily : 0,
        pts: g ? g.pts : 0,
        pas: g ? g.pas : 0,
        akhir: g ? g.finalGrade : 0,
        predikat: g ? g.predicate : 'E'
      };
    });
  };

  // 2. FILTER ATTENDANCE
  const getAttendanceReportData = () => {
    return classStudents.map((stud, idx) => {
      // Find all records for this student in range
      const studAtt = attendanceList.filter(
        a => a.studentId === stud.id &&
        (selectedSubjectId === 'all' || a.subjectId === selectedSubjectId) &&
        a.date >= startDate &&
        a.date <= endDate
      );

      const sClass = classes.find(c => c.id === stud.classId);

      const count = { Hadir: 0, Izin: 0, Sakit: 0, Alfa: 0 };
      studAtt.forEach(a => count[a.status]++);

      return {
        no: idx + 1,
        nis: stud.nis,
        nama: stud.fullName,
        kelas: sClass ? sClass.name : '-',
        hadir: count.Hadir,
        izin: count.Izin,
        sakit: count.Sakit,
        alfa: count.Alfa,
        totalPertemuan: studAtt.length
      };
    });
  };

  // 3. FILTER JOURNALS
  const getJournalsReportData = () => {
    return journals.filter(j => 
      (selectedSubjectId === 'all' || j.subjectId === selectedSubjectId) &&
      (selectedClassId === 'all' || j.classId === selectedClassId) &&
      j.date >= startDate &&
      j.date <= endDate
    ).map((j, idx) => {
      const sSub = subjects.find(s => s.id === j.subjectId);
      const sCls = classes.find(c => c.id === j.classId);

      return {
        no: idx + 1,
        tanggal: j.date,
        jam: j.period,
        kelas: sCls ? sCls.name : '-',
        mapel: sSub ? sSub.name : '-',
        materi: j.topic,
        metode: j.method,
        hadirCount: j.presentCount,
        catatan: j.notes || '-'
      };
    });
  };

  // EXPORT PROCESSORS
  const handleExportExcel = () => {
    if (activeReportTab === 'grades') {
      const data = getGradesReportData();
      const headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Mata Pelajaran', 'Nilai Harian (60%)', 'Nilai STS (20%)', 'Nilai PAS/PSAT (20%)', 'Nilai Akhir', 'Predikat'];
      const rows = data.map(d => [d.no, d.nis, d.nama, d.kelas, d.mapel, d.harian, d.pts, d.pas, d.akhir, d.predikat]);
      exportToExcel(`Laporan_Nilai_${activeSubject?.name || 'Semua'}_${activeClass?.name || 'Semua'}`, headers, rows);
    } else if (activeReportTab === 'attendance') {
      const data = getAttendanceReportData();
      const headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Hadir (H)', 'Izin (I)', 'Sakit (S)', 'Alfa (A)', 'Total KBM'];
      const rows = data.map(d => [d.no, d.nis, d.nama, d.kelas, d.hadir, d.izin, d.sakit, d.alfa, d.totalPertemuan]);
      exportToExcel(`Laporan_Absensi_${activeSubject?.name || 'Semua'}_${startDate}_s.d._${endDate}`, headers, rows);
    } else {
      const data = getJournalsReportData();
      const headers = ['No', 'Tanggal KBM', 'Jam', 'Kelas', 'Mata Pelajaran', 'Materi Pembelajaran', 'Metode Pembelajaran', 'Hadir', 'Catatan'];
      const rows = data.map(d => [d.no, d.tanggal, d.jam, d.kelas, d.mapel, d.materi, d.metode, d.hadirCount, d.catatan]);
      exportToExcel(`Laporan_Jurnal_Mengajar_${startDate}_s.d._${endDate}`, headers, rows);
    }
  };

  const handleExportPDF = () => {
    const subjectLabel = selectedSubjectId === 'all' ? 'Semua Mata Pelajaran' : (activeSubject?.name || '-');
    const classLabel = selectedClassId === 'all' ? 'Semua Kelas' : (activeClass?.name || '-');

    if (activeReportTab === 'grades') {
      const data = getGradesReportData();
      const headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Harian (60%)', 'STS (20%)', 'PAS/PSAT (20%)', 'Nilai Akhir', 'Predikat'];
      const rows = data.map(d => [d.no, d.nis, d.nama, d.kelas, d.harian, d.pts, d.pas, d.akhir, d.predikat]);
      exportToPDF(`Laporan Capaian Nilai Siswa`, headers, rows, {
        'Mata Pelajaran': subjectLabel,
        'Kelas / Rombel': classLabel,
        'Tahun Ajaran': activeClass?.academicYear || '2025/2026',
        'Parameter': 'Harian (60%) | STS (20%) | PAS/PSAT (20%)',
        'Nama Guru': profile?.fullName || 'Guru Mapel'
      }, 'Guru Mapel');
    } else if (activeReportTab === 'attendance') {
      const data = getAttendanceReportData();
      const headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Hadir (H)', 'Izin (I)', 'Sakit (S)', 'Alfa (A)', 'Total Absen'];
      const rows = data.map(d => [d.no, d.nis, d.nama, d.kelas, d.hadir, d.izin, d.sakit, d.alfa, d.totalPertemuan]);
      exportToPDF(`Laporan Rekapitulasi Presensi Kehadiran Siswa`, headers, rows, {
        'Mata Pelajaran': subjectLabel,
        'Kelas Diajar': classLabel,
        'Rentang Tanggal': `${startDate} s.d. ${endDate}`,
        'Metode': 'Dihitung dari kumulatif harian log database',
        'Nama Guru': profile?.fullName || 'Guru Mapel'
      }, 'Guru Mapel');
    } else {
      const data = getJournalsReportData();
      const headers = ['No', 'Tanggal', 'Jam', 'Kelas / Mapel', 'Materi Pembelajaran', 'Metode KBM', 'Hadir', 'Catatan Guru'];
      const rows = data.map(d => [d.no, d.tanggal, d.jam, `${d.kelas} - ${d.mapel}`, d.materi, d.metode, `${d.hadirCount} mhs`, d.catatan]);
      exportToPDF(`Laporan Jurnal Aktivitas Mengajar Guru`, headers, rows, {
        'Mata Pelajaran': subjectLabel,
        'Kelas Diajar': classLabel,
        'Rentang Periode': `${startDate} s.d. ${endDate}`,
        'Total Jurnal': journals.length.toString(),
        'Nama Guru': profile?.fullName || 'Guru Mapel'
      }, 'Guru Mapel');
    }
  };

  const cardBg = darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100';
  const textTitle = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-6">
      
      {/* Tab selection for Reports types */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {[
          { key: 'grades', label: 'Laporan Capaian Nilai' },
          { key: 'attendance', label: 'Laporan Rekap Absensi' },
          { key: 'journals', label: 'Laporan Jurnal Mengajar' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveReportTab(tab.key as ReportType)}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeReportTab === tab.key 
                ? 'border-[#696cff] text-[#696cff] bg-[#696cff]/5 font-extrabold' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Interactive Filters Panel */}
      <div className={`p-5 rounded-xl border shadow-xs ${cardBg}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-end gap-4 text-xs">
          
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Mata Pelajaran</label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
              >
                <option value="all">Semua Mata Pelajaran</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Kelas Diajar</label>
            <div className="relative">
              <Layers className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
              >
                <option value="all">Semua Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range selectors (only active for attendance and journals reports) */}
          <div className={`${activeReportTab === 'grades' ? 'opacity-40 pointer-events-none' : ''}`}>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Tanggal Mulai</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
              />
            </div>
          </div>

          <div className={`${activeReportTab === 'grades' ? 'opacity-40 pointer-events-none' : ''}`}>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Tanggal Akhir</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Preview and Export Buttons block */}
      <div className={`p-5 rounded-xl border shadow-xs flex flex-col ${cardBg}`}>
        
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
          <div>
            <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>Pratinjau Data Laporan</h3>
            <p className="text-[11px] text-gray-400">Pastikan data berikut sudah benar sebelum diekspor</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-200/50 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileDown className="w-4 h-4" /> Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg border border-indigo-200/50 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" /> Cetak PDF
            </button>
          </div>
        </div>

        {/* Dynamic preview grids based on tab */}
        <div className="overflow-x-auto text-xs">
          
          {activeReportTab === 'grades' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Mapel</th>
                  <th className="py-3 px-4 text-center">Harian (60%)</th>
                  <th className="py-3 px-4 text-center">STS (20%)</th>
                  <th className="py-3 px-4 text-center">PAS/PSAT (20%)</th>
                  <th className="py-3 px-4 text-center">Akhir</th>
                  <th className="py-3 px-4 text-center">Predikat</th>
                </tr>
              </thead>
              <tbody>
                {getGradesReportData().map((d) => (
                  <tr key={d.no} className="border-b border-gray-50 dark:border-gray-850/40 text-gray-700 dark:text-gray-300">
                    <td className="py-3 px-4 font-mono">{d.no}</td>
                    <td className="py-3 px-4 font-mono font-semibold">{d.nis}</td>
                    <td className="py-3 px-4 font-bold">{d.nama}</td>
                    <td className="py-3 px-4">{d.kelas}</td>
                    <td className="py-3 px-4">{d.mapel}</td>
                    <td className="py-3 px-4 text-center font-mono">{d.harian}</td>
                    <td className="py-3 px-4 text-center font-mono">{d.pts}</td>
                    <td className="py-3 px-4 text-center font-mono">{d.pas}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#696cff]">{d.akhir}</td>
                    <td className="py-3 px-4 text-center font-bold">{d.predikat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReportTab === 'attendance' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4 text-center text-emerald-500">Hadir</th>
                  <th className="py-3 px-4 text-center text-sky-500">Izin</th>
                  <th className="py-3 px-4 text-center text-amber-500">Sakit</th>
                  <th className="py-3 px-4 text-center text-rose-500">Alfa</th>
                  <th className="py-3 px-4 text-center">Total KBM</th>
                </tr>
              </thead>
              <tbody>
                {getAttendanceReportData().map((d) => (
                  <tr key={d.no} className="border-b border-gray-50 dark:border-gray-850/40 text-gray-700 dark:text-gray-300">
                    <td className="py-3 px-4 font-mono">{d.no}</td>
                    <td className="py-3 px-4 font-mono font-semibold">{d.nis}</td>
                    <td className="py-3 px-4 font-bold">{d.nama}</td>
                    <td className="py-3 px-4">{d.kelas}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-500">{d.hadir}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-sky-500">{d.izin}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-500">{d.sakit}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-500">{d.alfa}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">{d.totalPertemuan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReportTab === 'journals' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Jam</th>
                  <th className="py-3 px-4">Kelas / Mapel</th>
                  <th className="py-3 px-4">Materi Pembelajaran</th>
                  <th className="py-3 px-4">Metode KBM</th>
                  <th className="py-3 px-4 text-center">Siswa Hadir</th>
                </tr>
              </thead>
              <tbody>
                {getJournalsReportData().map((d) => (
                  <tr key={d.no} className="border-b border-gray-50 dark:border-gray-850/40 text-gray-700 dark:text-gray-300">
                    <td className="py-3 px-4 font-mono">{d.no}</td>
                    <td className="py-3 px-4 font-mono font-semibold">{d.tanggal}</td>
                    <td className="py-3 px-4 font-mono">{d.jam}</td>
                    <td className="py-3 px-4 font-bold">{d.kelas} - {d.mapel}</td>
                    <td className="py-3 px-4 font-medium">{d.materi}</td>
                    <td className="py-3 px-4 text-gray-500">{d.metode}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-500">{d.hadirCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Fallback empty view */}
          {((activeReportTab === 'grades' && getGradesReportData().length === 0) ||
            (activeReportTab === 'attendance' && getAttendanceReportData().length === 0) ||
            (activeReportTab === 'journals' && getJournalsReportData().length === 0)) && (
            <div className="text-center py-12 text-gray-400">
              Tidak ada data yang cocok dengan kriteria filter laporan.
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
