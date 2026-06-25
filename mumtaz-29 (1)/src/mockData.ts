/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Profile, Subject, Class, Student, Grade, Attendance, TeachingJournal, ActivityLog } from './types';

export const initialProfile: Profile = {
  id: 'guru-1',
  fullName: 'Ichwan Darmawan, S.Pd.',
  nip: '19880412 201503 1 002',
  email: 'ichwandarmawan78@guru.smp.belajar.id',
  phone: '081234567890',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

export const initialSubjects: Subject[] = [
  { id: 'subj-1', code: 'MAT-SMP7', name: 'Matematika' },
  { id: 'subj-2', code: 'IPA-SMP7', name: 'Ilmu Pengetahuan Alam (IPA)' },
  { id: 'subj-3', code: 'BIN-SMP7', name: 'Bahasa Indonesia' },
];

export const initialClasses: Class[] = [
  { id: 'class-1', name: 'VII-A', level: '7', academicYear: '2025/2026' },
  { id: 'class-2', name: 'VII-B', level: '7', academicYear: '2025/2026' },
  { id: 'class-3', name: 'VIII-A', level: '8', academicYear: '2025/2026' },
];

export const initialStudents: Student[] = [
  // VII-A Students
  { id: 'stud-1', classId: 'class-1', nis: '10001', fullName: 'Achmad Fauzi', gender: 'Laki-laki', birthPlace: 'Jakarta', birthDate: '2013-05-12', address: 'Jl. Merdeka No. 12', parentPhone: '085211112222' },
  { id: 'stud-2', classId: 'class-1', nis: '10002', fullName: 'Budi Santoso', gender: 'Laki-laki', birthPlace: 'Surabaya', birthDate: '2013-08-22', address: 'Jl. Mawar Gg. 3 No. 4', parentPhone: '085222223333' },
  { id: 'stud-3', classId: 'class-1', nis: '10003', fullName: 'Citra Kirana', gender: 'Perempuan', birthPlace: 'Bandung', birthDate: '2013-11-02', address: 'Perum Asri Indah Blok C/10', parentPhone: '085233334444' },
  { id: 'stud-4', classId: 'class-1', nis: '10004', fullName: 'Dewi Lestari', gender: 'Perempuan', birthPlace: 'Yogyakarta', birthDate: '2013-02-14', address: 'Jl. Diponegoro No. 88', parentPhone: '085244445555' },
  { id: 'stud-5', classId: 'class-1', nis: '10005', fullName: 'Eko Prasetyo', gender: 'Laki-laki', birthPlace: 'Semarang', birthDate: '2013-07-30', address: 'Jl. Pemuda Baru No. 15', parentPhone: '085255556666' },

  // VII-B Students
  { id: 'stud-6', classId: 'class-2', nis: '10006', fullName: 'Faris Rahmad', gender: 'Laki-laki', birthPlace: 'Malang', birthDate: '2013-09-05', address: 'Jl. Melati No. 5', parentPhone: '085266667777' },
  { id: 'stud-7', classId: 'class-2', nis: '10007', fullName: 'Gita Savitri', gender: 'Perempuan', birthPlace: 'Palembang', birthDate: '2013-04-18', address: 'Komp. Sriwijaya Residence B/4', parentPhone: '085277778888' },
  { id: 'stud-8', classId: 'class-2', nis: '10008', fullName: 'Hendra Wijaya', gender: 'Laki-laki', birthPlace: 'Medan', birthDate: '2013-12-25', address: 'Jl. Jend. Sudirman No. 201', parentPhone: '085288889999' },
  { id: 'stud-9', classId: 'class-2', nis: '10009', fullName: 'Indah Permata', gender: 'Perempuan', birthPlace: 'Denpasar', birthDate: '2013-01-09', address: 'Jl. Gatot Subroto Gg. VIII', parentPhone: '085299990000' },
  { id: 'stud-10', classId: 'class-2', nis: '10010', fullName: 'Joko Widodo', gender: 'Laki-laki', birthPlace: 'Solo', birthDate: '2013-06-21', address: 'Jl. Slamet Riyadi No. 45', parentPhone: '085200001111' },

  // VIII-A Students
  { id: 'stud-11', classId: 'class-3', nis: '20001', fullName: 'Kartika Sari', gender: 'Perempuan', birthPlace: 'Bandung', birthDate: '2012-10-15', address: 'Jl. Dago No. 142', parentPhone: '085211113333' },
  { id: 'stud-12', classId: 'class-3', nis: '20002', fullName: 'Lukman Hakim', gender: 'Laki-laki', birthPlace: 'Cirebon', birthDate: '2012-03-28', address: 'Jl. Tuparev Gg. Damai 4', parentPhone: '085222224444' },
];

export const initialGrades: Grade[] = [
  // VII-A - Matematika (subj-1)
  { id: 'gr-1', studentId: 'stud-1', subjectId: 'subj-1', classId: 'class-1', assignment: 85, daily: 80, pts: 78, pas: 82, finalGrade: 81.25, predicate: 'B' },
  { id: 'gr-2', studentId: 'stud-2', subjectId: 'subj-1', classId: 'class-1', assignment: 90, daily: 85, pts: 88, pas: 92, finalGrade: 88.75, predicate: 'A' },
  { id: 'gr-3', studentId: 'stud-3', subjectId: 'subj-1', classId: 'class-1', assignment: 75, daily: 70, pts: 65, pas: 72, finalGrade: 70.5, predicate: 'C' },
  { id: 'gr-4', studentId: 'stud-4', subjectId: 'subj-1', classId: 'class-1', assignment: 88, daily: 92, pts: 85, pas: 90, finalGrade: 88.75, predicate: 'A' },
  { id: 'gr-5', studentId: 'stud-5', subjectId: 'subj-1', classId: 'class-1', assignment: 60, daily: 65, pts: 58, pas: 62, finalGrade: 61.25, predicate: 'D' },

  // VII-A - IPA (subj-2)
  { id: 'gr-6', studentId: 'stud-1', subjectId: 'subj-2', classId: 'class-1', assignment: 88, daily: 84, pts: 80, pas: 85, finalGrade: 84.25, predicate: 'B' },
  { id: 'gr-7', studentId: 'stud-2', subjectId: 'subj-2', classId: 'class-1', assignment: 92, daily: 90, pts: 92, pas: 94, finalGrade: 92.0, predicate: 'A' },
  { id: 'gr-8', studentId: 'stud-3', subjectId: 'subj-2', classId: 'class-1', assignment: 80, daily: 78, pts: 75, pas: 80, finalGrade: 78.25, predicate: 'B' },

  // VII-B - Matematika (subj-1)
  { id: 'gr-9', studentId: 'stud-6', subjectId: 'subj-1', classId: 'class-2', assignment: 80, daily: 82, pts: 75, pas: 80, finalGrade: 79.25, predicate: 'B' },
  { id: 'gr-10', studentId: 'stud-7', subjectId: 'subj-1', classId: 'class-2', assignment: 95, daily: 92, pts: 90, pas: 96, finalGrade: 93.25, predicate: 'A' },
  { id: 'gr-11', studentId: 'stud-8', subjectId: 'subj-1', classId: 'class-2', assignment: 70, daily: 75, pts: 68, pas: 70, finalGrade: 70.75, predicate: 'C' },
];

export const initialAttendance: Attendance[] = [
  // Today's Date or recent dates
  { id: 'att-1', studentId: 'stud-1', subjectId: 'subj-1', classId: 'class-1', date: '2026-06-22', status: 'Hadir' },
  { id: 'att-2', studentId: 'stud-2', subjectId: 'subj-1', classId: 'class-1', date: '2026-06-22', status: 'Hadir' },
  { id: 'att-3', studentId: 'stud-3', subjectId: 'subj-1', classId: 'class-1', date: '2026-06-22', status: 'Izin' },
  { id: 'att-4', studentId: 'stud-4', subjectId: 'subj-1', classId: 'class-1', date: '2026-06-22', status: 'Hadir' },
  { id: 'att-5', studentId: 'stud-5', subjectId: 'subj-1', classId: 'class-1', date: '2026-06-22', status: 'Sakit' },

  { id: 'att-6', studentId: 'stud-1', subjectId: 'subj-1', classId: 'class-1', date: '2026-06-23', status: 'Hadir' },
  { id: 'att-7', studentId: 'stud-2', subjectId: 'subj-1', classId: 'class-1', date: '2026-06-23', status: 'Hadir' },
  { id: 'att-8', studentId: 'stud-3', subjectId: 'subj-1', classId: 'class-1', date: '2026-06-23', status: 'Hadir' },
  { id: 'att-9', studentId: 'stud-4', subjectId: 'subj-1', classId: 'class-1', date: '2026-06-23', status: 'Hadir' },
  { id: 'att-10', studentId: 'stud-5', subjectId: 'subj-1', classId: 'class-1', date: '2026-06-23', status: 'Alfa' },

  // VII-B Attendance
  { id: 'att-11', studentId: 'stud-6', subjectId: 'subj-2', classId: 'class-2', date: '2026-06-23', status: 'Hadir' },
  { id: 'att-12', studentId: 'stud-7', subjectId: 'subj-2', classId: 'class-2', date: '2026-06-23', status: 'Hadir' },
  { id: 'att-13', studentId: 'stud-8', subjectId: 'subj-2', classId: 'class-2', date: '2026-06-23', status: 'Izin' },
  { id: 'att-14', studentId: 'stud-9', subjectId: 'subj-2', classId: 'class-2', date: '2026-06-23', status: 'Hadir' },
  { id: 'att-15', studentId: 'stud-10', subjectId: 'subj-2', classId: 'class-2', date: '2026-06-23', status: 'Hadir' },
];

export const initialJournals: TeachingJournal[] = [
  {
    id: 'jr-1',
    date: '2026-06-22',
    subjectId: 'subj-1',
    classId: 'class-1',
    period: '1-2',
    topic: 'Aljabar dan Persamaan Linier',
    method: 'Ceramah & Diskusi Kelompok',
    presentCount: 4,
    notes: 'Siswa dapat memahami konsep variabel dan koefisien dengan baik. Citra Kirana izin tidak masuk.',
    attachmentName: 'Modul_Aljabar_Smt1.pdf'
  },
  {
    id: 'jr-2',
    date: '2026-06-23',
    subjectId: 'subj-1',
    classId: 'class-1',
    period: '3-4',
    topic: 'Penyelesaian Persamaan Linier Satu Variabel',
    method: 'Latihan Soal Mandiri',
    presentCount: 4,
    notes: 'Siswa mengerjakan latihan soal di papan tulis. Eko Prasetyo masih memerlukan bimbingan ekstra. Joko Widodo Alfa.',
    attachmentName: 'Latihan_SPLSV.docx'
  },
  {
    id: 'jr-3',
    date: '2026-06-23',
    subjectId: 'subj-2',
    classId: 'class-2',
    period: '5-6',
    topic: 'Sistem Organisasi Kehidupan',
    method: 'Praktikum Mikroskop',
    presentCount: 4,
    notes: 'Praktikum mengamati sel bawang merah berjalan lancar. Hendra Wijaya Izin sakit pertengahan jam pelajaran.',
    attachmentName: 'Laporan_Praktikum_Sel.xlsx'
  }
];

export const initialActivities: ActivityLog[] = [
  { id: 'act-1', timestamp: '2026-06-23T10:30:00', action: 'Input Nilai', module: 'Akademik', details: 'Memasukkan nilai PAS Matematika kelas VII-A' },
  { id: 'act-2', timestamp: '2026-06-23T08:15:00', action: 'Absensi', module: 'Akademik', details: 'Melakukan absensi kelas VII-A mata pelajaran Matematika' },
  { id: 'act-3', timestamp: '2026-06-22T14:00:00', action: 'Jurnal Mengajar', module: 'Akademik', details: 'Membuat jurnal mengajar Matematika kelas VII-A' },
  { id: 'act-4', timestamp: '2026-06-21T09:00:00', action: 'Tambah Siswa', module: 'Data Master', details: 'Menambahkan siswa baru Lukman Hakim ke kelas VIII-A' },
];

import { CharacterLog } from './types';

export const initialCharacterLogs: CharacterLog[] = [
  { id: 'cl-1', studentId: 'stud-1', classId: 'class-1', date: '2026-06-22', type: 'positif', level: 'ringan', description: 'Berpakaian rapih dan lengkap', points: 2 },
  { id: 'cl-2', studentId: 'stud-1', classId: 'class-1', date: '2026-06-22', type: 'positif', level: 'ringan', description: 'Mengucapkan salam dan sopan santun', points: 3 },
  { id: 'cl-3', studentId: 'stud-1', classId: 'class-1', date: '2026-06-23', type: 'positif', level: 'sedang', description: 'Menjadi petugas upacara', points: 10 },
  { id: 'cl-4', studentId: 'stud-2', classId: 'class-1', date: '2026-06-22', type: 'positif', level: 'berat', description: 'Juara tingkat kecamatan', points: 20 },
  { id: 'cl-5', studentId: 'stud-3', classId: 'class-1', date: '2026-06-22', type: 'negatif', level: 'ringan', description: 'Tidak mengerjakan tugas', points: -4 },
  { id: 'cl-6', studentId: 'stud-5', classId: 'class-1', date: '2026-06-23', type: 'negatif', level: 'ringan', description: 'Alfa', points: -8 },
];

