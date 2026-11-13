/**
 * Smart Interview Preparation System - Application Controller
 */

// Application State
const state = {
  currentUser: null,
  dashboard: null,
  currentView: 'dashboard', // 'dashboard' | 'aptitude' | 'coding' | 'technical' | 'mock'
  aptitude: {
    questions: [],
    currentIndex: 0,
    userAnswers: {},
    category: 'All Categories',
    difficulty: 'All Difficulties'
  },
  coding: {
    questions: [],
    selectedQuestion: null,
    activeFilter: 'All'
  },
  technical: {
    questions: [],
    currentIndex: 0,
    userAnswers: {},
    category: 'All Technologies',
    difficulty: 'All Difficulties'
  },
  mock: {
    questions: [],
    currentIndex: 0,
    userAnswers: [],
    evaluations: [],
    targetRole: 'Full Stack Developer',
    interviewType: 'Technical',
    difficulty: 'Medium'
  },
  resume: {
    selectedFile: null,
    history: []
  },
  progress: {
    summary: null
  },
  admin: {
    stats: null,
    users: [],
    questions: [],
    selectedModule: 'aptitude',
    activeTab: 'stats',
    editingQuestionId: null
  }
};


// DOM Element References
const elements = {
  // Views
  authView: document.getElementById('auth-view'),
  dashboardView: document.getElementById('dashboard-view'),
  aptitudeView: document.getElementById('aptitude-view'),
  codingView: document.getElementById('coding-view'),
  technicalView: document.getElementById('technical-view'),
  mockView: document.getElementById('mock-interview-view'),
  resumeView: document.getElementById('resume-view'),
  progressView: document.getElementById('progress-view'),
  adminView: document.getElementById('admin-view'),
  
  // Navigation
  guestNav: document.getElementById('guest-nav'),
  userNav: document.getElementById('user-nav'),
  navUserName: document.getElementById('nav-user-name'),
  navTargetRole: document.getElementById('nav-target-role'),
  navAvatar: document.getElementById('nav-avatar'),
  userProfileChip: document.getElementById('user-profile-chip'),
  profileDropdownMenu: document.getElementById('profile-dropdown-menu'),
  dropdownUserName: document.getElementById('dropdown-user-name'),
  dropdownUserEmail: document.getElementById('dropdown-user-email'),
  dropdownBtnProfile: document.getElementById('dropdown-btn-profile'),
  dropdownBtnProgress: document.getElementById('dropdown-btn-progress'),
  dropdownBtnTargetRole: document.getElementById('dropdown-btn-target-role'),
  dropdownBtnLogout: document.getElementById('dropdown-btn-logout'),
  btnShowLogin: document.getElementById('btn-show-login'),
  btnShowRegister: document.getElementById('btn-show-register'),
  btnLogout: document.getElementById('btn-logout'),
  btnOpenSettings: document.getElementById('btn-open-settings'),
  btnNavDashboard: document.getElementById('btn-nav-dashboard'),
  btnNavAptitude: document.getElementById('btn-nav-aptitude'),
  btnNavCoding: document.getElementById('btn-nav-coding'),
  btnNavTechnical: document.getElementById('btn-nav-technical'),
  btnNavMock: document.getElementById('btn-nav-mock'),
  btnNavResume: document.getElementById('btn-nav-resume'),
  btnNavProgress: document.getElementById('btn-nav-progress'),
  btnNavAdmin: document.getElementById('btn-nav-admin'),

  // Auth Tabs & Forms
  tabLogin: document.getElementById('tab-login'),
  tabRegister: document.getElementById('tab-register'),
  formLogin: document.getElementById('form-login'),
  formRegister: document.getElementById('form-register'),

  // Dashboard Elements
  dashUserName: document.getElementById('dash-user-name'),
  dashRoleDisplay: document.getElementById('dash-role-display'),
  btnEditTarget: document.getElementById('btn-edit-target'),
  btnOpenAptitudeCard: document.getElementById('btn-open-aptitude-card'),
  btnOpenCodingCard: document.getElementById('btn-open-coding-card'),
  btnOpenTechnicalCard: document.getElementById('btn-open-technical-card'),
  btnOpenMockCard: document.getElementById('btn-open-mock-card'),
  
  // Stats
  statReadiness: document.getElementById('stat-readiness'),
  statReadinessLabel: document.getElementById('stat-readiness-label'),
  statReadinessBar: document.getElementById('stat-readiness-bar'),
  statHours: document.getElementById('stat-hours'),
  statTopics: document.getElementById('stat-topics'),
  statInterviews: document.getElementById('stat-interviews'),
  
  // Containers
  topicsContainer: document.getElementById('topics-container'),
  scheduleContainer: document.getElementById('schedule-container'),
  
  // Modal & Settings
  modalSettings: document.getElementById('modal-settings'),
  formSettings: document.getElementById('form-settings'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  btnCancelSettings: document.getElementById('btn-cancel-settings'),
  editRole: document.getElementById('edit-role'),
  editLevel: document.getElementById('edit-level'),

  // Aptitude Module Controls
  aptitudeConfigCard: document.getElementById('aptitude-config-card'),
  aptitudeTestCard: document.getElementById('aptitude-test-card'),
  aptitudeResultsCard: document.getElementById('aptitude-results-card'),
  formStartAptitude: document.getElementById('form-start-aptitude'),
  aptitudeCategory: document.getElementById('aptitude-category'),
  aptitudeDifficulty: document.getElementById('aptitude-difficulty'),
  aptitudeLimit: document.getElementById('aptitude-limit'),
  testCategoryBadge: document.getElementById('test-category-badge'),
  testDifficultyBadge: document.getElementById('test-difficulty-badge'),
  currentQuestionNum: document.getElementById('current-question-num'),
  totalQuestionsNum: document.getElementById('total-questions-num'),
  testProgressBar: document.getElementById('test-progress-bar'),
  questionPillsContainer: document.getElementById('question-pills-container'),
  questionText: document.getElementById('question-text'),
  optionsContainer: document.getElementById('options-container'),
  btnPrevQuestion: document.getElementById('btn-prev-question'),
  btnNextQuestion: document.getElementById('btn-next-question'),
  btnSubmitTest: document.getElementById('btn-submit-test'),
  resPercentage: document.getElementById('res-percentage'),
  resTitle: document.getElementById('res-title'),
  resSubtitle: document.getElementById('res-subtitle'),
  resTotal: document.getElementById('res-total'),
  resCorrect: document.getElementById('res-correct'),
  resWrong: document.getElementById('res-wrong'),
  resScore: document.getElementById('res-score'),
  explanationsContainer: document.getElementById('explanations-container'),
  btnRestartAptitude: document.getElementById('btn-restart-aptitude'),
  btnBackDashboard: document.getElementById('btn-back-dashboard'),

  // Coding Practice Controls
  codingDiffFilters: document.getElementById('coding-diff-filters'),
  codingProblemList: document.getElementById('coding-problem-list'),
  codeProbCategory: document.getElementById('code-prob-category'),
  codeProbDifficulty: document.getElementById('code-prob-difficulty'),
  codeProbStatus: document.getElementById('code-prob-status'),
  codeProbTitle: document.getElementById('code-prob-title'),
  codeProbDescription: document.getElementById('code-prob-description'),
  codeProbExampleInput: document.getElementById('code-prob-example-input'),
  codeProbExampleOutput: document.getElementById('code-prob-example-output'),
  btnResetCode: document.getElementById('btn-reset-code'),
  btnSubmitCode: document.getElementById('btn-submit-code'),
  codingEditor: document.getElementById('coding-editor'),
  terminalStatusBadge: document.getElementById('terminal-status-badge'),
  terminalBody: document.getElementById('terminal-body'),

  // Technical Practice Controls
  techConfigCard: document.getElementById('tech-config-card'),
  techTestCard: document.getElementById('tech-test-card'),
  techResultsCard: document.getElementById('tech-results-card'),
  formStartTech: document.getElementById('form-start-tech'),
  btnStartTechTest: document.getElementById('btn-start-tech-test'),
  techCategory: document.getElementById('tech-category'),
  techDifficulty: document.getElementById('tech-difficulty'),
  techLimit: document.getElementById('tech-limit'),
  techTestCategoryBadge: document.getElementById('tech-test-category-badge'),
  techTestDifficultyBadge: document.getElementById('tech-test-difficulty-badge'),
  techCurrentQNum: document.getElementById('tech-current-q-num'),
  techTotalQNum: document.getElementById('tech-total-q-num'),
  techProgressBar: document.getElementById('tech-progress-bar'),
  techQuestionPillsContainer: document.getElementById('tech-question-pills-container'),
  techQuestionText: document.getElementById('tech-question-text'),
  techOptionsContainer: document.getElementById('tech-options-container'),
  techExplanationBox: document.getElementById('tech-explanation-box'),
  techAnswerStatusBadge: document.getElementById('tech-answer-status-badge'),
  techExplanationContent: document.getElementById('tech-explanation-content'),
  techBtnPrev: document.getElementById('tech-btn-prev'),
  techBtnNext: document.getElementById('tech-btn-next'),
  techBtnSubmit: document.getElementById('tech-btn-submit'),
  techResPercentage: document.getElementById('tech-res-percentage'),
  techResTitle: document.getElementById('tech-res-title'),
  techResSubtitle: document.getElementById('tech-res-subtitle'),
  techResTotal: document.getElementById('tech-res-total'),
  techResCorrect: document.getElementById('tech-res-correct'),
  techResWrong: document.getElementById('tech-res-wrong'),
  techResScore: document.getElementById('tech-res-score'),
  techExplanationsContainer: document.getElementById('tech-explanations-container'),
  btnRestartTech: document.getElementById('btn-restart-tech'),
  btnTechBackDashboard: document.getElementById('btn-tech-back-dashboard'),

  // AI Mock Interview Controls
  mockSetupCard: document.getElementById('mock-setup-card'),
  mockInterviewCard: document.getElementById('mock-interview-card'),
  mockReportCard: document.getElementById('mock-report-card'),
  formStartMock: document.getElementById('form-start-mock'),
  btnStartMock: document.getElementById('btn-start-mock'),
  mockRole: document.getElementById('mock-role'),
  mockType: document.getElementById('mock-type'),
  mockDifficulty: document.getElementById('mock-difficulty'),
  mockBadgeRole: document.getElementById('mock-badge-role'),
  mockBadgeType: document.getElementById('mock-badge-type'),
  mockBadgeDiff: document.getElementById('mock-badge-diff'),
  mockCurrentQNum: document.getElementById('mock-current-q-num'),
  mockProgressBar: document.getElementById('mock-progress-bar'),
  mockQuestionText: document.getElementById('mock-question-text'),
  mockAnswerInput: document.getElementById('mock-answer-input'),
  mockCharCounter: document.getElementById('mock-char-counter'),
  btnSubmitMockAnswer: document.getElementById('btn-submit-mock-answer'),
  mockEvalBox: document.getElementById('mock-eval-box'),
  mockEvalScoreBadge: document.getElementById('mock-eval-score-badge'),
  mockEvalStatusText: document.getElementById('mock-eval-status-text'),
  evalMetricRel: document.getElementById('eval-metric-rel'),
  evalMetricAcc: document.getElementById('eval-metric-acc'),
  evalMetricComm: document.getElementById('eval-metric-comm'),
  evalMetricComp: document.getElementById('eval-metric-comp'),
  mockEvalFeedback: document.getElementById('mock-eval-feedback'),
  btnNextMockQuestion: document.getElementById('btn-next-mock-question'),
  btnFinishMock: document.getElementById('btn-finish-mock'),
  mockFinalScorePct: document.getElementById('mock-final-score-pct'),
  mockReportTitle: document.getElementById('mock-report-title'),
  mockReportSubtitle: document.getElementById('mock-report-subtitle'),
  mockReportStrengths: document.getElementById('mock-report-strengths'),
  mockReportWeaknesses: document.getElementById('mock-report-weaknesses'),
  mockReportSuggestions: document.getElementById('mock-report-suggestions'),
  mockReportTopics: document.getElementById('mock-report-topics'),
  mockReportQuestionsList: document.getElementById('mock-report-questions-list'),
  btnRestartMock: document.getElementById('btn-restart-mock'),
  btnMockBackDashboard: document.getElementById('btn-mock-back-dashboard'),

  // Resume Analyzer Controls
  btnOpenResumeCard: document.getElementById('btn-open-resume-card'),
  resumeUploadCard: document.getElementById('resume-upload-card'),
  resumeResultsCard: document.getElementById('resume-results-card'),
  resumeHistoryCard: document.getElementById('resume-history-card'),
  formUploadResume: document.getElementById('form-upload-resume'),
  resumeRole: document.getElementById('resume-role'),
  resumeDropZone: document.getElementById('resume-drop-zone'),
  resumeFileInput: document.getElementById('resume-file-input'),
  dropzoneContent: document.getElementById('dropzone-content'),
  dropzoneFileInfo: document.getElementById('dropzone-file-info'),
  selectedFileName: document.getElementById('selected-file-name'),
  selectedFileSize: document.getElementById('selected-file-size'),
  btnRemoveFile: document.getElementById('btn-remove-file'),
  btnSubmitResume: document.getElementById('btn-submit-resume'),
  resumeScoreVal: document.getElementById('resume-score-val'),
  resumeResultsTitle: document.getElementById('resume-results-title'),
  resumeResultsSubtitle: document.getElementById('resume-results-subtitle'),
  resumeMetricMatch: document.getElementById('resume-metric-match'),
  resumeMetricDetected: document.getElementById('resume-metric-detected'),
  resumeMetricMissing: document.getElementById('resume-metric-missing'),
  resumeMetricOverall: document.getElementById('resume-metric-overall'),
  resumeDetectedSkills: document.getElementById('resume-detected-skills'),
  resumeMissingSkills: document.getElementById('resume-missing-skills'),
  resumeStrengthsList: document.getElementById('resume-strengths-list'),
  resumeWeaknessesList: document.getElementById('resume-weaknesses-list'),
  resumeKeywordsPills: document.getElementById('resume-keywords-pills'),
  resumeSuggestionsList: document.getElementById('resume-suggestions-list'),
  btnReanalyzeResume: document.getElementById('btn-reanalyze-resume'),
  btnResumeBackDashboard: document.getElementById('btn-resume-back-dashboard'),
  resumeHistoryContainer: document.getElementById('resume-history-container'),

  // Progress & Recommendation Controls
  btnOpenProgressCard: document.getElementById('btn-open-progress-card'),
  dashWeakestBadge: document.getElementById('dash-weakest-badge'),
  dashReadinessStatusBadge: document.getElementById('dash-readiness-status-badge'),
  dashTopRecTitle: document.getElementById('dash-top-rec-title'),
  dashTopRecDesc: document.getElementById('dash-top-rec-desc'),
  btnDashTopRec: document.getElementById('btn-dash-top-rec'),
  dashTopRecBtnLabel: document.getElementById('dash-top-rec-btn-label'),
  progressStatusBadge: document.getElementById('progress-status-badge'),
  progressOverallVal: document.getElementById('progress-overall-val'),
  progCountAptitude: document.getElementById('prog-count-aptitude'),
  progScoreAptitude: document.getElementById('prog-score-aptitude'),
  barAptitude: document.getElementById('bar-aptitude'),
  progCountCoding: document.getElementById('prog-count-coding'),
  progScoreCoding: document.getElementById('prog-score-coding'),
  barCoding: document.getElementById('bar-coding'),
  progCountTechnical: document.getElementById('prog-count-technical'),
  progScoreTechnical: document.getElementById('prog-score-technical'),
  barTechnical: document.getElementById('bar-technical'),
  progCountMock: document.getElementById('prog-count-mock'),
  progScoreMock: document.getElementById('prog-score-mock'),
  barMock: document.getElementById('bar-mock'),
  progCountResume: document.getElementById('prog-count-resume'),
  progScoreResume: document.getElementById('prog-score-resume'),
  barResume: document.getElementById('bar-resume'),
  progStrongAreas: document.getElementById('prog-strong-areas'),
  progWeakAreas: document.getElementById('prog-weak-areas'),
  progressRecommendationsList: document.getElementById('progress-recommendations-list'),
  ktMatrixTbody: document.getElementById('kt-matrix-tbody'),

  // Admin Controls
  tabAdminStats: document.getElementById('tab-admin-stats'),
  tabAdminUsers: document.getElementById('tab-admin-users'),
  tabAdminQuestions: document.getElementById('tab-admin-questions'),
  tabAdminSessions: document.getElementById('tab-admin-sessions'),
  adminPanelStats: document.getElementById('admin-panel-stats'),
  adminPanelUsers: document.getElementById('admin-panel-users'),
  adminPanelQuestions: document.getElementById('admin-panel-questions'),
  adminPanelSessions: document.getElementById('admin-panel-sessions'),
  adminStatUsers: document.getElementById('admin-stat-users'),
  adminStatActive: document.getElementById('admin-stat-active'),
  adminStatAptitude: document.getElementById('admin-stat-aptitude'),
  adminStatCoding: document.getElementById('admin-stat-coding'),
  adminStatTechnical: document.getElementById('admin-stat-technical'),
  adminStatMock: document.getElementById('admin-stat-mock'),
  adminStatAvg: document.getElementById('admin-stat-avg'),
  adminUserSearch: document.getElementById('admin-user-search'),
  adminUsersTbody: document.getElementById('admin-users-tbody'),
  adminQuestionsTbody: document.getElementById('admin-questions-tbody'),
  adminSessionsMockTbody: document.getElementById('admin-sessions-mock-tbody'),
  adminSessionsAptitudeTbody: document.getElementById('admin-sessions-aptitude-tbody'),
  adminSessionsCodingTbody: document.getElementById('admin-sessions-coding-tbody'),
  btnAdminAddQ: document.getElementById('btn-admin-add-q'),
  modalAdminQuestion: document.getElementById('modal-admin-question'),
  formAdminAddQuestion: document.getElementById('form-admin-add-question'),
  adminQModuleSelect: document.getElementById('admin-q-module-select'),
  adminQFieldsMcq: document.getElementById('admin-q-fields-mcq'),
  adminQFieldsCoding: document.getElementById('admin-q-fields-coding'),
  btnCloseQModal: document.getElementById('btn-close-q-modal'),
  btnCancelQModal: document.getElementById('btn-cancel-q-modal'),
  modalAdminUserProgress: document.getElementById('modal-admin-user-progress'),
  btnCloseUserProgressModal: document.getElementById('btn-close-user-progress-modal'),
  btnCloseUserProgress: document.getElementById('btn-close-user-progress'),
  adminUserProgressBody: document.getElementById('admin-user-progress-body'),

  // Toasts

  toastContainer: document.getElementById('toast-container')
};

// Initialization on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  setupEventListeners();
  checkSession();
});

