import {
  Profile,
  School,
  Course,
  CourseEnrollment,
  ClassRoster,
  CourseModule,
  Activity,
  QuizQuestion,
  QuizSubmission,
  StudyGroup,
  AssignmentSubmission,
  Reflection,
  Completion,
} from './types';

export const initialSchool: School = {
  id: 'school-01',
  name: 'SMP Labschool Cendekia',
  license_code: 'SCHOOL-0001',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

export const teacherProfile: Profile = {
  id: 'teacher-01',
  full_name: 'Ahmad Fauzi, S.Pd., M.Kom.',
  role: 'teacher',
  whatsapp_number: '081234567890',
  school_id: 'school-01',
  school_name: 'SMP Labschool Cendekia',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

export const studentProfiles: Profile[] = [
  {
    id: 'student-01',
    full_name: 'Budi Santoso',
    role: 'student',
    whatsapp_number: '085711223344',
    school_id: 'school-01',
    school_name: 'SMP Labschool Cendekia',
    is_active: true,
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'student-02',
    full_name: 'Siti Nurhaliza',
    role: 'student',
    whatsapp_number: '085799887766',
    school_id: 'school-01',
    school_name: 'SMP Labschool Cendekia',
    is_active: true,
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'student-03',
    full_name: 'Dimas Aditya Pratama',
    role: 'student',
    whatsapp_number: '085733445566',
    school_id: 'school-01',
    school_name: 'SMP Labschool Cendekia',
    is_active: true,
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'student-04',
    full_name: 'Rina Oktaviani',
    role: 'student',
    whatsapp_number: '085755667788',
    school_id: 'school-01',
    school_name: 'SMP Labschool Cendekia',
    is_active: true,
    created_at: '2026-01-10T00:00:00Z',
  },
];

export const initialCourses: Course[] = [
  {
    id: 'course-01',
    teacher_id: 'teacher-01',
    teacher_name: 'Ahmad Fauzi, S.Pd., M.Kom.',
    school_id: 'school-01',
    title: 'Informatika VII: Berpikir Komputasional & AI Dasar',
    subject: 'Informatika',
    grade_level: 'Kelas 7',
    class_code: 'INF701',
    description: 'Mempelajari 4 pilar computational thinking, logika pemrograman, dan etika kecerdasan buatan dengan pendekatan pembelajaran mendalam (deep learning).',
    year_term: '2026/2027 Ganjil',
    is_archived: false,
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'course-02',
    teacher_id: 'teacher-01',
    teacher_name: 'Ahmad Fauzi, S.Pd., M.Kom.',
    school_id: 'school-01',
    title: 'Informatika VIII: Jaringan Komputer & Internet Aman',
    subject: 'Informatika',
    grade_level: 'Kelas 8',
    class_code: 'INF802',
    description: 'Eksplorasi topologi jaringan, protokol internet, keamanan data pribadi, dan deteksi phishing.',
    year_term: '2026/2027 Ganjil',
    is_archived: false,
    created_at: '2026-01-08T00:00:00Z',
  },
];

export const initialEnrollments: CourseEnrollment[] = [
  { id: 'enr-01', course_id: 'course-01', student_id: 'student-01', enrolled_via: 'roster', is_active: true, joined_at: '2026-01-10T08:00:00Z' },
  { id: 'enr-02', course_id: 'course-01', student_id: 'student-02', enrolled_via: 'roster', is_active: true, joined_at: '2026-01-10T08:05:00Z' },
  { id: 'enr-03', course_id: 'course-01', student_id: 'student-03', enrolled_via: 'roster', is_active: true, joined_at: '2026-01-10T08:10:00Z' },
  { id: 'enr-04', course_id: 'course-01', student_id: 'student-04', enrolled_via: 'roster', is_active: true, joined_at: '2026-01-10T08:15:00Z' },
];

export const initialRosters: ClassRoster[] = [
  { id: 'ros-01', course_id: 'course-01', nis: '202401', full_name: 'Budi Santoso', sort_order: 1, is_claimed: true, claimed_by_student_id: 'student-01', claimed_at: '2026-01-10T08:00:00Z' },
  { id: 'ros-02', course_id: 'course-01', nis: '202402', full_name: 'Siti Nurhaliza', sort_order: 2, is_claimed: true, claimed_by_student_id: 'student-02', claimed_at: '2026-01-10T08:05:00Z' },
  { id: 'ros-03', course_id: 'course-01', nis: '202403', full_name: 'Dimas Aditya Pratama', sort_order: 3, is_claimed: true, claimed_by_student_id: 'student-03', claimed_at: '2026-01-10T08:10:00Z' },
  { id: 'ros-04', course_id: 'course-01', nis: '202404', full_name: 'Rina Oktaviani', sort_order: 4, is_claimed: true, claimed_by_student_id: 'student-04', claimed_at: '2026-01-10T08:15:00Z' },
  { id: 'ros-05', course_id: 'course-01', nis: '202405', full_name: 'Fajar Ramadhan', sort_order: 5, is_claimed: false },
  { id: 'ros-06', course_id: 'course-01', nis: '202406', full_name: 'Putri Ayu Lestari', sort_order: 6, is_claimed: false },
];

export const initialModules: CourseModule[] = [
  {
    id: 'mod-01',
    course_id: 'course-01',
    title: 'Bab 1: Empat Pilar Berpikir Komputasional',
    description: 'Mengenal Dekomposisi, Pengenalan Pola, Abstraksi, dan Algoritma dalam kehidupan sehari-hari.',
    order_index: 1,
    is_published: true,
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'mod-02',
    course_id: 'course-01',
    title: 'Bab 2: Kolaborasi Proyek & Logika Algoritma',
    description: 'Perancangan alur kerja terstruktur dan pemecahan masalah berkelompok.',
    order_index: 2,
    is_published: true,
    created_at: '2026-01-06T00:00:00Z',
    prerequisites: ['mod-01'],
  },
];

export const initialActivities: Activity[] = [
  {
    id: 'act-01',
    module_id: 'mod-01',
    title: 'Materi: Memahami 4 Pilar Berpikir Komputasional',
    type: 'lesson',
    description: 'Pelajari konsep inti dekomposisi, pola, abstraksi, dan perancangan algoritma.',
    content_markdown: `### Apa itu Berpikir Komputasional (*Computational Thinking*)?

Berpikir komputasional adalah metode pemecahan masalah dengan cara menerapkan prinsip dan teknik komputasi. Metode ini bukan berarti berpikir seperti robot, melainkan melatih cara berpikir logis, runtut, dan terstruktur.

#### 1. Dekomposisi (*Decomposition*)
Memecah masalah yang kompleks atau besar menjadi bagian-bagian yang lebih kecil dan lebih mudah dikelola.
*Contoh:* Saat ingin membuat aplikasi pengingat tugas, kita memecahnya menjadi modul input jadwal, modul alarm/notifikasi, dan modul tampilan kalender.

#### 2. Pengenalan Pola (*Pattern Recognition*)
Mencari kesamaan, keteraturan, atau pola dari masalah-masalah yang pernah kita selesaikan sebelumnya.
*Contoh:* Memperhatikan pola bahwa semua bilangan genap habis dibagi 2.

#### 3. Abstraksi (*Abstraction*)
Memfokuskan perhatian pada informasi penting dan mengabaikan rincian yang tidak relevan.
*Contoh:* Peta jalur transportasi MRT hanya menampilkan rute dan stasiun, tanpa menggambar pohon atau gedung di sepanjang jalan.

#### 4. Algoritma (*Algorithm*)
Menyusun langkah demi langkah secara berurutan dan logis untuk menyelesaikan permasalahan tersebut.

> **Tips Belajar:** Cobalah gunakan 4 pilar ini saat merencanakan kegiatan akhir pekanmu atau menyelesaikan soal matematika rumit!`,
    order_index: 1,
    is_published: true,
    created_at: '2026-01-05T10:00:00Z',
  },
  {
    id: 'act-02',
    module_id: 'mod-01',
    title: 'Kuis Bab 1: Uji Pemahaman 4 Pilar CT',
    type: 'quiz',
    description: '5 soal pilihan ganda untuk menguji pemahaman konsep Berpikir Komputasional.',
    order_index: 2,
    is_published: true,
    due_at: '2026-09-15T23:59:00Z',
    created_at: '2026-01-05T11:00:00Z',
  },
  {
    id: 'act-03',
    module_id: 'mod-01',
    title: 'Refleksi Deep Learning: Metakognisi Pemecahan Masalah',
    type: 'reflection',
    description: 'Luangkan waktu 5 menit untuk merenungkan bagaimana konsep ini dapat membantumu dalam kehidupan nyata.',
    reflection_prompt: 'Dari keempat pilar berpikir komputasional (Dekomposisi, Pola, Abstraksi, Algoritma), pilar mana yang paling sering kamu pakai tanpa disadari? Ceritakan satu contoh nyata dalam rutinitas harianmu!',
    order_index: 3,
    is_published: true,
    created_at: '2026-01-05T12:00:00Z',
  },
  {
    id: 'act-04',
    module_id: 'mod-02',
    title: 'Materi: Algoritma Percabangan & Pengambilan Keputusan',
    type: 'lesson',
    description: 'Memahami bagaimana logika IF-THEN-ELSE bekerja dalam sistem digital.',
    content_markdown: `### Logika Percabangan (Branching)

Dalam kehidupan sehari-hari, kita selalu mengambil keputusan:
*Jika hujan, bawa payung. Jika tidak hujan, pakai kacamata hitam.*

#### Struktur Percabangan Dasar:
\`\`\`text
JIKA kondisi terpenuhi MAKA
    lakukan Aksi 1
SELAIN ITU
    lakukan Aksi 2
\`\`\`

#### Contoh Kasus:
Sistem palang pintu otomatis parkir mall:
- **Kondisi:** Mobil menekan tombol tiket atau sensor RFID terbaca?
- **Jika YA:** Buka palang pintu dan nyalakan lampu hijau.
- **Jika TIDAK:** Palang pintu tetap tertutup.`,
    order_index: 1,
    is_published: true,
    created_at: '2026-01-06T10:00:00Z',
  },
  {
    id: 'act-05',
    module_id: 'mod-02',
    title: 'Tugas Kelompok: Desain Solusi Tempat Sampah Pintar',
    type: 'assignment',
    description: 'Rancanglah diagram alur (flowchart) dan deskripsi sistem untuk tempat sampah otomatis yang memilah sampah organik dan anorganik.',
    content_markdown: `### Petunjuk Kerja Kelompok:
1. Diskusikan bersama anggota timmu mengenai ide tempat sampah pintar (*Smart Trash Bin*).
2. Tentukan bagaimana sensor mendeteksi jenis sampah (organik vs anorganik).
3. Buat bagan alur algoritma (flowchart) menggunakan diagram online (Canva, Draw.io, atau Google Slides).
4. **Hanya Ketua Kelompok** yang dapat mengumpulkan link Google Drive / link dokumen pada halaman ini.
5. Pastikan hak akses file diatur ke **"Anyone with the link can view"**.`,
    assignment_mode: 'group',
    order_index: 2,
    is_published: true,
    due_at: '2026-09-20T23:59:00Z',
    created_at: '2026-01-06T11:00:00Z',
  },
];

export const initialQuizQuestions: QuizQuestion[] = [
  {
    id: 'q-01',
    activity_id: 'act-02',
    question_type: 'single',
    question_text: 'Ketika kamu merencanakan pesta ulang tahun dan membagi tugas menjadi bagian dekorasi, konsumsi, dan undangan, pilar berpikir komputasional apa yang sedang kamu terapkan?',
    options: [
      { key: 'A', text: 'Dekomposisi' },
      { key: 'B', text: 'Pengenalan Pola' },
      { key: 'C', text: 'Abstraksi' },
      { key: 'D', text: 'Algoritma' },
    ],
    correct_keys: ['A'],
    explanation: 'Dekomposisi adalah teknik memecah masalah besar (pesta) menjadi bagian-bagian kecil (dekorasi, konsumsi, undangan).',
    points: 20,
    difficulty: 'easy',
    bloom_taxonomy: 'understand',
    is_active: true,
  },
  {
    id: 'q-02',
    activity_id: 'act-02',
    question_type: 'single',
    question_text: 'Peta rute kereta Commuter Line hanya menampilkan garis stasiun dan jalur transfer tanpa menggambarkan bangunan fisik di jalan raya. Hal ini merupakan contoh dari penerapan pilar:',
    options: [
      { key: 'A', text: 'Dekomposisi' },
      { key: 'B', text: 'Abstraksi' },
      { key: 'C', text: 'Pengenalan Pola' },
      { key: 'D', text: 'Algoritma Sekuensial' },
    ],
    correct_keys: ['B'],
    explanation: 'Abstraksi memusatkan perhatian pada informasi penting (jalur dan nama stasiun) serta mengabaikan rincian yang tidak relevan (gedung/pohon).',
    points: 20,
    difficulty: 'medium',
    bloom_taxonomy: 'apply',
    is_active: true,
  },
  {
    id: 'q-03',
    activity_id: 'act-02',
    question_type: 'single',
    question_text: 'Dokter mengenali bahwa pasien menderita influenza karena melihat gejala demam, batuk, dan pilek yang sama seperti ratusan pasien sebelumnya. Dokter tersebut memanfaatkan:',
    options: [
      { key: 'A', text: 'Pengenalan Pola' },
      { key: 'B', text: 'Abstraksi' },
      { key: 'C', text: 'Dekomposisi' },
      { key: 'D', text: 'Debug Error' },
    ],
    correct_keys: ['A'],
    explanation: 'Pengenalan pola adalah kemampuan melihat kesamaan atau keteraturan dari data masa lalu.',
    points: 20,
    difficulty: 'easy',
    bloom_taxonomy: 'understand',
    is_active: true,
  },
  {
    id: 'q-04',
    activity_id: 'act-02',
    question_type: 'single',
    question_text: 'Langkah-langkah terurut dalam resep membuat mie instan (rebus air -> masukkan mie -> campur bumbu -> sajikan) mencerminkan pilar:',
    options: [
      { key: 'A', text: 'Algoritma' },
      { key: 'B', text: 'Dekomposisi' },
      { key: 'C', text: 'Abstraksi' },
      { key: 'D', text: 'Polimorfisme' },
    ],
    correct_keys: ['A'],
    explanation: 'Algoritma adalah serangkaian instruksi langkah demi langkah yang teratur dan logis.',
    points: 20,
    difficulty: 'easy',
    bloom_taxonomy: 'remember',
    is_active: true,
  },
  {
    id: 'q-05',
    activity_id: 'act-02',
    question_type: 'single',
    question_text: 'Manakah dari pernyataan berikut yang paling tepat mengenai hubungan antara Berpikir Komputasional dan Pemrograman?',
    options: [
      { key: 'A', text: 'Berpikir komputasional hanya berguna jika kita menulis kode program komputer' },
      { key: 'B', text: 'Berpikir komputasional adalah cara berpikir memecahkan masalah sebelum kode program ditulis' },
      { key: 'C', text: 'Keduanya adalah istilah yang sama persis' },
      { key: 'D', text: 'Pemrograman dapat dilakukan tanpa perlu berpikir secara logis' },
    ],
    correct_keys: ['B'],
    explanation: 'Berpikir komputasional melandasi proses formulasi masalah, sedangkan pemrograman adalah salah satu alat implementasi solusinya.',
    points: 20,
    difficulty: 'hard',
    bloom_taxonomy: 'analyze',
    is_active: true,
  },
];

export const initialQuizSubmissions: QuizSubmission[] = [
  {
    id: 'sub-quiz-01',
    activity_id: 'act-02',
    student_id: 'student-01',
    student_name: 'Budi Santoso',
    attempt_no: 1,
    score: 100,
    max_points: 100,
    answers_payload: {
      'q-01': 'A',
      'q-02': 'B',
      'q-03': 'A',
      'q-04': 'A',
      'q-05': 'B',
    },
    results_payload: [
      { question_id: 'q-01', correct: true, selected: 'A', points_earned: 20, max_points: 20 },
      { question_id: 'q-02', correct: true, selected: 'B', points_earned: 20, max_points: 20 },
      { question_id: 'q-03', correct: true, selected: 'A', points_earned: 20, max_points: 20 },
      { question_id: 'q-04', correct: true, selected: 'A', points_earned: 20, max_points: 20 },
      { question_id: 'q-05', correct: true, selected: 'B', points_earned: 20, max_points: 20 },
    ],
    time_taken_seconds: 142,
    status: 'submitted',
    submitted_at: '2026-01-11T14:30:00Z',
  },
  {
    id: 'sub-quiz-02',
    activity_id: 'act-02',
    student_id: 'student-02',
    student_name: 'Siti Nurhaliza',
    attempt_no: 1,
    score: 80,
    max_points: 100,
    answers_payload: {
      'q-01': 'A',
      'q-02': 'B',
      'q-03': 'A',
      'q-04': 'A',
      'q-05': 'A',
    },
    results_payload: [
      { question_id: 'q-01', correct: true, selected: 'A', points_earned: 20, max_points: 20 },
      { question_id: 'q-02', correct: true, selected: 'B', points_earned: 20, max_points: 20 },
      { question_id: 'q-03', correct: true, selected: 'A', points_earned: 20, max_points: 20 },
      { question_id: 'q-04', correct: true, selected: 'A', points_earned: 20, max_points: 20 },
      { question_id: 'q-05', correct: false, selected: 'A', points_earned: 0, max_points: 20 },
    ],
    time_taken_seconds: 210,
    status: 'submitted',
    submitted_at: '2026-01-11T15:10:00Z',
  },
];

export const initialStudyGroups: StudyGroup[] = [
  {
    id: 'grp-01',
    activity_id: 'act-05',
    group_name: 'Kelompok Turing (Inovasi Hijau)',
    leader_id: 'student-01', // Budi Santoso
    leader_name: 'Budi Santoso',
    members: [
      { student_id: 'student-01', full_name: 'Budi Santoso' },
      { student_id: 'student-02', full_name: 'Siti Nurhaliza' },
    ],
  },
  {
    id: 'grp-02',
    activity_id: 'act-05',
    group_name: 'Kelompok Lovelace (Smart IoT)',
    leader_id: 'student-03', // Dimas
    leader_name: 'Dimas Aditya Pratama',
    members: [
      { student_id: 'student-03', full_name: 'Dimas Aditya Pratama' },
      { student_id: 'student-04', full_name: 'Rina Oktaviani' },
    ],
  },
];

export const initialAssignmentSubmissions: AssignmentSubmission[] = [
  {
    id: 'sub-ass-01',
    activity_id: 'act-05',
    group_id: 'grp-01',
    group_name: 'Kelompok Turing (Inovasi Hijau)',
    submission_link: 'https://drive.google.com/file/d/1turing-trash-bin-design/view',
    submission_text: 'Berikut rancangan flowchart pemilahan sampah otomatis menggunakan sensor ultrasonik dan kamera AI sederhana. Logika keputusan menggunakan percabangan IF jenis sampah = organik THEN buka katup kiri ELSE buka katup kanan.',
    grade: 92,
    feedback: 'Kerja sama tim sangat baik! Flowchart rapi dan penanganan kondisi error sensor sudah dipikirkan dengan matang.',
    ai_feedback: 'Draf Analisis AI: Solusi menunjukkan pemahaman abstraksi dan percabangan algoritma yang sangat kuat. Skor rubrik yang disarankan: 90-95.',
    submitted_at: '2026-01-14T09:45:00Z',
  },
];

export const initialReflections: Reflection[] = [
  {
    id: 'ref-01',
    activity_id: 'act-03',
    student_id: 'student-01',
    student_name: 'Budi Santoso',
    reflection_text: 'Saya paling sering memakai Dekomposisi tanpa sadar saat merapikan kamar atau saat mengerjakan PR matematika yang panjang. Rasanya jauh lebih ringan kalau dipecah satu per satu dulu.',
    mood_tracker: 'paham',
    created_at: '2026-01-11T14:40:00Z',
  },
  {
    id: 'ref-02',
    activity_id: 'act-03',
    student_id: 'student-02',
    student_name: 'Siti Nurhaliza',
    reflection_text: 'Pilar abstraksi sangat menarik karena selama ini saya sering bingung karena terlalu memikirkan hal-hal kecil yang sebenarnya tidak penting.',
    mood_tracker: 'tertantang',
    created_at: '2026-01-11T15:20:00Z',
  },
  {
    id: 'ref-03',
    activity_id: 'act-03',
    student_id: 'student-03',
    student_name: 'Dimas Aditya Pratama',
    reflection_text: 'Awalnya agak bingung membedakan antara abstraksi dan pengenalan pola, tapi setelah melihat contoh peta rute kereta saya jadi paham.',
    mood_tracker: 'paham',
    created_at: '2026-01-12T10:00:00Z',
  },
];

export const initialCompletions: Completion[] = [
  { id: 'cmp-01', student_id: 'student-01', activity_id: 'act-01', completed_at: '2026-01-11T14:15:00Z' },
  { id: 'cmp-02', student_id: 'student-01', activity_id: 'act-02', completed_at: '2026-01-11T14:30:00Z' },
  { id: 'cmp-03', student_id: 'student-01', activity_id: 'act-03', completed_at: '2026-01-11T14:40:00Z' },
  { id: 'cmp-04', student_id: 'student-02', activity_id: 'act-01', completed_at: '2026-01-11T14:50:00Z' },
  { id: 'cmp-05', student_id: 'student-02', activity_id: 'act-02', completed_at: '2026-01-11T15:10:00Z' },
  { id: 'cmp-06', student_id: 'student-02', activity_id: 'act-03', completed_at: '2026-01-11T15:20:00Z' },
];
