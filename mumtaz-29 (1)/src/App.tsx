/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Profile, Subject, Class, Student, Grade, Attendance, TeachingJournal, ActivityLog, CharacterLog 
} from './types';
import { 
  initialProfile, initialSubjects, initialClasses, initialStudents, 
  initialGrades, initialAttendance, initialJournals, initialActivities, initialCharacterLogs 
} from './mockData';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  fetchAllTeacherData, uploadAllLocalDataToSupabase, syncDiffToSupabase,
  mapSubjectToDb, mapClassToDb, mapStudentToDb, mapGradeToDb, mapAttendanceToDb, mapJournalToDb
} from './utils/supabaseSync';

// Component Imports
import AuthView from './components/AuthView';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import SubjectsView from './components/SubjectsView';
import ClassesView from './components/ClassesView';
import StudentsView from './components/StudentsView';
import GradesView from './components/GradesView';
import AttendanceView from './components/AttendanceView';
import ClassAttendanceView from './components/ClassAttendanceView';
import JournalsView from './components/JournalsView';
import ReportsView from './components/ReportsView';
import ProfileView from './components/ProfileView';
import SqlSchemaView from './components/SqlSchemaView';
import CharacterZoneView from './components/CharacterZoneView';

export default function App() {
  // Authentication & session persistence
  const [profile, setProfile] = useState<Profile | null>(() => {
    const remember = localStorage.getItem('guruku_remember');
    const stored = localStorage.getItem('guruku_profile');
    if (remember === 'true' && stored) {
      return JSON.parse(stored);
    }
    return null;
  });

  // Theme states (Light/Dark)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('guruku_theme') === 'dark';
  });

  // UI state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Core Data Master states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Core Academic states
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [journals, setJournals] = useState<TeachingJournal[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [characterLogs, setCharacterLogs] = useState<CharacterLog[]>([]);

  // Load and seed initial states from localStorage or presets
  useEffect(() => {
    function loadOrSeed<T>(key: string, defaultValue: T): T {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error(`Error parsing ${key}`, e);
        }
      }
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }

    setSubjects(loadOrSeed('guruku_subjects', initialSubjects));
    setClasses(loadOrSeed('guruku_classes', initialClasses));
    setStudents(loadOrSeed('guruku_students', initialStudents));
    setGrades(loadOrSeed('guruku_grades', initialGrades));
    setAttendanceList(loadOrSeed('guruku_attendance', initialAttendance));
    setJournals(loadOrSeed('guruku_journals', initialJournals));
    setActivities(loadOrSeed('guruku_activities', initialActivities));
    setCharacterLogs(loadOrSeed('guruku_character', initialCharacterLogs));
  }, []);

  // Supabase Sync States
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Custom iframe-safe Dialog States
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertDialog({
      isOpen: true,
      title,
      message,
      type
    });
  };

  // Sync / Pull effect from Supabase on login
  useEffect(() => {
    async function loadCloudData() {
      if (profile && isSupabaseConfigured && supabase) {
        setSupabaseLoading(true);
        setSupabaseError(null);
        try {
          // Fetch latest profile from Supabase to keep it in sync
          const { data: profileList } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profile.id);

          if (profileList && profileList.length > 0) {
            const pDb = profileList[0];
            const hasChanges = 
              pDb.full_name !== profile.fullName ||
              (pDb.nip || '') !== profile.nip ||
              (pDb.phone || '') !== profile.phone ||
              (pDb.avatar_url || '') !== profile.avatarUrl;

            if (hasChanges) {
              const updatedProfile: Profile = {
                id: pDb.id,
                fullName: pDb.full_name || profile.fullName,
                nip: pDb.nip || profile.nip || '',
                email: pDb.email || profile.email,
                phone: pDb.phone || profile.phone || '',
                avatarUrl: pDb.avatar_url || profile.avatarUrl || '',
              };
              setProfile(updatedProfile);
              localStorage.setItem('guruku_profile', JSON.stringify(updatedProfile));
            }
          }

          const cloudData = await fetchAllTeacherData(profile.id);
          
          // Only update local states if there is data fetched
          // If the cloud is empty, we keep local default data so the teacher is not empty-handed
          if (
            cloudData.subjects.length > 0 || 
            cloudData.classes.length > 0 || 
            cloudData.students.length > 0 ||
            cloudData.journals.length > 0
          ) {
            setSubjects(cloudData.subjects);
            setClasses(cloudData.classes);
            setStudents(cloudData.students);
            setGrades(cloudData.grades);
            setAttendanceList(cloudData.attendance);
            setJournals(cloudData.journals);
            addActivity('Data Terunduh', 'Supabase', 'Sinkronisasi data berhasil diunduh dari cloud database Supabase Anda');
          } else {
            addActivity('Supabase Terhubung', 'Supabase', 'Database terhubung! Anda dapat mengunggah data lokal Anda ke cloud');
          }
        } catch (err: any) {
          console.error('[Supabase Load Error]', err);
          const errMsg = String(err?.message || err || '');
          if (errMsg.toLowerCase().includes('failed to fetch')) {
            setSupabaseError('Database Supabase tidak dapat dijangkau (Failed to fetch). Kemungkinan server database ditangguhkan (paused) atau koneksi Anda terputus. Seluruh data Anda saat ini disimpan dengan aman di penyimpanan lokal.');
            addActivity('Offline Mode', 'Lokal', 'Gagal terhubung ke Supabase. Aplikasi otomatis berjalan penuh dalam Mode Lokal/Offline.');
          } else {
            setSupabaseError(errMsg || 'Gagal sinkronisasi data dari Supabase. Periksa apakah tabel PostgreSQL sudah dicopy.');
            addActivity('Koneksi Gagal', 'Supabase', `Error sinkronisasi: ${errMsg || 'tabel tidak ditemukan'}`);
          }
        } finally {
          setSupabaseLoading(false);
        }
      }
    }

    loadCloudData();
  }, [profile?.id]);

  // Wrapper Setters for Real-Time Supabase Delta Syncing
  const setSubjectsWithSync = (value: React.SetStateAction<Subject[]>) => {
    setSubjects(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (profile && isSupabaseConfigured) {
        syncDiffToSupabase('subjects', prev, next, (item: any) => mapSubjectToDb(item, profile.id));
      }
      return next;
    });
  };

  const setClassesWithSync = (value: React.SetStateAction<Class[]>) => {
    setClasses(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (profile && isSupabaseConfigured) {
        syncDiffToSupabase('classes', prev, next, (item: any) => mapClassToDb(item, profile.id));
      }
      return next;
    });
  };

  const setStudentsWithSync = (value: React.SetStateAction<Student[]>) => {
    setStudents(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (profile && isSupabaseConfigured) {
        syncDiffToSupabase('students', prev, next, mapStudentToDb);
      }
      return next;
    });
  };

  const setGradesWithSync = (value: React.SetStateAction<Grade[]>) => {
    setGrades(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (profile && isSupabaseConfigured) {
        syncDiffToSupabase('grades', prev, next, mapGradeToDb);
      }
      return next;
    });
  };

  const setAttendanceListWithSync = (value: React.SetStateAction<Attendance[]>) => {
    setAttendanceList(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (profile && isSupabaseConfigured) {
        syncDiffToSupabase('attendance', prev, next, mapAttendanceToDb);
      }
      return next;
    });
  };

  const setJournalsWithSync = (value: React.SetStateAction<TeachingJournal[]>) => {
    setJournals(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (profile && isSupabaseConfigured) {
        syncDiffToSupabase('teaching_journals', prev, next, (item: any) => mapJournalToDb(item, profile.id));
      }
      return next;
    });
  };

  // Helper function to push local data to Supabase
  const handlePushLocalDataToSupabase = async () => {
    if (!profile || !isSupabaseConfigured) return;
    
    showConfirm(
      'Konfirmasi Unggah Data Cloud',
      'Apakah Anda ingin mengunggah seluruh data lokal Anda saat ini (Mata Pelajaran, Kelas, Siswa, Nilai, Absensi, Jurnal) ke Supabase? Ini akan memperbarui database Anda di cloud secara lengkap.',
      async () => {
        setSupabaseLoading(true);
        setSupabaseError(null);
        try {
          await uploadAllLocalDataToSupabase(profile.id, {
            subjects,
            classes,
            students,
            grades,
            attendance: attendanceList,
            journals
          });
          addActivity('Pembaruan Cloud', 'Supabase', 'Seluruh data lokal berhasil diunggah dan disinkronkan ke cloud Supabase');
          showAlert('Sinkronisasi Sukses', 'Seluruh data lokal Anda telah berhasil diunggah dan disimpan ke dalam database cloud Supabase!', 'success');
        } catch (err: any) {
          console.error('[Supabase Push Error]', err);
          setSupabaseError(err.message || 'Gagal mengunggah data lokal.');
          showAlert('Gagal Sinkronisasi', 'Gagal mengunggah data: ' + (err.message || err), 'error');
        } finally {
          setSupabaseLoading(false);
        }
      }
    );
  };

  // Save states to local storage on changes
  useEffect(() => {
    if (subjects.length > 0) localStorage.setItem('guruku_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    if (classes.length > 0) localStorage.setItem('guruku_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    if (students.length > 0) localStorage.setItem('guruku_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    if (grades.length > 0) localStorage.setItem('guruku_grades', JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    if (attendanceList.length > 0) localStorage.setItem('guruku_attendance', JSON.stringify(attendanceList));
  }, [attendanceList]);

  useEffect(() => {
    if (journals.length > 0) localStorage.setItem('guruku_journals', JSON.stringify(journals));
  }, [journals]);

  useEffect(() => {
    if (activities.length > 0) localStorage.setItem('guruku_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    if (characterLogs.length > 0) localStorage.setItem('guruku_character', JSON.stringify(characterLogs));
  }, [characterLogs]);

  // Synchronize "Alfa" attendance to character logs
  useEffect(() => {
    if (attendanceList.length === 0) return;
    
    setCharacterLogs(prev => {
      let changed = false;
      const nextLogs = [...prev];
      
      // 1. Add missing Alfa logs
      const alfaAttendances = attendanceList.filter(a => a.status === 'Alfa');
      alfaAttendances.forEach(att => {
        const exists = nextLogs.some(
          cl => cl.studentId === att.studentId && cl.date === att.date && cl.description === 'Alfa'
        );
        if (!exists) {
          nextLogs.push({
            id: `cl-auto-${att.id}`,
            studentId: att.studentId,
            classId: att.classId,
            date: att.date,
            type: 'negatif',
            level: 'ringan',
            description: 'Alfa',
            points: -8
          });
          changed = true;
        }
      });
      
      // 2. Remove orphaned or changed Alfa logs
      const finalLogs = nextLogs.filter(cl => {
        if (cl.description === 'Alfa') {
          // Check if this Alfa is still in attendance list
          const stillAlfa = attendanceList.some(
            a => a.studentId === cl.studentId && a.date === cl.date && a.status === 'Alfa'
          );
          if (!stillAlfa) {
            changed = true;
            return false;
          }
        }
        return true;
      });
      
      return changed ? finalLogs : prev;
    });
  }, [attendanceList]);

  // Handle dark mode DOM injection
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('guruku_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('guruku_theme', 'light');
    }
  }, [darkMode]);

  // Helper to append a system/activity log
  const addActivity = (action: string, module: string, details: string) => {
    const newLog: ActivityLog = {
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
      action,
      module,
      details
    };
    setActivities(prev => [newLog, ...prev].slice(0, 50)); // Cap logs at 50 records
  };

  const handleLoginSuccess = (userProfile: Profile) => {
    setProfile(userProfile);
    localStorage.setItem('guruku_profile', JSON.stringify(userProfile));
    addActivity('Login Berhasil', 'Autentikasi', `Guru ${userProfile.fullName} memulai sesi baru`);
  };

  const handleLogout = () => {
    showConfirm(
      'Konfirmasi Keluar',
      'Apakah Anda yakin ingin keluar dari sistem MUMTAZ 29?',
      () => {
        setProfile(null);
        localStorage.removeItem('guruku_profile');
        localStorage.removeItem('guruku_remember');
        setActiveTab('dashboard');
      }
    );
  };

  const updateProfile = async (newProfile: Profile) => {
    setProfile(newProfile);
    localStorage.setItem('guruku_profile', JSON.stringify(newProfile));

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: newProfile.fullName,
            nip: newProfile.nip || null,
            phone: newProfile.phone || null,
            avatar_url: newProfile.avatarUrl || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', newProfile.id);
        if (error) {
          console.error('[Supabase Profile Update Error]', error);
        } else {
          console.log('[Supabase Profile Update] Profile successfully updated in Supabase!');
        }
      } catch (err) {
        console.error('[Supabase Profile Update Exception]', err);
      }
    }
  };

  // Outer theme backgrounds
  const mainBg = darkMode ? 'bg-[#13131a] text-gray-100' : 'bg-[#f5f5f9] text-[#566a7f]';

  if (!profile) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen flex font-sans antialiased overflow-hidden transition-colors duration-300 ${mainBg}`}>
      
      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        darkMode={darkMode}
      />

      {/* Main app panel */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Sticky Header Navbar */}
        <Navbar 
          profile={profile} 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          activeTab={activeTab}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Dynamic Inner Viewport Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          
          {activeTab === 'dashboard' && (
            <DashboardView 
              subjects={subjects}
              classes={classes}
              students={students}
              journals={journals}
              activities={activities}
              grades={grades}
              attendanceList={attendanceList}
              characterLogs={characterLogs}
              setActiveTab={setActiveTab}
              profile={profile}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectsView 
              subjects={subjects}
              setSubjects={setSubjectsWithSync}
              addActivity={addActivity}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'classes' && (
            <ClassesView 
              classes={classes}
              setClasses={setClassesWithSync}
              addActivity={addActivity}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'students' && (
            <StudentsView 
              students={students}
              setStudents={setStudentsWithSync}
              classes={classes}
              addActivity={addActivity}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'grades' && (
            <GradesView 
              grades={grades}
              setGrades={setGradesWithSync}
              students={students}
              subjects={subjects}
              classes={classes}
              addActivity={addActivity}
              profile={profile}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView 
              attendanceList={attendanceList}
              setAttendanceList={setAttendanceListWithSync}
              students={students}
              subjects={subjects}
              classes={classes}
              addActivity={addActivity}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'class_attendance' && (
            <ClassAttendanceView 
              students={students}
              classes={classes}
              addActivity={addActivity}
              darkMode={darkMode}
              profile={profile}
            />
          )}

          {activeTab === 'journals' && (
            <JournalsView 
              journals={journals}
              setJournals={setJournalsWithSync}
              subjects={subjects}
              classes={classes}
              addActivity={addActivity}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'character' && (
            <CharacterZoneView 
              students={students}
              classes={classes}
              characterLogs={characterLogs}
              setCharacterLogs={setCharacterLogs}
              addActivity={addActivity}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView 
              subjects={subjects}
              classes={classes}
              students={students}
              grades={grades}
              attendanceList={attendanceList}
              journals={journals}
              profile={profile}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView 
              profile={profile}
              setProfile={updateProfile}
              addActivity={addActivity}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'sql_schema' && (
            <SqlSchemaView 
              darkMode={darkMode}
              isSupabaseConfigured={isSupabaseConfigured}
              onPushLocalData={handlePushLocalDataToSupabase}
              supabaseLoading={supabaseLoading}
              supabaseError={supabaseError}
            />
          )}

        </main>

        {/* Sneat-Inspired Sticky Footer */}
        <footer className={`h-[50px] px-6 border-t flex items-center justify-between text-[11px] shrink-0 font-medium ${
          darkMode ? 'border-[#2d2d3a] bg-[#1c1c24]/50' : 'border-gray-100 bg-white'
        }`}>
          <div>
            © {new Date().getFullYear()} <strong>MUMTAZ 29</strong>. Hak Cipta Dilindungi.
          </div>
          <div className="flex gap-4">
            <span className="text-[#696cff] font-bold">Sneat Admin Dashboard v5</span>
            <span className="text-gray-400">Powered by aaPanel & Supabase</span>
          </div>
        </footer>

      </div>

      {/* Custom Iframe-Safe Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-xl border shadow-xl ${darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-base font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {confirmDialog.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Iframe-Safe Alert Dialog */}
      {alertDialog.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-xl border shadow-xl ${darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-base font-extrabold tracking-tight mb-2 flex items-center gap-2 ${
              alertDialog.type === 'success' ? 'text-emerald-500' : 
              alertDialog.type === 'error' ? 'text-rose-500' : 'text-blue-500'
            }`}>
              {alertDialog.type === 'success' && '✓ '}
              {alertDialog.type === 'error' && '⚠️ '}
              {alertDialog.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed font-semibold">
              {alertDialog.message}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#696cff] hover:bg-[#5f61e6] text-white transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