// Helper: Refresh Lucide Icons
function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // User Profile Dropdown Toggle & Items
  const toggleProfileDropdown = (e) => {
    if (e) e.stopPropagation();
    if (elements.profileDropdownMenu) {
      elements.profileDropdownMenu.classList.toggle('hidden');
    }
  };

  if (elements.userProfileChip) {
    elements.userProfileChip.addEventListener('click', toggleProfileDropdown);
  }
  if (elements.navAvatar) {
    elements.navAvatar.addEventListener('click', toggleProfileDropdown);
  }

  if (elements.dropdownBtnProfile) {
    elements.dropdownBtnProfile.addEventListener('click', () => {
      if (elements.profileDropdownMenu) elements.profileDropdownMenu.classList.add('hidden');
      openSettingsModal();
    });
  }
  if (elements.dropdownBtnProgress) {
    elements.dropdownBtnProgress.addEventListener('click', () => {
      if (elements.profileDropdownMenu) elements.profileDropdownMenu.classList.add('hidden');
      switchMainView('progress');
    });
  }
  if (elements.dropdownBtnTargetRole) {
    elements.dropdownBtnTargetRole.addEventListener('click', () => {
      if (elements.profileDropdownMenu) elements.profileDropdownMenu.classList.add('hidden');
      openSettingsModal();
    });
  }
  if (elements.dropdownBtnLogout) {
    elements.dropdownBtnLogout.addEventListener('click', () => {
      if (elements.profileDropdownMenu) elements.profileDropdownMenu.classList.add('hidden');
      handleLogout();
    });
  }

  // Close profile dropdown when clicking outside or pressing Escape
  document.addEventListener('click', (e) => {
    if (elements.profileDropdownMenu && !elements.profileDropdownMenu.classList.contains('hidden')) {
      const chipContainer = elements.userProfileChip ? elements.userProfileChip.closest('.user-chip-container') : null;
      if (chipContainer && !chipContainer.contains(e.target)) {
        elements.profileDropdownMenu.classList.add('hidden');
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.profileDropdownMenu && !elements.profileDropdownMenu.classList.contains('hidden')) {
      elements.profileDropdownMenu.classList.add('hidden');
    }
  });

  // Auth buttons
  if (elements.btnShowLogin) elements.btnShowLogin.addEventListener('click', () => switchAuthTab('login'));
  if (elements.btnShowRegister) elements.btnShowRegister.addEventListener('click', () => switchAuthTab('register'));
  if (elements.btnLogout) elements.btnLogout.addEventListener('click', handleLogout);

  // View Switchers
  if (elements.btnNavDashboard) {
    elements.btnNavDashboard.addEventListener('click', () => switchMainView('dashboard'));
  }
  if (elements.btnNavAptitude) {
    elements.btnNavAptitude.addEventListener('click', () => switchMainView('aptitude'));
  }
  if (elements.btnNavCoding) {
    elements.btnNavCoding.addEventListener('click', () => switchMainView('coding'));
  }
  if (elements.btnNavTechnical) {
    elements.btnNavTechnical.addEventListener('click', () => switchMainView('technical'));
  }
  if (elements.btnNavMock) {
    elements.btnNavMock.addEventListener('click', () => switchMainView('mock'));
  }

  if (elements.btnOpenAptitudeCard) {
    elements.btnOpenAptitudeCard.addEventListener('click', () => switchMainView('aptitude'));
  }
  if (elements.btnOpenCodingCard) {
    elements.btnOpenCodingCard.addEventListener('click', () => switchMainView('coding'));
  }
  if (elements.btnOpenTechnicalCard) {
    elements.btnOpenTechnicalCard.addEventListener('click', () => switchMainView('technical'));
  }
  if (elements.btnOpenMockCard) {
    elements.btnOpenMockCard.addEventListener('click', () => switchMainView('mock'));
  }
  if (elements.btnNavResume) {
    elements.btnNavResume.addEventListener('click', () => switchMainView('resume'));
  }
  if (elements.btnOpenResumeCard) {
    elements.btnOpenResumeCard.addEventListener('click', () => switchMainView('resume'));
  }
  if (elements.btnNavProgress) {
    elements.btnNavProgress.addEventListener('click', () => switchMainView('progress'));
  }
  if (elements.btnOpenProgressCard) {
    elements.btnOpenProgressCard.addEventListener('click', () => switchMainView('progress'));
  }
  if (elements.btnNavAdmin) {
    elements.btnNavAdmin.addEventListener('click', () => switchMainView('admin'));
  }
  if (elements.btnDashTopRec) {
    elements.btnDashTopRec.addEventListener('click', handleTopRecClick);
  }

  // Admin Event Listeners
  if (elements.tabAdminStats) {
    elements.tabAdminStats.addEventListener('click', () => switchAdminTab('stats'));
  }
  if (elements.tabAdminUsers) {
    elements.tabAdminUsers.addEventListener('click', () => switchAdminTab('users'));
  }
  if (elements.tabAdminQuestions) {
    elements.tabAdminQuestions.addEventListener('click', () => switchAdminTab('questions'));
  }
  if (elements.tabAdminSessions) {
    elements.tabAdminSessions.addEventListener('click', () => switchAdminTab('sessions'));
  }
  if (elements.adminUserSearch) {
    elements.adminUserSearch.addEventListener('input', filterAdminUsers);
  }
  if (elements.btnAdminAddQ) {
    elements.btnAdminAddQ.addEventListener('click', openAdminQuestionModal);
  }
  if (elements.btnCloseQModal) {
    elements.btnCloseQModal.addEventListener('click', closeAdminQuestionModal);
  }
  if (elements.btnCancelQModal) {
    elements.btnCancelQModal.addEventListener('click', closeAdminQuestionModal);
  }
  if (elements.btnCloseUserProgressModal) {
    elements.btnCloseUserProgressModal.addEventListener('click', closeUserProgressModal);
  }
  if (elements.btnCloseUserProgress) {
    elements.btnCloseUserProgress.addEventListener('click', closeUserProgressModal);
  }
  if (elements.adminQModuleSelect) {
    elements.adminQModuleSelect.addEventListener('change', (e) => toggleAdminQuestionModalFields(e.target.value));
  }
  if (elements.formAdminAddQuestion) {
    elements.formAdminAddQuestion.addEventListener('submit', handleAdminCreateQuestion);
  }

  const qPills = document.querySelectorAll('.admin-q-module-pill');
  qPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      qPills.forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      const mod = e.target.getAttribute('data-mod');
      state.admin.selectedModule = mod;
      loadAdminQuestions(mod);
    });
  });

  // Auth Tabs
  if (elements.tabLogin) elements.tabLogin.addEventListener('click', () => switchAuthTab('login'));
  if (elements.tabRegister) elements.tabRegister.addEventListener('click', () => switchAuthTab('register'));

  // Cross-links between login/register
  const btnGoRegister = document.getElementById('btn-go-register');
  const btnGoLogin = document.getElementById('btn-go-login');
  if (btnGoRegister) btnGoRegister.addEventListener('click', () => switchAuthTab('register'));
  if (btnGoLogin) btnGoLogin.addEventListener('click', () => switchAuthTab('login'));

  // Show/Hide password toggles
  setupPasswordToggle('btn-toggle-login-pw', 'login-password', 'login-pw-eye-icon');
  setupPasswordToggle('btn-toggle-reg-pw', 'reg-password', 'reg-pw-eye-icon');

  // Password strength meter
  const regPwInput = document.getElementById('reg-password');
  if (regPwInput) regPwInput.addEventListener('input', () => updatePasswordStrength(regPwInput.value));

  // Auth Forms
  if (elements.formLogin) elements.formLogin.addEventListener('submit', handleLogin);
  if (elements.formRegister) elements.formRegister.addEventListener('submit', handleRegister);

  // OTP Sign-In button
  const btnLoginOtp = document.getElementById('btn-login-otp');
  if (btnLoginOtp) btnLoginOtp.addEventListener('click', handleLoginWithOtp);

  // OTP Panel
  setupOtpPanel();


  // Settings Modal & Panel Handlers
  if (elements.btnEditTarget) elements.btnEditTarget.addEventListener('click', () => openSettingsModal('profile'));
  if (elements.btnOpenSettings) elements.btnOpenSettings.addEventListener('click', () => openSettingsModal('profile'));
  if (elements.btnCloseModal) elements.btnCloseModal.addEventListener('click', closeSettingsModal);
  if (elements.btnCancelSettings) elements.btnCancelSettings.addEventListener('click', closeSettingsModal);
  if (elements.formSettings) elements.formSettings.addEventListener('submit', handleUpdateProfile);

  if (elements.modalSettings) {
    elements.modalSettings.addEventListener('click', (e) => {
      if (e.target === elements.modalSettings) closeSettingsModal();
    });
  }

  setupSettingsHandlers();

  // Aptitude Module Controls
  if (elements.formStartAptitude) {
    elements.formStartAptitude.addEventListener('submit', handleStartAptitudeTest);
  }
  if (elements.btnPrevQuestion) {
    elements.btnPrevQuestion.addEventListener('click', () => navigateAptitudeQuestion(-1));
  }
  if (elements.btnNextQuestion) {
    elements.btnNextQuestion.addEventListener('click', () => navigateAptitudeQuestion(1));
  }
  if (elements.btnSubmitTest) {
    elements.btnSubmitTest.addEventListener('click', handleSubmitAptitudeTest);
  }
  if (elements.btnRestartAptitude) {
    elements.btnRestartAptitude.addEventListener('click', resetAptitudeTest);
  }
  if (elements.btnBackDashboard) {
    elements.btnBackDashboard.addEventListener('click', () => {
      resetAptitudeTest();
      switchMainView('dashboard');
    });
  }

  // Coding Practice Event Listeners
  if (elements.codingDiffFilters) {
    elements.codingDiffFilters.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-pill')) {
        const filterBtns = elements.codingDiffFilters.querySelectorAll('.filter-pill');
        filterBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        state.coding.activeFilter = e.target.getAttribute('data-diff');
        renderCodingProblemList();
      }
    });
  }

  if (elements.btnResetCode) {
    elements.btnResetCode.addEventListener('click', () => {
      if (state.coding.selectedQuestion) {
        elements.codingEditor.value = state.coding.selectedQuestion.starter_code;
        showToast('Code reset to starter template.', 'info');
      }
    });
  }

  if (elements.btnSubmitCode) {
    elements.btnSubmitCode.addEventListener('click', handleSubmitCode);
  }

  // Technical Practice Event Listeners
  if (elements.formStartTech) {
    elements.formStartTech.addEventListener('submit', handleStartTechTest);
  }
  if (elements.techBtnPrev) {
    elements.techBtnPrev.addEventListener('click', () => navigateTechQuestion(-1));
  }
  if (elements.techBtnNext) {
    elements.techBtnNext.addEventListener('click', () => navigateTechQuestion(1));
  }
  if (elements.techBtnSubmit) {
    elements.techBtnSubmit.addEventListener('click', handleSubmitTechTest);
  }
  if (elements.btnRestartTech) {
    elements.btnRestartTech.addEventListener('click', resetTechTest);
  }
  if (elements.btnTechBackDashboard) {
    elements.btnTechBackDashboard.addEventListener('click', () => {
      resetTechTest();
      switchMainView('dashboard');
    });
  }

  // AI Mock Interview Event Listeners
  if (elements.formStartMock) {
    elements.formStartMock.addEventListener('submit', handleStartMockInterview);
  }
  if (elements.mockAnswerInput) {
    elements.mockAnswerInput.addEventListener('input', updateMockCharCounter);
  }
  if (elements.btnSubmitMockAnswer) {
    elements.btnSubmitMockAnswer.addEventListener('click', handleSubmitMockAnswer);
  }
  if (elements.btnNextMockQuestion) {
    elements.btnNextMockQuestion.addEventListener('click', handleNextMockQuestion);
  }
  if (elements.btnFinishMock) {
    elements.btnFinishMock.addEventListener('click', handleFinishMockInterview);
  }
  if (elements.btnRestartMock) {
    elements.btnRestartMock.addEventListener('click', resetMockInterview);
  }
  if (elements.btnMockBackDashboard) {
    elements.btnMockBackDashboard.addEventListener('click', () => {
      resetMockInterview();
      switchMainView('dashboard');
    });
  }

  // Resume File Upload Event Listeners
  if (elements.resumeFileInput) {
    elements.resumeFileInput.addEventListener('change', handleResumeFileSelect);
  }
  if (elements.btnRemoveFile) {
    elements.btnRemoveFile.addEventListener('click', clearSelectedResumeFile);
  }
  if (elements.formUploadResume) {
    elements.formUploadResume.addEventListener('submit', handleUploadResume);
  }
  if (elements.btnReanalyzeResume) {
    elements.btnReanalyzeResume.addEventListener('click', resetResumeView);
  }
  if (elements.btnResumeBackDashboard) {
    elements.btnResumeBackDashboard.addEventListener('click', () => {
      resetResumeView();
      switchMainView('dashboard');
    });
  }

  if (elements.resumeDropZone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      elements.resumeDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      elements.resumeDropZone.addEventListener(eventName, () => {
        elements.resumeDropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      elements.resumeDropZone.addEventListener(eventName, () => {
        elements.resumeDropZone.classList.remove('drag-over');
      });
    });

    elements.resumeDropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        elements.resumeFileInput.files = files;
        handleResumeFileSelect();
      }
    });
  }
}


// Toast Notifications Helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';
  if (type === 'warning') iconName = 'alert-circle';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;
  
  elements.toastContainer.appendChild(toast);
  initIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Switch Auth Forms
function switchAuthTab(tab) {
  if (tab === 'login') {
    elements.tabLogin.classList.add('active');
    elements.tabRegister.classList.remove('active');
    elements.formLogin.classList.remove('hidden');
    elements.formRegister.classList.add('hidden');
  } else {
    elements.tabRegister.classList.add('active');
    elements.tabLogin.classList.remove('active');
    elements.formRegister.classList.remove('hidden');
    elements.formLogin.classList.add('hidden');
  }
}

// Switch Main Views (Dashboard, Aptitude, Coding, Technical, Mock, Admin)
function switchMainView(viewName) {
  if (!state.currentUser) return;
  
  // Security check for admin view
  if (viewName === 'admin' && state.currentUser.is_admin !== 1) {
    showToast('Access denied. Admin privileges required.', 'error');
    switchMainView('dashboard');
    return;
  }

  state.currentView = viewName;

  // Hide all main views
  elements.dashboardView.classList.add('hidden');
  elements.aptitudeView.classList.add('hidden');
  elements.codingView.classList.add('hidden');
  if (elements.technicalView) elements.technicalView.classList.add('hidden');
  if (elements.mockView) elements.mockView.classList.add('hidden');
  if (elements.resumeView) elements.resumeView.classList.add('hidden');
  if (elements.progressView) elements.progressView.classList.add('hidden');
  if (elements.adminView) elements.adminView.classList.add('hidden');

  // Deactivate all nav links
  if (elements.btnNavDashboard) elements.btnNavDashboard.classList.remove('active');
  if (elements.btnNavAptitude) elements.btnNavAptitude.classList.remove('active');
  if (elements.btnNavCoding) elements.btnNavCoding.classList.remove('active');
  if (elements.btnNavTechnical) elements.btnNavTechnical.classList.remove('active');
  if (elements.btnNavMock) elements.btnNavMock.classList.remove('active');
  if (elements.btnNavResume) elements.btnNavResume.classList.remove('active');
  if (elements.btnNavProgress) elements.btnNavProgress.classList.remove('active');
  if (elements.btnNavAdmin) elements.btnNavAdmin.classList.remove('active');

  if (viewName === 'dashboard') {
    elements.dashboardView.classList.remove('hidden');
    if (elements.btnNavDashboard) elements.btnNavDashboard.classList.add('active');
    loadProgressSummaryForDashboard();
  } else if (viewName === 'aptitude') {
    elements.aptitudeView.classList.remove('hidden');
    if (elements.btnNavAptitude) elements.btnNavAptitude.classList.add('active');
  } else if (viewName === 'coding') {
    elements.codingView.classList.remove('hidden');
    if (elements.btnNavCoding) elements.btnNavCoding.classList.add('active');
    loadCodingQuestions();
  } else if (viewName === 'technical') {
    if (elements.technicalView) elements.technicalView.classList.remove('hidden');
    if (elements.btnNavTechnical) elements.btnNavTechnical.classList.add('active');
  } else if (viewName === 'mock') {
    if (elements.mockView) elements.mockView.classList.remove('hidden');
    if (elements.btnNavMock) elements.btnNavMock.classList.add('active');
  } else if (viewName === 'resume') {
    if (elements.resumeView) elements.resumeView.classList.remove('hidden');
    if (elements.btnNavResume) elements.btnNavResume.classList.add('active');
    loadResumeHistory();
  } else if (viewName === 'progress') {
    if (elements.progressView) elements.progressView.classList.remove('hidden');
    if (elements.btnNavProgress) elements.btnNavProgress.classList.add('active');
    loadProgressData();
  } else if (viewName === 'admin') {
    if (elements.adminView) elements.adminView.classList.remove('hidden');
    if (elements.btnNavAdmin) elements.btnNavAdmin.classList.add('active');
    switchAdminTab(state.admin.activeTab || 'stats');
  }
  initIcons();
}



// API Helper for fetch calls
async function apiCall(url, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return result;
  } catch (err) {
    console.error(`API Call Error (${url}):`, err);
    return { success: false, error: 'Network error or server unavailable.' };
  }
}

// Check Active Session
async function checkSession() {
  const res = await apiCall('/api/auth/me');
  if (res.success && res.user) {
    state.currentUser = res.user;
    applyUserPreferences(state.currentUser);
    updateUIState(true);
    await loadDashboardData();
  } else {
    state.currentUser = null;
    updateUIState(false);
  }
}

