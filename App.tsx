import React, { useState, useEffect, useRef } from 'react'; 
import{ 
  Sparkles, Brain, Timer, Compass, Trash2, Plus, Check, Lock, 
  BookOpen, Heart, User, Sun, Moon, AlertCircle, ArrowRight, 
  ArrowLeft, CheckSquare, RefreshCw, BarChart2, ShieldAlert,
  Smile, Meh, Frown, Sparkle, Calendar, ListTodo, Activity, Award, HelpCircle
} from 'lucide-react';

const STRESS_LEVELS = [
  { value: 1, label: 'Sangat Tenang (1/10)' },
  { value: 3, label: 'Santai & Terkendali (3/10)' },
  { value: 5, label: 'Sedang / Produktif (5/10)' },
  { value: 8, label: 'Cukup Stres / Lelah (8/10)' },
  { value: 10, label: 'Sangat Kewalahan / Burnout (10/10)' }
];

const INITIAL_TASKS = [
  { id: 't1', title: 'Membaca buku psikologi kognitif', priority: 'Sedang', goal: 'Produktivitas', status: 'todo' },
  { id: 't2', title: 'Olahraga ringan pagi hari selama 15 menit', priority: 'Tinggi', goal: 'Kesehatan prima', status: 'progress' },
  { id: 't3', title: 'Menulis jurnal refleksi harian', priority: 'Rendah', goal: 'Kesehatan mental', status: 'done' }
];

