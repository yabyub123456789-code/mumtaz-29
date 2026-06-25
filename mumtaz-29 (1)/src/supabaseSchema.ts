/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const supabaseSQLSchema = `-- ==========================================
-- GURUKU DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- RLS NONAKTIF (DISABLE ROW LEVEL SECURITY)
-- UNTUK SINKRONISASI DATA MUDAH TANPA PEMBATASAN KEBIJAKAN
-- ==========================================

-- 1. PROFILES (GURU) TABLE
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  nip TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS dinonaktifkan untuk mempermudah sinkronisasi data
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;


-- 2. SUBJECTS (MATA PELAJARAN) TABLE
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS dinonaktifkan untuk mempermudah sinkronisasi data
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;


-- 3. CLASSES (KELAS) TABLE
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(50) NOT NULL,
  level VARCHAR(10) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_class_teacher UNIQUE (teacher_id, name, academic_year)
);

-- RLS dinonaktifkan untuk mempermudah sinkronisasi data
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;


-- 4. STUDENTS (SISWA) TABLE
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  nis VARCHAR(50) NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  gender VARCHAR(15) CHECK (gender IN ('Laki-laki', 'Perempuan')) NOT NULL,
  birth_place TEXT,
  birth_date DATE,
  address TEXT,
  parent_phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS dinonaktifkan untuk mempermudah sinkronisasi data
ALTER TABLE students DISABLE ROW LEVEL SECURITY;


-- 5. GRADES (NILAI SISWA) TABLE
CREATE TABLE grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  assignment NUMERIC(5,2) DEFAULT 0 NOT NULL,
  daily NUMERIC(5,2) DEFAULT 0 NOT NULL,
  pts NUMERIC(5,2) DEFAULT 0 NOT NULL,
  pas NUMERIC(5,2) DEFAULT 0 NOT NULL,
  final_grade NUMERIC(5,2) GENERATED ALWAYS AS (
    (assignment * 0.25) + (daily * 0.25) + (pts * 0.25) + (pas * 0.25)
  ) STORED,
  predicate VARCHAR(2) CHECK (predicate IN ('A', 'B', 'C', 'D', 'E')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_student_subject_grade UNIQUE (student_id, subject_id)
);

-- RLS dinonaktifkan untuk mempermudah sinkronisasi data
ALTER TABLE grades DISABLE ROW LEVEL SECURITY;


-- 6. ATTENDANCE (ABSENSI) TABLE
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  status VARCHAR(10) CHECK (status IN ('Hadir', 'Izin', 'Sakit', 'Alfa')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_student_subject_date UNIQUE (student_id, subject_id, date)
);

-- RLS dinonaktifkan untuk mempermudah sinkronisasi data
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;


-- 7. TEACHING JOURNALS (JURNAL MENGAJAR) TABLE
CREATE TABLE teaching_journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  period VARCHAR(20) NOT NULL,
  topic TEXT NOT NULL,
  method TEXT NOT NULL,
  present_count INT DEFAULT 0 NOT NULL,
  notes TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS dinonaktifkan untuk mempermudah sinkronisasi data
ALTER TABLE teaching_journals DISABLE ROW LEVEL SECURITY;


-- ==========================================
-- REAL-TIME TRIGGERS FOR PROFILE INITIALIZATION
-- ==========================================

-- Trigger to create user profile in public.profiles when signing up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, nip, phone, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nama Guru Baru'),
    new.email,
    new.raw_user_meta_data->>'nip',
    new.raw_user_meta_data->>'phone',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`;
