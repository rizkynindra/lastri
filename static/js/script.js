// Initial mock configurations matching React
const mockCitizenProfile = {
  nama: "LAS TRI WULANDARI",
  nik: "3174075207880001",
  nomorPeserta: "16091234XXXXXXXX",
  tanggalLahir: "12/07/1988",
  statusPeserta: "Non Aktif (Berhenti Bekerja)",
  tanggalBerhenti: "15 Mei 2024",
  masaKepesertaan: "5 Tahun 8 Bulan",
};

const stepsData = [
  { id: 1, title: "Kebutuhan Anda", subtitle: "Peserta ingin tahu manfaat setelah berhenti bekerja" },
  { id: 2, title: "Validasi Data", subtitle: "Unggah KTP dan Kartu Peserta" },
  { id: 3, title: "Validasi Lanjutan", subtitle: "LASTRI membaca dan memvalidasi data Anda" },
  { id: 4, title: "Rekomendasi Program", subtitle: "Menentukan program yang dapat diajukan" },
  { id: 5, title: "Panduan Pengajuan", subtitle: "Memberikan arahan cara pengajuan klaim" },
  { id: 6, title: "Selesai", subtitle: "Proses edukasi dan simulasi tuntas" }
];

// Application State
const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
let activeMode = 'welcome'; // 'welcome' or 'chat'
let walkthroughActive = false;
let walkthroughStep = 0;
let currentStepperStep = 1;
let messages = [];
let isAiTyping = false;
let validatedProfile = null;
let selectedProgram = null;
let estimatedBalance = null;

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const chatWorkspace = document.getElementById('chat-workspace');
const welcomeInput = document.getElementById('welcome-input');
const welcomeSendBtn = document.getElementById('welcome-send-btn');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const messagesContainer = document.getElementById('messages-container');
const walkthroughBanner = document.getElementById('walkthrough-banner');
const walkthroughStepBadge = document.getElementById('walkthrough-step-badge');
const walkthroughInstructionText = document.getElementById('walkthrough-instruction-text');
const instantUploadBtn = document.getElementById('instant-upload-btn');
const stepperList = document.getElementById('stepper-list');
const summaryCard = document.getElementById('summary-card');
const summaryTitle = document.getElementById('summary-title');
const summaryFields = document.getElementById('summary-fields');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuIcon = document.getElementById('mobile-menu-icon');
const fileUploader = document.getElementById('file-uploader');