const INITIAL_JOURNALS = [
  {
    id: 'j1',
    category: 'Rasa syukur',
    feeling: 'Tenang',
    date: '2026-06-21',
    text: 'Hari ini bersyukur bisa bangun pagi tanpa merasa cemas. Langkah kecil menyelesaikan tugas pertama membuat saya merasa lebih berdaya.'
  },
  {
    id: 'j2',
    category: 'Curhatan',
    feeling: 'Cemas',
    date: '2026-06-22',
    text: 'Terlalu banyak memikirkan target karir jangka panjang. Agak overthinking malam ini, tapi berusaha memecah masalah menjadi bagian kecil.'
  }
];

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    name: '',
    age: '',
    status: 'Pelajar',
    goals: ['Produktivitas harian'],
    barriers: ['Menunda pekerjaan'],
    badHabits: '',
    goodHabits: '',
    dailyHours: '2',
    stressLevel: 5,
    quitTriggers: '',
    happyActivities: '',
    reward1: 'Minum kopi premium favorit',
    reward2: 'Menonton film/seri favorit tanpa rasa bersalah',
    reward3: 'Trip singkat akhir pekan'
  });

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [streakCount, setStreakCount] = useState(3);
  const [xpPoints, setXpPoints] = useState(120);
  const [focusStreak, setFocusStreak] = useState(2);
  const [dailyMood, setDailyMood] = useState('Tenang');
  const [aiFeedbackMessage, setAiFeedbackMessage] = useState('');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  
  // Tasks state
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskGoal, setNewTaskGoal] = useState('Produktivitas harian');
  const [newTaskPriority, setNewTaskPriority] = useState('Sedang');
  
  // Journal state
  const [journals, setJournals] = useState(INITIAL_JOURNALS);
  const [newJournalText, setNewJournalText] = useState('');
  const [newJournalCategory, setNewJournalCategory] = useState('Curhatan');
  const [newJournalFeeling, setNewJournalFeeling] = useState('Tenang');
  const [isAnalyzingJournal, setIsAnalyzingJournal] = useState(false);
  const [journalAnalysisResult, setJournalAnalysisResult] = useState('');

  // AI Chat state
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Halo! Saya adalah AI Coach personalmu. Saya sudah mempelajari profil, goals, dan hambatan hidupmu. Ada yang ingin kamu diskusikan hari ini mengenai produktivitas atau arah hidup?' }
  ]);

  // Consistency Coach state
  const [isGeneratingConsistency, setIsGeneratingConsistency] = useState(false);
  const [consistencyResult, setConsistencyResult] = useState(null);

  // Focus Timer state
  const [timerMode, setTimerMode] = useState('pomodoro'); // pomodoro, short_break, long_break
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25 mins
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Emergency Modal state
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isGeneratingEmergency, setIsGeneratingEmergency] = useState(false);
  const [emergencyPlan, setEmergencyPlan] = useState('');

  // AI Analysis Results
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');

  // Notification popup emulation
  const [notification, setNotification] = useState(null);

  // ================= GEMINI API CONTEXT-AWARE LLM CALLER WITH EXPONENTIAL BACKOFF =================
  const callGeminiAPI = async (prompt, systemInstruction = "") => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {})
    };

    let delay = 1000;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResponse) {
          setApiErrorMessage(''); // Reset any previous error message
          return textResponse;
        }
        throw new Error("Respon kosong diterima dari server.");
      } catch (error) {
        if (attempt === 4) {
          // Final attempt failed
          console.error("Gemini API call failed after 5 attempts:", error);
          setApiErrorMessage("Terjadi gangguan koneksi dengan AI Coach. Mengaktifkan model pemulihan lokal otomatis.");
          throw error;
        }
        // Exponential backoff wait (1s, 2s, 4s, 8s, 16s)
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  };

  useEffect(() => {
    const alerts = [
      "Hari ini cukup satu langkah kecil. Jangan membebani dirimu terlalu berlebih.",
      "Konsistensi harian jauh lebih bernilai daripada intensitas sesaat.",
      "Kembali ke tujuan utamamu: " + (onboardingData.goals[0] || 'Pertumbuhan diri'),
      "Hambatan '" + (onboardingData.barriers[0] || 'Menunda') + "' hanya tantangan sementara. Kamu bisa melaluinya!"
    ];
    
    const interval = setInterval(() => {
      const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
      setNotification(randomAlert);
      setTimeout(() => setNotification(null), 6000);
    }, 45000);

    return () => clearInterval(interval);
  }, [onboardingData.goals, onboardingData.barriers]);

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            setXpPoints(p => p + 15);
            setFocusStreak(s => s + 1);
            setAiFeedbackMessage("Luar biasa! Sesi fokusmu selesai. Kamu mendapatkan +15 XP! Ambil jeda istirahat sejenak.");
            setTimeout(() => setAiFeedbackMessage(''), 8000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  const toggleGoal = (goal) => {
    setOnboardingData(prev => {
      const isExist = prev.goals.includes(goal);
      const newGoals = isExist ? prev.goals.filter(g => g !== goal) : [...prev.goals, goal];
      return { ...prev, goals: newGoals.length > 0 ? newGoals : [goal] };
    });
  };

  const toggleBarrier = (barrier) => {
    setOnboardingData(prev => {
      const isExist = prev.barriers.includes(barrier);
      const newBarriers = isExist ? prev.barriers.filter(b => b !== barrier) : [...prev.barriers, barrier];
      return { ...prev, barriers: newBarriers.length > 0 ? newBarriers : [barrier] };
    });
  };

  // ================= REAL AI CALL: ONBOARDING SUBMIT =================
  const handleOnboardingSubmit = async () => {
    setIsOnboarded(true);
    setIsGeneratingAnalysis(true);

    const promptText = `
      Buatlah analisis personal yang mendalam, berempati tinggi, dan praktis menggunakan psikologi kognitif perilaku (CBT) berdasarkan data pengguna berikut:
      
      Nama Panggilan: ${onboardingData.name}
      Umur: ${onboardingData.age} tahun
      Status Saat Ini: ${onboardingData.status}
      Goals Utama: ${onboardingData.goals.join(', ')}
      Hambatan Terbesar: ${onboardingData.barriers.join(', ')}
      Kebiasaan buruk yang ingin dihilangkan: ${onboardingData.badHabits || "Belum ditentukan"}
      Kebiasaan baik yang ingin dibangun: ${onboardingData.goodHabits || "Belum ditentukan"}
      Jam harian untuk berkembang: ${onboardingData.dailyHours} jam/hari
      Tingkat stres saat ini: ${onboardingData.stressLevel}/10
      Faktor yang membuat menyerah: ${onboardingData.quitTriggers || "Kelelahan ekstrem"}
      Aktivitas bahagia: ${onboardingData.happyActivities || "Santai sejenak"}
      Reward Level 1: ${onboardingData.reward1}
      Reward Level 2: ${onboardingData.reward2}
      Reward Level 3: ${onboardingData.reward3}

      Berikan tanggapan yang tersusun dengan format Markdown yang indah (gunakan emoji pendukung yang tenang, jangan sertakan tag pembungkus JSON). Berikan poin-poin berikut:
      1. Ringkasan Kondisi Psikologis Pengguna
      2. Hambatan Utama & Pola Tersembunyi yang menghambat perkembangan Anda
      3. Potensi Alami yang belum Anda sadari
      4. Prioritas Perbaikan Mindset & Kebiasaan Hari Ini
      5. Langkah Pertama Konkret (Sangat Kecil & Mudah dilakukan dalam 15 menit)
      6. Rencana Aksi Taktis 30 Hari
      7. Rencana Aksi Strategis 90 Hari
      8. Risiko Kritis yang wajib dihindari agar tidak burnout
    `;

    const systemPrompt = "Anda adalah Coach Pertumbuhan Personal & Arah Hidup AI senior yang bijaksana, bersahabat, terinspirasi oleh pendekatan klinis Calm, Headspace, dan teknik kognitif perilaku (CBT).";

    try {
      const result = await callGeminiAPI(promptText, systemPrompt);
      setAiAnalysis(result);
    } catch (err) {
      // Robust Fallback Model if API key is invalid or fails completely
      const fallbackText = `
        ### ANALISIS KONDISI PERSONAL ANDA (Pemulihan Lokal)
        Halo **${onboardingData.name}**, terima kasih telah mempercayai FuturePath AI. Berdasarkan analisis batin awal kami:

        1. **Peta Hambatan**: Anda menghadapi hambatan **${onboardingData.barriers.join(', ')}** dengan tingkat stres berada di angka **${onboardingData.stressLevel}/10**. Adanya kebiasaan buruk yaitu *"${onboardingData.badHabits || 'menunda-nunda'}"* memperlambat laju produktivitas Anda.
        
        2. **Potensi & Alokasi**: Alokasi waktu sebanyak **${onboardingData.dailyHours} jam per hari** adalah modal awal yang melimpah jika dikelola dengan fokus mikro. Jangkar kesenangan Anda (*"${onboardingData.happyActivities || 'aktivitas bersantai'}"*) adalah kunci pemulihan dopamin alami Anda.

        3. **Rencana Taktis 30 Hari**: Mulailah dengan membangun kebiasaan baik **"${onboardingData.goodHabits || 'baca buku/olahraga'}"** hanya selama 10 menit setiap hari. 
        
        4. **Langkah Pertama Hari Ini**: Kurangi beban kognitif batin Anda. Kerjakan satu tugas paling mudah di papan tugas Anda, lalu berikan diri Anda reward Level 1: *"${onboardingData.reward1}"* sebagai bentuk apresiasi diri.
      `;
      setAiAnalysis(fallbackText);
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      priority: newTaskPriority,
      goal: newTaskGoal,
      status: 'todo'
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    
    setAiFeedbackMessage("Tugas baru ditambahkan! Lakukan langkah kecil ini dengan penuh kesadaran.");
    setTimeout(() => setAiFeedbackMessage(''), 5000);
  };

  const handleCompleteTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t));
    setXpPoints(prev => prev + 10);
    setStreakCount(prev => prev + 1);
    
    const encouragementList = [
      "Kamu berhasil menjaga komitmen hari ini. Fokus pada langkah berikutnya tanpa terburu-buru. +10 XP!",
      "Langkah kecil yang luar biasa! Satu hambatan mental berhasil kamu jinakkan hari ini. +10 XP!",
      "Konsistensi harian terbangun dengan baik. Ingatlah untuk beristirahat tanpa rasa bersalah. +10 XP!"
    ];
    setAiFeedbackMessage(encouragementList[Math.floor(Math.random() * encouragementList.length)]);
    setTimeout(() => setAiFeedbackMessage(''), 8000);
  };

  const handleDeleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAddJournal = (e) => {
    e.preventDefault();
    if (!newJournalText.trim()) return;
    const newEntry = {
      id: Date.now().toString(),
      category: newJournalCategory,
      feeling: newJournalFeeling,
      date: new Date().toISOString().split('T')[0],
      text: newJournalText
    };
    setJournals([newEntry, ...journals]);
    setNewJournalText('');
    setAiFeedbackMessage("Jurnal tersimpan. Menulis membantu menjernihkan pikiran yang kusut.");
    setTimeout(() => setAiFeedbackMessage(''), 4000);
  };

  // ================= REAL AI CALL: JOURNAL ANALYZER =================
  const handleAnalyzeJournal = async () => {
    if (journals.length === 0) return;
    setIsAnalyzingJournal(true);

    const promptText = `
      Uraikan secara mendalam pola emosi, hambatan, dan berikan solusi terapeutik berdasarkan isi jurnal terbaru berikut:
      
      Kategori Jurnal: ${newJournalCategory}
      Perasaan Dominan Pengguna: ${newJournalFeeling}
      Isi Jurnal Terbaru: "${journals[0]?.text}"
      
      Riwayat Jurnal Lainnya:
      ${journals.slice(1).map((j, idx) => `[${j.date}] (${j.category} - ${j.feeling}): ${j.text}`).join('\n')}

      Tolong berikan analisis terformat Markdown bahasa Indonesia yang rapi dengan fokus pada pemecahan masalah (Problem-solving CBT) yang mencakup:
      - Pola Berpikir yang tidak sehat atau berulang (overthinking, cemas, menyalahkan diri)
      - Deteksi Emosi Bawah Sadar
      - Kebiasaan merusak yang menghambat vs Kebiasaan baik yang menyelamatkan
      - 3 Tindakan Korektif Sederhana yang bisa langsung dilakukan sore/malam ini.
    `;

    const systemPrompt = "Anda adalah konselor penulisan ekspresif (expressive writing therapist) yang tenang, berempati tinggi, dan mampu membaca emosi di antara baris teks jurnal.";

    try {
      const result = await callGeminiAPI(promptText, systemPrompt);
      setJournalAnalysisResult(result);
    } catch (err) {
      const fallbackResult = `
        ### HASIL RELEKSI JURNAL (Lokal)
        * **Analisis Mood**: Anda mengekspresikan perasaan **${newJournalFeeling}** dalam kategori **${newJournalCategory}**.
        * **Pola Terdeteksi**: Terdapat ketegangan emosi antara tuntutan tinggi terhadap diri sendiri dan keterbatasan energi fisik harian.
        * **Rekomendasi Utama**: 
          1. Lakukan teknik 'Brain Dump' sebelum tidur (tulis segala kecemasan di kertas, lalu lupakan).
          2. Hindari membandingkan progres Anda dengan kecepatan hidup orang lain di media sosial.
      `;
      setJournalAnalysisResult(fallbackResult);
    } finally {
      setIsAnalyzingJournal(false);
    }
  };

  // ================= REAL AI CALL: CHAT COMPANION =================
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMessage = { sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    const currentQuery = chatInput;
    setChatInput('');
    setIsChatLoading(true);

    const promptText = `
      Pertanyaan/Keluhan Pengguna: "${currentQuery}"
      
      Profil Kontekstual Pengguna saat ini:
      Nama panggilan: ${onboardingData.name}
      Umur: ${onboardingData.age} tahun
      Status: ${onboardingData.status}
      Goals Utama: ${onboardingData.goals.join(', ')}
      Hambatan Terbesar: ${onboardingData.barriers.join(', ')}
      Tingkat Stres Saat Ini: ${onboardingData.stressLevel}/10
      Kebiasaan Buruk: ${onboardingData.badHabits || 'Belum diisi'}
      Kebiasaan Baik: ${onboardingData.goodHabits || 'Belum diisi'}
      Reward Level 1: ${onboardingData.reward1}
      
      Riwayat obrolan sebelumnya:
      ${chatMessages.slice(-4).map(msg => `${msg.sender === 'ai' ? 'Coach' : 'User'}: ${msg.text}`).join('\n')}

      Berikan bimbingan, empati hangat, jawaban ilmiah, serta aksi nyata (practical CBT action steps) dalam Bahasa Indonesia. Tetap singkat, tenang, dan bersahaja.
    `;

    const systemPrompt = `Anda adalah FuturePath AI Coach, sahabat batin yang suportif, solutif, tenang, dan selalu berorientasi pada kemajuan kecil yang konsisten. Panggil pengguna dengan nama panggilan mereka: ${onboardingData.name}.`;

    try {
      const result = await callGeminiAPI(promptText, systemPrompt);
      setChatMessages(prev => [...prev, { sender: 'ai', text: result }]);
    } catch (err) {
      let aiResponse = "";
      if (currentQuery.toLowerCase().includes('tunda') || currentQuery.toLowerCase().includes('prokrastinasi') || currentQuery.toLowerCase().includes('malas')) {
        aiResponse = `Menunda pekerjaan sebenarnya adalah alarm perlindungan dari rasa cemas, ${onboardingData.name}. Cobalah gunakan metode Pomodoro di menu Focus Mode kami selama 25 menit saja sekarang. Fokus pada prosesnya, bukan kesempurnaan hasilnya.`;
      } else {
        aiResponse = `Saya sangat memahami posisi Anda, ${onboardingData.name}. Mari kita hadapi tantangan ini bersama dengan memecahnya menjadi tugas mikro yang bisa diselesaikan hari ini tanpa membuat batin Anda kewalahan.`;
      }
      setChatMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ================= REAL AI CALL: CONSISTENCY COACH =================
  const handleAskConsistencyCoach = async (keluhan) => {
    setIsGeneratingConsistency(true);

    const promptText = `
      Saya sedang terjangkit hambatan mental: "${keluhan}"
      Goals hidup saya: ${onboardingData.goals.join(', ')}
      Hambatan mendasar saya: ${onboardingData.barriers.join(', ')}
      Tingkat stres harian: ${onboardingData.stressLevel}/10
      Reward Level 1: ${onboardingData.reward1}

      Berikan diagnosis psikologis yang singkat, tajam, namun menenangkan, diikuti dengan langkah mikro (Atomic Habits) yang wajib saya lakukan dalam 24 jam ke depan agar konsistensi saya tidak runtuh. Format dengan rapi menggunakan Markdown dalam Bahasa Indonesia.
    `;

    const systemPrompt = "Anda adalah Pelatih Disiplin Kognitif AI yang menganut paham minimalisme taktis dan Atomic Habits untuk membantu mengatasi kemalasan/burnout dengan cepat.";

    try {
      const result = await callGeminiAPI(promptText, systemPrompt);
      setConsistencyResult({ keluhan, output: result });
    } catch (err) {
      let outputText = "";
      switch (keluhan) {
        case 'Malas':
          outputText = `**Penyebab**: Otak Anda mendeteksi ancaman kelelahan berlebih.\n\n**Solusi**: Terapkan Aturan 2 Menit. Buka buku atau letakkan peralatan olahraga Anda sekarang juga. Cukup 2 menit saja untuk merobohkan tembok keengganan awal.\n\n**Target 24 Jam**: Lakukan tepat 1 aksi mikro dari tugas Anda hari ini.`;
          break;
        case 'Overthinking':
          outputText = `**Penyebab**: Terlalu banyak memikirkan hasil akhir dan mengabaikan kendali masa kini.\n\n**Solusi**: Tuliskan semua skenario terburuk Anda di Jurnal Terapi kami, lalu tutup halaman tersebut.\n\n**Target 24 Jam**: Kerjakan 1 tugas kecil berprioritas tinggi tanpa memikirkan apa yang terjadi besok.`;
          break;
        default:
          outputText = `Sistem saraf Anda mendeteksi kejenuhan. Ambil napas dalam, matikan notifikasi media sosial Anda, dan berikan diri Anda hak untuk beristirahat tanpa rasa bersalah sebelum memulai kembali langkah kecil esok hari.`;
      }
      setConsistencyResult({ keluhan, output: outputText });
    } finally {
      setIsGeneratingConsistency(false);
    }
  };

  // ================= REAL AI CALL: EMERGENCY crisis MODE =================
  const handleTriggerEmergency = async () => {
    setShowEmergencyModal(true);
    setIsGeneratingEmergency(true);
    
    const promptText = `
      PENGGUNA MENGALAMI SITUASI KRISIS MENTAL / INGIN MENYERAH ("AKU MAU MENYERAH").
      
      Data Pengguna:
      Nama: ${onboardingData.name}
      Tingkat Stres: ${onboardingData.stressLevel}/10
      Hambatan Terbesar: ${onboardingData.barriers.join(', ')}
      Aktivitas Bahagia: ${onboardingData.happyActivities || "Mendengarkan musik instrumen"}
      Pemicu Menyerah: ${onboardingData.quitTriggers || "Tekanan hidup"}

      Buatlah Protokol Grounding Darurat 10 Menit dalam Bahasa Indonesia yang sangat menenangkan, berempati tinggi, dan bebas dari penghakiman. Struktur respon:
      1. Sapaan hangat dan validasi emosional ("Saraf Anda sedang lelah, dan tidak apa-apa untuk berhenti sejenak").
      2. Latihan fisik grounding 5-4-3-2-1 atau pernapasan diafragma terapeutik secara detail.
      3. Pengingat bahwa kegagalan hari ini bukanlah kegagalan selamanya.
      4. Rencana tindakan nyata selama 10 menit ke depan dengan memanfaatkan aktivitas bahagia mereka: "${onboardingData.happyActivities || 'istirahat tanpa gawai'}".
    `;

    const systemPrompt = "Anda adalah pendamping krisis mental darurat (mental health first aider) yang sangat berhati-hati, menenangkan, hangat, dan ahli meredakan serangan panik atau burnout ekstrem.";

    try {
      const result = await callGeminiAPI(promptText, systemPrompt);
      setEmergencyPlan(result);
    } catch (err) {
      const plan = `
        ### EMERGENCY GROUNDING PROTOCOL (Pemulihan Darurat)
        Tarik napas dalam-dalam... hembuskan perlahan selama 4 detik. Anda aman di sini, **${onboardingData.name}**.
        
        Saraf batin Anda sedang sangat lelah, dan itu adalah reaksi tubuh yang normal atas tekanan sebesar ${onboardingData.stressLevel}/10 yang Anda pikul.
        
        **Latihan Grounding Tubuh 3-2-1**:
        1. **Sentuh 3 objek** bertekstur keras di dekat Anda saat ini. Rasakan suhunya.
        2. **Dengarkan 2 suara** di latar belakang kamar Anda. Amati nadanya.
        3. **Hirup 1 aroma** di sekitar Anda saat ini.
        
        **Aksi Nyata 10 Menit**:
        Tutup semua tab browser pekerjaan Anda sekarang juga. Ambil segelas air hangat, minum perlahan, dan nikmati waktu hening dengan melakukan aktivitas kesenangan Anda: *"${onboardingData.happyActivities || 'istirahat tanpa layar gadget'}"*. Anda telah berjuang dengan sangat baik hari ini.
      `;
      setEmergencyPlan(plan);
    } finally {
      setIsGeneratingEmergency(false);
    }
  };

  const handleStartTimer = () => setTimerActive(true);
  const handlePauseTimer = () => setTimerActive(false);
  const handleResetTimer = () => {
    setTimerActive(false);
    if (timerMode === 'pomodoro') setTimerSeconds(1500);
    else if (timerMode === 'short_break') setTimerSeconds(300);
    else setTimerSeconds(900);
  };

  const getRewardProgress = () => {
    if (xpPoints < 100) return { title: 'Level 1: Menuju Reward 1', percent: Math.round((xpPoints / 100) * 100), nextLvlReward: onboardingData.reward1 };
    if (xpPoints < 250) return { title: 'Level 2: Menuju Reward 2', percent: Math.round(((xpPoints - 100) / 150) * 100), nextLvlReward: onboardingData.reward2 };
    return { title: 'Level 3: Menuju Reward 3', percent: Math.min(100, Math.round(((xpPoints - 250) / 250) * 100)), nextLvlReward: onboardingData.reward3 };
  };

  const rewardInfo = getRewardProgress();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0b0f19] text-[#e2e8f0]' : 'bg-[#f7f9fc] text-[#1e293b]'}`}>
      
      {/* Realtime Ambient Toast Notification Bar */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm p-4 bg-white dark:bg-slate-900 border-l-4 border-indigo-500 rounded-xl shadow-xl animate-bounce flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{notification}</p>
        </div>
      )}

      {/* Header Premium Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b bg-white/70 dark:bg-[#0b0f19]/70 border-slate-100 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => isOnboarded && setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-100 dark:shadow-none">
              FP
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                FuturePath <span className="text-slate-500 dark:text-slate-400 font-normal">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 tracking-widest font-bold uppercase">Personal Growth & Life Direction Coach</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Dark Mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              title="Tukar Mode Gelap/Terang"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Emergency Crisis Button */}
            {isOnboarded && (
              <button
                onClick={handleTriggerEmergency}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 transition flex items-center gap-1.5 shadow-sm"
              >
                <ShieldAlert className="w-3.5 h-3.5 animate-pulse text-rose-500" />
                ✨ Aku Mau Menyerah
              </button>
            )}

            {/* User Badge Profile */}
            {isOnboarded && (
              <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
                  {onboardingData.name ? onboardingData.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold">{onboardingData.name || 'User'}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{onboardingData.status}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Framework Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* API Error Message Alert Banner */}
        {apiErrorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-850 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>{apiErrorMessage}</span>
          </div>
        )}

        {/* ================= ONBOARDING STEPPER WIZARD ================= */}
        {!isOnboarded && (
          <div className="max-w-2xl mx-auto my-6 p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl transition-all relative overflow-hidden">
            {/* Elegant Background Blobs */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-100/30 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-violet-100/30 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-8 relative z-10">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">Mulai Desain Hidupmu</span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-white mt-1">Onboarding Pengenalan Diri</h2>
              <p className="text-slate-400 text-xs mt-1">Kami memetakan batin Anda untuk membangun sistem kerja kognitif anti-burnout.</p>
              
              {/* Stepper Progress Bar */}
              <div className="mt-5 flex space-x-1.5 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                {[1, 2, 3, 4].map((step) => (
                  <div 
                    key={step} 
                    className={`h-full transition-all duration-300 rounded-full ${onboardingStep >= step ? 'bg-indigo-500 w-1/4' : 'bg-transparent w-1/4'}`} 
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-right font-semibold">Langkah {onboardingStep} dari 4</p>
            </div>

            {/* Stepper Wizard Forms */}
            <div className="min-h-[280px] relative z-10 flex flex-col justify-between">
              
              {/* STEP 1: Profil Dasar */}
              {onboardingStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">1. Identitas & Status</h3>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nama Panggilan Anda</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-xs"
                      placeholder="Contoh: Rian"
                      value={onboardingData.name}
                      onChange={(e) => setOnboardingData({...onboardingData, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Umur (Tahun)</label>
                      <input 
                        type="number"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-xs"
                        placeholder="Contoh: 23"
                        value={onboardingData.age}
                        onChange={(e) => setOnboardingData({...onboardingData, age: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status Saat Ini</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-xs text-slate-600 dark:text-slate-300"
                        value={onboardingData.status}
                        onChange={(e) => setOnboardingData({...onboardingData, status: e.target.value})}
                      >
                        {['Pelajar', 'Mahasiswa', 'Karyawan', 'Freelancer', 'Pengusaha', 'Lainnya'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Visi & Hambatan */}
              {onboardingStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">2. Goals Utama & Hambatan Terbesar</h3>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Pilih Goals Utama yang Ingin Dicapai</label>
                    <div className="flex flex-wrap gap-2">
                      {['Bebas finansial', 'Karir cemerlang', 'Bisnis mandiri', 'Kesehatan prima', 'Hubungan hangat', 'Pendidikan tinggi', 'Belajar bahasa asing', 'Produktivitas harian'].map(goal => {
                        const isSelected = onboardingData.goals.includes(goal);
                        return (
                          <button
                            key={goal}
                            type="button"
                            onClick={() => toggleGoal(goal)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isSelected ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                          >
                            {goal}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Hambatan Terbesar Saat Ini</label>
                    <div className="flex flex-wrap gap-2">
                      {['Menunda pekerjaan', 'Overthinking', 'Kurang disiplin', 'Takut gagal', 'Sulit fokus', 'Kurang percaya diri', 'Bingung arah hidup'].map(barrier => {
                        const isSelected = onboardingData.barriers.includes(barrier);
                        return (
                          <button
                            key={barrier}
                            type="button"
                            onClick={() => toggleBarrier(barrier)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isSelected ? 'bg-violet-500 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                          >
                            {barrier}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Kebiasaan & Kapasitas Harian */}
              {onboardingStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">3. Kebiasaan & Batas Stres</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Kebiasaan Buruk ingin dihilangkan</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-xs"
                        placeholder="Contoh: Doomscrolling media sosial"
                        value={onboardingData.badHabits}
                        onChange={(e) => setOnboardingData({...onboardingData, badHabits: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Kebiasaan Baik ingin dibangun</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-xs"
                        placeholder="Contoh: Membaca buku 15 menit & minum air"
                        value={onboardingData.goodHabits}
                        onChange={(e) => setOnboardingData({...onboardingData, goodHabits: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Kapasitas Waktu Perkembangan (Jam/Hari)</label>
                      <input 
                        type="number"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-xs"
                        placeholder="Contoh: 2"
                        value={onboardingData.dailyHours}
                        onChange={(e) => setOnboardingData({...onboardingData, dailyHours: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tingkat Stres Saat Ini</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-xs text-slate-600 dark:text-slate-300"
                        value={onboardingData.stressLevel}
                        onChange={(e) => setOnboardingData({...onboardingData, stressLevel: parseInt(e.target.value)})}
                      >
                        {STRESS_LEVELS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Emosi & Peta Reward */}
              {onboardingStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">4. Penyerah Trigger & Skema Reward</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Penyebab Terbanyak Menyerah</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-xs"
                        placeholder="Contoh: Tidak melihat hasil instan"
                        value={onboardingData.quitTriggers}
                        onChange={(e) => setOnboardingData({...onboardingData, quitTriggers: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Aktivitas Bahagia / Pengisi Energi</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-xs"
                        placeholder="Contoh: Jalan kaki sore tanpa gawai"
                        value={onboardingData.happyActivities}
                        onChange={(e) => setOnboardingData({...onboardingData, happyActivities: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Tentukan Reward Personal berdasarkan Level Target</p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-500 border border-indigo-100 dark:border-indigo-900 shrink-0">LVL 1</span>
                        <input 
                          type="text" 
                          placeholder="Reward Ringan (Misal: Minum kopi favorit)" 
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-300"
                          value={onboardingData.reward1}
                          onChange={(e) => setOnboardingData({...onboardingData, reward1: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950 text-violet-500 border border-violet-100 dark:border-violet-900 shrink-0">LVL 2</span>
                        <input 
                          type="text" 
                          placeholder="Reward Sedang (Misal: Nonton film favorit)" 
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-300"
                          value={onboardingData.reward2}
                          onChange={(e) => setOnboardingData({...onboardingData, reward2: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-fuchsia-50 dark:bg-fuchsia-950 text-fuchsia-500 border border-fuchsia-100 dark:border-fuchsia-900 shrink-0">LVL 3</span>
                        <input 
                          type="text" 
                          placeholder="Reward Tinggi (Misal: Trip singkat akhir pekan)" 
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-300"
                          value={onboardingData.reward3}
                          onChange={(e) => setOnboardingData({...onboardingData, reward3: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div className="mt-8 flex justify-between space-x-4 border-t border-slate-50 dark:border-slate-800/80 pt-4">
                {onboardingStep > 1 ? (
                  <button
                    onClick={() => setOnboardingStep(onboardingStep - 1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 flex items-center gap-1 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Kembali
                  </button>
                ) : (
                  <div />
                )}

                {onboardingStep < 4 ? (
                  <button
                    onClick={() => {
                      if (onboardingStep === 1 && !onboardingData.name.trim()) return;
                      setOnboardingStep(onboardingStep + 1);
                    }}
                    disabled={onboardingStep === 1 && !onboardingData.name.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-1 transition"
                  >
                    Lanjut
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleOnboardingSubmit}
                    className="px-6 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center gap-1.5 shadow-md shadow-indigo-100 dark:shadow-none transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    ✨ Rancang Jalan Hidupku
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ================= MAIN APPLICATION CONTENT ================= */}
        {isOnboarded && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar Navigation */}
            <nav className="lg:col-span-3 flex lg:flex-col gap-1 overflow-x-auto pb-3 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 lg:pr-6 whitespace-nowrap scrollbar-none scroll-smooth">
              <span className="hidden lg:block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 pl-3">Sistem Kemudi</span>
              
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${currentTab === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                <Compass className="w-4 h-4" />
                <span>Dashboard Utama</span>
              </button>

              <button
                onClick={() => setCurrentTab('roadmap')}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${currentTab === 'roadmap' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                <Activity className="w-4 h-4" />
                <span>Roadmap Masa Depan</span>
              </button>

              <button
                onClick={() => setCurrentTab('tasks')}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${currentTab === 'tasks' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                <ListTodo className="w-4 h-4" />
                <span>Smart Task Board</span>
              </button>

              <button
                onClick={() => setCurrentTab('journal')}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${currentTab === 'journal' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Jurnal & Refleksi AI</span>
              </button>

              <button
                onClick={() => setCurrentTab('coach')}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${currentTab === 'coach' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                <Heart className="w-4 h-4" />
                <span>Consistency Coach</span>
              </button>

              <button
                onClick={() => setCurrentTab('focus')}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${currentTab === 'focus' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                <Timer className="w-4 h-4" />
                <span>Focus Mode</span>
              </button>

              <button
                onClick={() => setCurrentTab('chat')}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${currentTab === 'chat' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                <Brain className="w-4 h-4" />
                <span>Konsultasi AI Coach</span>
              </button>

              <button
                onClick={() => setCurrentTab('reviews')}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${currentTab === 'reviews' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                <Calendar className="w-4 h-4" />
                <span>Review Periodik</span>
              </button>

              <button
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${currentTab === 'admin' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Admin Panel</span>
              </button>
            </nav>

            {/* Main Dynamic Viewport */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* Positive Realtime Feedback Banner */}
              {aiFeedbackMessage && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-2xl shadow-lg animate-fadeIn flex items-center space-x-3">
                  <Sparkle className="w-6 h-6 shrink-0 text-amber-300 animate-spin" />
                  <div>
                    <span className="font-extrabold text-[10px] uppercase tracking-widest block">Umpan Balik AI Coach</span>
                    <p className="text-xs font-semibold">{aiFeedbackMessage}</p>
                  </div>
                </div>
              )}

              {/* ================= TAB 1: DASHBOARD ================= */}
              {currentTab === 'dashboard' && (
                <div className="space-y-6">
                  
                  {/* Goal and Streak Header */}
                  <div className="bg-gradient-to-r from-indigo-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">Dashboard Utama</p>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Selamat Datang, {onboardingData.name}!</h2>
                      <p className="text-slate-400 text-xs">
                        Target Utama: <span className="font-bold text-indigo-500">{onboardingData.goals[0] || 'Produktivitas harian'}</span>. Streak saat ini: <span className="font-bold text-amber-500">{streakCount} hari beruntun 🔥</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-center shadow-xs">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Konsistensi</span>
                        <span className="text-lg font-black text-amber-500">{streakCount} Hari</span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-center shadow-xs">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth XP</span>
                        <span className="text-lg font-black text-indigo-500">{xpPoints} XP</span>
                      </div>
                    </div>
                  </div>

                  {/* AI LIFE ANALYSIS REPORT */}
                  <div className="bg-white dark:bg-slate-900 border border-indigo-50/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/20 dark:bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center space-x-2.5 mb-4 justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500">
                          <Brain className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white">AI Comprehensive Life Analysis</h3>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Disusun secara real-time berdasarkan batin Anda oleh Gemini API</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleOnboardingSubmit} 
                        className="text-xs px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950 dark:hover:bg-indigo-900 rounded-xl font-bold flex items-center gap-1 text-indigo-600 dark:text-indigo-400 transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        ✨ Refresh Analisis
                      </button>
                    </div>

                    {isGeneratingAnalysis ? (
                      <div className="py-12 flex flex-col items-center justify-center space-y-3">
                        <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                        <p className="text-xs text-slate-500">AI sedang memformulasikan peta psikologis batin Anda melalui Gemini LLM...</p>
                      </div>
                    ) : aiAnalysis ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line space-y-4">
                        {aiAnalysis}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-xs text-slate-400">Analisis belum siap.</p>
                        <button onClick={handleOnboardingSubmit} className="mt-2 text-xs font-bold text-indigo-500 underline">Generate Analisis Lagi</button>
                      </div>
                    )}
                  </div>

                  {/* Metrics & Mood Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Goal Progress Rates */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Progress Target & Skala Perkembangan</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs font-medium mb-1.5">
                            <span>Target Utama: {onboardingData.goals[0] || 'Produktivitas'}</span>
                            <span className="font-bold text-indigo-500">75%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: '75%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-medium mb-1.5">
                            <span>Target Sekunder: {onboardingData.goals[1] || 'Kesehatan'}</span>
                            <span className="font-bold text-violet-500">40%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-violet-500 h-full rounded-full" style={{ width: '40%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-medium mb-1.5">
                            <span>Mereduksi Hambatan: {onboardingData.barriers[0] || 'Menunda'}</span>
                            <span className="font-bold text-emerald-500">60%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '60%' }} />
                          </div>
                        </div>
                      </div>

                      {/* Reward System Integration */}
                      <div className="mt-6 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/40">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">{rewardInfo.title}</span>
                          <span className="text-xs font-bold text-slate-500">{rewardInfo.percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                          <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full" style={{ width: `${rewardInfo.percent}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Peroleh Growth XP dengan merampungkan aksi harian Anda. Target berikutnya: <span className="font-bold text-slate-600 dark:text-slate-200">"{rewardInfo.nextLvlReward}"</span>
                        </p>
                      </div>
                    </div>

                    {/* Everyday Mood Tracking & Micro Advice */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-xs space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Kondisi Suasana Hati Harian</h4>
                      
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Bagaimana keadaan batinmu hari ini?</p>
                        <div className="grid grid-cols-5 gap-2">
                          {['Stres', 'Cemas', 'Biasa saja', 'Tenang', 'Senang'].map(mood => (
                            <button
                              key={mood}
                              onClick={() => setDailyMood(mood)}
                              className={`p-2 rounded-xl text-[10px] font-bold border transition flex flex-col items-center ${dailyMood === mood ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-transparent text-slate-500'}`}
                            >
                              <span className="text-sm mb-1">
                                {mood === 'Stres' && '😟'}
                                {mood === 'Cemas' && '😰'}
                                {mood === 'Biasa saja' && '😐'}
                                {mood === 'Tenang' && '🧘'}
                                {mood === 'Senang' && '🌞'}
                              </span>
                              <span>{mood}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100/30 dark:border-amber-900/30">
                        <h5 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          Insight AI Hari Ini:
                        </h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          "Fokuslah pada satu langkah kerja selama {onboardingData.dailyHours} jam hari ini sesuai kapasitasmu. Hambatan '{onboardingData.barriers[0]}' dapat diredam dengan mematikan notifikasi gadget Anda selama sesi fokus berlangsung."
                        </p>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* ================= TAB 2: FUTURE ROADMAP ================= */}
              {currentTab === 'roadmap' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                  <div>
                    <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">Navigasi Jalur Perkembangan</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mt-1">Roadmap Pengembangan Diri</h2>
                    <p className="text-slate-400 text-xs">Peta jalur berurutan dari posisi Anda saat ini menuju tujuan besar Anda secara aman dan terukur.</p>
                  </div>

                  {/* Interactive Visual Timeline */}
                  <div className="space-y-6 relative before:absolute before:inset-0 before:left-8 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                    
                    {/* Milestone 1 */}
                    <div className="relative pl-14 group">
                      <div className="absolute left-4 top-1.5 w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all bg-indigo-500 border-indigo-100 dark:border-indigo-950 text-white">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/10 dark:border-indigo-950/20 dark:bg-indigo-950/5 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold text-indigo-500">Bulan 1 (Fase Fondasi)</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">Sedang Dilalui</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white">Menaklukkan "{onboardingData.barriers[0] || 'Menunda Pekerjaan'}"</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Fokus harian Anda adalah mengintegrasikan kebiasaan baik **"{onboardingData.goodHabits || 'Latihan kecil harian'}"** ke dalam rutinitas kerja harian Anda selama {onboardingData.dailyHours} jam.</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">Skill: Disiplin mikro</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">Skill: Regulasi emosi</span>
                        </div>
                      </div>
                    </div>

                    {/* Milestone 2 */}
                    <div className="relative pl-14 group">
                      <div className="absolute left-4 top-1.5 w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-300">
                        <Lock className="w-3 h-3" />
                      </div>
                      <div className="p-5 rounded-2xl border border-slate-105 bg-white dark:border-slate-800 dark:bg-slate-900/50">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold text-slate-400">Bulan 2 (Fase Akselerasi)</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">Terkunci</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Skalabilitas & Pengembangan Target Jangka Menengah</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Mulai mengembangkan kapabilitas dengan mengeliminasi pemicu kegagalan rutinitas dan meluncurkan reward Level 2.</p>
                      </div>
                    </div>

                    {/* Milestone 3 */}
                    <div className="relative pl-14 group">
                      <div className="absolute left-4 top-1.5 w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-300">
                        <Lock className="w-3 h-3" />
                      </div>
                      <div className="p-5 rounded-2xl border border-slate-105 bg-white dark:border-slate-800 dark:bg-slate-900/50">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold text-slate-400">Bulan 3 (Fase Integrasi Visi)</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">Terkunci</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Mencapai Target Utama: "{onboardingData.goals[0]}"</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Menjalankan rencana 90 hari, memonitor peningkatan kompetensi diri, serta merayakan kebebasan makro yang terbangun.</p>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ================= TAB 3: SMART TASK SYSTEM ================= */}
              {currentTab === 'tasks' && (
                <div className="space-y-6">
                  
                  {/* Task Header & Quick Add */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <div>
                      <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">Sistem Tugas Terpadu</span>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-1">Smart Task Board</h2>
                      <p className="text-slate-400 text-xs">Setiap tugas yang Anda kerjakan di sini melatih kekuatan fokus kognitif Anda.</p>
                    </div>

                    {/* Add Form */}
                    <form onSubmit={handleAddTask} className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end border-t border-slate-50 dark:border-slate-800 pt-5">
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Nama Tugas</label>
                        <input 
                          type="text" 
                          required
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Membaca buku psikologi harian..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-850 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Goals Terkait</label>
                        <select
                          value={newTaskGoal}
                          onChange={(e) => setNewTaskGoal(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 focus:outline-none"
                        >
                          {onboardingData.goals.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Prioritas</label>
                        <select
                          value={newTaskPriority}
                          onChange={(e) => setNewTaskPriority(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 focus:outline-none"
                        >
                          {['Rendah', 'Sedang', 'Tinggi'].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          type="submit"
                          className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                          Tambah
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Kanban Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Column 1: Belum Dikerjakan */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
                        <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Belum Dikerjakan
                        </h4>
                        <span className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-[10px] font-bold">
                          {tasks.filter(t => t.status === 'todo').length}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {tasks.filter(t => t.status === 'todo').map(task => (
                          <div key={task.id} className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-850 hover:border-slate-200 transition">
                            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${task.priority === 'Tinggi' ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/30' : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-950/30'}`}>
                              {task.priority}
                            </span>
                            <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{task.title}</h5>
                            
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">{task.goal}</span>
                              <div className="flex items-center space-x-1">
                                <button 
                                  onClick={() => setTasks(tasks.map(t => t.id === task.id ? { ...t, status: 'progress' } : t))}
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest"
                                  title="Mulai Kerjakan"
                                >
                                  Mulai →
                                </button>
                                <button onClick={() => handleDeleteTask(task.id)} className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500 rounded">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: Sedang Dikerjakan */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
                        <h4 className="text-[10px] font-extrabold uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          Sedang Dikerjakan
                        </h4>
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-[10px] font-bold text-amber-500">
                          {tasks.filter(t => t.status === 'progress').length}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {tasks.filter(t => t.status === 'progress').map(task => (
                          <div key={task.id} className="p-4 rounded-2xl bg-amber-50/5 dark:bg-amber-950/10 border border-amber-100/20 dark:border-amber-900/20 hover:border-amber-200 transition">
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                              {task.priority}
                            </span>
                            <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{task.title}</h5>
                            
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">{task.goal}</span>
                              <div className="flex items-center space-x-1">
                                <button 
                                  onClick={() => handleCompleteTask(task.id)}
                                  className="px-2 py-1 rounded bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-0.5 transition"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Selesai
                                </button>
                                <button onClick={() => handleDeleteTask(task.id)} className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500 rounded">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Selesai */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
                        <h4 className="text-[10px] font-extrabold uppercase text-emerald-500 tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Selesai
                        </h4>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-[10px] font-bold text-emerald-500">
                          {tasks.filter(t => t.status === 'done').length}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {tasks.filter(t => t.status === 'done').map(task => (
                          <div key={task.id} className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100 dark:border-slate-850 opacity-60">
                            <h5 className="text-xs font-semibold text-slate-500 line-through leading-relaxed">{task.title}</h5>
                            <p className="text-[10px] text-slate-400 mt-2">Goal: {task.goal}</p>
                            <div className="mt-2 text-right">
                              <span className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-500">Diverifikasi AI ✓</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ================= TAB 4: JOURNAL SYSTEM ================= */}
              {currentTab === 'journal' && (
                <div className="space-y-6">
                  
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                    <div>
                      <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">Penjernih Pikiran & Refleksi</span>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-1">Jurnal Terapi & Refleksi</h2>
                      <p className="text-slate-400 text-xs">Penuangan emosi ke dalam bentuk tulisan (expressive writing) terbukti menurunkan overthinking secara ilmiah.</p>
                    </div>

                    <form onSubmit={handleAddJournal} className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Kategori Jurnal</label>
                          <select
                            value={newJournalCategory}
                            onChange={(e) => setNewJournalCategory(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 focus:outline-none"
                          >
                            {['Curhatan', 'Perasaan hari ini', 'Keberhasilan hari ini', 'Kesalahan diperbaiki', 'Rasa syukur', 'Pelajaran hari ini'].map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Perasaan Dominan</label>
                          <select
                            value={newJournalFeeling}
                            onChange={(e) => setNewJournalFeeling(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 focus:outline-none"
                          >
                            {['Lelah', 'Cemas', 'Biasa Saja', 'Tenang', 'Senang', 'Semangat', 'Marah'].map(f => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Isi Jurnal Anda</label>
                        <textarea
                          required
                          rows={4}
                          value={newJournalText}
                          onChange={(e) => setNewJournalText(e.target.value)}
                          placeholder="Hari ini saya merasa agak kewalahan dengan rutinitas, tapi saya mencoba fokus ke satu hal..."
                          className="w-full p-4 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        Simpan Jurnal Pertumbuhan
                      </button>
                    </form>
                  </div>

                  {/* AI Analyzer Card */}
                  <div className="bg-gradient-to-tr from-[#faf8ff] to-[#f4f0ff] dark:from-slate-900 dark:to-indigo-950/20 border border-violet-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <Sparkles className="w-5 h-5 text-indigo-500" />
                          AI Emotional & Journal Analyzer
                        </h3>
                        <p className="text-xs text-slate-400">Analisis pola kecemasan, emosi dominan, dan tindakan korektif secara instan oleh Gemini API.</p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAnalyzeJournal}
                        disabled={isAnalyzingJournal || journals.length === 0}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                      >
                        {isAnalyzingJournal && <div className="w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                        ✨ Analisis Jurnal
                      </button>
                    </div>

                    {journalAnalysisResult ? (
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-violet-100 dark:border-slate-800 text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                        {journalAnalysisResult}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-violet-100 dark:border-slate-800/80 rounded-2xl bg-white/50 dark:bg-slate-950/10">
                        <p className="text-xs text-slate-400">Tekan tombol di atas untuk membedah riwayat curahan batin Anda secara aman.</p>
                      </div>
                    )}
                  </div>

                  {/* Journal History */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Riwayat Jurnal Refleksi</h3>
                    
                    <div className="space-y-4">
                      {journals.map(entry => (
                        <div key={entry.id} className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-850">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-extrabold text-indigo-500 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40">
                                {entry.category}
                              </span>
                              <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold">{entry.date}</span>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              Mood: {entry.feeling}
                            </span>
                          </div>
                          <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed whitespace-pre-line">{entry.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ================= TAB 5: CONSISTENCY COACH ================= */}
              {currentTab === 'coach' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                  <div>
                    <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">Penanganan Prokrastinasi</span>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-1">Consistency Coach & Anti-Malas</h2>
                    <p className="text-slate-400 text-xs">Pilih hambatan emosional utama yang sedang melanda batin Anda detik ini.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['Malas', 'Bosan', 'Ingin menyerah', 'Overthinking', 'Takut gagal', 'Tidak fokus', 'Kehilangan arah'].map(keluhan => (
                      <button
                        key={keluhan}
                        type="button"
                        onClick={() => handleAskConsistencyCoach(keluhan)}
                        disabled={isGeneratingConsistency}
                        className="p-3 text-xs font-bold rounded-2xl border border-slate-100 hover:border-indigo-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-750 dark:bg-slate-950/30 text-slate-700 dark:text-slate-300 text-center transition"
                      >
                        ✨ Hambatan: {keluhan}
                      </button>
                    ))}
                  </div>

                  {isGeneratingConsistency ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                      <p className="text-xs text-slate-500">AI Coach sedang meramu obat kognitif untuk Anda...</p>
                    </div>
                  ) : consistencyResult ? (
                    <div className="p-6 rounded-2xl bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/40 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Solusi Taktis: "{consistencyResult.keluhan}"</h3>
                      </div>
                      <div className="text-xs leading-relaxed text-slate-650 dark:text-slate-300 whitespace-pre-line space-y-3">
                        {consistencyResult.output}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-950/10">
                      <p className="text-xs text-slate-400">Pilih salah satu kendala emosional di atas untuk membongkar solusinya secara terukur.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ================= TAB 6: FOCUS TIMER ================= */}
              {currentTab === 'focus' && (
                <div className="bg-gradient-to-tr from-[#faf8ff] to-[#f4f0ff] dark:from-slate-900 dark:to-indigo-950/20 border border-violet-100 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm text-center space-y-6">
                  <div>
                    <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">Sesi Deep Work Minimalis</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mt-1">Pomodoro Focus Timer</h2>
                    <p className="text-slate-400 text-xs">Menyingkirkan distraksi digital secara visual. Latih ketahanan kognitif Anda.</p>
                  </div>

                  {/* Mode Selector */}
                  <div className="inline-flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 gap-1">
                    {[
                      { key: 'pomodoro', label: 'Fokus Kerja (25m)', sec: 1500 },
                      { key: 'short_break', label: 'Jeda Pendek (5m)', sec: 300 },
                      { key: 'long_break', label: 'Jeda Panjang (15m)', sec: 900 }
                    ].map(mode => (
                      <button
                        key={mode.key}
                        type="button"
                        onClick={() => {
                          setTimerMode(mode.key);
                          setTimerSeconds(mode.sec);
                          setTimerActive(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${timerMode === mode.key ? 'bg-indigo-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {/* Clock face */}
                  <div className="relative py-6">
                    <h3 className="text-6xl sm:text-8xl font-black tracking-tight text-slate-850 dark:text-white font-mono select-none">
                      {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}
                      <span className="text-indigo-400 animate-pulse">:</span>
                      {(timerSeconds % 60).toString().padStart(2, '0')}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Target Sesi Terselesaikan Minggu Ini: <span className="text-indigo-500">{focusStreak} kali</span></p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center space-x-3">
                    {timerActive ? (
                      <button
                        type="button"
                        onClick={handlePauseTimer}
                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs"
                      >
                        Jeda Sementara
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartTimer}
                        className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition shadow-xs"
                      >
                        Mulai Sesi Fokus
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleResetTimer}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-xs font-semibold text-slate-500 transition"
                    >
                      Reset
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 max-w-md mx-auto leading-relaxed">
                    Setiap menyelesaikan sesi fokus penuh, Anda berhak memperoleh tambahan **+15 XP Growth Points** untuk mempercepat pencapaian reward pribadi Anda.
                  </p>
                </div>
              )}

              {/* ================= TAB 7: AI CHAT COMPANION ================= */}
              {currentTab === 'chat' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col h-[550px] overflow-hidden">
                  
                  {/* Chat Companion Header */}
                  <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center space-x-3 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">AI Personal Growth Coach</h3>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-widest">Chatbot Interaktif Berbasis Profil Batin Anda</p>
                    </div>
                  </div>

                  {/* Messages container */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((msg, i) => {
                      const isAi = msg.sender === 'ai';
                      return (
                        <div key={i} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${isAi ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' : 'bg-indigo-500 text-white shadow-2xs'}`}>
                            {isAi && <span className="block text-[10px] font-extrabold uppercase tracking-widest text-indigo-500 mb-1">AI Coach</span>}
                            <p className="whitespace-pre-line">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}

                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl flex items-center space-x-1.5">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-55 dark:border-slate-800 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Tanyakan penanganan stres, manajemen waktu, kebiasaan..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || !chatInput.trim()}
                      className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition"
                    >
                      ✨ Tanya Coach
                    </button>
                  </form>

                </div>
              )}

              {/* ================= TAB 8: PERIODIC REVIEWS ================= */}
              {currentTab === 'reviews' && (
                <div className="space-y-6">
                  
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                    <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">Evaluasi Menyeluruh</span>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-1">Review Mingguan & Bulanan</h2>
                    <p className="text-slate-400 text-xs">Evaluasi terintegrasi untuk melihat apakah aksi harianmu telah selaras dengan visi besarmu.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      
                      {/* Weekly Card */}
                      <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-500">Minggu Ini</span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-500 border border-indigo-100/50">TERLAKSANA</span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-white">Progres & Konsistensi Kerja</h3>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Anda berhasil menjaga tingkat konsistensi sebesar <span className="font-bold text-indigo-500">{streakCount} hari beruntun</span>. Hambatan dominan yang perlu dimitigasi minggu depan adalah: <span className="font-semibold text-slate-700 dark:text-slate-300">Overthinking & kecenderungan doomscrolling</span> yang dilaporkan di jurnal Anda.
                        </p>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-extrabold uppercase text-indigo-500">Rekomendasi Minggu Depan:</span>
                          <p className="text-[10px] text-slate-400 mt-1">"Bagi pekerjaan besar menjadi tugas berdurasi maksimal 20 menit saja untuk meminimalkan beban kognitif."</p>
                        </div>
                      </div>

                      {/* Monthly Card */}
                      <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-violet-500">Bulan Ini</span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950 text-violet-500 border border-violet-100/50">DALAM PROSES</span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-white">Pencapaian Target Karir / Pendidikan</h3>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Perkembangan target utama Anda telah menyentuh angka 75%. Untuk sisa bulan ini, prioritaskan perbaikan mindset menyangkut <span className="font-semibold text-violet-500">'{onboardingData.barriers[0]}'</span> demi membuka kunci Roadmap Tahapan 2.
                        </p>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-extrabold uppercase text-violet-500">Prioritas Aksi 30 Hari:</span>
                          <p className="text-[10px] text-slate-400 mt-1">"Buka kunci reward Level 2 Anda ({onboardingData.reward2}) setelah merampungkan minimal 15 tugas di board."</p>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}

              {/* ================= TAB 9: ADMIN PANEL ================= */}
              {currentTab === 'admin' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                  <div>
                    <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">Dashboard Monitoring</span>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-1">Simulasi Admin Panel</h2>
                    <p className="text-slate-400 text-xs">Pantau metrik penggunaan sistem FuturePath secara keseluruhan.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Pengguna</span>
                      <span className="text-lg font-extrabold text-slate-800 dark:text-white">14,204</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">AI Usage Token</span>
                      <span className="text-lg font-extrabold text-slate-800 dark:text-white">1,249,582</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Subscription Rate</span>
                      <span className="text-lg font-extrabold text-slate-800 dark:text-white">12.4%</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">System Latency</span>
                      <span className="text-lg font-extrabold text-emerald-500">140ms</span>
                    </div>
                  </div>

                  {/* Simulated Activity Stream */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Log Aktivitas Server Terbaru</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {[
                        { time: 'Baru saja', event: 'Generate AI Life Analysis untuk User: ' + onboardingData.name },
                        { time: '2 menit lalu', event: 'User ID 4038 menyelesaikan Sesi Pomodoro Deep Work' },
                        { time: '5 menit lalu', event: 'Pembayaran Premium SaaS bulanan berhasil - ID 942' },
                        { time: '10 menit lalu', event: 'Log Jurnal Terapi AI dianalisis - Status Positif' }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850">
                          <span className="text-slate-600 dark:text-slate-300">{item.event}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* ================= EMERGENCY MODE DRAWER MODAL ================= */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-rose-100 dark:border-rose-950/50 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Soft decorative background shape */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-rose-200/20 dark:bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-500">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Emergency Grounding Mode</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold text-rose-500">Disediakan khusus untuk melepaskan letupan kecemasan mental</p>
              </div>
            </div>

            {isGeneratingEmergency ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 rounded-full border-4 border-rose-200 border-t-rose-600 animate-spin" />
                <p className="text-xs text-rose-500 font-semibold">Mempersiapkan teknik grounding penenang pikiran dari Gemini...</p>
              </div>
            ) : emergencyPlan ? (
              <div className="space-y-4">
                <div className="text-xs leading-relaxed text-slate-650 dark:text-slate-300 whitespace-pre-line bg-rose-50/10 dark:bg-rose-950/10 p-5 rounded-2xl border border-rose-100/45 dark:border-rose-900/30">
                  {emergencyPlan}
                </div>
                
                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setXpPoints(prev => prev + 5);
                      setShowEmergencyModal(false);
                    }}
                    className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    Saya Sudah Lebih Tenang
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmergencyModal(false)}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-500 text-xs font-semibold rounded-xl transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400">Gagal memuat rencana grounding batin.</p>
                <button type="button" onClick={handleTriggerEmergency} className="mt-2 text-xs font-bold text-rose-500 underline">Coba Lagi</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 mt-12 border-t border-slate-100 dark:border-slate-850 text-center space-y-2 text-[10px] text-slate-400 tracking-wider uppercase font-bold">
        <p>© 2026 FuturePath AI - Personal Growth & Life Direction Coach.</p>
        <p className="text-slate-500 dark:text-slate-600">Konsistensi mikro menghasilkan kebebasan makro. Satu langkah kecil setiap hari.</p>
      </footer>

    </div>
  );
}
