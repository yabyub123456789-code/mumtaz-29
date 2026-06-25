/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Student, Class } from '../types';
import { Plus, Edit2, Trash2, Search, Users, AlertCircle, Filter, FileSpreadsheet, Download, Upload, Check, X, Info } from 'lucide-react';
import * as XLSX from 'xlsx';

interface StudentsViewProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  classes: Class[];
  addActivity: (action: string, module: string, details: string) => void;
  darkMode: boolean;
}

export default function StudentsView({ 
  students, 
  setStudents, 
  classes, 
  addActivity, 
  darkMode 
}: StudentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  
  // Modals / Form editing states
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nis, setNis] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [classId, setClassId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Custom Delete Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  // Excel / CSV Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importClassId, setImportClassId] = useState('');
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewStudents, setPreviewStudents] = useState<Array<{
    nis: string;
    fullName: string;
    gender: 'Laki-laki' | 'Perempuan';
    birthPlace: string;
    birthDate: string;
    address: string;
    parentPhone: string;
    status: 'valid' | 'invalid';
    reason?: string;
  }>>([]);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [importError, setImportError] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setImportError('');
    setImportSuccessCount(null);
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      setImportError('File harus berupa format Excel (.xlsx, .xls) atau CSV (.csv).');
      return;
    }
    setImportedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
          setImportError('Gagal membaca isi file.');
          return;
        }

        const arrayBuffer = data as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, raw: false });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to json array of arrays (header: 1 retains the rows as simple arrays)
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
        
        if (rows.length <= 1) {
          setImportError('File tidak memiliki data siswa (hanya berisi header atau kosong).');
          return;
        }

        const parsedRows: Array<{
          nis: string;
          fullName: string;
          gender: 'Laki-laki' | 'Perempuan';
          birthPlace: string;
          birthDate: string;
          address: string;
          parentPhone: string;
          status: 'valid' | 'invalid';
          reason?: string;
        }> = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          // If all elements in row are empty, skip
          if (row.every(cell => String(cell || '').trim() === '')) continue;

          const nisRaw = String(row[0] || '').trim();
          const nameRaw = String(row[1] || '').trim();
          const genderRaw = String(row[2] || '').trim();
          const birthPlaceRaw = String(row[3] || '').trim();
          const birthDateRaw = row[4]; // Can be Date object or string
          const addressRaw = String(row[5] || '').trim();
          const parentPhoneRaw = String(row[6] || '').trim();

          let status: 'valid' | 'invalid' = 'valid';
          let reason = '';

          if (!nisRaw) {
            status = 'invalid';
            reason = 'NIS wajib diisi';
          } else if (!nameRaw) {
            status = 'invalid';
            reason = 'Nama wajib diisi';
          } else {
            const isDuplicateInFile = parsedRows.some(r => r.nis === nisRaw);
            if (isDuplicateInFile) {
              status = 'invalid';
              reason = 'NIS ganda dalam file';
            } else {
              const isDuplicateInDb = students.some(s => s.nis === nisRaw);
              if (isDuplicateInDb) {
                status = 'invalid';
                reason = 'NIS sudah terdaftar di sistem';
              }
            }
          }

          let mappedGender: 'Laki-laki' | 'Perempuan' = 'Laki-laki';
          const gNorm = genderRaw.toLowerCase().trim();
          if (gNorm.startsWith('p') || gNorm.includes('perempuan') || gNorm === 'wanita') {
            mappedGender = 'Perempuan';
          } else if (gNorm.startsWith('l') || gNorm.includes('laki') || gNorm === 'pria') {
            mappedGender = 'Laki-laki';
          } else if (genderRaw !== '') {
            status = 'invalid';
            reason = reason ? `${reason}, jenis kelamin tidak valid` : 'Jenis kelamin tidak valid';
          }

          let formattedBirthdate = '';
          if (birthDateRaw) {
            if (birthDateRaw instanceof Date) {
              const year = birthDateRaw.getFullYear();
              const month = String(birthDateRaw.getMonth() + 1).padStart(2, '0');
              const day = String(birthDateRaw.getDate()).padStart(2, '0');
              formattedBirthdate = `${year}-${month}-${day}`;
            } else {
              const dateStr = String(birthDateRaw).trim();
              const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
              if (dateRegex.test(dateStr)) {
                formattedBirthdate = dateStr;
              } else {
                // Try to parse typical Indonesian / Excel formats (e.g. DD/MM/YYYY or DD-MM-YYYY)
                const parts = dateStr.split(/[\/\-.]/);
                if (parts.length === 3) {
                  if (parts[2].length === 4) {
                    // DD/MM/YYYY
                    formattedBirthdate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                  } else if (parts[0].length === 4) {
                    // YYYY/MM/DD
                    formattedBirthdate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                  }
                } else {
                  formattedBirthdate = dateStr;
                }
              }
            }
          }

          parsedRows.push({
            nis: nisRaw,
            fullName: nameRaw,
            gender: mappedGender,
            birthPlace: birthPlaceRaw,
            birthDate: formattedBirthdate,
            address: addressRaw,
            parentPhone: parentPhoneRaw,
            status,
            reason
          });
        }

        setPreviewStudents(parsedRows);
      } catch (err) {
        console.error(err);
        setImportError('Gagal memproses file Excel/CSV. Pastikan format berkas sesuai.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const selectedClass = classes.find(c => c.id === importClassId);
    const className = selectedClass ? selectedClass.name : 'Template';
    
    const headers = [
      'NIS (Wajib)',
      'Nama Lengkap (Wajib)',
      'Jenis Kelamin (Laki-laki / Perempuan)',
      'Tempat Lahir',
      'Tanggal Lahir (Format: YYYY-MM-DD)',
      'Alamat Domisili',
      'No HP Ortu / Wali'
    ];
    
    const sampleRows = [
      ['10001', 'Ahmad Fauzi', 'Laki-laki', 'Sawangan', '2012-04-12', 'Jl. Sawangan Indah No. 29', '08123456789'],
      ['10002', 'Siti Rahmawati', 'Perempuan', 'Depok', '2012-09-21', 'Perum Arco Blok C5', '08567890123']
    ];

    // Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    
    // Set custom column widths for a neat Excel experience
    ws['!cols'] = [
      { wch: 15 }, // NIS
      { wch: 25 }, // Nama Lengkap
      { wch: 35 }, // Jenis Kelamin
      { wch: 15 }, // Tempat Lahir
      { wch: 30 }, // Tanggal Lahir
      { wch: 40 }, // Alamat
      { wch: 20 }  // No HP Ortu
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Layout Siswa');

    // Write and download actual xlsx file
    XLSX.writeFile(wb, `Layout_Siswa_Kelas_${className.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleExecuteImport = () => {
    const validStudentsToImport = previewStudents.filter(r => r.status === 'valid');
    if (validStudentsToImport.length === 0) return;

    const selectedClass = classes.find(c => c.id === importClassId);
    const className = selectedClass ? selectedClass.name : 'Unknown Class';

    const newStudents: Student[] = validStudentsToImport.map((r, idx) => ({
      id: 'stud-' + (Date.now() + idx),
      nis: r.nis,
      fullName: r.fullName,
      gender: r.gender,
      birthPlace: r.birthPlace,
      birthDate: r.birthDate,
      address: r.address,
      parentPhone: r.parentPhone,
      classId: importClassId
    }));

    setStudents(prev => [...prev, ...newStudents]);
    addActivity(
      'Impor Siswa',
      'Data Master',
      `Berhasil mengimpor massal ${newStudents.length} siswa baru ke dalam kelas ${className}`
    );

    setImportSuccessCount(newStudents.length);
    setPreviewStudents([]);
    setImportedFile(null);
  };

  // Default setup
  React.useEffect(() => {
    if (classes.length > 0 && !classId) {
      setClassId(classes[0].id);
    }
  }, [classes]);

  // Reset form
  const resetForm = () => {
    setNis('');
    setFullName('');
    setGender('Laki-laki');
    setBirthPlace('');
    setBirthDate('');
    setAddress('');
    setParentPhone('');
    if (classes.length > 0) {
      setClassId(classes[0].id);
    }
    setSelectedId(null);
    setErrorMsg('');
  };

  // Create or Update
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nis || !fullName || !classId || !gender) {
      setErrorMsg('NIS, Nama Lengkap, Jenis Kelamin, dan Kelas wajib diisi.');
      return;
    }

    // Check duplicate NIS
    const isDuplicate = students.some(s => s.nis === nis && s.id !== selectedId);
    if (isDuplicate) {
      setErrorMsg('Nomor Induk Siswa (NIS) sudah terdaftar.');
      return;
    }

    if (selectedId) {
      // Update
      setStudents(prev => prev.map(s => s.id === selectedId ? {
        ...s, nis, fullName, gender, birthPlace, birthDate, address, parentPhone, classId
      } : s));
      addActivity('Edit Siswa', 'Data Master', `Mengubah profil siswa ${fullName}`);
    } else {
      // Create
      const newStudent: Student = {
        id: 'stud-' + Date.now(),
        nis,
        fullName,
        gender,
        birthPlace,
        birthDate,
        address,
        parentPhone,
        classId
      };
      setStudents(prev => [...prev, newStudent]);
      addActivity('Tambah Siswa', 'Data Master', `Menambahkan siswa baru ${fullName}`);
    }

    resetForm();
  };

  // Edit action
  const handleEdit = (stud: Student) => {
    setSelectedId(stud.id);
    setNis(stud.nis);
    setFullName(stud.fullName);
    setGender(stud.gender);
    setBirthPlace(stud.birthPlace || '');
    setBirthDate(stud.birthDate || '');
    setAddress(stud.address || '');
    setParentPhone(stud.parentPhone || '');
    setClassId(stud.classId);
  };

  // Delete action
  const handleDelete = (id: string, studName: string) => {
    setDeleteId(id);
    setDeleteName(studName);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setStudents(prev => prev.filter(s => s.id !== deleteId));
      addActivity('Hapus Siswa', 'Data Master', `Menghapus siswa ${deleteName}`);
      setDeleteId(null);
      setDeleteName('');
    }
  };

  // Filter list
  const filteredStudents = students.filter(stud => {
    const matchesSearch = 
      stud.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stud.nis.includes(searchQuery) ||
      (stud.address && stud.address.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesClass = selectedClassFilter === 'all' || stud.classId === selectedClassFilter;
    
    return matchesSearch && matchesClass;
  });

  const cardBg = darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100';
  const textTitle = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* Student Creator / Editor Form Card */}
      <div className={`p-5 rounded-xl border shadow-xs h-fit ${cardBg}`}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
          <div className="p-2 bg-[#71dd37]/10 text-[#71dd37] rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>
              {selectedId ? 'Edit Biodata Siswa' : 'Tambah Siswa Baru'}
            </h3>
            <p className="text-[11px] text-gray-400">Registrasi biodata & alokasi kelas siswa</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>NIS (Nomor Induk)</label>
              <input
                type="text"
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff] font-mono"
                placeholder="e.g. 10023"
                required
              />
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Kelas Alokasi</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
                required
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.academicYear})</option>
                ))}
                {classes.length === 0 && (
                  <option value="">Buat kelas dahulu!</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Nama Lengkap Siswa</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
              placeholder="e.g. Amanda Manopo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Jenis Kelamin</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Laki-laki' | 'Perempuan')}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>No HP Wali / Ortu</label>
              <input
                type="text"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
                placeholder="e.g. 0812xxxxxx"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Tempat Lahir</label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
                placeholder="e.g. Jakarta"
              />
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Tanggal Lahir</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
              />
            </div>
          </div>

          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${textSub}`}>Alamat Domisili</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#696cff]"
              placeholder="e.g. Jl. Anggrek No. 12"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-[#71dd37] hover:bg-[#64c431] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {selectedId ? 'Simpan Data Siswa' : 'Tambah Siswa'}
            </button>
            {selectedId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Student list grid table card */}
      <div className={`p-5 rounded-xl border shadow-xs xl:col-span-2 flex flex-col ${cardBg}`}>
        
        {/* Header Options */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
          <div>
            <h3 className={`font-bold text-sm tracking-tight ${textTitle}`}>Master Database Siswa</h3>
            <p className="text-[11px] text-gray-400">Total {filteredStudents.length} siswa ditemukan</p>
          </div>

          {/* Search + Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Import Excel layout per class button */}
            <button
              type="button"
              onClick={() => {
                setShowImportModal(true);
                setImportClassId(selectedClassFilter !== 'all' ? selectedClassFilter : (classes[0]?.id || ''));
                setPreviewStudents([]);
                setImportedFile(null);
                setImportSuccessCount(null);
                setImportError('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#696cff]/10 hover:bg-[#696cff]/20 text-[#696cff] text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Impor Siswa</span>
            </button>

            {/* Filter by class */}
            <div className="relative flex items-center">
              <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-2.5" />
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none"
              >
                <option value="all">Semua Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Search query bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari NIS / Nama / Alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-full sm:w-48 md:w-56 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Responsive Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">L/P</th>
                <th className="py-3 px-4">Kontak Ortu</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((stud) => {
                const studentClass = classes.find(c => c.id === stud.classId);
                return (
                  <tr 
                    key={stud.id}
                    className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-all text-gray-700 dark:text-gray-300"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-gray-400 dark:text-gray-500">{stud.nis}</td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-bold">{stud.fullName}</div>
                        <div className="text-[10px] text-gray-400">
                          {stud.birthPlace || 'TTL Belum Diisi'}{stud.birthDate ? `, ${new Date(stud.birthDate).toLocaleDateString('id-ID')}` : ''}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#696cff]/10 text-[#696cff] font-bold">
                        {studentClass ? studentClass.name : 'Unknown Class'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${
                        stud.gender === 'Laki-laki' 
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' 
                          : 'bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400'
                      }`}>
                        {stud.gender === 'Laki-laki' ? 'L' : 'P'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-gray-500">{stud.parentPhone || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => handleEdit(stud)}
                          className="p-1.5 bg-[#71dd37]/10 hover:bg-[#71dd37]/20 text-[#71dd37] rounded-lg transition-colors cursor-pointer"
                          title="Edit siswa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(stud.id, stud.fullName)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer dark:bg-rose-950/20 dark:text-rose-400"
                          title="Hapus siswa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Tidak ada siswa ditemukan. Silakan tambahkan siswa atau sesuaikan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-xl border shadow-xl ${darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-base font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Konfirmasi Hapus Siswa
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus siswa <strong className={darkMode ? 'text-white' : 'text-gray-800'}>"{deleteName}"</strong>? Semua data nilai dan absensi terkait siswa ini juga akan terhapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteId(null);
                  setDeleteName('');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Impor Siswa Massal Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className={`w-full max-w-3xl p-6 rounded-2xl border shadow-2xl ${darkMode ? 'bg-[#1c1c24] border-[#2d2d3a]' : 'bg-white border-gray-100'} my-8`}>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50 dark:border-[#2d2d3a]">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#696cff]/10 text-[#696cff] rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Impor Siswa Baru via Excel Template
                  </h3>
                  <p className="text-xs text-gray-400">Unduh layout asli Excel, isi data siswa ke kolom yang rapi, dan unggah langsung sekaligus</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps & Guidance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              
              {/* Step 1: Download layout */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#15151c] border-[#2d2d3a]' : 'bg-gray-50/50 border-gray-200/60'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#696cff] text-white text-[10px] font-extrabold">1</span>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Unduh Layout Excel (.xlsx)</h4>
                </div>
                <p className="text-[11px] text-gray-400 mb-4">
                  Pilih kelas tujuan, lalu unduh berkas layout Excel. Berkas ini sudah dibagi rapi berdasarkan kolom-kolom Excel siap isi.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Kelas Tujuan Impor</label>
                    <select
                      value={importClassId}
                      onChange={(e) => {
                        setImportClassId(e.target.value);
                        setPreviewStudents([]);
                        setImportedFile(null);
                        setImportSuccessCount(null);
                        setImportError('');
                      }}
                      className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.academicYear})</option>
                      ))}
                      {classes.length === 0 && (
                        <option value="">Buat kelas dahulu!</option>
                      )}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={!importClassId}
                    className="w-full py-2 bg-[#696cff] hover:bg-[#5f61e6] disabled:bg-gray-300 disabled:dark:bg-gray-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Layout Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Upload filled file */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#15151c] border-[#2d2d3a]' : 'bg-gray-50/50 border-gray-200/60'} flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#71dd37] text-white text-[10px] font-extrabold">2</span>
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Unggah Layout Terisi</h4>
                  </div>
                  <p className="text-[11px] text-gray-400 mb-3">
                    Isi data siswa di baris kosong pada file Excel yang diunduh, simpan, lalu seret atau pilih file Excel (.xlsx/.xls) tersebut di bawah ini.
                  </p>
                </div>

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                    dragActive 
                      ? 'border-[#71dd37] bg-[#71dd37]/5' 
                      : (darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')
                  }`}
                >
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                  <span className="block text-[11px] font-bold text-gray-500 dark:text-gray-400">
                    {importedFile ? importedFile.name : 'Seret & letakkan file Excel/CSV atau Klik di sini'}
                  </span>
                  <span className="block text-[9px] text-gray-400 mt-0.5">Mendukung format .xlsx, .xls, maupun .csv</span>
                </div>
              </div>

            </div>

            {/* Error alerts */}
            {importError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Success alert */}
            {importSuccessCount !== null && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex flex-col gap-1.5 mb-4 border border-emerald-100 dark:border-emerald-900/40">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#71dd37]" />
                  <span className="text-sm">Impor Berhasil Terlaksana!</span>
                </div>
                <p className="text-[11px] font-normal text-gray-500 dark:text-gray-400">
                  Sebanyak <strong>{importSuccessCount} siswa</strong> telah sukses diimpor dan didaftarkan langsung ke dalam sistem untuk kelas yang dipilih.
                </p>
              </div>
            )}

            {/* Preview Section */}
            {previewStudents.length > 0 && (
              <div className="mb-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-1.5`}>
                    <Info className="w-4 h-4 text-[#696cff]" />
                    <span>Pratinjau Data Siswa ({previewStudents.length} baris terdeteksi)</span>
                  </h4>
                  <span className="text-[10px] text-gray-400">
                    Valid: <strong className="text-[#71dd37]">{previewStudents.filter(r => r.status === 'valid').length}</strong> | 
                    Invalid: <strong className="text-rose-500">{previewStudents.filter(r => r.status === 'invalid').length}</strong>
                  </span>
                </div>

                <div className="border border-gray-100 dark:border-[#2d2d3a] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className={`${darkMode ? 'bg-black/20' : 'bg-gray-50'} text-gray-400 font-bold uppercase text-[9px] tracking-wider sticky top-0`}>
                      <tr>
                        <th className="py-2 px-3">NIS</th>
                        <th className="py-2 px-3">Nama Siswa</th>
                        <th className="py-2 px-3">L/P</th>
                        <th className="py-2 px-3">No HP Ortu</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewStudents.map((p, idx) => (
                        <tr 
                          key={idx}
                          className={`border-b border-gray-50 dark:border-gray-800/40 ${
                            p.status === 'invalid' ? 'bg-rose-50/20 dark:bg-rose-950/5' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-mono font-bold text-gray-400">{p.nis || '-'}</td>
                          <td className="py-2 px-3">
                            <div>
                              <div className="font-bold">{p.fullName || <span className="text-rose-400 italic">Nama kosong</span>}</div>
                              {p.birthPlace && <div className="text-[9px] text-gray-400">{p.birthPlace}, {p.birthDate || ''}</div>}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                              p.gender === 'Laki-laki' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20' : 'bg-pink-50 text-pink-600 dark:bg-pink-950/20'
                            }`}>
                              {p.gender === 'Laki-laki' ? 'L' : 'P'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-[10px] text-gray-400">{p.parentPhone || '-'}</td>
                          <td className="py-2 px-3 text-right">
                            {p.status === 'valid' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#71dd37]">
                                <Check className="w-3.5 h-3.5" /> Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500" title={p.reason}>
                                <X className="w-3.5 h-3.5" /> {p.reason || 'Invalid'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-50 dark:border-[#2d2d3a]">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              
              {previewStudents.length > 0 && (
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={previewStudents.filter(r => r.status === 'valid').length === 0}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-[#71dd37] hover:bg-[#64c431] disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Impor {previewStudents.filter(r => r.status === 'valid').length} Siswa Valid</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
