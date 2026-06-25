/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Profile {
  id: string;
  fullName: string;
  nip: string;
  email: string;
  phone: string;
  avatarUrl: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
}

export interface Class {
  id: string;
  name: string;
  level: string; // e.g. "X", "XI", "XII" or "7", "8", "9"
  academicYear: string; // e.g. "2025/2026"
}

export interface Student {
  id: string;
  classId: string;
  nis: string;
  fullName: string;
  gender: 'Laki-laki' | 'Perempuan';
  birthPlace: string;
  birthDate: string;
  address: string;
  parentPhone: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  assignment: number;
  daily: number;
  pts: number;
  pas: number;
  finalGrade: number;
  predicate: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface Attendance {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';
}

export interface ClassAttendance {
  id: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';
}

export interface TeachingJournal {
  id: string;
  date: string; // YYYY-MM-DD
  subjectId: string;
  classId: string;
  period: string; // e.g. "1-2" (Jam ke-1 sampai ke-2)
  topic: string;
  method: string;
  presentCount: number;
  notes: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  module: string;
  details: string;
}

export interface CharacterLog {
  id: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  type: 'positif' | 'negatif';
  level: 'ringan' | 'sedang' | 'berat';
  description: string;
  points: number;
}