// Helper function to format time (e.g. "15.42")
function getFormattedTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}.${minutes}`;
}

// Initialize UI
function init() {
  // Mobile menu toggle
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    const isClosed = mobileMenu.classList.contains('hidden');
    mobileMenuIcon.setAttribute('data-lucide', isClosed ? 'menu' : 'x');
    lucide.createIcons();
  });

  // Input button state listener (Welcome Screen)
  welcomeInput.addEventListener('input', () => {
    const hasText = welcomeInput.value.trim().length > 0;
    welcomeSendBtn.disabled = !hasText;
    if (hasText) {
      welcomeSendBtn.className = "p-2.5 rounded-lg transition-all bg-blue-600 text-white hover:bg-blue-700 active:scale-95 cursor-pointer shadow-lg shadow-blue-600/20";
    } else {
      welcomeSendBtn.className = "p-2.5 rounded-lg transition-all bg-slate-200 text-slate-400 cursor-not-allowed";
    }
  });

  welcomeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSendWelcome();
  });
  welcomeSendBtn.addEventListener('click', handleSendWelcome);

  // Input button state listener (Chat Screen)
  chatInput.addEventListener('input', () => {
    const hasText = chatInput.value.trim().length > 0;
    chatSendBtn.disabled = !hasText;
    if (hasText) {
      chatSendBtn.className = "p-2.5 rounded-lg transition-all bg-blue-600 text-white hover:bg-blue-700 active:scale-95 cursor-pointer shadow-lg shadow-blue-600/25";
    } else {
      chatSendBtn.className = "p-2.5 rounded-lg transition-all bg-slate-200 text-slate-400 cursor-not-allowed";
    }
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSendChat();
  });
  chatSendBtn.addEventListener('click', handleSendChat);

  // Click handlers for quick replies
  document.querySelectorAll('.quick-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.getAttribute('data-reply');
      const isWT = btn.getAttribute('data-walkthrough') === 'true';
      handleStartChat(query, isWT);
    });
  });

  // Paperclip prompts
  document.getElementById('welcome-attach-prompt').addEventListener('click', () => {
    handleStartChat("Saya baru saja berhenti bekerja dan ingin tahu dana yang bisa saya dapatkan", true);
  });

  document.getElementById('chat-attach-btn').addEventListener('click', handleAttachDocuments);
  instantUploadBtn.addEventListener('click', handleAttachDocuments);
  fileUploader.addEventListener('change', handleFilesSelected);

  // Reset session
  document.getElementById('reset-session-btn').addEventListener('click', handleResetSession);

  // Render initial view
  render();
}

// Handler for sending from the Welcome screen
function handleSendWelcome() {
  const text = welcomeInput.value.trim();
  if (text) {
    const isWT = text.toLowerCase().includes("berhenti bekerja") || text.toLowerCase().includes("klaim");
    handleStartChat(text, isWT);
    welcomeInput.value = "";
    welcomeSendBtn.disabled = true;
    welcomeSendBtn.className = "p-2.5 rounded-lg transition-all bg-slate-200 text-slate-400 cursor-not-allowed";
  }
}

// Handler for sending from the Chat screen input
function handleSendChat() {
  const text = chatInput.value.trim();
  if (text) {
    handleSendMessage(text);
    chatInput.value = "";
    chatSendBtn.disabled = true;
    chatSendBtn.className = "p-2.5 rounded-lg transition-all bg-slate-200 text-slate-400 cursor-not-allowed";
  }
}

// Switch to Chat mode
function handleStartChat(initialText, isWalkthrough) {
  activeMode = 'chat';
  messages = [];
  validatedProfile = null;
  selectedProgram = null;
  estimatedBalance = null;

  if (isWalkthrough) {
    walkthroughActive = true;
    walkthroughStep = 1;
    currentStepperStep = 1;

    const userMsg = {
      id: "wt-usr-1",
      sender: 'user',
      text: initialText,
      time: getFormattedTime()
    };
    messages.push(userMsg);
    isAiTyping = true;
    render();

    setTimeout(() => {
      const lastriReply = {
        id: "wt-lst-1",
        sender: 'lastri',
        text: "Halo! Terima kasih sudah menghubungi saya 😊\n\nUntuk mengetahui hak manfaat dan estimasi nominal yang bisa Anda dapatkan, saya perlu memvalidasi data Anda terlebih dahulu ya.\n\nSilakan unggah dokumen berikut:\n📄 1. KTP (Kartu Tanda Penduduk)\n💳 2. Kartu Peserta / KPJ",
        time: getFormattedTime()
      };
      messages.push(lastriReply);
      isAiTyping = false;
      walkthroughStep = 2;
      currentStepperStep = 2;
      render();
    }, 1500);

  } else {
    walkthroughActive = false;
    walkthroughStep = 0;
    currentStepperStep = 1;

    const userMsg = {
      id: `free-usr-${Date.now()}`,
      sender: 'user',
      text: initialText,
      time: getFormattedTime()
    };
    messages.push(userMsg);
    isAiTyping = true;
    render();

    handleFreeChatRequest(initialText, []);
  }
}

// Main message dispatch
function handleSendMessage(text) {
  const userMsg = {
    id: `usr-${Date.now()}`,
    sender: 'user',
    text: text,
    time: getFormattedTime()
  };
  messages.push(userMsg);
  isAiTyping = true;
  render();

  if (walkthroughActive) {
    // If in walkthrough mode, type hint reply to guide them
    setTimeout(() => {
      let replyText = "";
      if (walkthroughStep === 2) {
        replyText = "Silakan klik ikon paperclip (Klip Kertas) di bawah atau tekan tombol panduan untuk melampirkan berkas dokumen simulasi (KTP & Kartu Peserta) terlebih dahulu.";
      } else if (walkthroughStep === 4) {
        replyText = "Silakan gunakan pilihan program (JHT, JKP, JP) yang tampil di layar di atas untuk melanjutkan pengajuan.";
      } else {
        replyText = "Terima kasih atas pesannya. Skenario panduan aktif sedang disiapkan. Anda dapat menekan 'Mulai Baru' di atas jika ingin tanya bebas dengan AI.";
      }

      const lastriReply = {
        id: `wt-hint-${Date.now()}`,
        sender: 'lastri',
        text: replyText,
        time: getFormattedTime()
      };
      messages.push(lastriReply);
      isAiTyping = false;
      render();
    }, 1200);
  } else {
    // Normal free chat request
    handleFreeChatRequest(text, messages.slice(0, -1));
  }
}

// Connect to Flask Gemini API
async function handleFreeChatRequest(text, currentHistory, files = []) {
  try {
    const formattedHistory = currentHistory.map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: formattedHistory, sessionId: sessionId, files: files })
    });

    const data = await response.json();
    isAiTyping = false;

    if (data.error) {
      throw new Error(data.message || data.error);
    }

    // Save validationResult if n8n returns it in free chat
    const isKpjUpload = validatedProfile !== null;
    if (data.validationResult) {
      validatedProfile = data.validationResult;
    }

    const lastriReply = {
      id: `free-lst-${Date.now()}`,
      sender: 'lastri',
      text: data.text || "Bagian ini belum di setting",
      time: getFormattedTime(),
      validationResult: data.validationResult || null
    };
    messages.push(lastriReply);
    render();

    // If KTP validated in free chat, ask for KPJ
    if (data.validationResult && text === "validate_docs" && !isKpjUpload) {
      isAiTyping = true;
      render();

      setTimeout(() => {
        messages.push({
          id: `upload-kpj-free-${Date.now()}`,
          sender: 'lastri',
          text: 'Silakan upload KPJ Anda untuk melanjutkan proses verifikasi.',
          time: getFormattedTime()
        });
        isAiTyping = false;
        render();
      }, 1500);
    }
  } catch (err) {
    console.warn("API Error, playing automated client fallback:", err);
    isAiTyping = false;

    const fallbackText =
      `Terima kasih atas pertanyaannya. Sebagai informasi awal, program jaminan utama BPJS Ketenagakerjaan adalah:\n` +
      `• **Jaminan Hari Tua (JHT)**: Tabungan pensiun yang cair saat berhenti kerja / masuk usia 56.\n` +
      `• **Jaminan Kehilangan Pekerjaan (JKP)**: Manfaat dana tunai & pelatihan bagi korban PHK.\n` +
      `• **Jaminan Pensiun (JP)**: Pembayaran tunai bulanan bagi masa tua.\n\n` +
      `Guna melihat estimasi nominal secara tepat, Anda dapat mencoba skenario interaktif kami dengan melampirkan berkas dokumen uji coba.`;

    const lastriReply = {
      id: `fallback-${Date.now()}`,
      sender: 'lastri',
      text: fallbackText,
      time: getFormattedTime()
    };
    messages.push(lastriReply);
  }
  render();
}

// Attach Documents trigger
function handleAttachDocuments() {
  fileUploader.click();
}

// Handle selected files
async function handleFilesSelected(e) {
  const selectedFiles = e.target.files;
  if (!selectedFiles || selectedFiles.length === 0) return;

  const formData = new FormData();
  for (let i = 0; i < selectedFiles.length; i++) {
    formData.append('files', selectedFiles[i]);
  }

  // Add temporary loading indicator to the chat view
  isAiTyping = true;
  const uploadingMsg = {
    id: `uploading-${Date.now()}`,
    sender: 'lastri',
    text: "Mengunggah berkas dokumen Anda...",
    time: getFormattedTime()
  };
  messages.push(uploadingMsg);
  render();

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();

    // Remove the temporary loading indicator
    messages = messages.filter(m => m.id !== uploadingMsg.id);
    isAiTyping = false;

    if (data.error || !data.files || data.files.length === 0) {
      throw new Error(data.error || "No files uploaded");
    }

    const uploadedFiles = data.files; // array of { name, original_name, size, type, url }

    // Process attachments depending on mode
    if (walkthroughActive && walkthroughStep === 2) {
      // Walkthrough attachments progress (Step 2 -> Step 3)
      const userAttachMsg = {
        id: "wt-attach-usr",
        sender: "user",
        text: "Baik Lastri, berikut saya lampirkan dokumennya.",
        time: getFormattedTime(),
        attachments: uploadedFiles
      };

      messages.push(userAttachMsg);
      isAiTyping = true;
      walkthroughStep = 3;
      currentStepperStep = 3;
      render();

      // Add a loading message to show we are reading/validating
      const intermediateMsg = {
        id: "wt-lst-loading",
        sender: 'lastri',
        text: "Terima kasih, dokumen Anda sedang saya baca dan validasi...",
        time: getFormattedTime()
      };
      messages.push(intermediateMsg);
      render();

      // Call the backend to hit the n8n webhook and perform OCR validation
      // Determine if we are uploading KTP or KPJ based on whether validatedProfile is already set
      const isKpjUpload = validatedProfile !== null;

      try {
        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: "validate_docs",
            history: [],
            sessionId: sessionId,
            files: uploadedFiles
          })
        });

        const chatData = await chatRes.json();

        // Remove the temporary loader
        messages = messages.filter(m => m.id !== "wt-lst-loading");

        // Extract validationResult from the response, fall back to mock if not provided
        validatedProfile = chatData.validationResult || validatedProfile || mockCitizenProfile;

        if (isKpjUpload) {
          // KPJ upload complete: proceed to Step 4
          const successValidationMsg = {
            id: "wt-lst-success-card",
            sender: 'lastri',
            text: chatData.text || "Terima kasih, Kartu Peserta (KPJ) Anda berhasil divalidasi. 😊",
            time: getFormattedTime(),
            validationResult: validatedProfile,
            programOptions: [
              { id: "jht", title: "Jaminan Hari Tua (JHT)" },
              { id: "jkp", title: "Jaminan Kehilangan Pekerjaan (JKP)" },
              { id: "jp", title: "Jaminan Pensiun (JP)" }
            ]
          };
          messages.push(successValidationMsg);
          isAiTyping = false;
          walkthroughStep = 4;
          currentStepperStep = 4;
          render();
        } else {
          // KTP upload complete: ask for KPJ, stay at Step 2
          const successValidationMsg = {
            id: "wt-lst-success-card",
            sender: 'lastri',
            text: chatData.text || "Terima kasih, dokumen KTP Anda berhasil diterima. \n\nBerikut hasil validasi data Anda:",
            time: getFormattedTime(),
            validationResult: validatedProfile
          };
          messages.push(successValidationMsg);
          render();

          // Show typing indicator for the follow-up message
          isAiTyping = true;
          render();

          setTimeout(() => {
            messages.push({
              id: `upload-kpj-${Date.now()}`,
              sender: 'lastri',
              text: 'Silakan upload KPJ Anda untuk melanjutkan proses verifikasi.',
              time: getFormattedTime()
            });
            isAiTyping = false;
            render();
          }, 1500);
        }

      } catch (chatErr) {
        console.error("Document validation failed, using mock fallback:", chatErr);
        messages = messages.filter(m => m.id !== "wt-lst-loading");

        validatedProfile = mockCitizenProfile;

        if (isKpjUpload) {
          const successValidationMsg = {
            id: "wt-lst-success-card",
            sender: 'lastri',
            text: "Terima kasih, Kartu Peserta (KPJ) Anda berhasil diterima (mode simulasi offline). 😊",
            time: getFormattedTime(),
            programOptions: [
              { id: "jht", title: "Jaminan Hari Tua (JHT)" },
              { id: "jkp", title: "Jaminan Kehilangan Pekerjaan (JKP)" },
              { id: "jp", title: "Jaminan Pensiun (JP)" }
            ]
          };
          messages.push(successValidationMsg);
          isAiTyping = false;
          walkthroughStep = 4;
          currentStepperStep = 4;
          render();
        } else {
          const successValidationMsg = {
            id: "wt-lst-success-card",
            sender: 'lastri',
            text: "Terima kasih, dokumen Anda berhasil diterima (mode simulasi offline). 😊\n\nBerikut hasil validasi data Anda:",
            time: getFormattedTime(),
            validationResult: validatedProfile
          };
          messages.push(successValidationMsg);
          render();

          isAiTyping = true;
          render();

          setTimeout(() => {
            messages.push({
              id: `upload-kpj-${Date.now()}`,
              sender: 'lastri',
              text: 'Silakan upload KPJ Anda untuk melanjutkan proses verifikasi.',
              time: getFormattedTime()
            });
            isAiTyping = false;
            render();
          }, 1500);
        }
      }
    } else {
      // Free Chat attachments
      const attachMsg = {
        id: `attach-free-${Date.now()}`,
        sender: 'user',
        text: "Baik Lastri, berikut saya lampirkan dokumennya.",
        time: getFormattedTime(),
        attachments: uploadedFiles
      };
      messages.push(attachMsg);
      isAiTyping = true;
      render();

      // Send to AI/n8n for validation/OCR processing
      handleFreeChatRequest("validate_docs", messages.slice(0, -1), uploadedFiles);
    }

  } catch (err) {
    console.error("Upload Error:", err);
    messages = messages.filter(m => m.id !== uploadingMsg.id);
    isAiTyping = false;

    const errorMsg = {
      id: `error-${Date.now()}`,
      sender: 'lastri',
      text: `Gagal mengunggah dokumen: ${err.message || 'Terjadi masalah jaringan.'}. Silakan coba lagi.`,
      time: getFormattedTime()
    };
    messages.push(errorMsg);
    render();
  } finally {
    e.target.value = '';
  }
}

// Choose JHT, JKP, or JP options
window.handleSelectProgram = function (programId) {
  if (programId !== 'jht') {
    alert("Program ini masih dalam tahap persiapan. Silakan pilih 'Jaminan Hari Tua (JHT)'.");
    return;
  }

  const userSelectMsg = {
    id: "wt-program-usr",
    sender: "user",
    text: "Saya pilih program Jaminan Hari Tua (JHT).",
    time: getFormattedTime()
  };

  messages.push(userSelectMsg);
  isAiTyping = true;
  walkthroughStep = 5;
  currentStepperStep = 5;

  selectedProgram = "Jaminan Hari Tua (JHT)";
  estimatedBalance = "Rp 36.245.000,-";
  render();

  setTimeout(() => {
    const balanceMsg = {
      id: "wt-lst-balance",
      sender: "lastri",
      text: "Berdasarkan informasi yang Anda berikan, Anda mungkin berhak mendapatkan manfaat dari program BPJS Ketenagakerjaan berikut:",
      time: getFormattedTime(),
      programDetails: {
        title: "Jaminan Hari Tua (JHT)",
        description: "Merupakan manfaat uang tunai yang diberikan ketika peserta berhenti bekerja, mengundurkan diri (resigned), atau memasuki usia pensiun.",
        badgeValue: "Rp 36.245.000,-",
        asOf: "*Estimasi berdasarkan data terakhir yang kami miliki (per 31 Mei 2024)"
      }
    };

    const finalGuideMsg = {
      id: "wt-lst-final-guide",
      sender: "lastri",
      text: "Sebelum saya bantu lebih lanjut untuk pengajuan klaim JHT, saya perlu melakukan validasi data lanjutan terlebih dahulu ya.\n\nMari kita persiapkan dokumen pendukung tambahan untuk masuk ke antrean digital JHT. 😊",
      time: getFormattedTime()
    };

    messages.push(balanceMsg);
    messages.push(finalGuideMsg);
    isAiTyping = false;
    walkthroughStep = 6;
    currentStepperStep = 6;
    render();
  }, 1500);
};

// Restart fresh session
function handleResetSession() {
  activeMode = 'welcome';
  walkthroughActive = false;
  walkthroughStep = 0;
  currentStepperStep = 1;
  messages = [];
  validatedProfile = null;
  selectedProgram = null;
  estimatedBalance = null;
  render();
}

// Central DOM Render Function
function render() {
  // Toggle main displays
  if (activeMode === 'welcome') {
    welcomeScreen.classList.remove('hidden');
    chatWorkspace.classList.add('hidden');
  } else {
    welcomeScreen.classList.add('hidden');
    chatWorkspace.classList.remove('hidden');

    // Render Walkthrough banner
    if (walkthroughActive && walkthroughStep < 6) {
      walkthroughBanner.classList.remove('hidden');
      walkthroughStepBadge.innerText = walkthroughStep;

      let instruction = "";
      let showInstant = false;

      if (walkthroughStep === 2) {
        if (validatedProfile) {
          instruction = "👉 Panduan: Tekan ikon klip kertas (Paperclip) untuk mengunggah Kartu Peserta (KPJ).";
        } else {
          instruction = "👉 Panduan: Tekan ikon klip kertas (Paperclip) untuk mengunggah berkas KTP.";
        }
        showInstant = true;
      } else if (walkthroughStep === 3) {
        instruction = "⏳ Tunggu sebentar, LASTRI sedang memproses validasi data...";
      } else if (walkthroughStep === 4) {
        instruction = "👉 Panduan: Tekan tombol biru 'Jaminan Hari Tua (JHT)' untuk kalkulasi saldo.";
      } else if (walkthroughStep === 5) {
        instruction = "⏳ Menghitung estimasi nominal saldo JHT...";
      }

      walkthroughInstructionText.innerText = instruction;
      if (showInstant) {
        instantUploadBtn.classList.remove('hidden');
      } else {
        instantUploadBtn.classList.add('hidden');
      }
    } else {
      walkthroughBanner.classList.add('hidden');
    }

    // Render Messages
    renderMessages();

    // Render Stepper
    renderStepper();

    // Render Sidebar Summary
    renderSummary();
  }

  // Re-compile dynamically created icons
  lucide.createIcons();
}

// Render the messages list
function renderMessages() {
  messagesContainer.innerHTML = "";

  messages.forEach(msg => {
    const isUser = msg.sender === 'user';
    const bubbleClass = isUser
      ? "bg-blue-600 text-white rounded-2xl rounded-tr-none font-medium text-right self-end"
      : "bg-white border border-slate-150 text-slate-800 rounded-2xl rounded-tl-none leading-relaxed shadow-sm";

    const alignmentClass = isUser ? "justify-end" : "justify-start";

    let messageHtml = `
            <div class="flex items-start ${alignmentClass} space-x-2.5 max-w-full">
              ${!isUser ? `<img src="/static/images/lastri_icon_depan.png" alt="Lastri" class="w-8 h-8 rounded-full flex-shrink-0 object-cover mt-1 border border-white/[0.06]" />` : ''}
              
              <div class="flex flex-col max-w-[85%] sm:max-w-[70%] space-y-1">
                <div class="px-4 py-3 text-xs sm:text-sm shadow-sm ${bubbleClass}">
                  <div class="whitespace-pre-line text-left">${msg.text}</div>
          `;

    // Render attachments
    if (msg.attachments && msg.attachments.length > 0) {
      messageHtml += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">`;
      msg.attachments.forEach(file => {
        const isImage = file.type === 'image';
        const iconHtml = isImage && file.url
          ? `<img src="${file.url}" class="w-8 h-8 rounded object-cover flex-shrink-0" />`
          : `<div class="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                  <i data-lucide="${file.type === 'pdf' ? 'file-text' : 'file'}" class="w-4 h-4 text-blue-600"></i>
                 </div>`;
        const fileLink = file.url
          ? `<a href="${file.url}" target="_blank" class="hover:underline font-bold text-slate-800 block truncate" title="${file.name}">${file.name}</a>`
          : `<span class="font-bold text-slate-800 block truncate" title="${file.name}">${file.name}</span>`;
        messageHtml += `
                <div class="flex items-center justify-between border border-slate-200 bg-slate-50 rounded-xl p-2.5">
                  <div class="flex items-center space-x-2.5 min-w-0 flex-1">
                    ${iconHtml}
                    <div class="truncate text-left text-[11px] flex-1">
                      ${fileLink}
                      <span class="text-[10px] text-slate-400 font-medium block mt-0.5">${file.size}</span>
                    </div>
                  </div>
                  <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 flex-shrink-0 ml-1.5"></i>
                </div>
              `;
      });
      messageHtml += `</div>`;
    }

    // Render ValidationResult Card
    if (msg.validationResult) {
      const profile = msg.validationResult;
      messageHtml += `
              <div class="mt-4 pt-3.5 border-t border-slate-100 bg-slate-50 border border-slate-200 p-4 rounded-xl text-[11px] text-slate-700">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-3">
                  <div class="md:col-span-5 bg-emerald-50 border border-emerald-250 rounded-lg p-3 flex items-center space-x-2.5 shadow-sm">
                    <i data-lucide="check-circle" class="w-8 h-8 text-emerald-600 flex-shrink-0"></i>
                    <div class="text-left text-[11px]">
                      <span class="text-emerald-700 font-extrabold block leading-none">Validasi Data Berhasil</span>
                      <p class="text-slate-500 font-medium mt-1 leading-snug">Data Anda sesuai dengan kepesertaan kami.</p>
                    </div>
                  </div>
                  <div class="md:col-span-7 grid grid-cols-12 gap-y-1.5 gap-x-1 border-l-0 md:border-l border-slate-200 md:pl-4 text-left">
                    <span class="col-span-4 text-slate-400 font-medium">Nama Lengkap</span>
                    <span class="col-span-8 text-slate-800 font-bold break-all flex items-center">
                      : <span class="pl-1.5">${profile.nama || '-'}</span>
                    </span>
                    <span class="col-span-4 text-slate-400 font-medium">NIK</span>
                    <span class="col-span-8 text-slate-700 font-semibold flex items-center">
                      : <span class="pl-1.5">${profile.nik || '-'}</span>
                    </span>
                    ${profile.saldoJHT !== undefined ? `
                    <span class="col-span-4 text-slate-400 font-medium">Saldo JHT</span>
                    <span class="col-span-8 text-emerald-600 font-bold flex items-center">
                      : <span class="pl-1.5 font-mono">${profile.saldoJHT}</span>
                    </span>
                    ` : ''}
                    ${profile.statusAktif !== undefined ? `
                    <span class="col-span-4 text-slate-400 font-medium">Status Aktif</span>
                    <span class="col-span-8 text-slate-700 font-semibold flex items-center">
                      : <span class="pl-1.5">${profile.statusAktif}</span>
                    </span>
                    ` : ''}
                    ${profile.statusPengkinian !== undefined ? `
                    <span class="col-span-4 text-slate-400 font-medium">Pengkinian Data</span>
                    <span class="col-span-8 text-slate-700 font-semibold flex items-center">
                      : <span class="pl-1.5">${profile.statusPengkinian}</span>
                    </span>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
    }
    if (msg.nextStep) {
      messageHtml += `
        <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div class="flex items-start space-x-2">
            <i data-lucide="arrow-right-circle" class="w-5 h-5 text-blue-600 flex-shrink-0"></i>
            <div class="text-left text-sm text-blue-800 font-medium">
              ${msg.nextStep}
            </div>
          </div>
        </div>
      `;
    }

    // Render program alternatives buttons
    if (msg.programOptions) {
      messageHtml += `<div class="flex flex-wrap gap-2.5 mt-3.5 pt-3 border-t border-slate-100">`;
      msg.programOptions.forEach(opt => {
        messageHtml += `
                <button
                  onclick="handleSelectProgram('${opt.id}')"
                  class="px-4 py-2 border border-blue-600 hover:bg-blue-50 bg-white text-blue-600 font-bold rounded-full text-xs transition-all cursor-pointer shadow-sm active:scale-95 flex items-center space-x-1"
                >
                  <span>${opt.title}</span>
                  ${opt.id === 'jht' ? '<i data-lucide="sparkles" class="w-3.5 h-3.5 ml-1"></i>' : ''}
                </button>
              `;
      });
      messageHtml += `</div>`;
    }

    // Render final Estimasi Saldo JHT card
    if (msg.programDetails) {
      const details = msg.programDetails;
      messageHtml += `
              <div class="mt-4 pt-4 border-t border-slate-100 text-left">
                <div class="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-start space-x-4 shadow-sm">
                  <div class="p-3 bg-blue-100 rounded-xl text-blue-600 flex-shrink-0">
                    <i data-lucide="layers" class="w-6 h-6 stroke-[2]"></i>
                  </div>
                  <div class="flex-1 min-w-0 text-left text-slate-700">
                    <h4 class="font-display font-extrabold text-slate-900 text-sm leading-none">${details.title}</h4>
                    <p class="text-slate-500 text-[11px] leading-relaxed mt-1.5">${details.description}</p>
                    <div class="mt-3 bg-white border border-slate-200 p-2.5 rounded-lg">
                      <span class="text-slate-400 text-[10px] block font-medium">Estimasi saldo JHT Anda saat ini:</span>
                      <span class="text-emerald-650 font-extrabold text-lg sm:text-xl block mt-0.5 tracking-tight font-mono">${details.badgeValue}</span>
                    </div>
                    <span class="text-[9px] text-slate-400 block italic mt-1 font-mono text-right">${details.asOf}</span>
                  </div>
                </div>
              </div>
            `;
    }

    messageHtml += `
                </div>
                <span class="text-[9px] text-slate-400/90 font-mono ${isUser ? 'text-right pr-1' : 'pl-1 text-left'}">
                  ${msg.time}
                </span>
              </div>
            </div>
          `;

    messagesContainer.innerHTML += messageHtml;
  });

  // Add typing indicator bubble if active
  if (isAiTyping) {
    const typingHtml = `
            <div class="flex items-start space-x-2.5 justify-start">
              <img src="/static/images/lastri_icon_depan.png" alt="Lastri" class="w-8 h-8 rounded-full flex-shrink-0 object-cover mt-1 border border-slate-100" />
              <div class="flex flex-col space-y-1">
                <div class="bg-white border border-slate-150 text-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-xs sm:text-sm shadow-sm flex items-center space-x-2">
                  <div class="flex space-x-1.5 py-1">
                    <div class="w-2.5 h-2.5 rounded-full bg-blue-500/45 animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-blue-500/60 animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-blue-500/80 animate-bounce" style="animation-delay: 300ms"></div>
                  </div>
                  <span class="text-[11px] text-slate-400 pl-2">LASTRI sedang mengetik...</span>
                </div>
              </div>
            </div>
          `;
    messagesContainer.innerHTML += typingHtml;
  }

  // Scroll to the bottom of the message area
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Render Stepper List
function renderStepper() {
  stepperList.innerHTML = `
          <!-- Timeline Connector Line -->
          <div class="absolute left-4.5 top-4 bottom-4 w-[2px] bg-white/10 z-0"></div>
        `;

  stepsData.forEach(step => {
    const status = currentStepperStep > step.id
      ? 'completed'
      : (currentStepperStep === step.id ? 'active' : 'pending');

    const isActive = status === 'active';
    const isCompleted = status === 'completed';

    let stepCircle = "";
    if (isCompleted) {
      stepCircle = `
              <div class="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                <i data-lucide="check" class="w-4 h-4 stroke-[3]"></i>
              </div>
            `;
    } else if (isActive) {
      stepCircle = `
              <div class="w-9 h-9 rounded-full bg-yellow-400 text-blue-900 flex items-center justify-center font-display font-semibold text-xs ring-4 ring-yellow-400/20 shadow-lg">
                ${step.id}
              </div>
            `;
    } else {
      stepCircle = `
              <div class="w-9 h-9 rounded-full bg-white/10 text-white/60 border border-white/15 flex items-center justify-center font-display font-semibold text-xs">
                ${step.id}
              </div>
            `;
    }

    const titleClass = isActive
      ? "text-yellow-450"
      : (isCompleted ? "text-white/80" : "text-white/40");

    const subtitleClass = isActive
      ? "text-white/70 font-medium"
      : "text-white/30";

    const stepHtml = `
            <div class="flex space-x-4 relative z-10 select-none">
              <div class="flex-shrink-0 flex items-center justify-center">
                ${stepCircle}
              </div>
              <div class="flex-1 min-w-0 pr-1 pt-0.5 text-left">
                <h4 class="text-xs font-semibold leading-tight ${titleClass}">${step.title}</h4>
                <p class="text-[10px] sm:text-[11px] leading-snug mt-0.5 ${subtitleClass}">${step.subtitle}</p>
              </div>
            </div>
          `;
    stepperList.innerHTML += stepHtml;
  });
}

