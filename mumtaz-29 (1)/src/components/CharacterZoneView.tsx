import React, { useState, useMemo } from 'react';
import { 
  Award, ShieldAlert, Plus, Trash2, Download, Search, CheckCircle2, AlertTriangle, 
  User, Calendar, TrendingUp, Sparkles, Filter, ChevronRight, FileText, Info
} from 'lucide-react';
import { Student, Class, CharacterLog } from '../types';
import { 
  POSITIVE_PRESETS, NEGATIVE_PRESETS, REWARD_MILESTONES, SANCTION_MILESTONES 
} from '../utils/characterPresets';

interface CharacterZoneViewProps {
  students: Student[];
  classes: Class[];
  characterLogs: CharacterLog[];
  setCharacterLogs: React.Dispatch<React.SetStateAction<CharacterLog[]>>;
  addActivity: (action: string, module: string, details: string) => void;
  darkMode: boolean;
}

export default function CharacterZoneView({
  students,
  classes,
  characterLogs,
  setCharacterLogs,
  addActivity,
  darkMode
}: CharacterZoneViewProps) {
  // Tabs: 'input' (Input Karakter), 'logs' (Riwayat Jurnal), 'reports' (Laporan Karakter)
  const [subTab, setSubTab] = useState<'input' | 'logs' | 'reports'>('input');
  
  // Filtering & Form States
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [categoryType, setCategoryType] = useState<'positif' | 'negatif'>('positif');
  const [levelType, setLevelType] = useState<'ringan' | 'sedang' | 'berat'>('ringan');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Logs & Reports filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterClassId, setFilterClassId] = useState<string>('all');

  // Filter students based on selected class in form
  const filteredStudentsForForm = useMemo(() => {
    return students.filter(s => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Set default student when class changes in form
  React.useEffect(() => {
    if (filteredStudentsForForm.length > 0) {
      setSelectedStudentId(filteredStudentsForForm[0].id);
    } else {
      setSelectedStudentId('');
    }
  }, [filteredStudentsForForm]);

  // Get options/presets based on Category & Level
  const activePresets = useMemo(() => {
    if (categoryType === 'positif') {
      return POSITIVE_PRESETS[levelType];
    } else {
      return NEGATIVE_PRESETS[levelType];
    }
  }, [categoryType, levelType]);

  // Auto-select first preset when category or level changes
  React.useEffect(() => {
    if (activePresets.length > 0) {
      setSelectedPresetId(activePresets[0].id);
    } else {
      setSelectedPresetId('');
    }
  }, [activePresets]);

  // Handle saving character log
  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('Silakan pilih siswa terlebih dahulu');
      return;
    }
    const preset = activePresets.find(p => p.id === selectedPresetId);
    if (!preset) {
      alert('Silakan pilih jenis kegiatan/pelanggaran');
      return;
    }

    const studentObj = students.find(s => s.id === selectedStudentId);
    if (!studentObj) return;

    const newLog: CharacterLog = {
      id: 'cl-' + Date.now(),
      studentId: selectedStudentId,
      classId: selectedClassId,
      date: logDate,
      type: categoryType,
      level: levelType,
      description: preset.name,
      points: preset.points
    };

    setCharacterLogs(prev => [...prev, newLog]);
    addActivity(
      categoryType === 'positif' ? 'Poin Karakter Positif' : 'Poin Karakter Negatif',
      'Zona Karakter',
      `Menambahkan poin ${preset.points > 0 ? '+' : ''}${preset.points} kepada ${studentObj.fullName} (${preset.name})`
    );

    // Reset selection to first item
    alert(`Sukses menambahkan poin ${preset.points > 0 ? '+' : ''}${preset.points} kepada ${studentObj.fullName}`);
  };

  // Handle deleting a log
  const handleDeleteLog = (id: string) => {
    const logToDelete = characterLogs.find(l => l.id === id);
    if (!logToDelete) return;
    const studentObj = students.find(s => s.id === logToDelete.studentId);
    
    if (window.confirm(`Hapus riwayat poin karakter untuk ${studentObj?.fullName || 'siswa'}?`)) {
      setCharacterLogs(prev => prev.filter(l => l.id !== id));
      addActivity(
        'Hapus Poin Karakter',
        'Zona Karakter',
        `Menghapus riwayat karakter dari ${studentObj?.fullName || 'siswa'}`
      );
    }
  };

  // Calculate accumulated points for all students
  const studentReports = useMemo(() => {
    return students.map(student => {
      const cls = classes.find(c => c.id === student.classId);
      const studentLogs = characterLogs.filter(l => l.studentId === student.id);
      
      const positivePoints = studentLogs
        .filter(l => l.type === 'positif')
        .reduce((sum, l) => sum + l.points, 0);

      const negativePoints = studentLogs
        .filter(l => l.type === 'negatif')
        .reduce((sum, l) => sum + l.points, 0); // negative values

      // Calculate achievements (milestones)
      const achievedRewards = REWARD_MILESTONES.filter(m => positivePoints >= m.points);
      const activeSanctions = SANCTION_MILESTONES.filter(m => negativePoints <= m.points);

      return {
        ...student,
        className: cls?.name || 'Tidak diketahui',
        positivePoints,
        negativePoints,
        netPoints: positivePoints + negativePoints,
        rewards: achievedRewards,
        sanctions: activeSanctions,
        logsCount: studentLogs.length
      };
    });
  }, [students, classes, characterLogs]);

  // Filter reports for list/search
  const filteredReports = useMemo(() => {
    return studentReports.filter(rep => {
      const matchesSearch = rep.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            rep.nis.includes(searchQuery);
      const matchesClass = filterClassId === 'all' || rep.classId === filterClassId;
      return matchesSearch && matchesClass;
    });
  }, [studentReports, searchQuery, filterClassId]);

  // Filter raw logs for view
  const filteredRawLogs = useMemo(() => {
    return characterLogs.map(log => {
      const student = students.find(s => s.id === log.studentId);
      const cls = classes.find(c => c.id === log.classId);
      return {
        ...log,
        studentName: student?.fullName || 'Siswa tidak ditemukan',
        studentNis: student?.nis || '-',
        className: cls?.name || 'Kelas tidak ditemukan'
      };
    }).filter(log => {
      const matchesSearch = log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            log.studentNis.includes(searchQuery);
      const matchesClass = filterClassId === 'all' || log.classId === filterClassId;
      return matchesSearch && matchesClass;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [characterLogs, students, classes, searchQuery, filterClassId]);

  // Print PDF helper
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka halaman cetak PDF. Izinkan pop-up di browser Anda.');
      return;
    }

    const rowsHtml = filteredReports.map((rep, idx) => {
      const rewardsText = rep.rewards.map(r => `${r.badge} ${r.name}`).join(', ') || '-';
      const sanctionsText = rep.sanctions.map(s => `⚠️ ${s.name}`).join(', ') || '-';
      
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${rep.nis}</td>
          <td style="font-weight: bold;">${rep.fullName}</td>
          <td style="text-align: center;">${rep.className}</td>
          <td style="text-align: center; color: #10b981; font-weight: bold;">+${rep.positivePoints}</td>
          <td style="text-align: center; color: #ef4444; font-weight: bold;">${rep.negativePoints}</td>
          <td style="text-align: center; font-weight: bold; background-color: #f3f4f6;">${rep.netPoints}</td>
          <td style="font-size: 11px;">${rewardsText}</td>
          <td style="font-size: 11px; color: #b91c1c;">${sanctionsText}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Zona Karakter - MUMTAZ 29</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
            .header { text-align: center; margin-bottom: 25px; border-bottom: 3px double #333; padding-bottom: 15px; }
            .header .title { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
            .header .subtitle { font-size: 12px; color: #666; margin-top: 5px; }
            h2 { font-size: 16px; margin-top: 0; margin-bottom: 15px; text-transform: uppercase; color: #111; border-bottom: 1px solid #ddd; padding-bottom: 5px;}
            .meta-info { font-size: 11px; color: #555; margin-bottom: 20px; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background-color: #f8f9fa; color: #333; padding: 10px 8px; border: 1px solid #ddd; font-weight: bold; }
            td { padding: 8px; border: 1px solid #ddd; }
            .footer { margin-top: 40px; font-size: 11px; display: flex; justify-content: space-between; }
            .signature { text-align: center; width: 200px; }
            .signature-space { height: 60px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">SMP MUHAMMADIYAH 29 SAWANGAN</div>
            <div class="subtitle">Monitoring Upaya dan Mutu Terpadu Akademik serta Zona Karakter (MUMTAZ)</div>
          </div>
          
          <h2>Laporan Akumulasi Poin Karakter Siswa</h2>
          
          <div class="meta-info">
            <div>
              <strong>Kelas:</strong> ${filterClassId === 'all' ? 'Semua Kelas' : (classes.find(c => c.id === filterClassId)?.name || '')}<br>
              <strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div>
              <strong>Petugas:</strong> Guru Pembimbing / Wali Kelas
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 10%;">NIS</th>
                <th style="width: 25%;">Nama Siswa</th>
                <th style="width: 10%;">Kelas</th>
                <th style="width: 8%;">Poin (+)</th>
                <th style="width: 8%;">Poin (-)</th>
                <th style="width: 8%;">Total Net</th>
                <th style="width: 15%;">Penghargaan (Reward)</th>
                <th style="width: 15%;">Tindak Lanjut (Sanksi)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="9" style="text-align:center; padding: 20px;">Tidak ada data siswa ditemukan</td></tr>'}
            </tbody>
          </table>
          
          <div class="footer">
            <div class="signature">
              Mengetahui,<br>
              Kepala Sekolah
              <div class="signature-space"></div>
              <strong>SMP Muhammadiyah 29 Sawangan</strong>
            </div>
            <div class="signature">
              Depok, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}<br>
              Guru Pembimbing / Wali Kelas
              <div class="signature-space"></div>
              <strong>${addActivity ? 'Ichwan Darmawan, S.Pd.' : 'Petugas'}</strong>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Upper Tab Selection */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        darkMode ? 'bg-[#15151c] border-[#2d2d3a]' : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Zona Karakter Terpadu (MUMTAZ)
            </h2>
            <p className="text-xs text-gray-400">Pencatatan Karakter Positif & Pelanggaran Karakter Negatif secara Real-time</p>
          </div>
        </div>

        {/* Sub tabs selection buttons */}
        <div className="flex bg-gray-100/70 dark:bg-[#1a1a24] p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setSubTab('input')}
            className={`flex-1 md:flex-none py-1.5 px-4 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              subTab === 'input' 
                ? 'bg-[#696cff] text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Input Karakter
          </button>
          <button
            onClick={() => setSubTab('logs')}
            className={`flex-1 md:flex-none py-1.5 px-4 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              subTab === 'logs' 
                ? 'bg-[#696cff] text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Riwayat Poin
          </button>
          <button
            onClick={() => setSubTab('reports')}
            className={`flex-1 md:flex-none py-1.5 px-4 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              subTab === 'reports' 
                ? 'bg-[#696cff] text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Laporan & Penghargaan
          </button>
        </div>
      </div>

      {/* CBT / Link Input Soal Card */}
      <div className={`p-4 rounded-xl border border-dashed flex flex-col sm:flex-row items-center justify-between gap-4 ${
        darkMode ? 'bg-[#181824] border-indigo-500/40' : 'bg-indigo-50/50 border-indigo-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-extrabold text-sm">
            CBT
          </div>
          <div>
            <h4 className={`text-xs font-extrabold ${darkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
              Portal CBT & Input Soal SMPM 29 Sawangan
            </h4>
            <p className="text-[11px] text-gray-400">Akses langsung ke manager dashboard portal ujian sekolah</p>
          </div>
        </div>
        <a 
          href="http://cbt.smpmuhammadiyah29.com/cbt/index.php/manager/dashboard" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
        >
          <span>Buka CBT Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Main View Switcher */}
      {subTab === 'input' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Input Section */}
          <div className={`lg:col-span-2 p-6 rounded-xl border space-y-6 ${
            darkMode ? 'bg-[#15151c] border-[#2d2d3a]' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center gap-2 border-b pb-3 border-gray-100 dark:border-[#2d2d3a]">
              <Plus className="w-5 h-5 text-[#696cff]" />
              <h3 className={`text-sm font-extrabold tracking-tight uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Form Catat Karakter Siswa Baru
              </h3>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Class Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Pilih Kelas</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#696cff] ${
                      darkMode ? 'bg-[#1e1e2d] border-[#2d2d3a] text-white' : 'bg-white border-gray-200'
                    }`}
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tanggal Pencatatan</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#696cff] ${
                      darkMode ? 'bg-[#1e1e2d] border-[#2d2d3a] text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
              </div>

              {/* Student Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Pilih Siswa</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#696cff] ${
                    darkMode ? 'bg-[#1e1e2d] border-[#2d2d3a] text-white' : 'bg-white border-gray-200'
                  }`}
                  required
                >
                  {filteredStudentsForForm.length === 0 ? (
                    <option value="">-- Tidak ada siswa di kelas ini --</option>
                  ) : (
                    filteredStudentsForForm.map(s => (
                      <option key={s.id} value={s.id}>{s.nis} - {s.fullName}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Category: Positive or Negative */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Kategori Karakter</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCategoryType('positif')}
                    className={`p-3 rounded-lg border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      categoryType === 'positif'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-transparent border-gray-200 dark:border-[#2d2d3a] text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Poin Positif (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategoryType('negatif')}
                    className={`p-3 rounded-lg border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      categoryType === 'negatif'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-500 ring-2 ring-rose-500/20'
                        : 'bg-transparent border-gray-200 dark:border-[#2d2d3a] text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Poin Negatif (-)</span>
                  </button>
                </div>
              </div>

              {/* Level: Ringan / Sedang / Berat */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tingkat Tindakan</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ringan', 'sedang', 'berat'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevelType(lvl)}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold capitalize transition-all cursor-pointer ${
                        levelType === lvl
                          ? categoryType === 'positif'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-transparent border-gray-200 dark:border-[#2d2d3a] text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity / Violation Preset Items Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Kegiatan atau Pelanggaran</label>
                <div className="max-h-[220px] overflow-y-auto border border-gray-200 dark:border-[#2d2d3a] rounded-lg p-2 space-y-1.5 custom-scrollbar">
                  {activePresets.map(preset => (
                    <label
                      key={preset.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-[11.5px] font-medium transition-all ${
                        selectedPresetId === preset.id
                          ? categoryType === 'positif'
                            ? 'bg-emerald-500/5 border-emerald-500/60 text-emerald-500 font-bold'
                            : 'bg-rose-500/5 border-rose-500/60 text-rose-500 font-bold'
                          : 'bg-transparent border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-[#1e1e2d]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="characterPreset"
                          checked={selectedPresetId === preset.id}
                          onChange={() => setSelectedPresetId(preset.id)}
                          className="text-[#696cff] focus:ring-0"
                        />
                        <span>{preset.name}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        categoryType === 'positif' 
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' 
                          : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600'
                      }`}>
                        {preset.points > 0 ? `+${preset.points}` : preset.points} Poin
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!selectedStudentId || !selectedPresetId}
                className="w-full py-2.5 bg-[#696cff] hover:bg-[#5f61e6] disabled:bg-gray-200 disabled:dark:bg-gray-800 disabled:text-gray-400 text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#696cff]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Poin Karakter</span>
              </button>
            </form>
          </div>

          {/* Guidelines & Milestones Section */}
          <div className="space-y-6">
            {/* Reward Milestones */}
            <div className={`p-5 rounded-xl border space-y-4 ${
              darkMode ? 'bg-[#15151c] border-[#2d2d3a]' : 'bg-white border-gray-100'
            }`}>
              <h3 className={`text-xs font-extrabold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5`}>
                <Award className="w-4 h-4 animate-bounce" />
                <span>Skema Penghargaan Siswa</span>
              </h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Akumulasi poin karakter positif bulanan secara otomatis memicu pencapaian penghargaan:
              </p>
              
              <div className="space-y-2.5">
                {REWARD_MILESTONES.map((m, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                    darkMode ? 'bg-[#1c1c28] border-[#2d2d3a]' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{m.badge}</span>
                      <span className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{m.name}</span>
                    </div>
                    <span className="font-extrabold text-emerald-500">≥ {m.points} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sanction Milestones */}
            <div className={`p-5 rounded-xl border space-y-4 ${
              darkMode ? 'bg-[#15151c] border-[#2d2d3a]' : 'bg-white border-gray-100'
            }`}>
              <h3 className={`text-xs font-extrabold uppercase tracking-wider text-rose-500 flex items-center gap-1.5`}>
                <AlertTriangle className="w-4 h-4" />
                <span>Tindak Lanjut Pelanggaran</span>
              </h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Akumulasi poin negatif memicu tindakan disiplin dan pembinaan berikut:
              </p>
              
              <div className="space-y-2.5">
                {SANCTION_MILESTONES.map((m, i) => (
                  <div key={i} className={`p-2.5 rounded-lg border text-xs flex flex-col gap-0.5 ${
                    darkMode ? 'bg-[#1c1c28] border-[#2d2d3a]' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-rose-500">{m.name}</span>
                      <span className="text-rose-600 font-extrabold">≤ {m.points} pts</span>
                    </div>
                    <span className="text-[10px] text-gray-400 italic leading-snug">{m.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'logs' && (
        <div className={`p-6 rounded-xl border space-y-4 ${
          darkMode ? 'bg-[#15151c] border-[#2d2d3a]' : 'bg-white border-gray-100'
        }`}>
          {/* Header & Filter riwayat */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#2d2d3a]">
            <div>
              <h3 className={`text-sm font-extrabold tracking-tight uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Jurnal Riwayat Poin Karakter
              </h3>
              <p className="text-xs text-gray-400">Daftar lengkap riwayat pencatatan karakter positif dan negatif siswa</p>
            </div>
            
            {/* Search and Class filtering */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:flex-initial">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full md:w-48 pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#696cff] ${
                    darkMode ? 'bg-[#1e1e2d] border-[#2d2d3a] text-white' : 'bg-white border-gray-200'
                  }`}
                />
              </div>

              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className={`py-1.5 px-3 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#696cff] ${
                  darkMode ? 'bg-[#1e1e2d] border-[#2d2d3a] text-white' : 'bg-white border-gray-200'
                }`}
              >
                <option value="all">Semua Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Riwayat logs */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-[#2d2d3a] text-gray-400' : 'border-gray-100 text-gray-500'} font-bold uppercase tracking-wider`}>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Kegiatan / Pelanggaran</th>
                  <th className="py-3 px-4 text-center">Poin</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2d2d3a]">
                {filteredRawLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      <Info className="w-5 h-5 mx-auto mb-2 text-gray-500" />
                      Tidak ada riwayat pencatatan karakter ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredRawLogs.map((log) => (
                    <tr key={log.id} className={`hover:bg-gray-50/50 dark:hover:bg-[#1a1a24]/30 transition-colors`}>
                      <td className="py-3.5 px-4 font-semibold text-gray-400 whitespace-nowrap">
                        {new Date(log.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold">
                        {log.studentName}
                        <span className="block text-[10px] text-gray-400 font-medium">{log.studentNis}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          darkMode ? 'bg-[#232333] text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                        }`}>{log.className}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${log.type === 'positif' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="font-semibold">{log.description}</span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 rounded ${
                            log.level === 'ringan' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                            log.level === 'sedang' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                            'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                          }`}>{log.level}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-black">
                        <span className={`${log.type === 'positif' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {log.points > 0 ? `+${log.points}` : log.points}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 text-gray-400 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'reports' && (
        <div className={`p-6 rounded-xl border space-y-6 ${
          darkMode ? 'bg-[#15151c] border-[#2d2d3a]' : 'bg-white border-gray-100'
        }`}>
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 dark:border-[#2d2d3a] pb-4">
            <div>
              <h3 className={`text-sm font-extrabold tracking-tight uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Laporan Akumulasi & Penghargaan Karakter
              </h3>
              <p className="text-xs text-gray-400">Total akumulasi positif/negatif, lencana, sanksi, dan tindak lanjut siswa</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:flex-initial">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full md:w-48 pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#696cff] ${
                    darkMode ? 'bg-[#1e1e2d] border-[#2d2d3a] text-white' : 'bg-white border-gray-200'
                  }`}
                />
              </div>

              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className={`py-1.5 px-3 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#696cff] ${
                  darkMode ? 'bg-[#1e1e2d] border-[#2d2d3a] text-white' : 'bg-white border-gray-200'
                }`}
              >
                <option value="all">Semua Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                onClick={handlePrintPDF}
                className="py-1.5 px-4 bg-[#696cff] hover:bg-[#5f61e6] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#696cff]/10"
              >
                <Download className="w-4 h-4" />
                <span>Cetak PDF</span>
              </button>
            </div>
          </div>

          {/* Table Laporan */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-[#2d2d3a] text-gray-400' : 'border-gray-100 text-gray-500'} font-bold uppercase tracking-wider`}>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4 text-center">Poin Positif</th>
                  <th className="py-3 px-4 text-center">Poin Negatif</th>
                  <th className="py-3 px-4 text-center">Total Net</th>
                  <th className="py-3 px-4">Lencana / Reward Bulanan</th>
                  <th className="py-3 px-4">Sanksi / Tindak Lanjut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2d2d3a]">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      Tidak ada data siswa ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1a1a24]/30 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold">
                        {rep.fullName}
                        <span className="block text-[10px] text-gray-400 font-medium">{rep.nis}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold">{rep.className}</td>
                      <td className="py-3.5 px-4 text-center text-emerald-500 font-extrabold">+{rep.positivePoints}</td>
                      <td className="py-3.5 px-4 text-center text-rose-500 font-extrabold">{rep.negativePoints}</td>
                      <td className={`py-3.5 px-4 text-center font-black text-xs ${
                        darkMode ? 'bg-[#181824]' : 'bg-gray-50'
                      }`}>
                        <span className={rep.netPoints >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                          {rep.netPoints > 0 ? `+${rep.netPoints}` : rep.netPoints}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        {rep.rewards.length === 0 ? (
                          <span className="text-gray-400 text-[10px]">-</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {rep.rewards.map((m, i) => (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  darkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                <span>{m.badge}</span>
                                <span>{m.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {rep.sanctions.length === 0 ? (
                          <span className="text-gray-400 text-[10px]">-</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {rep.sanctions.map((m, i) => (
                              <div key={i} className="text-[10px]">
                                <span className="font-extrabold text-rose-500 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>{m.name}</span>
                                </span>
                                <span className="block text-[9px] text-gray-400 italic">{m.action}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