// Apply saved user preferences (theme, accent, language)
function applyUserPreferences(user) {
  if (!user) return;

  // Theme mode
  const mode = user.theme_mode || 'dark';
  if (mode === 'light') {
    document.body.classList.add('light-mode');
    const darkBtn = document.getElementById('theme-dark-btn');
    const lightBtn = document.getElementById('theme-light-btn');
    if (darkBtn) darkBtn.classList.remove('active');
    if (lightBtn) lightBtn.classList.add('active');
  } else {
    document.body.classList.remove('light-mode');
    const darkBtn = document.getElementById('theme-dark-btn');
    const lightBtn = document.getElementById('theme-light-btn');
    if (darkBtn) darkBtn.classList.add('active');
    if (lightBtn) lightBtn.classList.remove('active');
  }

  // Accent color
  const accent = user.accent_color || 'indigo';
  applyAccentColor(accent);
  document.querySelectorAll('.color-pill').forEach(p => {
    p.classList.toggle('active', p.getAttribute('data-theme') === accent);
  });

  // Language
  const lang = user.language || 'en';
  if (window.I18N) {
    window.I18N.setLanguage(lang);
    document.querySelectorAll('input[name="sys-lang"]').forEach(r => {
      r.checked = (r.value === lang);
      r.closest('.language-option') && r.closest('.language-option').classList.toggle('active', r.value === lang);
    });
  }

  // Avatar color
  const aColor = user.avatar_color || 'blue';
  const colorMap = {
    blue:    'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    emerald: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    purple:  'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    amber:   'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    rose:    'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)'
  };
  if (colorMap[aColor]) {
    if (elements.navAvatar) elements.navAvatar.style.background = colorMap[aColor];
    const preview = document.getElementById('settings-avatar-preview');
    if (preview) preview.style.background = colorMap[aColor];
  }
  document.querySelectorAll('.avatar-preset').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-color') === aColor);
  });
}

function applyAccentColor(theme) {
  const root = document.documentElement;
  const accentMap = {
    indigo:  ['#6366f1', '#8b5cf6'],
    emerald: ['#10b981', '#059669'],
    purple:  ['#a855f7', '#7c3aed'],
    amber:   ['#f59e0b', '#d97706'],
    cyan:    ['#06b6d4', '#0284c7']
  };
  const [primary, secondary] = accentMap[theme] || accentMap.indigo;
  root.style.setProperty('--accent-primary', primary);
  root.style.setProperty('--accent-secondary', secondary);
}

// Update UI Layout based on login status
function updateUIState(isLoggedIn) {
  if (isLoggedIn && state.currentUser) {
    elements.authView.classList.add('hidden');

    if (state.currentUser.is_admin === 1) {
      if (elements.btnNavAdmin) elements.btnNavAdmin.classList.remove('hidden');
    } else {
      if (elements.btnNavAdmin) elements.btnNavAdmin.classList.add('hidden');
      if (state.currentView === 'admin') state.currentView = 'dashboard';
    }

    switchMainView(state.currentView || 'dashboard');

    elements.guestNav.classList.add('hidden');
    elements.userNav.classList.remove('hidden');
    if (elements.navbar) {
      elements.navbar.classList.add('user-active');
      elements.navbar.classList.remove('guest-active');
    }

    const firstLetter = (state.currentUser.name || 'U').charAt(0).toUpperCase();
    if (state.currentUser.photo_url) {
      // Show photo in nav — replace avatar text with img
      elements.navAvatar.textContent = '';
      elements.navAvatar.style.background = 'none';
      elements.navAvatar.style.overflow = 'hidden';
      let navImg = document.getElementById('nav-avatar-img');
      if (!navImg) {
        navImg = document.createElement('img');
        navImg.id = 'nav-avatar-img';
        navImg.className = 'nav-avatar-photo';
        navImg.style.cssText = 'width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--accent-primary);';
        elements.navAvatar.appendChild(navImg);
      }
      navImg.src = state.currentUser.photo_url;
      navImg.alt = firstLetter;
    } else {
      // Remove photo if previously shown
      const oldImg = document.getElementById('nav-avatar-img');
      if (oldImg) oldImg.remove();
      elements.navAvatar.textContent = firstLetter;
    }
    elements.navUserName.textContent = state.currentUser.name;
    elements.navTargetRole.textContent = state.currentUser.is_admin === 1 ? 'Admin' : (state.currentUser.target_role || 'Student');

    if (elements.dropdownUserName) elements.dropdownUserName.textContent = state.currentUser.name || 'User';
    if (elements.dropdownUserEmail) elements.dropdownUserEmail.textContent = state.currentUser.email || '';

    elements.dashUserName.textContent = state.currentUser.name;
    elements.dashRoleDisplay.textContent = state.currentUser.target_role || 'Full Stack Developer';
  } else {
    elements.authView.classList.remove('hidden');
    elements.dashboardView.classList.add('hidden');
    elements.aptitudeView.classList.add('hidden');
    elements.codingView.classList.add('hidden');
    if (elements.technicalView) elements.technicalView.classList.add('hidden');
    if (elements.mockView) elements.mockView.classList.add('hidden');
    if (elements.resumeView) elements.resumeView.classList.add('hidden');
    if (elements.progressView) elements.progressView.classList.add('hidden');
    if (elements.adminView) elements.adminView.classList.add('hidden');

    elements.guestNav.classList.remove('hidden');
    elements.userNav.classList.add('hidden');
    if (elements.btnNavAdmin) elements.btnNavAdmin.classList.add('hidden');
    if (elements.navbar) {
      elements.navbar.classList.add('guest-active');
      elements.navbar.classList.remove('user-active');
    }
  }
  initIcons();
}

// ============================================================
//  Auth UI Helpers
// ============================================================

/** Setup a show/hide password toggle button */
function setupPasswordToggle(btnId, inputId, iconId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!btn || !input) return;
  btn.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    if (icon) icon.setAttribute('data-lucide', isHidden ? 'eye-off' : 'eye');
    initIcons();
  });
}

/** Show/clear a field-level error message */
function setFieldError(groupId, errorId, errorMsgId, message) {
  const group = document.getElementById(groupId);
  const errBox = document.getElementById(errorId);
  const errMsg = document.getElementById(errorMsgId);
  if (!errBox || !errMsg) return;
  if (message) {
    errBox.classList.remove('hidden');
    errMsg.textContent = message;
    if (group) group.querySelector('.input-wrapper')?.classList.add('input-error');
  } else {
    errBox.classList.add('hidden');
    errMsg.textContent = '';
    if (group) group.querySelector('.input-wrapper')?.classList.remove('input-error');
  }
}

/** Show/clear a form-level global error */
function setFormAlert(alertId, msgId, message, isError = true) {
  const alertEl = document.getElementById(alertId);
  const msgEl = document.getElementById(msgId);
  if (!alertEl || !msgEl) return;
  if (message) {
    alertEl.classList.remove('hidden');
    msgEl.textContent = message;
    // Ensure correct class
    alertEl.className = isError ? 'form-alert-error' : 'form-alert-success';
  } else {
    alertEl.classList.add('hidden');
    msgEl.textContent = '';
  }
  initIcons();
}

/** Set button loading state */
function setAuthBtnLoading(btnId, loading, defaultText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const textEl = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.btn-spinner');
  const arrow = btn.querySelector('.btn-arrow');
  btn.disabled = loading;
  if (spinner) spinner.classList.toggle('hidden', !loading);
  if (arrow) arrow.style.display = loading ? 'none' : '';
  if (textEl) textEl.textContent = loading ? 'Please wait…' : defaultText;
}

/** Password strength */
function updatePasswordStrength(pw) {
  const bar = document.getElementById('pw-strength-bar');
  const label = document.getElementById('pw-strength-label');
  if (!bar || !label) return;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const configs = [
    { pct: '0%',   color: 'transparent', text: '' },
    { pct: '25%',  color: '#ef4444',     text: 'Weak',      labelColor: '#f87171' },
    { pct: '50%',  color: '#f59e0b',     text: 'Fair',      labelColor: '#fbbf24' },
    { pct: '75%',  color: '#3b82f6',     text: 'Good',      labelColor: '#60a5fa' },
    { pct: '90%',  color: '#10b981',     text: 'Strong',    labelColor: '#34d399' },
    { pct: '100%', color: '#059669',     text: 'Very Strong', labelColor: '#10b981' }
  ];
  const cfg = configs[Math.min(score, 5)];
  bar.style.width = cfg.pct;
  bar.style.background = cfg.color;
  label.textContent = cfg.text || '';
  label.style.color = cfg.labelColor || '';
}

// ============================================================
//  Handle Login (Step 1 of 2FA)
//  Submits email + password. On success the server sends an OTP
//  and responds with { otpRequired: true }. The session is NOT
//  created until the user verifies the OTP via /api/auth/otp/verify.
// ============================================================
async function handleLogin(e) {
  e.preventDefault();
  const email = (document.getElementById('login-email')?.value || '').trim();
  const password = document.getElementById('login-password')?.value || '';

  // Clear previous errors
  setFieldError('login-email-group', 'login-email-error', 'login-email-error-msg', '');
  setFieldError('login-password-group', 'login-password-error', 'login-password-error-msg', '');
  setFormAlert('login-global-error', 'login-global-error-msg', '');

  // Client-side validation
  let hasError = false;
  if (!email) {
    setFieldError('login-email-group', 'login-email-error', 'login-email-error-msg', 'Email address is required.');
    hasError = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError('login-email-group', 'login-email-error', 'login-email-error-msg', 'Please enter a valid email address.');
    hasError = true;
  }
  if (!password) {
    setFieldError('login-password-group', 'login-password-error', 'login-password-error-msg', 'Password is required.');
    hasError = true;
  }
  if (hasError) return;

  setAuthBtnLoading('btn-login-submit', true, 'Sign In');

  const res = await apiCall('/api/auth/login', 'POST', { email, password });

  setAuthBtnLoading('btn-login-submit', false, 'Sign In');

  if (res.success && res.otpRequired) {
    // Credentials verified — server sent OTP to user's email, now show verification screen
    showOtpFromLoginResponse(email, res);
  } else {
    setFormAlert('login-global-error', 'login-global-error-msg', res.error || 'Invalid email or password.');
  }
}

// ============================================================
//  Handle Register
// ============================================================
async function handleRegister(e) {
  e.preventDefault();
  const name = (document.getElementById('reg-name')?.value || '').trim();
  const email = (document.getElementById('reg-email')?.value || '').trim();
  const password = document.getElementById('reg-password')?.value || '';
  const targetRole = document.getElementById('reg-role')?.value;
  const experienceLevel = document.getElementById('reg-level')?.value;

  // Clear previous errors
  setFieldError('reg-name-group', 'reg-name-error', 'reg-name-error-msg', '');
  setFieldError('reg-email-group', 'reg-email-error', 'reg-email-error-msg', '');
  setFieldError('reg-password-group', 'reg-password-error', 'reg-password-error-msg', '');
  setFormAlert('reg-global-error', 'reg-global-error-msg', '');

  // Client-side validation
  let hasError = false;
  if (!name || name.length < 2) {
    setFieldError('reg-name-group', 'reg-name-error', 'reg-name-error-msg', 'Full name must be at least 2 characters.');
    hasError = true;
  }
  if (!email) {
    setFieldError('reg-email-group', 'reg-email-error', 'reg-email-error-msg', 'Email address is required.');
    hasError = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError('reg-email-group', 'reg-email-error', 'reg-email-error-msg', 'Please enter a valid email address.');
    hasError = true;
  }
  if (!password || password.length < 6) {
    setFieldError('reg-password-group', 'reg-password-error', 'reg-password-error-msg', 'Password must be at least 6 characters.');
    hasError = true;
  }
  if (hasError) return;

  setAuthBtnLoading('btn-reg-submit', true, 'Create Account');

  const res = await apiCall('/api/auth/register', 'POST', { name, email, password, targetRole, experienceLevel });

  setAuthBtnLoading('btn-reg-submit', false, 'Create Account');

  if (res.success && res.otpRequired) {
    // Account created — now verify email before granting dashboard access
    showOtpFromLoginResponse(email, res);
  } else {
    // Map backend field errors
    const err = res.error || 'Registration failed.';
    if (err.toLowerCase().includes('email')) {
      setFieldError('reg-email-group', 'reg-email-error', 'reg-email-error-msg', err);
    } else if (err.toLowerCase().includes('password')) {
      setFieldError('reg-password-group', 'reg-password-error', 'reg-password-error-msg', err);
    } else if (err.toLowerCase().includes('name')) {
      setFieldError('reg-name-group', 'reg-name-error', 'reg-name-error-msg', err);
    } else {
      setFormAlert('reg-global-error', 'reg-global-error-msg', err);
    }
  }
}

// ============================================================
//  OTP Panel Setup
// ============================================================
const otp = {
  email: '',
  resendTimer: null,
  expiryTimer: null,
  resendCountdown: 60,
  expirySeconds: 300
};

function setupOtpPanel() {
  const otpInputs = document.querySelectorAll('.otp-box');

  otpInputs.forEach((box, idx) => {
    // Only allow digits
    box.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val ? val[0] : '';
      box.classList.toggle('otp-filled', !!e.target.value);
      if (e.target.value && idx < 3) {
        const next = document.getElementById(`otp-${idx + 1}`);
        if (next) next.focus();
      }
    });

    // Backspace: clear current then move back
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) {
        const prev = document.getElementById(`otp-${idx - 1}`);
        if (prev) { prev.value = ''; prev.classList.remove('otp-filled'); prev.focus(); }
      }
      // Arrow key navigation
      if (e.key === 'ArrowLeft' && idx > 0) document.getElementById(`otp-${idx - 1}`)?.focus();
      if (e.key === 'ArrowRight' && idx < 3) document.getElementById(`otp-${idx + 1}`)?.focus();
    });

    // Paste: distribute across boxes
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 4);
      if (!pasted) return;
      [...pasted].forEach((char, i) => {
        const target = document.getElementById(`otp-${i}`);
        if (target) { target.value = char; target.classList.add('otp-filled'); }
      });
      const lastFilled = Math.min(pasted.length - 1, 3);
      document.getElementById(`otp-${lastFilled}`)?.focus();
    });
  });

  // Verify button
  const btnVerify = document.getElementById('btn-verify-otp');
  if (btnVerify) btnVerify.addEventListener('click', handleVerifyOtp);

  // Resend button
  const btnResend = document.getElementById('btn-resend-otp');
  if (btnResend) btnResend.addEventListener('click', handleResendOtp);

  // Back button
  const btnBack = document.getElementById('btn-otp-back');
  if (btnBack) btnBack.addEventListener('click', () => showOtpPanel(false));
}

/** Show or hide the OTP panel vs the main auth panel */
function showOtpPanel(show) {
  const authPanel = document.getElementById('auth-panel');
  const otpPanel = document.getElementById('otp-panel');
  if (!authPanel || !otpPanel) return;
  if (show) {
    authPanel.classList.add('hidden');
    otpPanel.classList.remove('hidden');
    // Focus first OTP box
    document.getElementById('otp-0')?.focus();
  } else {
    clearOtpTimers();
    resetOtpBoxes();
    authPanel.classList.remove('hidden');
    otpPanel.classList.add('hidden');
  }
}

function resetOtpBoxes() {
  for (let i = 0; i < 4; i++) {
    const box = document.getElementById(`otp-${i}`);
    if (box) { box.value = ''; box.className = 'otp-box'; }
  }
  setFormAlert('otp-error', 'otp-error-msg', '');
  const successEl = document.getElementById('otp-success-msg');
  if (successEl) successEl.classList.add('hidden');
}

function clearOtpTimers() {
  if (otp.resendTimer) { clearInterval(otp.resendTimer); otp.resendTimer = null; }
  if (otp.expiryTimer) { clearInterval(otp.expiryTimer); otp.expiryTimer = null; }
}

/**
 * Start a server-driven resend cooldown for `seconds` seconds.
 * Only called when the backend returns waitSeconds in a 429 response.
 * The button is locked for exactly the time the server says to wait.
 */
function startResendCooldown(seconds) {
  if (otp.resendTimer) { clearInterval(otp.resendTimer); otp.resendTimer = null; }
  const countdownEl = document.getElementById('otp-countdown');
  const btnResend   = document.getElementById('btn-resend-otp');
  let remaining = Math.max(1, Math.ceil(seconds));
  if (btnResend) btnResend.disabled = true;
  if (countdownEl) countdownEl.textContent = `(${remaining}s)`;
  otp.resendTimer = setInterval(() => {
    remaining--;
    if (countdownEl) countdownEl.textContent = remaining > 0 ? `(${remaining}s)` : '';
    if (remaining <= 0) {
      clearInterval(otp.resendTimer);
      otp.resendTimer = null;
      if (btnResend) { btnResend.disabled = false; setResendBtnNormal(btnResend); }
    }
  }, 1000);
}

/** Enable the resend button immediately (no countdown) */
function enableResendBtn() {
  if (otp.resendTimer) { clearInterval(otp.resendTimer); otp.resendTimer = null; }
  const countdownEl = document.getElementById('otp-countdown');
  const btnResend   = document.getElementById('btn-resend-otp');
  if (countdownEl) countdownEl.textContent = '';
  if (btnResend) { btnResend.disabled = false; setResendBtnNormal(btnResend); }
}

function setResendBtnNormal(btn) {
  const t = btn.querySelector('.resend-text');
  const s = btn.querySelector('.resend-spinner');
  if (t) t.textContent = 'Resend OTP';
  if (s) s.classList.add('hidden');
  btn.disabled = false;
}

/** Start only the 5-minute expiry countdown. Resend button is left enabled. */
function startOtpTimers() {
  clearOtpTimers();

  // Resend button: immediately available — no hardcoded frontend lockout.
  // The server enforces its own 60 s DB cooldown and returns waitSeconds
  // in the 429 if the user clicks too soon. See handleResendOtp().
  enableResendBtn();

  // Expiry countdown (5 min)
  otp.expirySeconds = 300;
  const expiryEl = document.getElementById('otp-expiry-timer');
  const updateExpiry = () => {
    if (!expiryEl) return;
    const m = Math.floor(otp.expirySeconds / 60);
    const s = otp.expirySeconds % 60;
    expiryEl.textContent = `${m}:${String(s).padStart(2, '0')}`;
    expiryEl.style.color = otp.expirySeconds <= 60 ? '#f87171' : '';
  };
  updateExpiry();

  otp.expiryTimer = setInterval(() => {
    otp.expirySeconds--;
    updateExpiry();
    if (otp.expirySeconds <= 0) {
      clearInterval(otp.expiryTimer);
      otp.expiryTimer = null;
      setFormAlert('otp-error', 'otp-error-msg', 'Your OTP has expired. Please request a new one.');
      const btnVerify = document.getElementById('btn-verify-otp');
      if (btnVerify) btnVerify.disabled = true;
    }
  }, 1000);
}

// ============================================================
//  Handle "Sign In with OTP" button click
//  Security note: OTP is now ALWAYS part of the password login flow.
//  There is no password-less email-only OTP bypass.
//  This button guides the user to enter their password and click Sign In.
// ============================================================
function handleLoginWithOtp() {
  setFormAlert('login-global-error', 'login-global-error-msg', '');

  const email = (document.getElementById('login-email')?.value || '').trim();
  const password = document.getElementById('login-password')?.value || '';

  if (!email || !password) {
    // Prompt the user to fill in both fields then click Sign In
    setFormAlert('login-global-error', 'login-global-error-msg',
      'Enter your email and password above, then click Sign In — an OTP will be sent automatically.',
      false // info-style (not error)
    );
    if (!email) document.getElementById('login-email')?.focus();
    else document.getElementById('login-password')?.focus();
    return;
  }

  // Both fields filled — just submit the login form which triggers OTP flow
  document.getElementById('form-login')?.requestSubmit();
}

