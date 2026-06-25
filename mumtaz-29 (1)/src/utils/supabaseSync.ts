/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { 
  Subject, Class, Student, Grade, Attendance, TeachingJournal, Profile 
} from '../types';

// ==========================================
// DB ROW TO FRONTEND OBJECT CONVERTERS
// ==========================================

export function mapSubjectFromDb(row: any): Subject {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
  };
}

export function mapClassFromDb(row: any): Class {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    academicYear: row.academic_year,
  };
}

export function mapStudentFromDb(row: any): Student {
  return {
    id: row.id,
    classId: row.class_id,
    nis: row.nis,
    fullName: row.full_name,
    gender: row.gender,
    birthPlace: row.birth_place || '',
    birthDate: row.birth_date || '',
    address: row.address || '',
    parentPhone: row.parent_phone || '',
  };
}

export function mapGradeFromDb(row: any): Grade {
  return {
    id: row.id,
    studentId: row.student_id,
    subjectId: row.subject_id,
    classId: row.class_id,
    assignment: Number(row.assignment),
    daily: Number(row.daily),
    pts: Number(row.pts),
    pas: Number(row.pas),
    finalGrade: Number(row.final_grade || 0),
    predicate: row.predicate,
  };
}

export function mapAttendanceFromDb(row: any): Attendance {
  return {
    id: row.id,
    studentId: row.student_id,
    subjectId: row.subject_id,
    classId: row.class_id,
    date: row.date,
    status: row.status,
  };
}

export function mapJournalFromDb(row: any): TeachingJournal {
  return {
    id: row.id,
    date: row.date,
    subjectId: row.subject_id,
    classId: row.class_id,
    period: row.period,
    topic: row.topic,
    method: row.method,
    presentCount: Number(row.present_count),
    notes: row.notes || '',
    attachmentUrl: row.attachment_url || undefined,
    attachmentName: row.attachment_name || undefined,
  };
}

// ==========================================
// FRONTEND OBJECT TO DB ROW CONVERTERS WITH STABLE UUID GUARANTEE
// ==========================================

const stableUuidMap = new Map<string, string>();

export function getStableUUID(id: string): string {
  if (!id) return '';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }
  if (stableUuidMap.has(id)) {
    return stableUuidMap.get(id)!;
  }
  
  // Deterministic seed generation from string
  let seed = 0;
  for (let i = 0; i < id.length; i++) {
    seed += id.charCodeAt(i) * (i + 1);
  }
  
  const rand = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };
  
  let charIndex = 0;
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(rand(seed + charIndex++) * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  
  stableUuidMap.set(id, uuid);
  return uuid;
}

export function mapSubjectToDb(item: Subject, teacherId: string) {
  return {
    id: getStableUUID(item.id),
    teacher_id: teacherId,
    code: item.code,
    name: item.name,
  };
}

export function mapClassToDb(item: Class, teacherId: string) {
  return {
    id: getStableUUID(item.id),
    teacher_id: teacherId,
    name: item.name,
    level: item.level,
    academic_year: item.academicYear,
  };
}

export function mapStudentToDb(item: Student) {
  return {
    id: getStableUUID(item.id),
    class_id: getStableUUID(item.classId),
    nis: item.nis,
    full_name: item.fullName,
    gender: item.gender,
    birth_place: item.birthPlace || null,
    birth_date: item.birthDate || null,
    address: item.address || null,
    parent_phone: item.parentPhone || null,
  };
}

export function mapGradeToDb(item: Grade) {
  return {
    id: getStableUUID(item.id),
    student_id: getStableUUID(item.studentId),
    subject_id: getStableUUID(item.subjectId),
    class_id: getStableUUID(item.classId),
    assignment: item.assignment,
    daily: item.daily,
    pts: item.pts,
    pas: item.pas,
    predicate: item.predicate,
  };
}

export function mapAttendanceToDb(item: Attendance) {
  return {
    id: getStableUUID(item.id),
    student_id: getStableUUID(item.studentId),
    subject_id: getStableUUID(item.subjectId),
    class_id: getStableUUID(item.classId),
    date: item.date,
    status: item.status,
  };
}

export function mapJournalToDb(item: TeachingJournal, teacherId: string) {
  return {
    id: getStableUUID(item.id),
    teacher_id: teacherId,
    date: item.date,
    subject_id: getStableUUID(item.subjectId),
    class_id: getStableUUID(item.classId),
    period: item.period,
    topic: item.topic,
    method: item.method,
    present_count: item.presentCount,
    notes: item.notes || null,
    attachment_url: item.attachmentUrl || null,
    attachment_name: item.attachmentName || null,
  };
}

// ==========================================
// CENTRAL DELTA DIFF SYNC ENGINE
// ==========================================

