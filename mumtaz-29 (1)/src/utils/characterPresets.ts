/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CharacterItemPreset {
  id: string;
  name: string;
  points: number;
}

export const POSITIVE_PRESETS = {
  ringan: [
    { id: 'pos-r1', name: 'Berpakaian rapih dan lengkap', points: 2 },
    { id: 'pos-r2', name: 'Mengumpulkan tugas tepat waktu', points: 2 },
    { id: 'pos-r3', name: 'Mengikuti piket dengan baik', points: 3 },
    { id: 'pos-r4', name: 'Mengucap salam dan sopan santun', points: 3 },
    { id: 'pos-r5', name: 'Aktif bertanya di kelas', points: 3 },
    { id: 'pos-r6', name: 'Membantu guru tanpa diminta', points: 3 },
  ] as CharacterItemPreset[],
  sedang: [
    { id: 'pos-s1', name: 'Menjadi petugas upacara', points: 10 },
    { id: 'pos-s2', name: 'Menjadi imam', points: 10 },
    { id: 'pos-s3', name: 'Menjadi ketua kelas', points: 10 },
    { id: 'pos-s4', name: 'Menjadi ketua kegiatan kelas', points: 10 },
    { id: 'pos-s5', name: 'Menjadi bagian organisasi kelas', points: 10 },
    { id: 'pos-s6', name: 'Menjadi juara lomba antar kelas tingkat sekolah', points: 15 },
  ] as CharacterItemPreset[],
  berat: [
    { id: 'pos-b1', name: 'Juara tingkat kecamatan', points: 20 },
    { id: 'pos-b2', name: 'Juara tingkat kota', points: 30 },
    { id: 'pos-b3', name: 'Prestasi di organisasi persyarikatan', points: 30 },
    { id: 'pos-b4', name: 'Menjadi ketua IPM', points: 30 },
    { id: 'pos-b5', name: 'Juara nasional dan mengharumkan nama sekolah', points: 50 },
  ] as CharacterItemPreset[]
};

export const NEGATIVE_PRESETS = {
  ringan: [
    { id: 'neg-r1', name: 'Tidak memakai atribut lengkap', points: -2 },
    { id: 'neg-r2', name: 'Tidak membawa perlengkapan belajar', points: -2 },
    { id: 'neg-r3', name: 'Tidak mengerjakan tugas', points: -4 },
    { id: 'neg-r4', name: 'Makan di kelas tanpa izin', points: -3 },
    { id: 'neg-r5', name: 'Mengganggu teman saat belajar', points: -4 },
    { id: 'neg-r6', name: 'Berbicara saat guru menjelaskan', points: -5 },
    { id: 'neg-r7', name: 'Terlambat masuk kelas', points: -5 },
    { id: 'neg-r8', name: 'Tidak melaksanakan piket', points: -5 },
    { id: 'neg-r9', name: 'Alfa', points: -8 },
  ] as CharacterItemPreset[],
  sedang: [
    { id: 'neg-s1', name: 'Membolos', points: -20 },
    { id: 'neg-s2', name: 'Menyontek', points: -10 },
    { id: 'neg-s3', name: 'Berkata kasar', points: -10 },
    { id: 'neg-s4', name: 'Keluar kelas tanpa izin', points: -15 },
    { id: 'neg-s5', name: 'Merusak fasilitas ringan', points: -15 },
    { id: 'neg-s6', name: 'Membuat keributan yang mengganggu KBM', points: -20 },
    { id: 'neg-s7', name: 'Menggunakan hp tanpa izin', points: -20 },
  ] as CharacterItemPreset[],
  berat: [
    { id: 'neg-b1', name: 'Berkelahi', points: -25 },
    { id: 'neg-b2', name: 'Menampilkan aurat rambut bagi perempuan', points: -25 },
    { id: 'neg-b3', name: 'Perundungan', points: -35 },
    { id: 'neg-b4', name: 'Merusak fasilitas sekolah dengan sengaja', points: -40 },
    { id: 'neg-b5', name: 'Membawa rokok', points: -50 },
    { id: 'neg-b6', name: 'Membawa senjata tajam', points: -55 },
    { id: 'neg-b7', name: 'Mencuri', points: -75 },
    { id: 'neg-b8', name: 'Pelecehan terhadap teman', points: -100 },
    { id: 'neg-b9', name: 'Penyalagunaan narkoba', points: -100 },
  ] as CharacterItemPreset[]
};

export const REWARD_MILESTONES = [
  { points: 50, name: 'Sertifikat Karakter Baik', badge: '🎖️' },
  { points: 100, name: 'Siswa Teladan Bulanan', badge: '🏆' },
  { points: 150, name: 'Lencana Karakter Unggul', badge: '✨' },
  { points: 200, name: 'Penghargaan Khusus dari Kepsek', badge: '👑' },
];

export const SANCTION_MILESTONES = [
  { points: -25, name: 'Teguran', action: 'Teguran Lisan / Pembinaan wali kelas' },
  { points: -50, name: 'Pembinaan', action: 'Pembinaan khusus oleh Guru BK' },
  { points: -75, name: 'Surat Peringatan', action: 'Penerbitan Surat Peringatan (SP 1)' },
  { points: -100, name: 'Pemanggilan Orang Tua', action: 'Pemanggilan Orang Tua / Wali ke sekolah' },
  { points: -200, name: 'Sidang Pembinaan Sekolah', action: 'Sidang khusus dengan Kepala Sekolah dan Komite' },
];