/**
 * Show the OTP verification panel using the response returned by /api/auth/login.
 * Called after credentials are verified and the server has already sent the OTP.
 */
function showOtpFromLoginResponse(email, res) {
  otp.email = email;
  // Update masked email display
  const maskedEl = document.getElementById('otp-masked-email');
  if (maskedEl) maskedEl.textContent = res.maskedEmail || email;
  // Show dev-mode notice if SMTP is not configured
  const devNotice = document.getElementById('otp-dev-notice');
  if (devNotice) devNotice.classList.toggle('hidden', !res.devMode);
  showOtpPanel(true);
  startOtpTimers();
  showToast(res.message || 'OTP sent — please check your email.', 'info');
}

async function handleVerifyOtp() {
  // Collect 4 digits
  const digits = [];
  for (let i = 0; i < 4; i++) {
    const box = document.getElementById(`otp-${i}`);
    digits.push(box?.value || '');
  }
  const otpCode = digits.join('');

  setFormAlert('otp-error', 'otp-error-msg', '');

  if (otpCode.length !== 4 || !/^\d{4}$/.test(otpCode)) {
    setFormAlert('otp-error', 'otp-error-msg', 'Please enter all 4 digits of your OTP.');
    document.querySelectorAll('.otp-box').forEach(b => b.classList.add('otp-error-state'));
    setTimeout(() => document.querySelectorAll('.otp-box').forEach(b => b.classList.remove('otp-error-state')), 600);
    return;
  }

  const btnVerify = document.getElementById('btn-verify-otp');
  if (btnVerify) {
    btnVerify.disabled = true;
    const textEl = btnVerify.querySelector('.btn-text');
    const spinner = btnVerify.querySelector('.btn-spinner');
    if (textEl) textEl.textContent = 'Verifying…';
    if (spinner) spinner.classList.remove('hidden');
  }

  const res = await apiCall('/api/auth/otp/verify', 'POST', { email: otp.email, otp: otpCode });

  if (btnVerify) {
    btnVerify.disabled = false;
    const textEl = btnVerify.querySelector('.btn-text');
    const spinner = btnVerify.querySelector('.btn-spinner');
    if (textEl) textEl.textContent = 'Verify OTP';
    if (spinner) spinner.classList.add('hidden');
  }

  if (res.success && res.user) {
    // Mark boxes as success
    document.querySelectorAll('.otp-box').forEach(b => { b.classList.add('otp-success-state'); b.classList.remove('otp-error-state'); });
    const successEl = document.getElementById('otp-success-msg');
    if (successEl) successEl.classList.remove('hidden');
    clearOtpTimers();
    setTimeout(() => {
      state.currentUser = res.user;
      showOtpPanel(false);
      updateUIState(true);
      loadDashboardData();
    }, 900);
  } else {
    document.querySelectorAll('.otp-box').forEach(b => b.classList.add('otp-error-state'));
    setTimeout(() => document.querySelectorAll('.otp-box').forEach(b => b.classList.remove('otp-error-state')), 600);
    setFormAlert('otp-error', 'otp-error-msg', res.error || 'Incorrect OTP. Please try again.');
  }
  initIcons();
}

async function handleResendOtp() {
  const btnResend = document.getElementById('btn-resend-otp');
  if (!btnResend || btnResend.disabled) return; // guard double-click

  // Show loading state while request is in flight
  btnResend.disabled = true;
  const textEl    = btnResend.querySelector('.resend-text');
  const spinnerEl = btnResend.querySelector('.resend-spinner');
  if (textEl)    textEl.textContent = 'Sending…';
  if (spinnerEl) spinnerEl.classList.remove('hidden');

  const res = await apiCall('/api/auth/otp/resend', 'POST', { email: otp.email });

  // Restore button text/spinner regardless of outcome
  if (textEl)    textEl.textContent = 'Resend OTP';
  if (spinnerEl) spinnerEl.classList.add('hidden');

  if (res.success) {
    resetOtpBoxes();
    showToast('A new OTP has been sent — check your email.', 'success');
    // Keep expiry timer running from its current position (OTP was just refreshed).
    // Re-enable the resend button immediately; server cooldown handles abuse.
    enableResendBtn();
    const btnVerify = document.getElementById('btn-verify-otp');
    if (btnVerify) btnVerify.disabled = false;
  } else {
    setFormAlert('otp-error', 'otp-error-msg', res.error || 'Could not resend OTP.');
    // If the server returned a specific wait time, lock the button for exactly that long.
    // Otherwise re-enable immediately so the user can retry.
    if (typeof res.waitSeconds === 'number' && res.waitSeconds > 0) {
      startResendCooldown(res.waitSeconds);
    } else {
      enableResendBtn();
    }
  }
  initIcons();
}

// ============================================================
//  Handle Logout
// ============================================================
async function handleLogout() {
  const res = await apiCall('/api/auth/logout', 'POST');
  if (res.success) {
    showToast('Logged out successfully.', 'info');
    state.currentUser = null;
    state.dashboard = null;
    updateUIState(false);
  } else {
    showToast('Error logging out.', 'error');
  }
}

// Dashboard Data
async function loadDashboardData() {
  const res = await apiCall('/api/dashboard/summary');
  if (res.success && res.data) {
    state.dashboard = res.data;
    renderDashboard(res.data);
  } else {
    showToast(res.error || 'Could not load dashboard stats.', 'error');
  }
}

function renderDashboard(data) {
  if (!data) return;
  const { stats, practiceTopics, upcomingSchedule } = data;

  if (stats) {
    const readinessScore = stats.readiness_score !== undefined ? stats.readiness_score : 65;
    if (elements.statReadiness) elements.statReadiness.textContent = `${readinessScore}%`;
    if (elements.statReadinessBar) elements.statReadinessBar.style.width = `${readinessScore}%`;

    if (elements.statReadinessLabel) {
      if (readinessScore >= 80) {
        elements.statReadinessLabel.textContent = 'Interview Ready 🎯';
        elements.statReadinessLabel.className = 'badge badge-success';
      } else if (readinessScore >= 50) {
        elements.statReadinessLabel.textContent = 'On Track 📈';
        elements.statReadinessLabel.className = 'badge badge-accent';
      } else {
        elements.statReadinessLabel.textContent = 'Needs Practice 💡';
        elements.statReadinessLabel.className = 'badge badge-warning';
      }
    }

    if (elements.statHours) elements.statHours.textContent = stats.practice_hours !== undefined ? stats.practice_hours : 0;
    if (elements.statTopics) elements.statTopics.textContent = stats.topics_mastered !== undefined ? stats.topics_mastered : 0;
    if (elements.statInterviews) elements.statInterviews.textContent = stats.interviews_completed !== undefined ? stats.interviews_completed : 0;
  }

  if (elements.topicsContainer) {
    elements.topicsContainer.innerHTML = '';
    if (practiceTopics && practiceTopics.length > 0) {
      practiceTopics.forEach(topic => {
        const topicRow = document.createElement('div');
        topicRow.className = 'topic-row';

        const isMastered = topic.progress >= 80;
        const statusBadgeClass = isMastered ? 'badge-success' : 'badge-accent';

        topicRow.innerHTML = `
          <div class="topic-info">
            <div class="topic-title-row">
              <span class="topic-name">${topic.title}</span>
              <span class="badge ${statusBadgeClass}">${topic.category}</span>
            </div>
            <span class="card-subtitle">${topic.totalQuestions} Questions Available</span>
          </div>

          <div class="topic-progress-wrapper">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${topic.progress}%;"></div>
            </div>
            <span class="metric-unit" style="font-weight: 600;">${topic.progress}%</span>
          </div>
        `;
        elements.topicsContainer.appendChild(topicRow);
      });
    } else {
      elements.topicsContainer.innerHTML = '<p class="text-muted">No practice topics assigned yet.</p>';
    }
  }

  if (elements.scheduleContainer) {
    elements.scheduleContainer.innerHTML = '';
    if (upcomingSchedule && upcomingSchedule.length > 0) {
      upcomingSchedule.forEach(item => {
        const scheduleDiv = document.createElement('div');
        scheduleDiv.className = 'schedule-item';
        scheduleDiv.innerHTML = `
          <div class="schedule-title">${item.title}</div>
          <div class="schedule-meta">
            <span><i data-lucide="clock" class="icon-sm"></i> ${item.date}</span>
            <span class="badge badge-accent">${item.type}</span>
          </div>
        `;
        elements.scheduleContainer.appendChild(scheduleDiv);
      });
    } else {
      elements.scheduleContainer.innerHTML = '<p class="text-muted">No upcoming sessions scheduled.</p>';
    }
  }

  initIcons();
}

// Settings Modal & Panel Controller
function openSettingsModal(defaultSection = 'profile') {
  if (!state.currentUser) return;

  if (elements.editRole) elements.editRole.value = state.currentUser.target_role || 'Full Stack Developer';
  if (elements.editLevel) elements.editLevel.value = state.currentUser.experience_level || 'Entry Level (0-2 yrs)';

  const editName = document.getElementById('edit-profile-name');
  const editEmail = document.getElementById('edit-profile-email');
  const avatarPreview = document.getElementById('settings-avatar-preview');
  
  if (editName) editName.value = state.currentUser.name || 'User';
  if (editEmail) editEmail.value = state.currentUser.email || '';
  if (avatarPreview) {
    const firstChar = (state.currentUser.name || 'U').charAt(0).toUpperCase();
    avatarPreview.textContent = firstChar;
  }

  switchSettingsTab(defaultSection);

  if (elements.modalSettings) {
    elements.modalSettings.classList.remove('hidden');
  }
  initIcons();
}

function closeSettingsModal() {
  if (elements.modalSettings) {
    elements.modalSettings.classList.add('hidden');
  }
}