// Render Sidebar Summary Card
function renderSummary() {
  const hasSummary = validatedProfile !== null || selectedProgram !== null;
  if (!hasSummary) {
    summaryCard.classList.add('hidden');
    return;
  }

  summaryCard.classList.remove('hidden');
  summaryFields.innerHTML = "";

  if (validatedProfile) {
    summaryTitle.innerText = selectedProgram ? "Ringkasan Sementara" : "Ringkasan Data Anda";

    const nama = validatedProfile.nama || "-";
    const nik = validatedProfile.nik || "-";
    const saldoJHT = validatedProfile.saldoJHT || "-";
    const statusAktif = validatedProfile.statusAktif || "-";
    const statusPengkinian = validatedProfile.statusPengkinian || "-";

    let html = `
            <div class="flex justify-between items-start border-b border-white/10 pb-2">
              <span class="text-white/60">Nama</span>
              <span class="text-white font-semibold text-right max-w-[160px] truncate" title="${nama}">${nama}</span>
            </div>
            <div class="flex justify-between items-center border-b border-white/10 pb-2">
              <span class="text-white/60">NIK</span>
              <span class="text-white font-mono tracking-wide">${nik}</span>
            </div>
    `;

    if (validatedProfile.saldoJHT !== undefined) {
      html += `
            <div class="flex justify-between items-center border-b border-white/10 pb-2">
              <span class="text-white/60">Saldo JHT</span>
              <span class="text-yellow-400 font-bold">${saldoJHT}</span>
            </div>
      `;
    }

    if (validatedProfile.statusAktif !== undefined) {
      const isAktif = statusAktif.toLowerCase().includes('aktif') && !statusAktif.toLowerCase().includes('non');
      const badgeClass = isAktif
        ? "bg-emerald-500/20 text-white border border-emerald-500/10"
        : "bg-white/20 text-white border border-white/10";
      html += `
            <div class="flex justify-between items-center border-b border-white/10 pb-2">
              <span class="text-white/60">Status Aktif</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}">${statusAktif}</span>
            </div>
      `;
    }

    if (validatedProfile.statusPengkinian !== undefined) {
      const isYa = statusPengkinian.toLowerCase().includes('sudah') || statusPengkinian.toLowerCase().includes('berhasil') || statusPengkinian.toLowerCase().includes('ya');
      const badgeClass = isYa
        ? "bg-emerald-500/20 text-white border border-emerald-500/10"
        : "bg-white/20 text-white border border-white/10";
      html += `
            <div class="flex justify-between items-center border-b border-white/10 pb-2">
              <span class="text-white/60">Pengkinian Data</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}">${statusPengkinian}</span>
            </div>
      `;
    }

    summaryFields.innerHTML = html;
  }

  if (selectedProgram) {
    summaryFields.innerHTML += `
            <div class="mt-4 pt-4 border-t border-dashed border-white/10 space-y-3 bg-white/10 p-3 rounded-lg">
              <div class="flex justify-between items-center">
                <span class="text-white/60 text-[11px]">Program Potensial</span>
                <span class="text-yellow-400 font-bold text-[11px]">${selectedProgram}</span>
              </div>
              ${estimatedBalance ? `
                <div class="flex justify-between items-center pt-1">
                  <span class="text-white/60 text-[11px]">Estimasi Saldo ${selectedProgram.split(' ')[0]}</span>
                  <span class="text-yellow-400 font-extrabold text-sm">${estimatedBalance}</span>
                </div>
              ` : ''}
              <span class="text-[9px] text-white/50 block italic leading-none text-right">*Per 31 Mei 2024</span>
            </div>
          `;
  }
}

// Initialize on window load
window.onload = init;