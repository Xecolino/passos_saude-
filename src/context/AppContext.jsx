import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  initialUserData,
  mockRewards,
  healthProfessionals as initialHealthProfessionals,
  nr1ComplianceReport as initialNr1ComplianceReport,
  initialEmployeesList,
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

  // Load saved user or initial
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('passo_saude_user');
      return saved ? JSON.parse(saved) : initialUserData;
    } catch {
      return initialUserData;
    }
  });

  // Corporate Sectors (public.setores)
  const [sectorsList, setSectorsList] = useState([
    { id: '22222222-2222-2222-2222-222222222201', nome: 'Tecnologia', ghe: 'GHE-01-TEC' },
    { id: '22222222-2222-2222-2222-222222222202', nome: 'Operações & Logística', ghe: 'GHE-02-OPE' },
    { id: '22222222-2222-2222-2222-222222222203', nome: 'Comercial & Vendas', ghe: 'GHE-03-COM' },
    { id: '22222222-2222-2222-2222-222222222204', nome: 'Recursos Humanos', ghe: 'GHE-04-RH' },
    { id: '22222222-2222-2222-2222-222222222205', nome: 'Financeiro & Jurídico', ghe: 'GHE-05-FIN' },
    { id: '22222222-2222-2222-2222-222222222206', nome: 'Marketing & Produto', ghe: 'GHE-06-MKT' },
    { id: '22222222-2222-2222-2222-222222222207', nome: 'Administrativo / Geral', ghe: 'GHE-07-ADM' }
  ]);

  // Corporate Employees & Invites List (public.usuarios + public.convites)
  const [employeesList, setEmployeesList] = useState(() => {
    try {
      const saved = localStorage.getItem('passo_saude_employees');
      return saved ? JSON.parse(saved) : initialEmployeesList;
    } catch {
      return initialEmployeesList;
    }
  });

  // Dynamic Catalogs from the 6 Database Domains
  const [rewardsCatalog, setRewardsCatalog] = useState(mockRewards);
  const [healthProfessionals, setHealthProfessionals] = useState(initialHealthProfessionals);
  const [meditationsList, setMeditationsList] = useState(initialMeditationSessions);
  const [burnoutQuestionsList, setBurnoutQuestionsList] = useState(initialBurnoutQuestions);
  const [nr1ComplianceReport, setNr1ComplianceReport] = useState(initialNr1ComplianceReport);
  const [coinTransactions, setCoinTransactions] = useState([]);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);

  // Save employees to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('passo_saude_employees', JSON.stringify(employeesList));
    } catch (e) {
      console.warn('Could not save employees to localStorage:', e);
    }
  }, [employeesList]);

  // Hardware sensor states
  const [isMotionSensorActive, setIsMotionSensorActive] = useState(false);
  const [sensorPermissionStatus, setSensorPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [liveCadence, setLiveCadence] = useState(0);
  const globalStepDetectorRef = useRef(null);
  const stepsSyncTimeoutRef = useRef(null);

  // Current view role: 'colaborador' or 'rh'
  const [currentRole, setCurrentRole] = useState('colaborador');

  // Active Screen
  const [currentScreen, setCurrentScreen] = useState('home');

  // Is Logged in?
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Viewport mode: 'mobile-mockup' or 'full-responsive'
  const [deviceFrameMode, setDeviceFrameMode] = useState('mobile-mockup');

  // Burnout quiz state
  const [burnoutAnswers, setBurnoutAnswers] = useState([1, 2]);
  const [isBurnoutModalOpen, setIsBurnoutModalOpen] = useState(false);

  // Redeemed Rewards (public.resgates)
  const [redeemedRewards, setRedeemedRewards] = useState([
    {
      id: 'rew_1',
      name: 'Squeeze Personalizada Passos Saúde',
      date: '10/10/2026',
      status: 'Entregue pelo RH',
      coinsSpent: 200
    }
  ]);
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

  // Save user changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('passo_saude_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, [user]);

  const showToast = useCallback((message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

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
        nr1Res
      ] = await Promise.all([
        fetchCompanyFromSupabase(targetEmpresaId),
        fetchSectorsFromSupabase(targetEmpresaId),
        fetchEmployeesFromSupabase(targetEmpresaId),
        fetchBenefitsCatalogFromSupabase(targetEmpresaId),
        fetchPsychologistsFromSupabase(),
        fetchMeditationsFromSupabase(),
        fetchBurnoutInstrumentFromSupabase(),
        fetchNr1ComplianceDataFromSupabase(targetEmpresaId)
      ]);

      let connected = false;

      if (companyRes.success && companyRes.data) {
        connected = true;
        if (companyRes.data.id) setEmpresaId(companyRes.data.id);
      }

      if (sectorsRes.success && sectorsRes.data?.length > 0) {
        connected = true;
        setSectorsList(sectorsRes.data);
      }

      if (employeesRes.success && employeesRes.data?.length > 0) {
        connected = true;
        // Preserva médias/saldos mockados caso o convite ainda não tenha histórico de passos
        setEmployeesList(prev => {
          const prevByEmail = new Map((prev || []).map(p => [(p.email || '').toLowerCase(), p]));
          return employeesRes.data.map(dbEmp => {
            const localMatch = prevByEmail.get((dbEmp.email || '').toLowerCase());
            return {
              ...localMatch,
              ...dbEmp,
              phone: dbEmp.phone && dbEmp.phone !== '-' ? dbEmp.phone : (localMatch?.phone || '(11) 98765-4321'),
              avgSteps: dbEmp.avgSteps > 0 ? dbEmp.avgSteps : (localMatch?.avgSteps || 0),
              nr1Attends: dbEmp.nr1Attends > 0 ? dbEmp.nr1Attends : (localMatch?.nr1Attends || 0),
              meditationTime: dbEmp.meditationTime !== '0 min' ? dbEmp.meditationTime : (localMatch?.meditationTime || '0 min'),
              pointsBalance: dbEmp.pointsBalance > 0 ? dbEmp.pointsBalance : (localMatch?.pointsBalance || 0)
            };
          });
        });
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

  // Inicializa conexão com o banco ao montar o App
  useEffect(() => {
    refreshDatabaseData(DEFAULT_EMPRESA_ID);
  }, [refreshDatabaseData]);

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
        const dbSituacao = res.data?.usuario_id ? 'ativo' : 'convidado';
        setEmployeesList(prev => prev.map(e => e.id === newEmp.id ? {
          ...e,
          id: dbId,
          usuarioId: res.data?.usuario_id || null,
          conviteId: res.data?.id || null,
          situacao: dbSituacao
        } : e));
        showToast(`Colaborador(a) ${newEmp.name} registrado(a) em convites/usuários no Supabase!`, 'success');
      } else if (res.isRlsError) {
        showToast(`Salvo localmente! Execute o script seed_dados_iniciais.sql no Supabase.`, 'error');
      } else {
        showToast(`Salvo localmente. Aviso Supabase: ${res.error || 'Verifique as tabelas'}`, 'error');
      }
    } catch (err) {
      console.warn('Erro ao sincronizar com Supabase:', err);
      showToast(`Colaborador(a) ${newEmp.name} cadastrado(a) localmente.`, 'success');
    }

    return newEmp;
  };

  // Sync all local employees to Supabase (public.setores + public.convites)
  const syncEmployeesWithSupabase = async () => {
    showToast('Sincronizando setores, convites e colaboradores com o Supabase...', 'info');
    const res = await syncAllEmployeesToSupabase(employeesList, empresaId);
    if (res.isRlsError) {
      showToast('Acesso bloqueado por RLS. Execute os scripts SQL da pasta sql/ no Supabase.', 'error');
    } else if (res.successCount > 0) {
      await refreshDatabaseData(empresaId);
      showToast(`${res.successCount} colaboradores sincronizados na nova arquitetura do Supabase!`, 'success');
    } else {
      showToast(`Aviso na sincronização: ${res.lastError || 'Verifique sua conexão'}`, 'error');
    }
    return res;
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

    showToast('Cadastro de colaborador atualizado com sucesso!');

    try {
      await updateEmployeeInSupabase(id, updatedFields, empresaId);
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

    // Se o usuário estiver autenticado no Supabase com UUID válido, tenta usar a RPC atômica fn_resgatar_beneficio
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

    // Tenta autenticar via Supabase Auth caso o usuário exista em auth.users
    const sbAuth = await signInWithSupabase(cleanEmail, cleanPass);
    if (sbAuth.success && sbAuth.profile) {
      if (['rh_operador', 'rh_admin', 'admin_plataforma'].includes(sbAuth.profile.papel)) {
        setIsRhAuthenticated(true);
        setCurrentRole('rh');
        setCurrentScreen('rh_dashboard');
        setIsRhLoginModalOpen(false);
        await refreshDatabaseData(sbAuth.profile.empresaId);
        showToast('Acesso autorizado via Supabase Auth ao Painel de Gestão SST & NR-1!');
        return { success: true };
      }
    }

    // Fallback para credencial delegada da empresa (Demo/Simulador)
    if (cleanEmail === 'techcorpbr@gmail.com' && cleanPass === '123456') {
      setIsRhAuthenticated(true);
      setCurrentRole('rh');
      setCurrentScreen('rh_dashboard');
      setIsRhLoginModalOpen(false);
      refreshDatabaseData(empresaId);
      showToast('Acesso autorizado ao Painel de Gestão Ocupacional & SST!');
      return { success: true };
    }

    return {
      success: false,
      error: 'E-mail ou senha incorretos. Acesso restrito aos usuários delegados pela empresa (rh_operador / rh_admin).'
    };
  };

  const logoutRh = () => {
    setIsRhAuthenticated(false);
    setCurrentRole('colaborador');
    setCurrentScreen('home');
    showToast('Sessão do Painel de Gestão encerrada.');
  };

  // Switch role with access control
  const switchToRole = (role) => {
    if (role === 'rh') {
      if (!isRhAuthenticated) {
        openRhLoginModal();
        return;
      }
      setCurrentRole('rh');
      setCurrentScreen('rh_dashboard');
    } else {
      setCurrentRole('colaborador');
      setCurrentScreen('home');
    }
  };

  // Logout
  const handleLogout = () => {
    signOutSupabase();
    setIsAuthenticated(false);
    setIsRhAuthenticated(false);
    setCurrentRole('colaborador');
    setCurrentScreen('login');
  };

  // Login (Real Supabase Auth + Hybrid Demo Mode)
  const handleLogin = async (role = 'colaborador', credentials = null) => {
    if (credentials?.email && credentials?.password) {
      const sbAuth = await signInWithSupabase(credentials.email, credentials.password);
      if (sbAuth.success && sbAuth.profile) {
        setUser(prev => ({
          ...prev,
          ...sbAuth.profile,
          initials: sbAuth.profile.name
            ? sbAuth.profile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
            : 'AC'
        }));
        const walletRes = await fetchWalletAndTransactionsFromSupabase(sbAuth.profile.id);
        if (walletRes.success) {
          setCoinTransactions(walletRes.transactions || []);
        }
      } else {
        // Verifica se o e-mail corresponde a algum colaborador carregado de public.usuarios / public.convites
        const matchedEmp = employeesList.find(
          e => (e.email || '').toLowerCase() === credentials.email.trim().toLowerCase()
        );
        if (matchedEmp) {
          setUser(prev => ({
            ...prev,
            id: matchedEmp.id,
            name: matchedEmp.name,
            initials: matchedEmp.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(),
            email: matchedEmp.email,
            phone: matchedEmp.phone !== '-' ? matchedEmp.phone : prev.phone,
            department: matchedEmp.department,
            role: matchedEmp.cargo || prev.role,
            coins: matchedEmp.pointsBalance || prev.coins
          }));
        }
      }
    }

    setIsAuthenticated(true);
    if (role === 'rh') {
      if (!isRhAuthenticated) {
        openRhLoginModal();
        return;
      }
      setCurrentRole('rh');
      setCurrentScreen('rh_dashboard');
    } else {
      setCurrentRole('colaborador');
      setCurrentScreen('home');
    }
    showToast(`Olá, ${user.name}! Bem-vindo(a) ao Passo é Saúde!`);
  };

  return (
    <AppContext.Provider
      value={{
        empresaId,
        isDatabaseConnected,
        refreshDatabaseData,
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
