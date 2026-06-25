/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Subject, Class, Student, TeachingJournal, ActivityLog, Grade, Attendance, CharacterLog, Profile } from '../types';
import { 
  BookOpen, Layers, Users, FileText, ArrowRight, TrendingUp, Calendar, Clock, Sparkles, Award
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line
} from 'recharts';
import { REWARD_MILESTONES } from '../utils/characterPresets';

interface DashboardViewProps {
  subjects: Subject[];
  classes: Class[];
  students: Student[];
  journals: TeachingJournal[];
  activities: ActivityLog[];
  grades: Grade[];
  attendanceList: Attendance[];
  characterLogs?: CharacterLog[];
  setActiveTab: (tab: string) => void;
  profile?: Profile | null;
  darkMode: boolean;
}

export default function DashboardView({
  subjects,
  classes,
  students,
  journals,
  activities,
  grades,
  attendanceList,
  characterLogs = [],
  setActiveTab,
  profile,
  darkMode
}: DashboardViewProps) {

  // Prepare Attendance Chart Data
  // Group attendance by date, count statuses
  const attendanceDates = Array.from(new Set(attendanceList.map(a => a.date))).sort().slice(-5);
  const attendanceChartData = attendanceDates.map(date => {
    const list = attendanceList.filter(a => a.date === date);
    const hadir = list.filter(a => a.status === 'Hadir').length;
    const izin = list.filter(a => a.status === 'Izin').length;
    const sakit = list.filter(a => a.status === 'Sakit').length;
    const alfa = list.filter(a => a.status === 'Alfa').length;
    return {
      Tanggal: date.split('-').slice(1).join('/'), // MM-DD format
      Hadir: hadir,
      Izin: izin,
      Sakit: sakit,
      Alfa: alfa
    };
  });

  // Fallback if attendance is empty
  const defaultAttendanceData = [
    { Tanggal: '21/06', Hadir: 15, Izin: 1, Sakit: 1, Alfa: 0 },
    { Tanggal: '22/06', Hadir: 16, Izin: 0, Sakit: 1, Alfa: 0 },
    { Tanggal: '23/06', Hadir: 14, Izin: 1, Sakit: 0, Alfa: 2 },
  ];

  const finalAttendanceData = attendanceChartData.length > 0 ? attendanceChartData : defaultAttendanceData;

  // Prepare Grades Distribution Chart Data
  // Average final grades grouped by Class
  const gradesChartData = classes.map(cls => {
    const classGrades = grades.filter(g => g.classId === cls.id);
    const avg = classGrades.length > 0
      ? parseFloat((classGrades.reduce((sum, g) => sum + g.finalGrade, 0) / classGrades.length).toFixed(1))
      : 0;
    return {
      Kelas: cls.name,
      'Rata-rata Nilai': avg
    };
  });

  const finalGradesData = grades.length > 0 
    ? gradesChartData 
    : [
        { Kelas: 'VII-A', 'Rata-rata Nilai': 81.5 },
        { Kelas: 'VII-B', 'Rata-rata Nilai': 78.2 },
        { Kelas: 'VIII-A', 'Rata-rata Nilai': 84.0 }
      ];

  // Calculate student character target achievements
  const characterAchievements = React.useMemo(() => {
    return students.map(student => {
      const positivePoints = characterLogs
        .filter(l => l.studentId === student.id && l.type === 'positif')
        .reduce((sum, l) => sum + l.points, 0);

      const achievedRewards = REWARD_MILESTONES.filter(m => positivePoints >= m.points);
      const topReward = achievedRewards.length > 0 ? achievedRewards[achievedRewards.length - 1] : null;

      const cls = classes.find(c => c.id === student.classId);

      return {
        ...student,
        className: cls?.name || 'Tidak diketahui',
        positivePoints,
        topReward
      };
    }).filter(s => s.topReward !== null)
      .sort((a, b) => b.positivePoints - a.positivePoints);
  }, [students, classes, characterLogs]);

  // Quick stats calculations
  const stats = [
    { 
      label: 'Mata Pelajaran', 
      value: subjects.length, 
      desc: 'Mata pelajaran yang diampu', 
      icon: BookOpen, 
      color: 'bg-[#696cff]/10 text-[#696cff]', 
      targetTab: 'subjects' 
    },
    { 
      label: 'Daftar Kelas', 
      value: classes.length, 
      desc: 'Kelas yang diajar semester ini', 
      icon: Layers, 
      color: 'bg-[#03c3ec]/10 text-[#03c3ec]', 
      targetTab: 'classes' 
    },
    { 
      label: 'Total Siswa', 
      value: students.length, 
      desc: 'Siswa aktif terdaftar', 
      icon: Users, 
      color: 'bg-[#71dd37]/10 text-[#71dd37]', 
      targetTab: 'students' 
    },
    { 
      label: 'Jurnal Mengajar', 
      value: journals.length, 
      desc: 'Catatan mengajar guru', 
      icon: FileText, 
      color: 'bg-[#ffab00]/10 text-[#ffab00]', 
      targetTab: 'journals' 
    },
  ];

  // Helper to format timestamps
  const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const cardBg = darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100';
  const textTitle = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className={`p-6 rounded-xl border relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        darkMode 
          ? 'bg-gradient-to-r from-indigo-950/40 to-slate-900 border-indigo-900/40 text-white' 
          : 'bg-gradient-to-r from-[#696cff]/10 to-[#787aff]/5 border-[#696cff]/20 text-gray-800'
      }`}>
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#696cff] dark:text-[#8587ff] uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-spin-slow" /> Selamat Datang di MUMTAZ 29
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight">Halo {profile?.fullName || 'Bapak/Ibu Guru'} 👋</h2>
          <p className="text-xs text-gray-500 dark:text-gray-300 max-w-xl">
            Sistem rekapitulasi data akademik Anda siap digunakan. Anda dapat mencatat jurnal mengajar harian, mengisi lembar absensi kehadiran, dan memasukkan nilai harian dan ujian siswa dengan cepat.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('journals')}
            className="px-4 py-2 bg-[#696cff] hover:bg-[#5f61e6] text-white text-xs font-semibold rounded-lg shadow-sm shadow-[#696cff]/30 transition-all cursor-pointer whitespace-nowrap"
          >
            Tulis Jurnal Mengajar
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className="px-4 py-2 bg-[#71dd37] hover:bg-[#64c431] text-white text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap"
          >
            Absensi Siswa
          </button>
        </div>
      </div>

      {/* Grid of Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx} 
              onClick={() => setActiveTab(stat.targetTab)}
              className={`p-5 rounded-xl border shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between h-[130px] ${cardBg}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[11px] uppercase tracking-wider font-bold ${textSub}`}>{stat.label}</span>
                  <div className={`text-2xl md:text-3xl font-extrabold mt-1 font-sans tracking-tight ${textTitle}`}>
                    {stat.value}
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-gray-50 dark:border-[#2d2d3a] text-gray-400">
                <span>{stat.desc}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#696cff]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts Graphical Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Attendance Bar Chart */}
        <div className={`p-5 rounded-xl border shadow-xs flex flex-col justify-between ${cardBg}`}>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
            <div>
              <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>Grafik Kehadiran Siswa</h3>
              <p className="text-[11px] text-gray-400">Distribusi status absen 5 hari mengajar terakhir</p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#71dd37]" />
          </div>

          <div className="h-[250px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={finalAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#2d2d3a" : "#f1f1f5"} />
                <XAxis dataKey="Tanggal" stroke={darkMode ? "#888" : "#566a7f"} />
                <YAxis stroke={darkMode ? "#888" : "#566a7f"} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1c1c24' : '#fff', border: '1px solid #ddd' }} />
                <Legend />
                <Bar dataKey="Hadir" fill="#71dd37" stackId="a" />
                <Bar dataKey="Izin" fill="#03c3ec" stackId="a" />
                <Bar dataKey="Sakit" fill="#ffab00" stackId="a" />
                <Bar dataKey="Alfa" fill="#ff3e1d" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grades Line Chart */}
        <div className={`p-5 rounded-xl border shadow-xs flex flex-col justify-between ${cardBg}`}>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
            <div>
              <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>Grafik Nilai Siswa</h3>
              <p className="text-[11px] text-gray-400">Rata-rata Nilai Akhir Gabungan per Kelas</p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#696cff]" />
          </div>

          <div className="h-[250px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={finalGradesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#2d2d3a" : "#f1f1f5"} />
                <XAxis dataKey="Kelas" stroke={darkMode ? "#888" : "#566a7f"} />
                <YAxis stroke={darkMode ? "#888" : "#566a7f"} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1c1c24' : '#fff', border: '1px solid #ddd' }} />
                <Legend />
                <Line type="monotone" dataKey="Rata-rata Nilai" stroke="#696cff" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Target Karakter Siswa Bulanan Achievements */}
      <div className={`p-5 rounded-xl border shadow-xs ${cardBg}`}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
          <div>
            <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>🏆 Capaian Lencana Karakter Siswa Bulan Ini</h3>
            <p className="text-[11px] text-gray-400">Siswa yang berhasil mencapai target poin karakter positif bulan ini</p>
          </div>
          <button 
            onClick={() => setActiveTab('character')}
            className="text-xs font-bold text-[#696cff] hover:underline cursor-pointer"
          >
            Lihat Selengkapnya
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {characterAchievements.length === 0 ? (
            <div className="col-span-full text-center py-6 text-gray-400 text-xs">
              Belum ada siswa yang mencapai target poin penghargaan karakter bulan ini.
            </div>
          ) : (
            characterAchievements.map((ach) => (
              <div 
                key={ach.id} 
                className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 ${
                  darkMode ? 'bg-[#1e1e2d] border-[#2d2d3a]' : 'bg-[#696cff]/5 border-[#696cff]/10'
                }`}
              >
                <div className="space-y-1 overflow-hidden">
                  <div className={`font-extrabold text-xs truncate ${textTitle}`}>{ach.fullName}</div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
                    <span>NIS: {ach.nis}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                    <span>Kelas {ach.className}</span>
                  </div>
                  <div className={`text-[10px] font-bold text-emerald-500`}>
                    Total +{ach.positivePoints} Poin Karakter
                  </div>
                </div>
                {ach.topReward && (
                  <div className="flex flex-col items-center justify-center shrink-0" title={ach.topReward.name}>
                    <div className="text-2xl animate-bounce">{ach.topReward.badge}</div>
                    <div className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-tight text-center max-w-[80px] truncate">
                      {ach.topReward.name.split(' ')[0]}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity Logs */}
      <div className={`p-5 rounded-xl border shadow-xs ${cardBg}`}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
          <div>
            <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>Aktivitas & Log Sistem Terbaru</h3>
            <p className="text-[11px] text-gray-400">Log operasional Guru di terminal lokal</p>
          </div>
          <Clock className="w-4.5 h-4.5 text-gray-400" />
        </div>

        <div className="space-y-4">
          {activities.map((act) => (
            <div key={act.id} className="flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                  act.module === 'Akademik' ? 'bg-[#696cff]' : 'bg-[#71dd37]'
                }`}></div>
                <div>
                  <div className={`font-bold ${textTitle}`}>
                    {act.action} <span className="font-semibold text-gray-400">({act.module})</span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">{act.details}</div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 text-right whitespace-nowrap flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {formatTimeAgo(act.timestamp)}
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-xs">Belum ada aktivitas tercatat.</div>
          )}
        </div>
      </div>

    </div>
  );
}
