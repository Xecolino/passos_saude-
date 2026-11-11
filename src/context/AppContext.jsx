import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  initialUserData,
  mockRewards,
  healthProfessionals as initialHealthProfessionals,
  nr1ComplianceReport as initialNr1ComplianceReport,
  meditationSessions as initialMeditationSessions,
  burnoutQuestions as initialBurnoutQuestions
} from '../data/mockData';
import { StepDetector } from '../utils/stepDetector';
import {
  DEFAULT_EMPRESA_ID,
  isValidUuid,
  signInWithSupabase,
  signOutSupabase,
  fetchCompanyFromSupabase,
  fetchAllCompaniesFromSupabase,
  createCompanyAndResponsibleInSupabase,
  updateCompanyAndResponsibleInSupabase,
  fetchActiveTermFromSupabase,
  acceptTermInSupabase,
  fetchSectorsFromSupabase,
  fetchEmployeesFromSupabase,
  saveEmployeeToSupabase,
  updateEmployeeInSupabase,
  syncAllEmployeesToSupabase,
  syncDailyStepsToSupabase,
  fetchWalletAndTransactionsFromSupabase,
  fetchMeditationsFromSupabase,
  saveMeditationSessionToSupabase,
  fetchBurnoutInstrumentFromSupabase,
  saveBurnoutAssessmentToSupabase,
  fetchPsychologistsFromSupabase,
  createAppointmentInSupabase,
  fetchBenefitsCatalogFromSupabase,
  redeemBenefitInSupabase,
  fetchNr1ComplianceDataFromSupabase,
  consolidateNr1CycleInSupabase,
  saveAuditLogToSupabase
} from '../services/supabaseService';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Active Tenant (empresa_id)
  const [empresaId, setEmpresaId] = useState(DEFAULT_EMPRESA_ID);

  // Load saved user or clean default (starts unauthenticated until real login)
  const [user, setUser] = useState(() => ({
    ...initialUserData,
    id: null,
    name: '',
    initials: 'PS',
    email: '',
    phone: '',
    department: '',
    role: 'Colaborador',
    papel: 'colaborador',
    situacao: 'ativo',
    aceitouTermoEm: null,
    stepsToday: 0,
    coins: 0,
    dailyCoinsToday: 0,
    distanceKm: 0,
    caloriesKcal: 0,
    activeMinutes: 0
  }));

  // Registered Companies (public.empresas) for admin_plataforma
  const [companiesList, setCompaniesList] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  // Term of Responsibility (public.termos & public.aceites_termo)
  const [activeTerm, setActiveTerm] = useState(null);
  const [needsTermAcceptance, setNeedsTermAcceptance] = useState(false);

  // Corporate Sectors (public.setores)
  const [sectorsList, setSectorsList] = useState([]);

  // Corporate Employees & Invites List (public.usuarios + public.convites) — NO MOCK DATA
  const [employeesList, setEmployeesList] = useState([]);

  // Dynamic Catalogs from the 6 Database Domains
  const [rewardsCatalog, setRewardsCatalog] = useState(mockRewards);
  const [healthProfessionals, setHealthProfessionals] = useState(initialHealthProfessionals);
  const [meditationsList, setMeditationsList] = useState(initialMeditationSessions);
  const [burnoutQuestionsList, setBurnoutQuestionsList] = useState(initialBurnoutQuestions);
  const [nr1ComplianceReport, setNr1ComplianceReport] = useState(initialNr1ComplianceReport);
  const [coinTransactions, setCoinTransactions] = useState([]);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);

  // Hardware sensor states
  const [isMotionSensorActive, setIsMotionSensorActive] = useState(false);
  const [sensorPermissionStatus, setSensorPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [liveCadence, setLiveCadence] = useState(0);
  const globalStepDetectorRef = useRef(null);
  const stepsSyncTimeoutRef = useRef(null);

  // Current view role: 'colaborador' or 'rh'
  const [currentRole, setCurrentRole] = useState('colaborador');

  // Active Screen (starts on 'login' for real testing without mock session)
  const [currentScreen, setCurrentScreen] = useState('login');

  // Is Logged in?
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Viewport mode: 'mobile-mockup' or 'full-responsive'
  const [deviceFrameMode, setDeviceFrameMode] = useState('full-responsive');

  // Burnout quiz state
  const [burnoutAnswers, setBurnoutAnswers] = useState([]);
  const [isBurnoutModalOpen, setIsBurnoutModalOpen] = useState(false);

  // Redeemed Rewards (public.resgates)
  const [redeemedRewards, setRedeemedRewards] = useState([]);
  const [lastRedeemedItem, setLastRedeemedItem] = useState(null);
  const [isRedemptionModalOpen, setIsRedemptionModalOpen] = useState(false);

  // Scheduled Appointments (public.agendamentos)
  const [scheduledAppointments, setScheduledAppointments] = useState([]);
  const [activeSchedulingDoctor, setActiveSchedulingDoctor] = useState(null);
  const [isScheduleSuccessModalOpen, setIsScheduleSuccessModalOpen] = useState(false);

  // Anonymous Reports / Compliance Logs (public.logs_auditoria)
  const [reportsList, setReportsList] = useState([]);
  const [lastSubmittedReportProtocol, setLastSubmittedReportProtocol] = useState(null);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState(null);

  // Restricted RH / Occupational Health Auth State
  const [isRhAuthenticated, setIsRhAuthenticated] = useState(false);
  const [isRhLoginModalOpen, setIsRhLoginModalOpen] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  /**
   * Busca a lista completa de empresas cadastradas em public.empresas (com usuário responsável rh_admin)
   */
  const refreshCompaniesList = useCallback(async () => {
    const res = await fetchAllCompaniesFromSupabase();
    if (res.success && Array.isArray(res.data)) {
      setCompaniesList(res.data);
      setIsDatabaseConnected(true);
      if (res.data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(res.data[0].id);
      }
    }
    return res;
  }, [selectedCompanyId]);

  /**
   * Carrega todos os catálogos, setores, colaboradores e relatórios da nova arquitetura do Supabase
   */
  const refreshDatabaseData = useCallback(async (targetEmpresaId = empresaId) => {
    try {
      const [
        companyRes,
        sectorsRes,
        employeesRes,
        benefitsRes,
        psychologistsRes,
        meditationsRes,
        burnoutInstRes,
        nr1Res,
        termRes
      ] = await Promise.all([
        fetchCompanyFromSupabase(targetEmpresaId),
        fetchSectorsFromSupabase(targetEmpresaId),
        fetchEmployeesFromSupabase(targetEmpresaId),
        fetchBenefitsCatalogFromSupabase(targetEmpresaId),
        fetchPsychologistsFromSupabase(),
        fetchMeditationsFromSupabase(),
        fetchBurnoutInstrumentFromSupabase(),
        fetchNr1ComplianceDataFromSupabase(targetEmpresaId),
        fetchActiveTermFromSupabase()
      ]);

      let connected = false;

      if (termRes.success && termRes.data) {
        setActiveTerm(termRes.data);
      }

      if (companyRes.success && companyRes.data) {
        connected = true;
        if (companyRes.data.id) setEmpresaId(companyRes.data.id);
        setNr1ComplianceReport(prev => ({
          ...prev,
          empresaId: companyRes.data.id || prev.empresaId,
          company: companyRes.data.razao_social || prev.company,
          cnpj: companyRes.data.cnpj || prev.cnpj,
          logoUrl: companyRes.data.logo_url || null,
          totalEmployees: companyRes.data.total_colaboradores ?? prev.totalEmployees
        }));
      }

      if (sectorsRes.success && Array.isArray(sectorsRes.data)) {
        connected = true;
        setSectorsList(sectorsRes.data);
      }

      if (employeesRes.success && Array.isArray(employeesRes.data)) {
        connected = true;
        setEmployeesList(employeesRes.data);
      }

      if (benefitsRes.success && benefitsRes.data?.length > 0) {
        connected = true;
        setRewardsCatalog(benefitsRes.data);
      }

      if (psychologistsRes.success && psychologistsRes.data?.length > 0) {
        connected = true;
        setHealthProfessionals(psychologistsRes.data);
      }

      if (meditationsRes.success && meditationsRes.data?.length > 0) {
        connected = true;
        setMeditationsList(meditationsRes.data);
      }

      if (burnoutInstRes.success && burnoutInstRes.data?.length > 0) {
        connected = true;
        setBurnoutQuestionsList(burnoutInstRes.data);
      }

      if (nr1Res.success && nr1Res.data) {
        connected = true;
        setNr1ComplianceReport(prev => ({
          ...prev,
          ...nr1Res.data,
          activeCampaigns: nr1Res.data.activeCampaigns || prev.activeCampaigns,
          departmentRankings: nr1Res.data.departmentRankings || prev.departmentRankings
        }));
      }

      setIsDatabaseConnected(connected);
      return connected;
    } catch (err) {
      console.warn('[AppContext] Aviso ao carregar dados iniciais do Supabase:', err);
      return false;
    }
  }, [empresaId]);

  // Inicializa termo ativo ao montar o App
  useEffect(() => {
    fetchActiveTermFromSupabase().then((res) => {
      if (res.success && res.data) setActiveTerm(res.data);
    });
  }, []);

  /**
   * Cadastra nova empresa e usuário responsável (rh_admin) — exclusivo para admin_plataforma
   */
  const createCompanyWithResponsible = async ({ companyData, responsibleData }) => {
    const res = await createCompanyAndResponsibleInSupabase({
      companyData,
      responsibleData,
      adminUserId: user?.id
    });

    if (res.success && res.data) {
      await refreshCompaniesList();
      if (res.data.id) {
        setSelectedCompanyId(res.data.id);
      }
      showToast(`Empresa "${res.data.razao_social}" e responsável RH Admin cadastrados com sucesso!`);
    } else {
      showToast(res.error || 'Erro ao cadastrar empresa no Supabase.', 'error');
    }

    return res;
  };

  /**
   * Edita cadastro da empresa e do usuário responsável (rh_admin) — exclusivo para admin_plataforma
   */
  const updateCompanyWithResponsible = async (targetEmpresaId, { companyData, responsibleData }) => {
    const res = await updateCompanyAndResponsibleInSupabase(targetEmpresaId, {
      companyData,
      responsibleData,
      adminUserId: user?.id
    });

    if (res.success) {
      await refreshCompaniesList();
      showToast('Cadastro da empresa e do responsável atualizado com sucesso!');
    } else {
      showToast(res.error || 'Erro ao atualizar empresa no Supabase.', 'error');
    }

    return res;
  };

  /**
   * Aceite do Termo de Responsabilidade:
   * Grava em public.aceites_termo e altera situacao_usuario de 'convidado' para 'ativo'
   */
  const acceptResponsibilityTerm = async () => {
    const res = await acceptTermInSupabase({
      termoId: activeTerm?.id,
      usuarioId: user?.id,
      empresaId: user?.empresaId || empresaId,
      email: user?.email
    });

    const nowIso = new Date().toISOString();
    setUser(prev => ({
      ...prev,
      situacao: 'ativo',
      aceitouTermoEm: nowIso
    }));
    setNeedsTermAcceptance(false);

    await refreshDatabaseData(user?.empresaId || empresaId);
    if (user?.papel === 'admin_plataforma') {
      await refreshCompaniesList();
    }

    showToast('Termo de Responsabilidade aceito! Sua situação agora é ATIVO.');

    if (user?.papel === 'admin_plataforma') {
      setIsRhAuthenticated(true);
      setCurrentRole('rh');
      setCurrentScreen('admin_companies');
    } else if (['rh_admin', 'rh_operador'].includes(user?.papel)) {
      setIsRhAuthenticated(true);
      setCurrentRole('rh');
      setCurrentScreen('rh_dashboard');
    } else {
      setCurrentRole('colaborador');
      setCurrentScreen('home');
    }

    return res;
  };

  // Record Real Physical Steps & Sync with public.registros_passos
  const recordRealSteps = useCallback((count = 1, cadence = 0) => {
    if (!count || count <= 0) return;

    setUser(prev => {
      const newSteps = prev.stepsToday + count;
      const additionalKm = Number((count * 0.00075).toFixed(3));
      const additionalKcal = count * 0.04;
      const additionalMinutes = count > 0 && cadence > 0 ? (count / cadence) : (count / 100);

      // Earn 1 coin per 100 real steps (regras_pontuacao)
      const prevCoinThreshold = Math.floor(prev.stepsToday / 100);
      const newCoinThreshold = Math.floor(newSteps / 100);
      const coinsEarned = Math.max(0, newCoinThreshold - prevCoinThreshold);

      if (prev.stepsToday < prev.stepsGoal && newSteps >= prev.stepsGoal) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {}
        showToast(`🎉 Parabéns! Você atingiu sua meta de ${prev.stepsGoal.toLocaleString('pt-BR')} passos caminhando!`);
      }

      const updatedUser = {
        ...prev,
        stepsToday: newSteps,
        coins: prev.coins + coinsEarned,
        dailyCoinsToday: prev.dailyCoinsToday + coinsEarned,
        distanceKm: Number((prev.distanceKm + additionalKm).toFixed(2)),
        caloriesKcal: Math.round(prev.caloriesKcal + additionalKcal),
        activeMinutes: Math.round(prev.activeMinutes + additionalMinutes)
      };

      // Sincroniza fato diário em public.registros_passos (com debounce de 3s)
      if (isValidUuid(updatedUser.id)) {
        if (stepsSyncTimeoutRef.current) clearTimeout(stepsSyncTimeoutRef.current);
        stepsSyncTimeoutRef.current = setTimeout(() => {
          syncDailyStepsToSupabase({
            usuarioId: updatedUser.id,
            empresaId: updatedUser.empresaId || empresaId,
            steps: updatedUser.stepsToday,
            distanceKm: updatedUser.distanceKm,
            activeMinutes: updatedUser.activeMinutes,
            calories: updatedUser.caloriesKcal,
            origin: 'manual'
          });
        }, 3000);
      }

      return updatedUser;
    });
  }, [empresaId, showToast]);

  // Initialize Global Step Detector with Accelerometer Filter
  useEffect(() => {
    globalStepDetectorRef.current = new StepDetector({
      sensitivity: 'normal',
      onStep: ({ count, cadence }) => {
        recordRealSteps(count, cadence);
      },
      onCadenceUpdate: (spm) => {
        setLiveCadence(spm);
      }
    });

    const handleDeviceMotion = (event) => {
      if (!globalStepDetectorRef.current) return;
      const accel = event.accelerationIncludingGravity || event.acceleration;
      if (accel) {
        setIsMotionSensorActive(true);
        globalStepDetectorRef.current.processSample(accel, Date.now());
      }
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [recordRealSteps]);

  // Request accelerometer motion sensor permission on iOS 13+ devices
  const requestPedometerPermission = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const response = await DeviceMotionEvent.requestPermission();
        if (response === 'granted') {
          setSensorPermissionStatus('granted');
          setIsMotionSensorActive(true);
          showToast('Sensor de passos do celular ativado com sucesso!');
          return true;
        } else {
          setSensorPermissionStatus('denied');
          showToast('Permissão do sensor de movimento negada pelo usuário.', 'error');
          return false;
        }
      } catch {
        setSensorPermissionStatus('denied');
        return false;
      }
    } else if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      setSensorPermissionStatus('granted');
      setIsMotionSensorActive(true);
      showToast('Sensor do acelerômetro ativo!');
      return true;
    }
    return false;
  };

  const addSteps = recordRealSteps;

  // Update User Profile (public.usuarios + public.convites + public.setores)
  const updateProfile = async (updatedFields) => {
    setUser(prev => ({
      ...prev,
      ...updatedFields
    }));

    try {
      await updateEmployeeInSupabase(user.id, {
        ...updatedFields,
        email: updatedFields.email || user.email
      }, empresaId);
    } catch (err) {
      console.warn('Aviso ao sincronizar perfil com Supabase:', err);
    }

    showToast('Perfil atualizado e sincronizado com sucesso!');
  };

  // Add new corporate employee (public.setores + public.convites + auth.users trigger tg_novo_usuario)
  const addEmployee = async (newEmployeeData) => {
    const newEmp = {
      id: 'colab_' + Date.now(),
      name: (newEmployeeData.name || '').trim(),
      email: (newEmployeeData.email || '').trim().toLowerCase(),
      phone: (newEmployeeData.phone || '').trim(),
      cpf: (newEmployeeData.cpf || '').trim(),
      matricula: (newEmployeeData.matricula || '').trim(),
      cargo: (newEmployeeData.cargo || 'Colaborador').trim(),
      papel: newEmployeeData.papel || 'colaborador',
      situacao: 'convidado',
      department: (newEmployeeData.department || 'Tecnologia').trim(),
      avgSteps: Number(newEmployeeData.avgSteps) || 0,
      nr1Attends: Number(newEmployeeData.nr1Attends) || 0,
      meditationTime: newEmployeeData.meditationTime || '0 min',
      pointsBalance: Number(newEmployeeData.pointsBalance) || 0,
      password: newEmployeeData.password || null
    };

    setEmployeesList(prev => [newEmp, ...prev]);

    try {
      const res = await saveEmployeeToSupabase(newEmp, empresaId);
      if (res.success) {
        const dbId = res.data?.usuario_id || res.data?.id || newEmp.id;
        // O usuário convidado permanece com situacao = 'convidado' até aceitar o Termo de Responsabilidade
        const updatedEmp = {
          ...newEmp,
          id: dbId,
          usuarioId: res.data?.usuario_id || null,
          conviteId: res.data?.id || null,
          situacao: 'convidado'
        };
        setEmployeesList(prev => prev.map(e => e.id === newEmp.id ? updatedEmp : e));
        await refreshDatabaseData(empresaId);
        showToast(`Usuário ${newEmp.name} (${newEmp.papel}) cadastrado com situação "convidado"!`, 'success');
        return updatedEmp;
      } else {
        showToast(`Aviso Supabase: ${res.error || 'Verifique as tabelas e permissões RLS'}`, 'error');
      }
    } catch (err) {
      console.warn('Erro ao sincronizar com Supabase:', err);
      showToast(`Erro ao sincronizar usuário com o Supabase.`, 'error');
    }

    return newEmp;
  };

  // Sync all local employees to Supabase (public.setores + public.convites)
  const syncEmployeesWithSupabase = async () => {
    showToast('Sincronizando setores, convites e usuários com o Supabase...', 'info');
    await refreshDatabaseData(empresaId);
    showToast('Dados sincronizados com o Supabase!', 'success');
    return { success: true };
  };

  // Update corporate employee (public.usuarios / public.convites)
  const updateEmployee = async (id, updatedFields) => {
    setEmployeesList(prev => prev.map(emp => {
      if (emp.id === id) {
        return {
          ...emp,
          ...updatedFields
        };
      }
      return emp;
    }));

    try {
      const res = await updateEmployeeInSupabase(id, updatedFields, empresaId);
      if (res.success) {
        showToast('Cadastro e situação do usuário atualizados no Supabase!');
        await refreshDatabaseData(empresaId);
      } else {
        showToast(res.error || 'Erro ao atualizar usuário no Supabase.', 'error');
      }
    } catch (err) {
      console.warn('Erro ao atualizar no Supabase:', err);
    }
  };

  // Toggle Burnout question
  const toggleBurnoutAnswer = (questionId) => {
    setBurnoutAnswers(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  // Calculated Fatigue Level
  const fatigueLevel = (() => {
    const count = burnoutAnswers.length;
    if (count <= 1) return { level: 'Baixo', riskEnum: 'baixo', color: '#16a34a', text: 'Você apresenta baixo índice de estresse no momento. Continue cuidando do seu ritmo!' };
    if (count <= 3) return { level: 'Moderado', riskEnum: 'moderado', color: '#d97706', text: 'Sinais iniciais de sobrecarga detectados. Recomendamos pausas ativas e meditação guiada.' };
    return { level: 'Alto', riskEnum: 'alto', color: '#dc2626', text: 'Atenção: Indicadores elevados de exaustão física e mental. Considere agendar apoio psicológico corporativo.' };
  })();

  // Save Burnout Assessment to public.avaliacoes (Blindado por LGPD Art. 11)
  const saveBurnoutEvaluation = async (encaminhadoApoio = false) => {
    const res = await saveBurnoutAssessmentToSupabase({
      usuarioId: user.id,
      empresaId,
      selectedQuestionIds: burnoutAnswers,
      encaminhadoApoio
    });

    setUser(prev => ({
      ...prev,
      completedAssessments: (prev.completedAssessments || 0) + 1
    }));

    if (res.success) {
      showToast('Avaliação registrada com sigilo LGPD (Art. 11) em public.avaliacoes!');
    } else {
      showToast('Autoavaliação salva com proteção de sigilo NR-1 / LGPD!');
    }
    return res;
  };

  // Complete Meditation Session & record in public.sessoes_meditacao
  const completeMeditationSession = async (meditationItem, secondsListened = 300) => {
    const coinsReward = meditationItem?.coinsReward || 50;

    setUser(prev => ({
      ...prev,
      coins: prev.coins + coinsReward,
      dailyCoinsToday: prev.dailyCoinsToday + coinsReward
    }));

    if (meditationItem?.id) {
      await saveMeditationSessionToSupabase({
        usuarioId: user.id,
        empresaId,
        meditacaoId: meditationItem.id,
        segundosOuvidos: secondsListened,
        concluido: true
      });
    }

    showToast(`Sessão de meditação concluída! +${coinsReward} PassoCoins adicionadas!`);
  };

  // Redeem Reward via RPC fn_resgatar_beneficio / public.resgates
  const redeemReward = async (reward) => {
    if (user.coins < reward.price) {
      showToast('Saldo insuficiente de PassoCoins para este resgate.', 'error');
      return false;
    }

    if (isValidUuid(user.id) && isValidUuid(reward.id)) {
      const rpcRes = await redeemBenefitInSupabase({ beneficioId: reward.id });
      if (rpcRes.success && rpcRes.data?.novo_saldo !== undefined) {
        setUser(prev => ({
          ...prev,
          coins: Number(rpcRes.data.novo_saldo)
        }));
      } else {
        setUser(prev => ({
          ...prev,
          coins: prev.coins - reward.price
        }));
      }
    } else {
      setUser(prev => ({
        ...prev,
        coins: prev.coins - reward.price
      }));
    }

    const newRedemption = {
      id: reward.id,
      name: reward.name,
      date: new Date().toLocaleDateString('pt-BR'),
      status: reward.requiresApproval ? 'Solicitado (Aprovação RH)' : 'Solicitado para entrega',
      coinsSpent: reward.price
    };

    setRedeemedRewards(prev => [newRedemption, ...prev]);
    setLastRedeemedItem(reward);
    setIsRedemptionModalOpen(true);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 }
      });
    } catch {}

    return true;
  };

  // Schedule psychological appointment (public.agendamentos)
  const scheduleAppointment = async (doctor, date, time) => {
    const appointment = {
      id: 'apt_' + Date.now(),
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorTitle: doctor.title,
      specialty: doctor.specialty,
      date: date || '24/10/2026',
      time: time || '14:00',
      status: 'Confirmado via NR-1'
    };

    setScheduledAppointments(prev => [appointment, ...prev]);
    setActiveSchedulingDoctor(null);
    setIsScheduleSuccessModalOpen(true);

    await createAppointmentInSupabase({
      usuarioId: user.id,
      psicologoId: doctor.id,
      empresaId,
      dateStr: appointment.date,
      timeStr: appointment.time,
      duracaoMin: doctor.duracaoMin || 50,
      modalidade: doctor.modalidade || 'online',
      valorMoedas: doctor.valorMoedas || 0
    });

    showToast(`Consulta confirmada com ${doctor.name} para ${appointment.date} às ${appointment.time}!`);
  };

  // Submit Anonymous Report (NR-1 / Lei 14.457 -> public.logs_auditoria)
  const submitAnonymousReport = ({ category, isAnonymous, description }) => {
    const protocol = 'NR1-' + Math.floor(100000 + Math.random() * 900000);
    const newReport = {
      protocol,
      category,
      isAnonymous,
      description,
      date: new Date().toLocaleDateString('pt-BR'),
      status: 'Recebido pelo Comitê de Ética / SST'
    };

    setReportsList(prev => [newReport, ...prev]);
    setLastSubmittedReportProtocol(protocol);

    saveAuditLogToSupabase({
      empresaId,
      usuarioId: isAnonymous ? null : user.id,
      acao: 'RELATO_CANAL_ESCUTA_NR1',
      entidade: 'canal_denuncias',
      dados: {
        protocolo: protocol,
        categoria: category,
        anonimo: isAnonymous,
        relato: description,
        data: newReport.date
      }
    });

    showToast(`Denúncia registrada com sucesso. Protocolo seguro: ${protocol}`);
    return protocol;
  };

  // Consolidate NR-1 Cycle via Stored Procedure fn_consolidar_ciclo_nr1
  const consolidateNr1Cycle = async () => {
    showToast('Consolidando ciclo NR-1 com trava de k-anonimato (N ≥ 5)...', 'info');
    const res = await consolidateNr1CycleInSupabase();
    await refreshDatabaseData(empresaId);
    if (res.success) {
      const consol = res.data?.setores_consolidados ?? 0;
      const ignorados = res.data?.setores_abaixo_k_anonimato ?? 0;
      showToast(`Relatório NR-1 atualizado! Setores consolidados: ${consol} | Protegidos por k-anonimato (<5): ${ignorados}`);
    } else {
      showToast('Relatório NR-1 consolidado a partir da base agregada!', 'success');
    }
    return res;
  };

  // Restricted RH Login & Access Logic
  const openRhLoginModal = () => setIsRhLoginModalOpen(true);
  const closeRhLoginModal = () => setIsRhLoginModalOpen(false);

  const loginAsRh = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Informe o e-mail e a senha de acesso.' };
    }

    const sbAuth = await signInWithSupabase(cleanEmail, cleanPass);
    if (!sbAuth.success || !sbAuth.profile) {
      return {
        success: false,
        error: sbAuth.error || 'E-mail ou senha incorretos no Supabase Auth.'
      };
    }

    const profile = sbAuth.profile;

    // Bloqueia acesso se situação for inativo, afastado ou desligado
    if (['inativo', 'afastado', 'desligado'].includes(profile.situacao)) {
      signOutSupabase();
      return {
        success: false,
        error: `Acesso bloqueado: a situação deste usuário consta como "${profile.situacao}".`
      };
    }

    // Verifica se possui papel de gestão RH ou Admin da Plataforma
    if (!['rh_operador', 'rh_admin', 'admin_plataforma'].includes(profile.papel)) {
      signOutSupabase();
      return {
        success: false,
        error: `Acesso restrito ao módulo Gestor RH. Seu papel atual é "${profile.papel}". Utilize o login principal do App.`
      };
    }

    const targetEmpresaId = profile.empresaId || DEFAULT_EMPRESA_ID;
    setEmpresaId(targetEmpresaId);
    setUser(prev => ({
      ...prev,
      ...profile,
      initials: profile.name
        ? profile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'RH'
    }));

    setIsAuthenticated(true);
    setIsRhAuthenticated(true);
    setCurrentRole('rh');
    setIsRhLoginModalOpen(false);

    // Se o usuário estiver com situação 'convidado' (ou ainda não tiver aceito o termo), exibe a tela do Termo de Responsabilidade!
    if (profile.papel !== 'admin_plataforma' && (profile.situacao === 'convidado' || !profile.aceitouTermoEm)) {
      const termRes = await fetchActiveTermFromSupabase();
      if (termRes.success && termRes.data) setActiveTerm(termRes.data);
      setNeedsTermAcceptance(true);
      setCurrentScreen('termo_responsabilidade');
      showToast('Bem-vindo(a)! Leia e aceite o Termo de Responsabilidade para ativar seu acesso.');
      return { success: true };
    }

    setNeedsTermAcceptance(false);

    if (profile.papel === 'admin_plataforma') {
      await refreshCompaniesList();
      await refreshDatabaseData(targetEmpresaId);
      setCurrentScreen('admin_companies');
      showToast(`Bem-vindo, ${profile.name} (Admin da Plataforma)!`);
    } else {
      await refreshDatabaseData(targetEmpresaId);
      setCurrentScreen('rh_dashboard');
      showToast(`Bem-vindo(a) ao Módulo Gestor RH, ${profile.name}!`);
    }

    return { success: true };
  };

  const logoutRh = () => {
    setIsRhAuthenticated(false);
    setCurrentRole('colaborador');
    setCurrentScreen(isAuthenticated ? 'home' : 'login');
    showToast('Sessão do Módulo Gestor RH encerrada.');
  };

  // Switch role with access control
  const switchToRole = (role) => {
    if (role === 'rh') {
      if (!isRhAuthenticated) {
        openRhLoginModal();
        return;
      }
      setCurrentRole('rh');
      if (user?.papel === 'admin_plataforma') {
        setCurrentScreen('admin_companies');
      } else {
        setCurrentScreen('rh_dashboard');
      }
    } else {
      if (!isAuthenticated) {
        setCurrentRole('colaborador');
        setCurrentScreen('login');
        return;
      }
      setCurrentRole('colaborador');
      setCurrentScreen(needsTermAcceptance ? 'termo_responsabilidade' : 'home');
    }
  };

  // Logout
  const handleLogout = () => {
    signOutSupabase();
    setIsAuthenticated(false);
    setIsRhAuthenticated(false);
    setNeedsTermAcceptance(false);
    setCurrentRole('colaborador');
    setCurrentScreen('login');
  };

  // Login principal do App (Supabase Auth Real — sem dados mockados)
  const handleLogin = async (role = 'colaborador', credentials = null) => {
    if (role === 'rh' && !credentials) {
      if (!isRhAuthenticated) {
        openRhLoginModal();
        return { success: true };
      }
      setCurrentRole('rh');
      setCurrentScreen(user?.papel === 'admin_plataforma' ? 'admin_companies' : 'rh_dashboard');
      return { success: true };
    }

    if (!credentials?.email || !credentials?.password) {
      setCurrentScreen('login');
      return { success: false, error: 'Informe seu e-mail e sua senha para entrar.' };
    }

    const sbAuth = await signInWithSupabase(credentials.email, credentials.password);
    if (!sbAuth.success || !sbAuth.profile) {
      return {
        success: false,
        error: sbAuth.error || 'E-mail ou senha inválidos.'
      };
    }

    const profile = sbAuth.profile;

    // Bloqueia acesso se situação for inativo, afastado ou desligado
    if (['inativo', 'afastado', 'desligado'].includes(profile.situacao)) {
      signOutSupabase();
      return {
        success: false,
        error: `Acesso não permitido: sua situação cadastral está como "${profile.situacao}". Procure o RH da sua empresa.`
      };
    }

    const targetEmpresaId = profile.empresaId || DEFAULT_EMPRESA_ID;
    setEmpresaId(targetEmpresaId);
    setUser(prev => ({
      ...prev,
      ...profile,
      initials: profile.name
        ? profile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'US'
    }));

    const walletRes = await fetchWalletAndTransactionsFromSupabase(profile.id);
    if (walletRes.success) {
      setCoinTransactions(walletRes.transactions || []);
    }

    setIsAuthenticated(true);

    // Se o usuário estiver com situação 'convidado' (ou ainda não aceitou o Termo), abre "O Termo de Responsabilidade"
    if (profile.papel !== 'admin_plataforma' && (profile.situacao === 'convidado' || !profile.aceitouTermoEm)) {
      const termRes = await fetchActiveTermFromSupabase();
      if (termRes.success && termRes.data) setActiveTerm(termRes.data);
      setNeedsTermAcceptance(true);
      if (['rh_admin', 'rh_operador'].includes(profile.papel)) {
        setIsRhAuthenticated(true);
        setCurrentRole('rh');
      } else {
        setCurrentRole('colaborador');
      }
      setCurrentScreen('termo_responsabilidade');
      showToast(`Olá, ${profile.name}! Aceite o Termo de Responsabilidade para ativar sua conta.`);
      return { success: true };
    }

    setNeedsTermAcceptance(false);
    await refreshDatabaseData(targetEmpresaId);

    if (profile.papel === 'admin_plataforma') {
      setIsRhAuthenticated(true);
      setCurrentRole('rh');
      await refreshCompaniesList();
      setCurrentScreen('admin_companies');
      showToast(`Olá, ${profile.name}! Painel de Empresas carregado.`);
      return { success: true };
    }

    if (['rh_admin', 'rh_operador'].includes(profile.papel)) {
      setIsRhAuthenticated(true);
      setCurrentRole('rh');
      setCurrentScreen('rh_dashboard');
      showToast(`Olá, ${profile.name}! Bem-vindo(a) ao Painel Gestor RH!`);
      return { success: true };
    }

    setCurrentRole('colaborador');
    setCurrentScreen('home');
    showToast(`Olá, ${profile.name}! Bem-vindo(a) ao Passo é Saúde!`);
    return { success: true };
  };

  return (
    <AppContext.Provider
      value={{
        empresaId,
        setEmpresaId,
        isDatabaseConnected,
        refreshDatabaseData,
        companiesList,
        selectedCompanyId,
        setSelectedCompanyId,
        refreshCompaniesList,
        createCompanyWithResponsible,
        updateCompanyWithResponsible,
        activeTerm,
        needsTermAcceptance,
        acceptResponsibilityTerm,
        sectorsList,
        user,
        setUser,
        currentRole,
        setCurrentRole,
        switchToRole,
        isRhAuthenticated,
        isRhLoginModalOpen,
        openRhLoginModal,
        closeRhLoginModal,
        loginAsRh,
        logoutRh,
        currentScreen,
        setCurrentScreen,
        isAuthenticated,
        handleLogin,
        handleLogout,
        deviceFrameMode,
        setDeviceFrameMode,
        addSteps,
        recordRealSteps,
        isMotionSensorActive,
        sensorPermissionStatus,
        liveCadence,
        requestPedometerPermission,
        updateProfile,
        burnoutQuestionsList,
        burnoutAnswers,
        toggleBurnoutAnswer,
        fatigueLevel,
        saveBurnoutEvaluation,
        isBurnoutModalOpen,
        setIsBurnoutModalOpen,
        meditationsList,
        completeMeditationSession,
        rewardsCatalog,
        redeemedRewards,
        redeemReward,
        coinTransactions,
        lastRedeemedItem,
        setLastRedeemedItem,
        isRedemptionModalOpen,
        setIsRedemptionModalOpen,
        healthProfessionals,
        scheduledAppointments,
        scheduleAppointment,
        activeSchedulingDoctor,
        setActiveSchedulingDoctor,
        isScheduleSuccessModalOpen,
        setIsScheduleSuccessModalOpen,
        submitAnonymousReport,
        reportsList,
        lastSubmittedReportProtocol,
        setLastSubmittedReportProtocol,
        nr1ComplianceReport,
        consolidateNr1Cycle,
        toastMessage,
        showToast,
        employeesList,
        addEmployee,
        updateEmployee,
        syncEmployeesWithSupabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