export async function syncDiffToSupabase<T extends { id: string }>(
  table: string,
  prevList: T[],
  nextList: T[],
  toDbRowFn: (item: T) => any
) {
  if (!isSupabaseConfigured || !supabase) return;

  const prevMap = new Map(prevList.map(i => [i.id, i]));
  const nextMap = new Map(nextList.map(i => [i.id, i]));

  const deleted = prevList.filter(i => !nextMap.has(i.id));
  const added = nextList.filter(i => !prevMap.has(i.id));
  const updated = nextList.filter(i => {
    const old = prevMap.get(i.id);
    return old && JSON.stringify(old) !== JSON.stringify(i);
  });

  // 1. Delete rows
  if (deleted.length > 0) {
    try {
      const deleteIds = deleted.map(i => i.id);
      console.log(`[Supabase Sync] Deleting ${deleted.length} rows from ${table}`, deleteIds);
      await supabase.from(table).delete().in('id', deleteIds);
    } catch (e) {
      console.error(`[Supabase Sync] Error deleting from ${table}`, e);
    }
  }

  // 2. Insert rows
  for (const item of added) {
    try {
      const row = toDbRowFn(item);
      console.log(`[Supabase Sync] Inserting row into ${table}`, row);
      await supabase.from(table).insert(row);
    } catch (e) {
      console.error(`[Supabase Sync] Error inserting into ${table}`, e);
    }
  }

  // 3. Update rows
  for (const item of updated) {
    try {
      const row = toDbRowFn(item);
      console.log(`[Supabase Sync] Updating row in ${table}`, row);
      await supabase.from(table).update(row).eq('id', item.id);
    } catch (e) {
      console.error(`[Supabase Sync] Error updating ${table}`, e);
    }
  }
}

// ==========================================
// BULK PULL ALL DATA FROM SUPABASE
// ==========================================

export async function fetchAllTeacherData(teacherId: string) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  console.log('[Supabase Sync] Fetching all teacher data for ID:', teacherId);

  // Subjects
  const { data: dbSubjects, error: errSubj } = await supabase
    .from('subjects')
    .select('*')
    .eq('teacher_id', teacherId);
  if (errSubj) throw errSubj;

  // Classes
  const { data: dbClasses, error: errCls } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', teacherId);
  if (errCls) throw errCls;

  const classIds = (dbClasses || []).map(c => c.id);

  // Students (by class_id belonging to teacher)
  let dbStudents: any[] = [];
  if (classIds.length > 0) {
    const { data: studData, error: errStud } = await supabase
      .from('students')
      .select('*')
      .in('class_id', classIds);
    if (errStud) throw errStud;
    dbStudents = studData || [];
  }

  const studentIds = dbStudents.map(s => s.id);

  // Grades
  let dbGrades: any[] = [];
  if (studentIds.length > 0) {
    const { data: grdData, error: errGrd } = await supabase
      .from('grades')
      .select('*')
      .in('student_id', studentIds);
    if (errGrd) throw errGrd;
    dbGrades = grdData || [];
  }

  // Attendance
  let dbAttendance: any[] = [];
  if (studentIds.length > 0) {
    const { data: attData, error: errAtt } = await supabase
      .from('attendance')
      .select('*')
      .in('student_id', studentIds);
    if (errAtt) throw errAtt;
    dbAttendance = attData || [];
  }

  // Teaching Journals
  const { data: dbJournals, error: errJourn } = await supabase
    .from('teaching_journals')
    .select('*')
    .eq('teacher_id', teacherId);
  if (errJourn) throw errJourn;

  return {
    subjects: (dbSubjects || []).map(mapSubjectFromDb),
    classes: (dbClasses || []).map(mapClassFromDb),
    students: dbStudents.map(mapStudentFromDb),
    grades: dbGrades.map(mapGradeFromDb),
    attendance: dbAttendance.map(mapAttendanceFromDb),
    journals: (dbJournals || []).map(mapJournalFromDb),
  };
}

// ==========================================
// BULK PUSH ALL LOCAL RECOVERED DATA TO DB
// ==========================================

export async function uploadAllLocalDataToSupabase(
  teacherId: string,
  localData: {
    subjects: Subject[];
    classes: Class[];
    students: Student[];
    grades: Grade[];
    attendance: Attendance[];
    journals: TeachingJournal[];
  }
) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }

  console.log('[Supabase Sync] Pushing all local data to Supabase...');

  // 1. Upload Subjects
  if (localData.subjects.length > 0) {
    const rows = localData.subjects.map(item => mapSubjectToDb(item, teacherId));
    await supabase.from('subjects').upsert(rows);
  }

  // 2. Upload Classes
  if (localData.classes.length > 0) {
    const rows = localData.classes.map(item => mapClassToDb(item, teacherId));
    await supabase.from('classes').upsert(rows);
  }

  // 3. Upload Students
  if (localData.students.length > 0) {
    const rows = localData.students.map(item => mapStudentToDb(item));
    await supabase.from('students').upsert(rows);
  }

  // 4. Upload Grades
  if (localData.grades.length > 0) {
    const rows = localData.grades.map(item => mapGradeToDb(item));
    await supabase.from('grades').upsert(rows);
  }

  // 5. Upload Attendance
  if (localData.attendance.length > 0) {
    const rows = localData.attendance.map(item => mapAttendanceToDb(item));
    await supabase.from('attendance').upsert(rows);
  }

  // 6. Upload Journals
  if (localData.journals.length > 0) {
    const rows = localData.journals.map(item => mapJournalToDb(item, teacherId));
    await supabase.from('teaching_journals').upsert(rows);
  }

  console.log('[Supabase Sync] All local data successfully upserted to Supabase!');
}