function switchSettingsTab(sectionId) {
  const navItems = document.querySelectorAll('.settings-nav-item');
  const panes = document.querySelectorAll('.settings-pane');

  navItems.forEach(item => {
    if (item.getAttribute('data-section') === sectionId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  panes.forEach(pane => {
    if (pane.id === `settings-pane-${sectionId}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  initIcons();
}

// Setup Settings Interactive Handlers (Sidebar, Themes, Language, Photo, FAQ, Support)
function setupSettingsHandlers() {
  // Sidebar tab click
  const navList = document.getElementById('settings-sidebar-nav');
  if (navList) {
    navList.addEventListener('click', (e) => {
      const btn = e.target.closest('.settings-nav-item');
      if (btn) { const sec = btn.getAttribute('data-section'); if (sec) switchSettingsTab(sec); }
    });
  }

  // Avatar Color Presets
  const avatarPicker = document.getElementById('avatar-preset-picker');
  if (avatarPicker) {
    avatarPicker.addEventListener('click', async (e) => {
      const btn = e.target.closest('.avatar-preset');
      if (!btn) return;
      avatarPicker.querySelectorAll('.avatar-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const color = btn.getAttribute('data-color');
      const colorMap = {
        blue:    'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        emerald: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        purple:  'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        amber:   'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
        rose:    'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)'
      };
      const preview = document.getElementById('settings-avatar-preview');
      if (colorMap[color]) {
        if (preview) preview.style.background = colorMap[color];
        if (elements.navAvatar) elements.navAvatar.style.background = colorMap[color];
      }
      if (state.currentUser) {
        state.currentUser.avatar_color = color;
        await apiCall('/api/preferences', 'POST', { avatar_color: color });
        showToast('Avatar theme updated!', 'info');
      }
    });
  }

  // Accent Color Palette — persisted to server
  const colorPicker = document.getElementById('theme-color-picker');
  if (colorPicker) {
    colorPicker.addEventListener('click', async (e) => {
      const pill = e.target.closest('.color-pill');
      if (!pill) return;
      colorPicker.querySelectorAll('.color-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const theme = pill.getAttribute('data-theme');
      applyAccentColor(theme);
      if (state.currentUser) {
        state.currentUser.accent_color = theme;
        await apiCall('/api/preferences', 'POST', { accent_color: theme });
        showToast(window.I18N ? window.I18N.t('toast_accent_changed') : 'Accent color updated!', 'success');
      }
    });
  }

  // Dark / Light Mode — toggles body.light-mode class + persists
  const darkBtn = document.getElementById('theme-dark-btn');
  const lightBtn = document.getElementById('theme-light-btn');
  if (darkBtn && lightBtn) {
    darkBtn.addEventListener('click', async () => {
      darkBtn.classList.add('active');
      lightBtn.classList.remove('active');
      document.body.classList.remove('light-mode');
      if (state.currentUser) {
        state.currentUser.theme_mode = 'dark';
        await apiCall('/api/preferences', 'POST', { theme_mode: 'dark' });
        showToast(window.I18N ? window.I18N.t('toast_theme_changed') : 'Dark mode enabled.', 'info');
      }
    });
    lightBtn.addEventListener('click', async () => {
      lightBtn.classList.add('active');
      darkBtn.classList.remove('active');
      document.body.classList.add('light-mode');
      if (state.currentUser) {
        state.currentUser.theme_mode = 'light';
        await apiCall('/api/preferences', 'POST', { theme_mode: 'light' });
        showToast(window.I18N ? window.I18N.t('toast_theme_changed') : 'Light mode enabled.', 'info');
      }
    });
  }

  // Language Selection — applies I18N + persists
  const langGrid = document.querySelector('.language-grid');
  if (langGrid) {
    langGrid.addEventListener('change', async (e) => {
      if (e.target.name !== 'sys-lang') return;
      const lang = e.target.value;
      document.querySelectorAll('.language-option').forEach(opt => {
        const inp = opt.querySelector('input');
        if (inp) opt.classList.toggle('active', inp.value === lang);
      });
      if (window.I18N) window.I18N.setLanguage(lang);
      if (state.currentUser) {
        state.currentUser.language = lang;
        await apiCall('/api/preferences', 'POST', { language: lang });
        showToast(window.I18N ? window.I18N.t('toast_lang_changed') : 'Language changed!', 'success');
      }
    });
  }

  // Profile Photo Upload
  const photoInput    = document.getElementById('input-photo-upload');
  const photoPreviewEl= document.getElementById('settings-photo-preview');
  const avatarPreviewEl = document.getElementById('settings-avatar-preview');
  const btnSavePhoto  = document.getElementById('btn-save-photo');
  const btnRemovePhoto= document.getElementById('btn-remove-photo');
  const btnTrigger    = document.getElementById('btn-trigger-photo-upload');
  let pendingPhotoFile = null;

  if (btnTrigger && photoInput) btnTrigger.addEventListener('click', () => photoInput.click());

  if (photoInput) {
    photoInput.addEventListener('change', () => {
      const file = photoInput.files[0];
      if (!file) return;
      if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) {
        showToast('Only JPG, PNG, WebP, or GIF images allowed.', 'error');
        photoInput.value = ''; return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('Photo must be under 5 MB.', 'error');
        photoInput.value = ''; return;
      }
      pendingPhotoFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (photoPreviewEl) { photoPreviewEl.src = ev.target.result; photoPreviewEl.classList.remove('hidden'); }
        if (avatarPreviewEl) avatarPreviewEl.classList.add('hidden');
        if (btnSavePhoto) btnSavePhoto.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnSavePhoto) {
    btnSavePhoto.addEventListener('click', async () => {
      if (!pendingPhotoFile) return;
      const formData = new FormData();
      formData.append('photo', pendingPhotoFile);
      btnSavePhoto.disabled = true;
      const origText = btnSavePhoto.querySelector('span') ? btnSavePhoto.querySelector('span').textContent : 'Save Photo';
      if (btnSavePhoto.querySelector('span')) btnSavePhoto.querySelector('span').textContent = 'Saving…';
      try {
        const resp = await fetch('/api/preferences/photo', { method: 'POST', body: formData });
        const result = await resp.json();
        if (result.success) {
          state.currentUser.photo_url = result.photo_url;
          updateUIState(true);
          if (photoPreviewEl) photoPreviewEl.src = result.photo_url;
          pendingPhotoFile = null;
          if (btnSavePhoto) btnSavePhoto.classList.add('hidden');
          showToast(window.I18N ? window.I18N.t('toast_photo_saved') : 'Profile photo updated!', 'success');
        } else {
          showToast(result.error || 'Upload failed.', 'error');
        }
      } catch { showToast('Network error during upload.', 'error'); }
      btnSavePhoto.disabled = false;
      if (btnSavePhoto.querySelector('span')) btnSavePhoto.querySelector('span').textContent = origText;
      initIcons();
    });
  }

  if (btnRemovePhoto) {
    btnRemovePhoto.addEventListener('click', async () => {
      if (!state.currentUser || !state.currentUser.photo_url) { showToast('No photo to remove.', 'info'); return; }
      const res = await apiCall('/api/preferences/photo', 'DELETE');
      if (res.success) {
        state.currentUser.photo_url = null;
        pendingPhotoFile = null;
        if (photoPreviewEl) { photoPreviewEl.classList.add('hidden'); photoPreviewEl.src = ''; }
        if (avatarPreviewEl) avatarPreviewEl.classList.remove('hidden');
        if (btnSavePhoto) btnSavePhoto.classList.add('hidden');
        if (photoInput) photoInput.value = '';
        updateUIState(true);
        showToast(window.I18N ? window.I18N.t('toast_photo_removed') : 'Profile photo removed.', 'info');
      } else { showToast(res.error || 'Failed to remove photo.', 'error'); }
    });
  }

  // FAQ Accordion
  const faqList = document.querySelectorAll('.faq-question');
  faqList.forEach(q => { q.addEventListener('click', () => { const item = q.closest('.faq-item'); if (item) item.classList.toggle('open'); }); });

  // Support Form
  const suppForm = document.getElementById('form-support-ticket');
  if (suppForm) {
    suppForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Support ticket submitted! Our team will get back to you shortly.', 'success');
      suppForm.reset();
    });
  }

  // Logout All Devices
  const btnLogoutAll = document.getElementById('btn-logout-all-devices');
  if (btnLogoutAll) { btnLogoutAll.addEventListener('click', () => { closeSettingsModal(); handleLogout(); }); }
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const targetRole = elements.editRole.value;
  const experienceLevel = elements.editLevel.value;
  const editName = document.getElementById('edit-profile-name');

  const nameVal = editName ? editName.value.trim() : state.currentUser.name;

  const res = await apiCall('/api/dashboard/profile', 'PUT', {
    targetRole,
    experienceLevel,
    name: nameVal
  });

  if (res.success) {
    showToast('Profile & Target Role updated successfully!', 'success');
    closeSettingsModal();
    
    if (nameVal) state.currentUser.name = nameVal;
    state.currentUser.target_role = targetRole;
    state.currentUser.experience_level = experienceLevel;
    updateUIState(true);
    await loadDashboardData();
  } else {
    showToast(res.error || 'Failed to update profile.', 'error');
  }
}

/* ==========================================================================
   APTITUDE PRACTICE MODULE CONTROLLER
   ========================================================================== */

async function handleStartAptitudeTest(e) {
  e.preventDefault();
  const category = elements.aptitudeCategory.value;
  const difficulty = elements.aptitudeDifficulty.value;
  const limit = elements.aptitudeLimit.value;

  const btnStart = document.getElementById('btn-start-test');
  btnStart.disabled = true;

  const query = new URLSearchParams({ category, difficulty, limit }).toString();
  const res = await apiCall(`/api/aptitude/questions?${query}`);

  btnStart.disabled = false;

  if (res.success && res.questions && res.questions.length > 0) {
    state.aptitude.questions = res.questions;
    state.aptitude.currentIndex = 0;
    state.aptitude.userAnswers = {};
    state.aptitude.category = category;
    state.aptitude.difficulty = difficulty;

    elements.testCategoryBadge.textContent = category;
    elements.testDifficultyBadge.textContent = difficulty;

    elements.aptitudeConfigCard.classList.add('hidden');
    elements.aptitudeResultsCard.classList.add('hidden');
    elements.aptitudeTestCard.classList.remove('hidden');

    renderAptitudeQuestion(0);
    showToast(`Loaded ${res.questions.length} questions from database. Good luck!`, 'success');
  } else {
    showToast('No questions found matching selected filter criteria. Try another filter.', 'warning');
  }
}

function renderAptitudeQuestion(index) {
  const questions = state.aptitude.questions;
  if (!questions || index < 0 || index >= questions.length) return;

  state.aptitude.currentIndex = index;
  const currentQ = questions[index];
  const total = questions.length;

  elements.currentQuestionNum.textContent = index + 1;
  elements.totalQuestionsNum.textContent = total;
  const progressPct = Math.round(((index + 1) / total) * 100);
  elements.testProgressBar.style.width = `${progressPct}%`;

  elements.questionPillsContainer.innerHTML = '';
  questions.forEach((q, i) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = `q-pill ${i === index ? 'active' : ''} ${state.aptitude.userAnswers[q.id] ? 'answered' : ''}`;
    pill.textContent = i + 1;
    pill.addEventListener('click', () => renderAptitudeQuestion(i));
    elements.questionPillsContainer.appendChild(pill);
  });

  elements.questionText.textContent = `${index + 1}. ${currentQ.question}`;

  elements.optionsContainer.innerHTML = '';
  const optionKeys = ['option_a', 'option_b', 'option_c', 'option_d'];
  const optionLabels = ['A', 'B', 'C', 'D'];

  optionKeys.forEach((key, optIdx) => {
    const optCard = document.createElement('div');
    const isSelected = state.aptitude.userAnswers[currentQ.id] === key;
    optCard.className = `option-card ${isSelected ? 'selected' : ''}`;
    optCard.innerHTML = `
      <div class="option-prefix">${optionLabels[optIdx]}</div>
      <div class="option-text">${currentQ[key]}</div>
    `;

    optCard.addEventListener('click', () => {
      state.aptitude.userAnswers[currentQ.id] = key;
      renderAptitudeQuestion(index);
    });

    elements.optionsContainer.appendChild(optCard);
  });

  elements.btnPrevQuestion.disabled = (index === 0);

  if (index === total - 1) {
    elements.btnNextQuestion.classList.add('hidden');
    elements.btnSubmitTest.classList.remove('hidden');
  } else {
    elements.btnNextQuestion.classList.remove('hidden');
    elements.btnSubmitTest.add('hidden');
  }

  initIcons();
}

function navigateAptitudeQuestion(direction) {
  const newIndex = state.aptitude.currentIndex + direction;
  renderAptitudeQuestion(newIndex);
}

async function handleSubmitAptitudeTest() {
  const questions = state.aptitude.questions;
  const answeredCount = Object.keys(state.aptitude.userAnswers).length;
  const unAnsweredCount = questions.length - answeredCount;

  if (unAnsweredCount > 0) {
    const confirmSubmit = confirm(`You have ${unAnsweredCount} unanswered question(s). Are you sure you want to submit?`);
    if (!confirmSubmit) return;
  }

  const btnSubmit = elements.btnSubmitTest;
  btnSubmit.disabled = true;

  const res = await apiCall('/api/aptitude/submit', 'POST', {
    category: state.aptitude.category,
    difficulty: state.aptitude.difficulty,
    answers: state.aptitude.userAnswers
  });

  btnSubmit.disabled = false;

  if (res.success && res.data) {
    renderAptitudeResults(res.data);
    showToast('Aptitude test submitted successfully!', 'success');
    loadDashboardData();
  } else {
    showToast(res.error || 'Failed to submit test.', 'error');
  }
}

function renderAptitudeResults(data) {
  const { score, totalQuestions, correctAnswers, wrongAnswers, percentage, questionResults } = data;

  elements.aptitudeTestCard.classList.add('hidden');
  elements.aptitudeResultsCard.classList.remove('hidden');

  elements.resPercentage.textContent = `${percentage}%`;
  elements.resTotal.textContent = totalQuestions;
  elements.resCorrect.textContent = correctAnswers;
  elements.resWrong.textContent = wrongAnswers;
  elements.resScore.textContent = `${score} / ${totalQuestions}`;

  if (percentage >= 80) {
    elements.resTitle.textContent = 'Outstanding Performance! 🎯';
    elements.resSubtitle.textContent = 'Excellent problem-solving skills. You are well prepared!';
  } else if (percentage >= 50) {
    elements.resTitle.textContent = 'Good Effort! 📈';
    elements.resSubtitle.textContent = 'Nice job! Review the explanations below to improve further.';
  } else {
    elements.resTitle.textContent = 'Needs Practice 💡';
    elements.resSubtitle.textContent = 'Keep practicing! Review detailed solutions below to master concepts.';
  }

  elements.explanationsContainer.innerHTML = '';
  const optionLabels = { option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D' };

  questionResults.forEach((q, i) => {
    const item = document.createElement('div');
    item.className = `explanation-item ${q.isCorrect ? 'is-correct' : 'is-wrong'}`;

    const statusBadge = q.isCorrect
      ? '<span class="badge badge-success">Correct ✓</span>'
      : '<span class="badge badge-warning">Incorrect ✗</span>';

    const selectedLabel = q.selectedOption ? `${optionLabels[q.selectedOption]}: ${q[q.selectedOption]}` : 'Not Answered';
    const correctLabel = `${optionLabels[q.correctAnswer]}: ${q[q.correctAnswer]}`;

    item.innerHTML = `
      <div class="item-header">
        <span class="item-question">Q${i + 1}. ${q.question}</span>
        ${statusBadge}
      </div>

      <div class="answer-summary-row">
        <div><span class="ans-label">Your Choice:</span><span class="ans-val ${q.isCorrect ? 'text-success' : 'text-danger'}">${selectedLabel}</span></div>
        <div><span class="ans-label">Correct Answer:</span><span class="ans-val text-success">${correctLabel}</span></div>
      </div>

      <div class="explanation-box">
        <div class="exp-title"><i data-lucide="lightbulb" class="icon-sm"></i> Explanation</div>
        <div>${q.explanation}</div>
      </div>
    `;

    elements.explanationsContainer.appendChild(item);
  });

  initIcons();
}

function resetAptitudeTest() {
  state.aptitude.questions = [];
  state.aptitude.currentIndex = 0;
  state.aptitude.userAnswers = {};

  elements.aptitudeConfigCard.classList.remove('hidden');
  elements.aptitudeTestCard.classList.add('hidden');
  elements.aptitudeResultsCard.classList.add('hidden');
}


/* ==========================================================================
   CODING PRACTICE MODULE CONTROLLER
   ========================================================================== */

// Load Coding Questions from API
async function loadCodingQuestions() {
  const res = await apiCall('/api/coding/questions');
  if (res.success && res.questions) {
    state.coding.questions = res.questions;
    renderCodingProblemList();
    
    // Select first question by default if none selected
    if (res.questions.length > 0 && !state.coding.selectedQuestion) {
      selectCodingQuestion(res.questions[0].id);
    }
  } else {
    showToast(res.error || 'Failed to load coding questions.', 'error');
  }
}

// Render Problem Directory List
function renderCodingProblemList() {
  if (!elements.codingProblemList) return;
  elements.codingProblemList.innerHTML = '';

  const activeFilter = state.coding.activeFilter || 'All';
  const filtered = state.coding.questions.filter(q => {
    if (activeFilter === 'All') return true;
    return q.difficulty.toLowerCase() === activeFilter.toLowerCase();
  });

  if (filtered.length === 0) {
    elements.codingProblemList.innerHTML = '<p class="text-muted p-2">No problems found matching filter.</p>';
    return;
  }

  filtered.forEach(q => {
    const item = document.createElement('div');
    const isSelected = state.coding.selectedQuestion && state.coding.selectedQuestion.id === q.id;
    item.className = `problem-item ${isSelected ? 'active' : ''}`;
    
    let statusBadgeClass = 'badge-outline';
    if (q.userStatus === 'Accepted') statusBadgeClass = 'badge-success';
    if (q.userStatus === 'Wrong Answer' || q.userStatus === 'Syntax Error') statusBadgeClass = 'badge-warning';

    item.innerHTML = `
      <div class="prob-title">${q.title}</div>
      <div class="prob-tags">
        <span class="badge badge-accent">${q.category}</span>
        <span class="badge ${statusBadgeClass}">${q.userStatus}</span>
      </div>
    `;

    item.addEventListener('click', () => selectCodingQuestion(q.id));
    elements.codingProblemList.appendChild(item);
  });

  initIcons();
}

// Select a coding problem and load details
async function selectCodingQuestion(questionId) {
  const res = await apiCall(`/api/coding/questions/${questionId}`);
  if (res.success && res.question) {
    const q = res.question;
    state.coding.selectedQuestion = q;

    // Update Problem Details UI
    elements.codeProbTitle.textContent = q.title;
    elements.codeProbDescription.textContent = q.description;
    elements.codeProbCategory.textContent = q.category;
    elements.codeProbDifficulty.textContent = q.difficulty;
    elements.codeProbExampleInput.textContent = q.example_input;
    elements.codeProbExampleOutput.textContent = q.example_output;

    // Set status badge
    const matched = state.coding.questions.find(item => item.id === q.id);
    const status = matched ? matched.userStatus : 'Unattempted';
    elements.codeProbStatus.textContent = status;
    elements.codeProbStatus.className = status === 'Accepted' ? 'badge badge-success' : 'badge badge-outline';

    // Populate Editor Code
    elements.codingEditor.value = q.starter_code;

    // Reset Terminal
    resetTerminal();

    // Refresh problem list to update active highlight
    renderCodingProblemList();
  } else {
    showToast(res.error || 'Could not load question details.', 'error');
  }
}

// Reset Terminal Output
function resetTerminal() {
  if (!elements.terminalBody) return;
  elements.terminalStatusBadge.textContent = 'Ready';
  elements.terminalStatusBadge.className = 'badge badge-accent';
  elements.terminalBody.innerHTML = `
    <div class="terminal-placeholder">
      <i data-lucide="play-circle" class="placeholder-icon mb-2"></i>
      <p>Click "Submit Solution" to run your code against automated test cases.</p>
    </div>
  `;
  initIcons();
}

// Submit Solution to API
async function handleSubmitCode() {
  if (!state.coding.selectedQuestion) {
    showToast('Please select a coding problem first.', 'warning');
    return;
  }

  const code = elements.codingEditor.value.trim();
  if (!code) {
    showToast('Please write your solution before submitting.', 'warning');
    return;
  }

  const btnSubmit = elements.btnSubmitCode;
  btnSubmit.disabled = true;
  btnSubmit.querySelector('span').textContent = 'Evaluating...';

  elements.terminalStatusBadge.textContent = 'Running Tests...';
  elements.terminalStatusBadge.className = 'badge badge-warning';

  const res = await apiCall('/api/coding/submit', 'POST', {
    questionId: state.coding.selectedQuestion.id,
    submittedCode: code
  });

  btnSubmit.disabled = false;
  btnSubmit.querySelector('span').textContent = 'Submit Solution';

  if (res.success && res.data) {
    renderExecutionResults(res.data);
    showToast(`Evaluation Complete: Status '${res.data.status}'`, res.data.status === 'Accepted' ? 'success' : 'error');
    
    // Refresh questions list & user status
    await loadCodingQuestions();
    loadDashboardData();
  } else {
    showToast(res.error || 'Execution engine failure.', 'error');
    elements.terminalStatusBadge.textContent = 'Error';
    elements.terminalStatusBadge.className = 'badge badge-warning';
  }
}

// Render Terminal Test Results
function renderExecutionResults(data) {
  const { status, testResults, executionLog } = data;

  elements.terminalStatusBadge.textContent = status;
  if (status === 'Accepted') {
    elements.terminalStatusBadge.className = 'badge badge-success';
  } else if (status === 'Wrong Answer') {
    elements.terminalStatusBadge.className = 'badge badge-warning';
  } else {
    elements.terminalStatusBadge.className = 'badge badge-accent';
  }

  let html = `<div class="mb-3 text-muted" style="font-size: 0.85rem;"><i data-lucide="info" class="icon-sm"></i> ${executionLog}</div>`;

  if (testResults && testResults.length > 0) {
    html += '<div class="test-cases-list">';
    testResults.forEach(tc => {
      const cardClass = tc.passed ? 'tc-passed' : 'tc-failed';
      const statusIcon = tc.passed ? '✓ Passed' : '✗ Failed';
      const badgeClass = tc.passed ? 'text-success' : 'text-danger';

      html += `
        <div class="tc-card ${cardClass}">
          <div class="tc-header">
            <span class="tc-title">Test Case #${tc.testCase}</span>
            <span class="tc-val ${badgeClass}">${statusIcon}</span>
          </div>
          <div class="tc-details">
            <div><span class="tc-field">Input:</span> <span class="tc-val">${tc.input}</span></div>
            <div><span class="tc-field">Expected:</span> <span class="tc-val">${tc.expectedOutput}</span></div>
            <div><span class="tc-field">Actual:</span> <span class="tc-val">${tc.actualOutput}</span></div>
          </div>
          ${tc.error ? `<div class="mt-1 text-danger" style="font-size: 0.78rem;">Error: ${tc.error}</div>` : ''}
        </div>
      `;
    });
    html += '</div>';
  }

  elements.terminalBody.innerHTML = html;
  initIcons();
}


/* ==========================================================================
   TECHNICAL INTERVIEW PRACTICE MODULE CONTROLLER
   ========================================================================== */

async function handleStartTechTest(e) {
  e.preventDefault();
  const category = elements.techCategory.value;
  const difficulty = elements.techDifficulty.value;
  const limit = elements.techLimit.value;

  const btnStart = elements.btnStartTechTest || document.getElementById('btn-start-tech-test');
  if (btnStart) btnStart.disabled = true;

  const query = new URLSearchParams({ category, difficulty, limit }).toString();
  const res = await apiCall(`/api/technical/questions?${query}`);

  if (btnStart) btnStart.disabled = false;

  if (res.success && res.questions && res.questions.length > 0) {
    state.technical.questions = res.questions;
    state.technical.currentIndex = 0;
    state.technical.userAnswers = {};
    state.technical.category = category;
    state.technical.difficulty = difficulty;

    elements.techTestCategoryBadge.textContent = category;
    elements.techTestDifficultyBadge.textContent = difficulty;

    elements.techConfigCard.classList.add('hidden');
    elements.techResultsCard.classList.add('hidden');
    elements.techTestCard.classList.remove('hidden');

    renderTechQuestion(0);
    showToast(`Loaded ${res.questions.length} technical questions for ${category}. Good luck!`, 'success');
  } else {
    showToast('No technical questions found matching selected filters.', 'warning');
  }
}

function renderTechQuestion(index) {
  const questions = state.technical.questions;
  if (!questions || index < 0 || index >= questions.length) return;

  state.technical.currentIndex = index;
  const currentQ = questions[index];
  const total = questions.length;

  elements.techCurrentQNum.textContent = index + 1;
  elements.techTotalQNum.textContent = total;
  const progressPct = Math.round(((index + 1) / total) * 100);
  elements.techProgressBar.style.width = `${progressPct}%`;

  // Question drawer pills
  elements.techQuestionPillsContainer.innerHTML = '';
  questions.forEach((q, i) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = `q-pill ${i === index ? 'active' : ''} ${state.technical.userAnswers[q.id] ? 'answered' : ''}`;
    pill.textContent = i + 1;
    pill.addEventListener('click', () => renderTechQuestion(i));
    elements.techQuestionPillsContainer.appendChild(pill);
  });

  elements.techQuestionText.textContent = `${index + 1}. [${currentQ.category}] ${currentQ.question}`;

  elements.techOptionsContainer.innerHTML = '';
  const optionKeys = ['option_a', 'option_b', 'option_c', 'option_d'];
  const optionLabels = ['A', 'B', 'C', 'D'];

  const selectedAnswer = state.technical.userAnswers[currentQ.id];
  const correctAnswer = currentQ.answer;

  optionKeys.forEach((key, optIdx) => {
    const optCard = document.createElement('div');
    const isSelected = selectedAnswer === key;
    let cardClass = 'option-card';

    if (selectedAnswer) {
      if (key.toLowerCase() === correctAnswer.toLowerCase()) {
        cardClass += ' correct-choice';
      } else if (isSelected) {
        cardClass += ' wrong-choice';
      }
    } else if (isSelected) {
      cardClass += ' selected';
    }

    optCard.className = cardClass;
    optCard.innerHTML = `
      <div class="option-prefix">${optionLabels[optIdx]}</div>
      <div class="option-text">${currentQ[key]}</div>
    `;

    optCard.addEventListener('click', () => {
      state.technical.userAnswers[currentQ.id] = key;
      renderTechQuestion(index);
    });

    elements.techOptionsContainer.appendChild(optCard);
  });

  // Navigation Buttons
  elements.techBtnPrev.disabled = (index === 0);

  if (index === total - 1) {
    elements.techBtnNext.classList.add('hidden');
    elements.techBtnSubmit.classList.remove('hidden');
  } else {
    elements.techBtnNext.classList.remove('hidden');
    elements.techBtnSubmit.classList.add('hidden');
  }

  // Explanation Box logic (revealed when an answer is selected)
  if (selectedAnswer) {
    const isCorrect = selectedAnswer.toLowerCase() === correctAnswer.toLowerCase();
    elements.techExplanationBox.classList.remove('hidden');
    elements.techExplanationContent.textContent = currentQ.explanation || "No explanation available.";
    if (isCorrect) {
      elements.techAnswerStatusBadge.textContent = "Correct ✓";
      elements.techAnswerStatusBadge.className = "badge badge-success";
    } else {
      elements.techAnswerStatusBadge.textContent = "Incorrect ✗";
      elements.techAnswerStatusBadge.className = "badge badge-warning";
    }
  } else {
    elements.techExplanationBox.classList.add('hidden');
  }

  initIcons();
}

function navigateTechQuestion(direction) {
  const newIndex = state.technical.currentIndex + direction;
  renderTechQuestion(newIndex);
}

async function handleSubmitTechTest() {
  const questions = state.technical.questions;
  const answeredCount = Object.keys(state.technical.userAnswers).length;
  const unAnsweredCount = questions.length - answeredCount;

  if (unAnsweredCount > 0) {
    const confirmSubmit = confirm(`You have ${unAnsweredCount} unanswered technical question(s). Are you sure you want to finish the session?`);
    if (!confirmSubmit) return;
  }

  const btnSubmit = elements.techBtnSubmit;
  btnSubmit.disabled = true;

  const res = await apiCall('/api/technical/submit', 'POST', {
    category: state.technical.category,
    difficulty: state.technical.difficulty,
    answers: state.technical.userAnswers
  });

  btnSubmit.disabled = false;

  if (res.success && res.data) {
    renderTechResults(res.data);
    showToast('Technical Practice Session completed!', 'success');
    loadDashboardData();
  } else {
    showToast(res.error || 'Failed to submit technical test.', 'error');
  }
}

function renderTechResults(data) {
  const { score, totalQuestions, correctAnswers, wrongAnswers, percentage, questionResults } = data;

  elements.techTestCard.classList.add('hidden');
  elements.techResultsCard.classList.remove('hidden');

  elements.techResPercentage.textContent = `${percentage}%`;
  elements.techResTotal.textContent = totalQuestions;
  elements.techResCorrect.textContent = correctAnswers;
  elements.techResWrong.textContent = wrongAnswers;
  elements.techResScore.textContent = `${score} / ${totalQuestions}`;

  if (percentage >= 80) {
    elements.techResTitle.textContent = 'Technical Mastery Demonstrated! 🎯';
    elements.techResSubtitle.textContent = 'Outstanding technical accuracy across concepts. Excellent job!';
  } else if (percentage >= 50) {
    elements.techResTitle.textContent = 'Solid Technical Foundation! 📈';
    elements.techResSubtitle.textContent = 'Good effort! Review the detailed explanations below to strengthen your understanding.';
  } else {
    elements.techResTitle.textContent = 'Core Concept Review Recommended 💡';
    elements.techResSubtitle.textContent = 'Keep practicing! Check the explanations below for key technical takeaways.';
  }

  elements.techExplanationsContainer.innerHTML = '';
  const optionLabels = { option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D' };

  questionResults.forEach((q, i) => {
    const item = document.createElement('div');
    item.className = `explanation-item ${q.isCorrect ? 'is-correct' : 'is-wrong'}`;

    const statusBadge = q.isCorrect
      ? '<span class="badge badge-success">Correct ✓</span>'
      : '<span class="badge badge-warning">Incorrect ✗</span>';

    const selectedLabel = q.selectedOption ? `${optionLabels[q.selectedOption]}: ${q[q.selectedOption]}` : 'Not Answered';
    const correctLabel = `${optionLabels[q.correctAnswer]}: ${q[q.correctAnswer]}`;

    item.innerHTML = `
      <div class="item-header">
        <span class="item-question">Q${i + 1}. [${q.category}] ${q.question}</span>
        ${statusBadge}
      </div>

      <div class="answer-summary-row">
        <div><span class="ans-label">Your Choice:</span><span class="ans-val ${q.isCorrect ? 'text-success' : 'text-danger'}">${selectedLabel}</span></div>
        <div><span class="ans-label">Correct Answer:</span><span class="ans-val text-success">${correctLabel}</span></div>
      </div>

      <div class="explanation-box">
        <div class="exp-title"><i data-lucide="lightbulb" class="icon-sm"></i> Technical Explanation</div>
        <div>${q.explanation}</div>
      </div>
    `;

    elements.techExplanationsContainer.appendChild(item);
  });

  initIcons();
}

function resetTechTest() {
  state.technical.questions = [];
  state.technical.currentIndex = 0;
  state.technical.userAnswers = {};

  elements.techConfigCard.classList.remove('hidden');
  elements.techTestCard.classList.add('hidden');
  elements.techResultsCard.classList.add('hidden');
}


/* ==========================================================================
   AI MOCK INTERVIEW MODULE CONTROLLER
   ========================================================================== */

async function handleStartMockInterview(e) {
  e.preventDefault();
  const targetRole = elements.mockRole ? elements.mockRole.value : 'Full Stack Developer';
  const interviewType = elements.mockType ? elements.mockType.value : 'Technical';
  const difficulty = elements.mockDifficulty ? elements.mockDifficulty.value : 'Medium';

  const btnStart = elements.btnStartMock;
  if (btnStart) btnStart.disabled = true;

  const res = await apiCall('/api/mock-interview/start', 'POST', {
    targetRole,
    interviewType,
    difficulty
  });

  if (btnStart) btnStart.disabled = false;

  if (res.success && res.data && res.data.questions && res.data.questions.length > 0) {
    state.mock.sessionId = res.sessionId || res.data.sessionId;
    state.mock.questions = res.data.questions;
    state.mock.currentIndex = 0;
    state.mock.userAnswers = new Array(res.data.questions.length).fill('');
    state.mock.evaluations = new Array(res.data.questions.length).fill(null);
    state.mock.targetRole = targetRole;
    state.mock.interviewType = interviewType;
    state.mock.difficulty = difficulty;

    if (elements.mockBadgeRole) elements.mockBadgeRole.textContent = targetRole;
    if (elements.mockBadgeType) elements.mockBadgeType.textContent = interviewType;
    if (elements.mockBadgeDiff) elements.mockBadgeDiff.textContent = difficulty;

    if (elements.mockSetupCard) elements.mockSetupCard.classList.add('hidden');
    if (elements.mockReportCard) elements.mockReportCard.classList.add('hidden');
    if (elements.mockInterviewCard) elements.mockInterviewCard.classList.remove('hidden');

    renderMockQuestion(0);
    showToast(`AI Mock Interview started with ${res.data.questions.length} ${interviewType} questions!`, 'success');
  } else {
    showToast(res.error || 'Failed to start mock interview session.', 'error');
  }
}


function renderMockQuestion(index) {
  const questions = state.mock.questions;
  if (!questions || index < 0 || index >= questions.length) return;

  state.mock.currentIndex = index;
  const total = questions.length;
  const currentQ = questions[index];

  if (elements.mockCurrentQNum) elements.mockCurrentQNum.textContent = index + 1;
  const progressPct = Math.round(((index + 1) / total) * 100);
  if (elements.mockProgressBar) elements.mockProgressBar.style.width = `${progressPct}%`;

  if (elements.mockQuestionText) elements.mockQuestionText.textContent = `${index + 1}. ${currentQ}`;
  
  const savedAnswer = state.mock.userAnswers[index] || '';
  if (elements.mockAnswerInput) elements.mockAnswerInput.value = savedAnswer;
  updateMockCharCounter();

  const savedEval = state.mock.evaluations[index];
  if (savedEval) {
    showMockEvaluation(savedEval);
    if (elements.mockAnswerInput) elements.mockAnswerInput.disabled = true;
    if (elements.btnSubmitMockAnswer) elements.btnSubmitMockAnswer.classList.add('hidden');
  } else {
    if (elements.mockEvalBox) elements.mockEvalBox.classList.add('hidden');
    if (elements.mockAnswerInput) elements.mockAnswerInput.disabled = false;
    if (elements.btnSubmitMockAnswer) {
      elements.btnSubmitMockAnswer.classList.remove('hidden');
      elements.btnSubmitMockAnswer.disabled = false;
    }
  }

  initIcons();
}

function updateMockCharCounter() {
  if (!elements.mockAnswerInput || !elements.mockCharCounter) return;
  const count = elements.mockAnswerInput.value.length;
  elements.mockCharCounter.textContent = `${count} characters`;
}

async function handleSubmitMockAnswer() {
  const index = state.mock.currentIndex;
  const questionText = state.mock.questions[index];
  const answer = elements.mockAnswerInput ? elements.mockAnswerInput.value.trim() : '';

  if (!answer) {
    showToast('Please type your response before submitting.', 'warning');
    return;
  }

  const btnSubmit = elements.btnSubmitMockAnswer;
  if (btnSubmit) {
    btnSubmit.disabled = true;
    const btnSpan = btnSubmit.querySelector('span');
    if (btnSpan) btnSpan.textContent = 'AI Evaluating Answer...';
  }

  const res = await apiCall('/api/mock-interview/evaluate-answer', 'POST', {
    targetRole: state.mock.targetRole,
    interviewType: state.mock.interviewType,
    difficulty: state.mock.difficulty,
    questionText,
    studentAnswer: answer
  });

  if (btnSubmit) {
    btnSubmit.disabled = false;
    const btnSpan = btnSubmit.querySelector('span');
    if (btnSpan) btnSpan.textContent = 'Submit Answer for AI Evaluation';
  }

  if (res.success && res.evaluation) {
    state.mock.userAnswers[index] = answer;
    state.mock.evaluations[index] = res.evaluation;
    
    if (elements.mockAnswerInput) elements.mockAnswerInput.disabled = true;
    if (btnSubmit) btnSubmit.classList.add('hidden');

    showMockEvaluation(res.evaluation);
    showToast('Answer evaluated by AI!', 'success');
  } else {
    showToast(res.error || 'Failed to evaluate answer.', 'error');
  }
}

function showMockEvaluation(evaluation) {
  if (!elements.mockEvalBox) return;

  const { score, relevance, accuracy, communication, completeness, feedback } = evaluation;

  if (elements.mockEvalScoreBadge) elements.mockEvalScoreBadge.textContent = `Score: ${score} / 100`;
  if (elements.mockEvalStatusText) elements.mockEvalStatusText.textContent = score >= 75 ? 'Strong Answer ✓' : 'Needs Detail 💡';
  
  if (elements.evalMetricRel) elements.evalMetricRel.textContent = `${relevance || 0}%`;
  if (elements.evalMetricAcc) elements.evalMetricAcc.textContent = `${accuracy || 0}%`;
  if (elements.evalMetricComm) elements.evalMetricComm.textContent = `${communication || 0}%`;
  if (elements.evalMetricComp) elements.evalMetricComp.textContent = `${completeness || 0}%`;

  if (elements.mockEvalFeedback) elements.mockEvalFeedback.textContent = feedback || 'No feedback available.';

  elements.mockEvalBox.classList.remove('hidden');

  const currentIndex = state.mock.currentIndex;
  const isLastQuestion = currentIndex === state.mock.questions.length - 1;

  if (isLastQuestion) {
    if (elements.btnNextMockQuestion) elements.btnNextMockQuestion.classList.add('hidden');
    if (elements.btnFinishMock) elements.btnFinishMock.classList.remove('hidden');
  } else {
    if (elements.btnNextMockQuestion) elements.btnNextMockQuestion.classList.remove('hidden');
    if (elements.btnFinishMock) elements.btnFinishMock.classList.add('hidden');
  }

  initIcons();
}

function handleNextMockQuestion() {
  const nextIndex = state.mock.currentIndex + 1;
  renderMockQuestion(nextIndex);
}

async function handleFinishMockInterview() {
  const btnFinish = elements.btnFinishMock;
  if (btnFinish) btnFinish.disabled = true;

  const res = await apiCall('/api/mock-interview/finish', 'POST', {
    sessionId: state.mock.sessionId,
    targetRole: state.mock.targetRole,
    interviewType: state.mock.interviewType,
    difficulty: state.mock.difficulty,
    questions: state.mock.questions,
    answers: state.mock.userAnswers,
    evaluations: state.mock.evaluations
  });


  if (btnFinish) btnFinish.disabled = false;

  if (res.success && res.data) {
    renderMockReport(res.data);
    showToast('Mock Interview Completed! Report generated.', 'success');
    loadDashboardData();
  } else {
    showToast(res.error || 'Failed to complete interview session.', 'error');
  }
}

function renderMockReport(data) {
  const { finalScore, strengths, weaknesses, suggestions, recommendedTopics } = data;

  if (elements.mockInterviewCard) elements.mockInterviewCard.classList.add('hidden');
  if (elements.mockReportCard) elements.mockReportCard.classList.remove('hidden');

  if (elements.mockFinalScorePct) elements.mockFinalScorePct.textContent = finalScore;
  if (elements.mockReportTitle) elements.mockReportTitle.textContent = `${state.mock.targetRole} Mock Interview Report`;
  if (elements.mockReportSubtitle) elements.mockReportSubtitle.textContent = `Completed ${state.mock.interviewType} Interview (${state.mock.difficulty} Level)`;

  if (elements.mockReportStrengths) {
    elements.mockReportStrengths.innerHTML = (strengths || []).map(s => `<li><i data-lucide="check" class="icon-sm text-success"></i> ${s}</li>`).join('');
  }
  if (elements.mockReportWeaknesses) {
    elements.mockReportWeaknesses.innerHTML = (weaknesses || []).map(w => `<li><i data-lucide="alert-circle" class="icon-sm text-warning"></i> ${w}</li>`).join('');
  }
  if (elements.mockReportSuggestions) {
    elements.mockReportSuggestions.innerHTML = (suggestions || []).map(s => `<li><i data-lucide="lightbulb" class="icon-sm text-accent"></i> ${s}</li>`).join('');
  }
  if (elements.mockReportTopics) {
    elements.mockReportTopics.innerHTML = (recommendedTopics || []).map(t => `<span class="badge badge-accent">${t}</span>`).join('');
  }

  if (elements.mockReportQuestionsList) {
    elements.mockReportQuestionsList.innerHTML = state.mock.questions.map((q, i) => {
      const evalObj = state.mock.evaluations[i] || {};
      const answer = state.mock.userAnswers[i] || 'No response provided.';
      return `
        <div class="explanation-item">
          <div class="item-header">
            <span class="item-question">Q${i + 1}. ${q}</span>
            <span class="badge ${evalObj.score >= 75 ? 'badge-success' : 'badge-warning'}">Score: ${evalObj.score || 0}/100</span>
          </div>
          <div class="answer-summary-row mb-2">
            <div><span class="ans-label">Your Answer:</span> <span class="text-primary">${answer}</span></div>
          </div>
          <div class="explanation-box">
            <div class="exp-title"><i data-lucide="bot" class="icon-sm"></i> AI Evaluation</div>
            <div>${evalObj.feedback || 'No feedback.'}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  initIcons();
}

function resetMockInterview() {
  state.mock.questions = [];
  state.mock.currentIndex = 0;
  state.mock.userAnswers = [];
  state.mock.evaluations = [];

  if (elements.mockSetupCard) elements.mockSetupCard.classList.remove('hidden');
  if (elements.mockInterviewCard) elements.mockInterviewCard.classList.add('hidden');
  if (elements.mockReportCard) elements.mockReportCard.classList.add('hidden');
  if (elements.mockEvalBox) elements.mockEvalBox.classList.add('hidden');
  if (elements.mockAnswerInput) {
    elements.mockAnswerInput.value = '';
    elements.mockAnswerInput.disabled = false;
  }
}


/* ==========================================================================
   RESUME ANALYZER MODULE CONTROLLER
   ========================================================================== */

function handleResumeFileSelect() {
  const file = elements.resumeFileInput ? elements.resumeFileInput.files[0] : null;
  if (!file) return;

  const allowedExts = ['pdf', 'docx'];
  const ext = file.name.split('.').pop().toLowerCase();

  if (!allowedExts.includes(ext)) {
    showToast('Invalid file type. Please upload a PDF (.pdf) or Word (.docx) document.', 'error');
    clearSelectedResumeFile();
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('File size exceeds 5MB limit. Please upload a smaller file.', 'error');
    clearSelectedResumeFile();
    return;
  }

  state.resume.selectedFile = file;
  if (elements.selectedFileName) elements.selectedFileName.textContent = file.name;
  if (elements.selectedFileSize) elements.selectedFileSize.textContent = formatBytes(file.size);

  if (elements.dropzoneContent) elements.dropzoneContent.classList.add('hidden');
  if (elements.dropzoneFileInfo) elements.dropzoneFileInfo.classList.remove('hidden');
}

function clearSelectedResumeFile() {
  state.resume.selectedFile = null;
  if (elements.resumeFileInput) elements.resumeFileInput.value = '';
  if (elements.dropzoneContent) elements.dropzoneContent.classList.remove('hidden');
  if (elements.dropzoneFileInfo) elements.dropzoneFileInfo.classList.add('hidden');
}

function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function handleUploadResume(e) {
  e.preventDefault();

  const file = elements.resumeFileInput ? elements.resumeFileInput.files[0] : null;
  if (!file) {
    showToast('Please select a resume file before analyzing.', 'warning');
    return;
  }

  const targetRole = elements.resumeRole ? elements.resumeRole.value : 'Full Stack Developer';

  const formData = new FormData();
  formData.append('resumeFile', file);
  formData.append('targetRole', targetRole);

  const btnSubmit = elements.btnSubmitResume;
  if (btnSubmit) {
    btnSubmit.disabled = true;
    const btnSpan = btnSubmit.querySelector('span');
    if (btnSpan) btnSpan.textContent = 'Extracting Text & Analyzing...';
  }

  try {
    const response = await fetch('/api/resume/analyze', {
      method: 'POST',
      body: formData
    });
    const res = await response.json();

    if (btnSubmit) {
      btnSubmit.disabled = false;
      const btnSpan = btnSubmit.querySelector('span');
      if (btnSpan) btnSpan.textContent = 'Analyze Resume';
    }

    if (res.success && res.data) {
      renderResumeResults(res.data);
      showToast('Resume analyzed successfully!', 'success');
      loadResumeHistory();
      loadDashboardData();
    } else {
      showToast(res.error || 'Failed to analyze resume.', 'error');
    }
  } catch (err) {
    console.error('Resume upload error:', err);
    if (btnSubmit) {
      btnSubmit.disabled = false;
      const btnSpan = btnSubmit.querySelector('span');
      if (btnSpan) btnSpan.textContent = 'Analyze Resume';
    }
    showToast('Network error while uploading resume.', 'error');
  }
}

function renderResumeResults(data) {
  const { filename, targetRole, score, matchPercentage, analysis } = data;
  const { detectedSkills, missingSkills, strengths, weaknesses, keywords, suggestions } = analysis || {};

  if (elements.resumeUploadCard) elements.resumeUploadCard.classList.add('hidden');
  if (elements.resumeResultsCard) elements.resumeResultsCard.classList.remove('hidden');

  if (elements.resumeScoreVal) elements.resumeScoreVal.textContent = score || 0;
  if (elements.resumeResultsTitle) elements.resumeResultsTitle.textContent = `${targetRole} Resume Analysis`;
  if (elements.resumeResultsSubtitle) elements.resumeResultsSubtitle.textContent = `Uploaded file: ${filename}`;

  if (elements.resumeMetricMatch) elements.resumeMetricMatch.textContent = `${matchPercentage || 0}%`;
  if (elements.resumeMetricDetected) elements.resumeMetricDetected.textContent = (detectedSkills || []).length;
  if (elements.resumeMetricMissing) elements.resumeMetricMissing.textContent = (missingSkills || []).length;
  if (elements.resumeMetricOverall) elements.resumeMetricOverall.textContent = `${score || 0} / 100`;

  if (elements.resumeDetectedSkills) {
    elements.resumeDetectedSkills.innerHTML = (detectedSkills || []).length > 0
      ? (detectedSkills || []).map(s => `<span class="badge badge-success">${s}</span>`).join('')
      : '<span class="text-muted">No specific domain skills detected.</span>';
  }

  if (elements.resumeMissingSkills) {
    elements.resumeMissingSkills.innerHTML = (missingSkills || []).length > 0
      ? (missingSkills || []).map(s => `<span class="badge badge-warning">${s}</span>`).join('')
      : '<span class="badge badge-success">No critical skills missing!</span>';
  }

  if (elements.resumeStrengthsList) {
    elements.resumeStrengthsList.innerHTML = (strengths || []).map(s => `<li><i data-lucide="check" class="icon-sm text-success"></i> ${s}</li>`).join('');
  }

  if (elements.resumeWeaknessesList) {
    elements.resumeWeaknessesList.innerHTML = (weaknesses || []).map(w => `<li><i data-lucide="alert-circle" class="icon-sm text-warning"></i> ${w}</li>`).join('');
  }

  if (elements.resumeKeywordsPills) {
    elements.resumeKeywordsPills.innerHTML = (keywords || []).map(k => `<span class="badge badge-accent">${k}</span>`).join('');
  }

  if (elements.resumeSuggestionsList) {
    elements.resumeSuggestionsList.innerHTML = (suggestions || []).map(s => `<li><i data-lucide="lightbulb" class="icon-sm text-accent"></i> ${s}</li>`).join('');
  }

  initIcons();
}

function resetResumeView() {
  clearSelectedResumeFile();
  if (elements.resumeUploadCard) elements.resumeUploadCard.classList.remove('hidden');
  if (elements.resumeResultsCard) elements.resumeResultsCard.classList.add('hidden');
}

async function loadResumeHistory() {
  const res = await apiCall('/api/resume/history');
  if (res.success && res.history) {
    state.resume.history = res.history;
    renderResumeHistoryList(res.history);
  }
}

function renderResumeHistoryList(history) {
  if (!elements.resumeHistoryContainer) return;
  elements.resumeHistoryContainer.innerHTML = '';

  if (!history || history.length === 0) {
    elements.resumeHistoryContainer.innerHTML = '<p class="text-muted p-2">No previous resume analyses recorded.</p>';
    return;
  }

  history.forEach(item => {
    const row = document.createElement('div');
    row.className = 'history-item topic-row';
    const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    row.innerHTML = `
      <div class="topic-info">
        <div class="topic-title-row">
          <span class="topic-name">${item.filename}</span>
          <span class="badge badge-accent">${item.target_role}</span>
        </div>
        <span class="card-subtitle">Analyzed on ${formattedDate}</span>
      </div>

      <div class="d-flex align-items-center gap-3">
        <div class="text-right">
          <div class="topic-name text-success">${item.score} / 100</div>
          <span class="card-subtitle">${item.match_percentage}% Match</span>
        </div>
        <button class="btn btn-sm btn-outline btn-view-history" data-id="${item.id}">View Details</button>
      </div>
    `;

    row.querySelector('.btn-view-history').addEventListener('click', () => loadResumeHistoryDetail(item.id));
    elements.resumeHistoryContainer.appendChild(row);
  });

  initIcons();
}

async function loadResumeHistoryDetail(id) {
  const res = await apiCall(`/api/resume/history/${id}`);
  if (res.success && res.data) {
    renderResumeResults(res.data);
    showToast('Loaded resume analysis details from history.', 'info');
  } else {
    showToast(res.error || 'Could not load historical analysis details.', 'error');
  }
}


/* ==========================================================================
   SMART PROGRESS TRACKING & RECOMMENDATIONS CONTROLLER
   ========================================================================== */

async function loadProgressData() {
  const res = await apiCall('/api/progress/summary');
  if (res.success && res.data) {
    state.progress.summary = res.data;
    renderProgressView(res.data);
  } else {
    showToast(res.error || 'Failed to load progress analytics.', 'error');
  }
  loadKnowledgeTracingData();
}

async function loadKnowledgeTracingData() {
  if (!elements.ktMatrixTbody) return;
  elements.ktMatrixTbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted p-3">Loading Knowledge Tracing analysis...</td></tr>';
  const res = await apiCall('/api/progress/knowledge-tracing');
  if (res.success) {
    // API spreads overview at top level: { success, enabled, data: { masteryMatrix, ... } }
    renderKnowledgeTracingMatrix({ enabled: res.enabled, ...(res.data || {}) });
  } else {
    elements.ktMatrixTbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger p-3">${res.error || 'Failed to load Knowledge Tracing data.'}</td></tr>`;
  }
}

function renderKnowledgeTracingMatrix(data) {
  if (!elements.ktMatrixTbody) return;
  elements.ktMatrixTbody.innerHTML = '';

  if (!data.enabled) {
    elements.ktMatrixTbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted p-3">Knowledge Tracing is currently disabled in system configuration.</td></tr>';
    return;
  }

  // Support both field names: masteryMatrix (from API) or profiles (legacy)
  const profiles = data.masteryMatrix || data.profiles || [];
  if (profiles.length === 0) {
    elements.ktMatrixTbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted p-3">No skill mastery estimates recorded yet. Complete practice assessments to generate evidence.</td></tr>';
    return;
  }

  profiles.forEach(p => {
    const tr = document.createElement('tr');
    
    let trendBadge = '<span class="badge badge-outline">Insufficient History</span>';
    if (p.trendDirection === 'improving') {
      trendBadge = '<span class="badge badge-success"><i data-lucide="trending-up" class="icon-xs"></i> Improving</span>';
    } else if (p.trendDirection === 'stable') {
      trendBadge = '<span class="badge badge-accent"><i data-lucide="minus" class="icon-xs"></i> Stable</span>';
    } else if (p.trendDirection === 'declining') {
      trendBadge = '<span class="badge badge-danger"><i data-lucide="trending-down" class="icon-xs"></i> Declining</span>';
    }

    const verificationBadge = p.isVerified 
      ? '<span class="badge badge-sm badge-success ml-1" title="Verified by practice assessments">Verified</span>'
      : '<span class="badge badge-sm badge-warning ml-1" title="Derived from resume, not yet verified">Resume-Derived</span>';

    // Support both field names from API: estimatedMastery (from getKnowledgeTracingOverview) or masteryScore
    const mastery = p.estimatedMastery !== undefined ? p.estimatedMastery : (p.masteryScore !== undefined ? p.masteryScore : 60);
    // Support both field names: attemptCount (from API) or observationCount (legacy)
    const attempts = p.attemptCount !== undefined ? p.attemptCount : (p.observationCount || 0);

    const masteryDisplay = attempts >= 1 
      ? `<strong>${mastery}%</strong> <span class="text-muted small">(Estimate)</span>`
      : `<span class="text-muted">Unrated (${mastery}%)</span>`;

    tr.innerHTML = `
      <td><strong>${p.skillName}</strong> ${verificationBadge}</td>
      <td>${p.category || 'General'}</td>
      <td>${masteryDisplay}</td>
      <td>${trendBadge}</td>
      <td>${attempts} attempt(s)</td>
      <td class="small text-secondary">${p.explanation || 'No assessment evidence recorded yet.'}</td>
    `;

    elements.ktMatrixTbody.appendChild(tr);
  });

  initIcons();
}


async function loadProgressSummaryForDashboard() {
  const res = await apiCall('/api/progress/summary');
  if (res.success && res.data) {
    state.progress.summary = res.data;
    renderDashboardProgressSummary(res.data);
  }
}

function renderDashboardProgressSummary(data) {
  const { overallScore, readinessStatus, weakestArea, topRecommendation, recommendations } = data;

  if (elements.statReadiness) elements.statReadiness.textContent = `${overallScore}%`;
  if (elements.statReadinessBar) elements.statReadinessBar.style.width = `${overallScore}%`;
  if (elements.statReadinessLabel) {
    elements.statReadinessLabel.textContent = readinessStatus;
    if (overallScore >= 80) elements.statReadinessLabel.className = 'badge badge-success';
    else if (overallScore >= 60) elements.statReadinessLabel.className = 'badge badge-accent';
    else elements.statReadinessLabel.className = 'badge badge-warning';
  }

  if (elements.dashWeakestBadge) elements.dashWeakestBadge.innerHTML = `<i data-lucide="alert-triangle" class="icon-xs"></i> Focus Needed: ${weakestArea}`;
  if (elements.dashReadinessStatusBadge) elements.dashReadinessStatusBadge.textContent = readinessStatus;

  if (elements.dashTopRecTitle) elements.dashTopRecTitle.textContent = topRecommendation || 'Recommended Practice';

  const topRecItem = (recommendations && recommendations.length > 0) ? recommendations[0] : null;
  if (topRecItem) {
    if (elements.dashTopRecDesc) elements.dashTopRecDesc.textContent = topRecItem.description;
    if (elements.dashTopRecBtnLabel) elements.dashTopRecBtnLabel.textContent = topRecItem.actionText;
  }
  initIcons();
}

function handleTopRecClick() {
  const summary = state.progress.summary;
  if (summary && summary.recommendations && summary.recommendations.length > 0) {
    const targetView = summary.recommendations[0].targetView || 'aptitude';
    switchMainView(targetView);
  } else {
    switchMainView('aptitude');
  }
}

function renderProgressView(data) {
  const { overallScore, readinessStatus, modules, strongAreas, weakAreas, recommendations } = data;

  if (elements.progressOverallVal) elements.progressOverallVal.textContent = `${overallScore}%`;
  if (elements.progressStatusBadge) {
    elements.progressStatusBadge.textContent = readinessStatus;
    if (overallScore >= 80) elements.progressStatusBadge.className = 'badge badge-success';
    else if (overallScore >= 60) elements.progressStatusBadge.className = 'badge badge-accent';
    else elements.progressStatusBadge.className = 'badge badge-warning';
  }

  // Render individual module progress bars
  (modules || []).forEach(m => {
    const scoreText = m.score !== null ? `${m.score}%` : 'Not Started';
    const countText = `${m.count} ${m.unit}`;

    if (m.key === 'aptitude') {
      if (elements.progCountAptitude) elements.progCountAptitude.textContent = countText;
      if (elements.progScoreAptitude) elements.progScoreAptitude.textContent = scoreText;
      if (elements.barAptitude) elements.barAptitude.style.width = m.score !== null ? `${m.score}%` : '0%';
    } else if (m.key === 'coding') {
      if (elements.progCountCoding) elements.progCountCoding.textContent = countText;
      if (elements.progScoreCoding) elements.progScoreCoding.textContent = scoreText;
      if (elements.barCoding) elements.barCoding.style.width = m.score !== null ? `${m.score}%` : '0%';
    } else if (m.key === 'technical') {
      if (elements.progCountTechnical) elements.progCountTechnical.textContent = countText;
      if (elements.progScoreTechnical) elements.progScoreTechnical.textContent = scoreText;
      if (elements.barTechnical) elements.barTechnical.style.width = m.score !== null ? `${m.score}%` : '0%';
    } else if (m.key === 'mock') {
      if (elements.progCountMock) elements.progCountMock.textContent = countText;
      if (elements.progScoreMock) elements.progScoreMock.textContent = scoreText;
      if (elements.barMock) elements.barMock.style.width = m.score !== null ? `${m.score}%` : '0%';
    } else if (m.key === 'resume') {
      if (elements.progCountResume) elements.progCountResume.textContent = countText;
      if (elements.progScoreResume) elements.progScoreResume.textContent = scoreText;
      if (elements.barResume) elements.barResume.style.width = m.score !== null ? `${m.score}%` : '0%';
    }
  });

  // Render Strong Areas
  if (elements.progStrongAreas) {
    elements.progStrongAreas.innerHTML = (strongAreas || []).length > 0
      ? strongAreas.map(s => `<span class="badge badge-success">${s}</span>`).join('')
      : '<span class="text-muted">Complete more practice modules to identify strengths.</span>';
  }

  // Render Weak Areas
  if (elements.progWeakAreas) {
    elements.progWeakAreas.innerHTML = (weakAreas || []).length > 0
      ? weakAreas.map(w => `<span class="badge badge-warning">${w}</span>`).join('')
      : '<span class="badge badge-success">No significant weak areas detected!</span>';
  }

  // Render Recommendations List
  if (elements.progressRecommendationsList) {
    elements.progressRecommendationsList.innerHTML = '';
    if (!recommendations || recommendations.length === 0) {
      elements.progressRecommendationsList.innerHTML = '<p class="text-muted">No pending recommendations.</p>';
      return;
    }

    recommendations.forEach(rec => {
      const card = document.createElement('div');
      card.className = `recommendation-card priority-${(rec.priority || 'Medium').toLowerCase()}`;

      let priorityBadge = 'badge-accent';
      if (rec.priority === 'High') priorityBadge = 'badge-warning';

      let diffBadge = rec.recommendedDifficulty ? `<span class="badge badge-outline ml-2">${rec.recommendedDifficulty}</span>` : '';
      let reasonHtml = rec.reason ? `<p class="rec-card-reason text-muted small mt-1"><em><i data-lucide="info" class="icon-xs"></i> ${rec.reason}</em></p>` : '';

      card.innerHTML = `
        <div class="rec-card-body">
          <div class="rec-card-header">
            <span class="badge ${priorityBadge}">${rec.priority || 'Medium'} Priority</span>
            ${diffBadge}
            <h4>${rec.title}</h4>
          </div>
          <p class="rec-card-desc">${rec.description}</p>
          ${reasonHtml}
        </div>
        <div class="rec-card-action">
          <button class="btn btn-primary btn-sm btn-action-rec" data-target="${rec.targetView}">
            <span>${rec.actionText}</span>
            <i data-lucide="arrow-right"></i>
          </button>
        </div>
      `;

      card.querySelector('.btn-action-rec').addEventListener('click', () => {
        switchMainView(rec.targetView);
      });

      elements.progressRecommendationsList.appendChild(card);
    });
  }

  initIcons();
}


/* ==========================================================================
   ADMIN PANEL CONTROLLER
   ========================================================================== */

function switchAdminTab(tabName) {
  state.admin.activeTab = tabName;

  if (elements.adminPanelStats) elements.adminPanelStats.classList.add('hidden');
  if (elements.adminPanelUsers) elements.adminPanelUsers.classList.add('hidden');
  if (elements.adminPanelQuestions) elements.adminPanelQuestions.classList.add('hidden');
  if (elements.adminPanelSessions) elements.adminPanelSessions.classList.add('hidden');

  if (elements.tabAdminStats) elements.tabAdminStats.className = 'btn btn-sm btn-outline admin-tab';
  if (elements.tabAdminUsers) elements.tabAdminUsers.className = 'btn btn-sm btn-outline admin-tab';
  if (elements.tabAdminQuestions) elements.tabAdminQuestions.className = 'btn btn-sm btn-outline admin-tab';
  if (elements.tabAdminSessions) elements.tabAdminSessions.className = 'btn btn-sm btn-outline admin-tab';

  if (tabName === 'stats') {
    if (elements.adminPanelStats) elements.adminPanelStats.classList.remove('hidden');
    if (elements.tabAdminStats) elements.tabAdminStats.className = 'btn btn-sm btn-primary admin-tab active';
    loadAdminStats();
  } else if (tabName === 'users') {
    if (elements.adminPanelUsers) elements.adminPanelUsers.classList.remove('hidden');
    if (elements.tabAdminUsers) elements.tabAdminUsers.className = 'btn btn-sm btn-primary admin-tab active';
    loadAdminUsers();
  } else if (tabName === 'questions') {
    if (elements.adminPanelQuestions) elements.adminPanelQuestions.classList.remove('hidden');
    if (elements.tabAdminQuestions) elements.tabAdminQuestions.className = 'btn btn-sm btn-primary admin-tab active';
    loadAdminQuestions(state.admin.selectedModule || 'aptitude');
  } else if (tabName === 'sessions') {
    if (elements.adminPanelSessions) elements.adminPanelSessions.classList.remove('hidden');
    if (elements.tabAdminSessions) elements.tabAdminSessions.className = 'btn btn-sm btn-primary admin-tab active';
    loadAdminSessions();
  }
  initIcons();
}

async function loadAdminStats() {
  const res = await apiCall('/api/admin/stats');
  if (res.success && res.stats) {
    state.admin.stats = res.stats;
    const { totalUsers, activeUsers, aptitudeAttempts, codingAttempts, technicalAttempts, mockAttempts, avgPerformance } = res.stats;
    if (elements.adminStatUsers) elements.adminStatUsers.textContent = totalUsers || 0;
    if (elements.adminStatActive) elements.adminStatActive.textContent = activeUsers || 0;
    if (elements.adminStatAptitude) elements.adminStatAptitude.textContent = aptitudeAttempts || 0;
    if (elements.adminStatCoding) elements.adminStatCoding.textContent = codingAttempts || 0;
    if (elements.adminStatTechnical) elements.adminStatTechnical.textContent = technicalAttempts || 0;
    if (elements.adminStatMock) elements.adminStatMock.textContent = mockAttempts || 0;
    if (elements.adminStatAvg) elements.adminStatAvg.textContent = `${avgPerformance || 0}%`;
  } else {
    showToast(res.error || 'Failed to load platform stats.', 'error');
  }
}

async function loadAdminUsers() {
  if (elements.adminUsersTbody) {
    elements.adminUsersTbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted p-3">Loading registered users...</td></tr>';
  }
  const res = await apiCall('/api/admin/users');
  if (res.success && res.users) {
    state.admin.users = res.users;
    renderAdminUsersTable(res.users);
  } else {
    if (elements.adminUsersTbody) {
      elements.adminUsersTbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger p-3">${res.error || 'Failed to load users.'}</td></tr>`;
    }
  }
}

function renderAdminUsersTable(users) {
  if (!elements.adminUsersTbody) return;
  elements.adminUsersTbody.innerHTML = '';
  if (!users || users.length === 0) {
    elements.adminUsersTbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted p-3">No matching users found.</td></tr>';
    return;
  }

  const currentUserId = state.currentUser ? state.currentUser.id : null;

  users.forEach(u => {
    const tr = document.createElement('tr');
    const roleBadge = u.is_admin === 1 ? '<span class="badge badge-warning">Admin</span>' : '<span class="badge badge-accent">Student</span>';
    
    let roleActionHtml = '';
    if (u.id !== currentUserId) {
      const toggleLabel = u.is_admin === 1 ? 'Demote' : 'Make Admin';
      const toggleClass = u.is_admin === 1 ? 'btn-outline-danger' : 'btn-outline';
      roleActionHtml = `
        <button class="btn btn-sm ${toggleClass} btn-toggle-role" data-id="${u.id}">
          <i data-lucide="${u.is_admin === 1 ? 'user-minus' : 'user-check'}"></i> ${toggleLabel}
        </button>
      `;
    }

    tr.innerHTML = `
      <td>#${u.id}</td>
      <td><strong>${u.name}</strong></td>
      <td>${u.email}</td>
      <td>${u.target_role || 'Student'}</td>
      <td><span class="badge badge-success">${u.readinessScore || 65}%</span></td>
      <td>${u.totalAttempts || 0} attempts</td>
      <td>${roleBadge}</td>
      <td class="text-right d-flex justify-content-end gap-2">
        <button class="btn btn-sm btn-primary btn-view-user-progress" data-id="${u.id}">
          <i data-lucide="bar-chart-2"></i> Progress
        </button>
        ${roleActionHtml}
      </td>
    `;

    const viewProgressBtn = tr.querySelector('.btn-view-user-progress');
    if (viewProgressBtn) {
      viewProgressBtn.addEventListener('click', () => openUserProgressModal(u.id));
    }

    const toggleBtn = tr.querySelector('.btn-toggle-role');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => handleToggleUserAdmin(u.id, u.name, u.is_admin));
    }

    elements.adminUsersTbody.appendChild(tr);
  });
  initIcons();
}

async function openUserProgressModal(userId) {
  if (!elements.modalAdminUserProgress) return;
  elements.modalAdminUserProgress.classList.remove('hidden');

  if (elements.adminUserProgressBody) {
    elements.adminUserProgressBody.innerHTML = '<p class="text-muted p-3">Loading detailed progress breakdown...</p>';
  }

  const res = await apiCall(`/api/admin/users/${userId}/progress`);
  if (res.success && res.user) {
    const { user, stats, history } = res;
    const titleElem = document.getElementById('admin-modal-user-title');
    if (titleElem) titleElem.textContent = `${user.name} - Performance & Progress Details`;

    const aptCount = (history.aptitude || []).length;
    const codingCount = (history.coding || []).length;
    const techCount = (history.technical || []).length;
    const mockCount = (history.mock || []).length;

    elements.adminUserProgressBody.innerHTML = `
      <div class="metrics-grid mb-3" style="grid-template-columns: repeat(3, 1fr);">
        <div class="metric-card glass-panel text-center p-2">
          <span class="metric-title">Target Role</span>
          <span class="topic-name mt-1">${user.target_role || 'Full Stack Developer'}</span>
        </div>
        <div class="metric-card glass-panel text-center p-2">
          <span class="metric-title">Overall Readiness</span>
          <span class="metric-number text-success" style="font-size: 1.5rem;">${stats.readiness_score || 65}%</span>
        </div>
        <div class="metric-card glass-panel text-center p-2">
          <span class="metric-title">Practice Hours</span>
          <span class="metric-number text-accent" style="font-size: 1.5rem;">${stats.practice_hours || 0} hrs</span>
        </div>
      </div>

      <h4 class="mb-2 mt-3"><i data-lucide="list-checks" class="icon-sm"></i> Activity Counts</h4>
      <div class="d-flex gap-2 flex-wrap mb-4">
        <span class="badge badge-accent">Aptitude: ${aptCount} attempts</span>
        <span class="badge badge-success">Coding: ${codingCount} submissions</span>
        <span class="badge badge-warning">Technical: ${techCount} quizzes</span>
        <span class="badge badge-purple">AI Mock: ${mockCount} sessions</span>
      </div>

      <h4 class="mb-2"><i data-lucide="bot" class="icon-sm text-accent"></i> Recent Mock Interviews</h4>
      <div class="table-responsive mb-3">
        <table class="admin-table">
          <thead>
            <tr><th>Interview Type</th><th>Difficulty</th><th>Score</th><th>Date</th></tr>
          </thead>
          <tbody>
            ${(history.mock || []).length > 0 ? (history.mock || []).map(m => `
              <tr>
                <td>${m.interview_type} (${m.target_role})</td>
                <td><span class="badge badge-outline">${m.difficulty}</span></td>
                <td><span class="badge badge-success">${m.final_score}/100</span></td>
                <td>${new Date(m.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('') : '<tr><td colspan="4" class="text-muted text-center p-2">No mock interviews recorded.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
    initIcons();
  } else {
    if (elements.adminUserProgressBody) {
      elements.adminUserProgressBody.innerHTML = `<p class="text-danger p-3">${res.error || 'Failed to load user progress.'}</p>`;
    }
  }
}

function closeUserProgressModal() {
  if (elements.modalAdminUserProgress) elements.modalAdminUserProgress.classList.add('hidden');
}

async function loadAdminSessions() {
  if (elements.adminSessionsMockTbody) elements.adminSessionsMockTbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted p-3">Loading sessions...</td></tr>';
  if (elements.adminSessionsAptitudeTbody) elements.adminSessionsAptitudeTbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted p-3">Loading sessions...</td></tr>';
  if (elements.adminSessionsCodingTbody) elements.adminSessionsCodingTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-3">Loading sessions...</td></tr>';

  const res = await apiCall('/api/admin/sessions');
  if (res.success && res.sessions) {
    const { mockInterviews, aptitudeAttempts, codingAttempts } = res.sessions;

    if (elements.adminSessionsMockTbody) {
      elements.adminSessionsMockTbody.innerHTML = (mockInterviews || []).length > 0 ? mockInterviews.map(m => `
        <tr>
          <td>#${m.id}</td>
          <td><strong>${m.user_name}</strong> <span class="text-muted">(${m.user_email})</span></td>
          <td>${m.target_role}</td>
          <td>${m.interview_type}</td>
          <td><span class="badge badge-outline">${m.difficulty}</span></td>
          <td><span class="badge badge-success">${m.final_score}/100</span></td>
          <td>${new Date(m.created_at).toLocaleDateString()}</td>
        </tr>
      `).join('') : '<tr><td colspan="7" class="text-center text-muted p-3">No mock interview sessions recorded.</td></tr>';
    }

    if (elements.adminSessionsAptitudeTbody) {
      elements.adminSessionsAptitudeTbody.innerHTML = (aptitudeAttempts || []).length > 0 ? aptitudeAttempts.map(a => `
        <tr>
          <td>#${a.id}</td>
          <td><strong>${a.user_name}</strong></td>
          <td><span class="badge badge-accent">${a.category}</span></td>
          <td><span class="badge badge-outline">${a.difficulty}</span></td>
          <td>${a.score} / ${a.total_questions}</td>
          <td><span class="badge badge-success">${a.percentage}%</span></td>
          <td>${new Date(a.created_at).toLocaleDateString()}</td>
        </tr>
      `).join('') : '<tr><td colspan="7" class="text-center text-muted p-3">No aptitude attempts recorded.</td></tr>';
    }

    if (elements.adminSessionsCodingTbody) {
      elements.adminSessionsCodingTbody.innerHTML = (codingAttempts || []).length > 0 ? codingAttempts.map(c => `
        <tr>
          <td>#${c.id}</td>
          <td><strong>${c.user_name}</strong></td>
          <td>${c.question_title || 'Coding Problem'}</td>
          <td><span class="badge ${c.status === 'Accepted' ? 'badge-success' : 'badge-warning'}">${c.status}</span></td>
          <td>${new Date(c.created_at).toLocaleDateString()}</td>
        </tr>
      `).join('') : '<tr><td colspan="5" class="text-center text-muted p-3">No coding submissions recorded.</td></tr>';
    }
    initIcons();
  } else {
    showToast(res.error || 'Failed to load session monitoring feed.', 'error');
  }
}

async function handleToggleUserAdmin(id, name, currentIsAdmin) {
  const actionText = currentIsAdmin === 1 ? 'demote' : 'promote';
  if (!confirm(`Are you sure you want to ${actionText} ${name}?`)) return;

  const res = await apiCall(`/api/admin/users/${id}/toggle-admin`, 'PUT');
  if (res.success) {
    showToast(res.message, 'success');
    loadAdminUsers();
  } else {
    showToast(res.error || 'Failed to update user status.', 'error');
  }
}

function filterAdminUsers() {
  const query = (elements.adminUserSearch ? elements.adminUserSearch.value : '').toLowerCase().trim();
  if (!query) {
    renderAdminUsersTable(state.admin.users);
    return;
  }
  const filtered = (state.admin.users || []).filter(u =>
    (u.name && u.name.toLowerCase().includes(query)) ||
    (u.email && u.email.toLowerCase().includes(query)) ||
    (u.target_role && u.target_role.toLowerCase().includes(query))
  );
  renderAdminUsersTable(filtered);
}

async function loadAdminQuestions(moduleName) {
  if (elements.adminQuestionsTbody) {
    elements.adminQuestionsTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-3">Loading questions...</td></tr>';
  }
  const res = await apiCall(`/api/admin/questions/${moduleName}`);
  if (res.success && res.questions) {
    state.admin.questions = res.questions;
    renderAdminQuestionsTable(res.questions, moduleName);
  } else {
    if (elements.adminQuestionsTbody) {
      elements.adminQuestionsTbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger p-3">${res.error || 'Failed to load questions.'}</td></tr>`;
    }
  }
}

function renderAdminQuestionsTable(questions, moduleName) {
  if (!elements.adminQuestionsTbody) return;
  elements.adminQuestionsTbody.innerHTML = '';
  if (!questions || questions.length === 0) {
    elements.adminQuestionsTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-3">No questions found in this repository.</td></tr>';
    return;
  }

  questions.forEach(q => {
    const tr = document.createElement('tr');
    const titleOrQuestion = q.title || q.question || 'Untitled';
    const category = q.category || 'General';
    const difficulty = q.difficulty || 'Easy';

    tr.innerHTML = `
      <td>#${q.id}</td>
      <td style="max-width: 380px;" class="text-truncate"><strong>${titleOrQuestion}</strong></td>
      <td><span class="badge badge-accent">${category}</span></td>
      <td><span class="badge badge-outline">${difficulty}</span></td>
      <td class="text-right d-flex justify-content-end gap-2">
        <button class="btn btn-sm btn-outline btn-edit-q" data-id="${q.id}">
          <i data-lucide="edit-3"></i> Edit
        </button>
        <button class="btn btn-sm btn-outline-danger btn-delete-q" data-id="${q.id}">
          <i data-lucide="trash-2"></i> Delete
        </button>
      </td>
    `;

    tr.querySelector('.btn-edit-q').addEventListener('click', () => openAdminQuestionModal(q));
    tr.querySelector('.btn-delete-q').addEventListener('click', () => handleDeleteQuestion(moduleName, q.id));
    elements.adminQuestionsTbody.appendChild(tr);
  });
  initIcons();
}

async function handleDeleteQuestion(moduleName, id) {
  if (!confirm('Are you sure you want to delete this question?')) return;
  const res = await apiCall(`/api/admin/questions/${moduleName}/${id}`, 'DELETE');
  if (res.success) {
    showToast('Question deleted successfully.', 'success');
    loadAdminQuestions(moduleName);
  } else {
    showToast(res.error || 'Failed to delete question.', 'error');
  }
}

function openAdminQuestionModal(questionToEdit = null) {
  if (!elements.modalAdminQuestion) return;
  elements.modalAdminQuestion.classList.remove('hidden');

  const titleElem = document.getElementById('admin-modal-q-title');
  const submitBtn = elements.formAdminAddQuestion ? elements.formAdminAddQuestion.querySelector('button[type="submit"]') : null;

  if (questionToEdit) {
    state.admin.editingQuestionId = questionToEdit.id;
    if (titleElem) titleElem.textContent = `Edit Question #${questionToEdit.id}`;
    if (submitBtn) submitBtn.innerHTML = '<i data-lucide="save"></i> <span>Save Changes</span>';

    const mod = state.admin.selectedModule || 'aptitude';
    if (elements.adminQModuleSelect) {
      elements.adminQModuleSelect.value = mod;
      elements.adminQModuleSelect.disabled = true; // prevent changing module when editing
    }
    toggleAdminQuestionModalFields(mod);

    if (mod === 'coding') {
      document.getElementById('admin-code-title').value = questionToEdit.title || '';
      document.getElementById('admin-code-desc').value = questionToEdit.description || '';
      document.getElementById('admin-code-category').value = questionToEdit.category || '';
      document.getElementById('admin-code-difficulty').value = questionToEdit.difficulty || 'Easy';
      document.getElementById('admin-code-ex-in').value = questionToEdit.example_input || '';
      document.getElementById('admin-code-ex-out').value = questionToEdit.example_output || '';
      document.getElementById('admin-code-starter').value = questionToEdit.starter_code || '';
      document.getElementById('admin-code-testcases').value = typeof questionToEdit.test_cases === 'string' ? questionToEdit.test_cases : JSON.stringify(questionToEdit.test_cases || []);
    } else {
      document.getElementById('admin-mcq-question').value = questionToEdit.question || '';
      document.getElementById('admin-mcq-a').value = questionToEdit.option_a || '';
      document.getElementById('admin-mcq-b').value = questionToEdit.option_b || '';
      document.getElementById('admin-mcq-c').value = questionToEdit.option_c || '';
      document.getElementById('admin-mcq-d').value = questionToEdit.option_d || '';
      document.getElementById('admin-mcq-correct').value = questionToEdit.correct_answer || questionToEdit.answer || 'option_a';
      document.getElementById('admin-mcq-category').value = questionToEdit.category || '';
      document.getElementById('admin-mcq-difficulty').value = questionToEdit.difficulty || 'Easy';
      document.getElementById('admin-mcq-explanation').value = questionToEdit.explanation || '';
    }

  } else {
    state.admin.editingQuestionId = null;
    if (titleElem) titleElem.textContent = 'Add New Question';
    if (submitBtn) submitBtn.innerHTML = '<i data-lucide="plus-circle"></i> <span>Create Question</span>';

    if (elements.formAdminAddQuestion) elements.formAdminAddQuestion.reset();
    const mod = state.admin.selectedModule || 'aptitude';
    if (elements.adminQModuleSelect) {
      elements.adminQModuleSelect.value = mod;
      elements.adminQModuleSelect.disabled = false;
    }
    toggleAdminQuestionModalFields(mod);
  }
  initIcons();
}

function closeAdminQuestionModal() {
  state.admin.editingQuestionId = null;
  if (elements.modalAdminQuestion) elements.modalAdminQuestion.classList.add('hidden');
  if (elements.formAdminAddQuestion) elements.formAdminAddQuestion.reset();
  if (elements.adminQModuleSelect) elements.adminQModuleSelect.disabled = false;
}

function toggleAdminQuestionModalFields(mod) {
  if (mod === 'coding') {
    if (elements.adminQFieldsMcq) elements.adminQFieldsMcq.classList.add('hidden');
    if (elements.adminQFieldsCoding) elements.adminQFieldsCoding.classList.remove('hidden');
  } else {
    if (elements.adminQFieldsMcq) elements.adminQFieldsMcq.classList.remove('hidden');
    if (elements.adminQFieldsCoding) elements.adminQFieldsCoding.classList.add('hidden');
  }
}

async function handleAdminCreateQuestion(e) {
  e.preventDefault();
  const mod = elements.adminQModuleSelect ? elements.adminQModuleSelect.value : 'aptitude';
  let payload = {};

  if (mod === 'coding') {
    payload = {
      title: document.getElementById('admin-code-title').value.trim(),
      description: document.getElementById('admin-code-desc').value.trim(),
      category: document.getElementById('admin-code-category').value.trim() || 'Algorithms',
      difficulty: document.getElementById('admin-code-difficulty').value,
      example_input: document.getElementById('admin-code-ex-in').value.trim(),
      example_output: document.getElementById('admin-code-ex-out').value.trim(),
      starter_code: document.getElementById('admin-code-starter').value.trim(),
      test_cases: document.getElementById('admin-code-testcases').value.trim()
    };
  } else {
    payload = {
      question: document.getElementById('admin-mcq-question').value.trim(),
      option_a: document.getElementById('admin-mcq-a').value.trim(),
      option_b: document.getElementById('admin-mcq-b').value.trim(),
      option_c: document.getElementById('admin-mcq-c').value.trim(),
      option_d: document.getElementById('admin-mcq-d').value.trim(),
      correct_answer: document.getElementById('admin-mcq-correct').value,
      answer: document.getElementById('admin-mcq-correct').value,
      category: document.getElementById('admin-mcq-category').value.trim() || (mod === 'aptitude' ? 'Quantitative Aptitude' : 'Python'),
      difficulty: document.getElementById('admin-mcq-difficulty').value,
      explanation: document.getElementById('admin-mcq-explanation').value.trim()
    };
  }

  const isEditing = !!state.admin.editingQuestionId;
  const url = isEditing ? `/api/admin/questions/${mod}/${state.admin.editingQuestionId}` : `/api/admin/questions/${mod}`;
  const method = isEditing ? 'PUT' : 'POST';

  const res = await apiCall(url, method, payload);
  if (res.success) {
    showToast(isEditing ? 'Question updated successfully!' : 'Question created successfully!', 'success');
    closeAdminQuestionModal();
    state.admin.selectedModule = mod;
    loadAdminQuestions(mod);
  } else {
    showToast(res.error || (isEditing ? 'Failed to update question.' : 'Failed to create question.'), 'error');
  }
}




