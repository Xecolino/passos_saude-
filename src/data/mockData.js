export const initialUserData = {
  id: "colab_01",
  name: "Ana Colaboradora",
  initials: "AC",
  role: "Engenheira de Software Pleno",
  email: "ana.colaboradora@empresa.com.br",
  phone: "(11) 98765-4321",
  department: "Tecnologia",
  companyName: "TechCorp Brasil",
  coins: 1250,
  dailyCoinsToday: 84,
  streakDays: 5,
  stepsToday: 8420,
  stepsGoal: 10000,
  distanceKm: 5.8,
  caloriesKcal: 320,
  activeMinutes: 72,
  averageHeartRate: 112,
  completedAssessments: 1,
  avatarUrl: null
};

export const hourlyStepsData = [
  { hour: "06h", steps: 420 },
  { hour: "09h", steps: 1850 },
  { hour: "12h", steps: 2340 },
  { hour: "15h", steps: 1680 },
  { hour: "18h", steps: 1420 },
  { hour: "21h", steps: 710 }
];

export const burnoutQuestions = [
  { id: 1, text: "Sinto-me exausto(a) ao acordar para trabalhar" },
  { id: 2, text: "Tenho dificuldade de concentração no trabalho" },
  { id: 3, text: "Perdi o interesse por atividades que antes me motivavam" },
  { id: 4, text: "Sinto-me irritado(a) ou impaciente com frequência" },
  { id: 5, text: "Tenho dificuldade para dormir ou sono não reparador" },
  { id: 6, text: "Sinto que minhas conquistas no trabalho não são reconhecidas" }
];

export const anonymousReportCategories = [
  { id: "assedio_moral", label: "Assédio Moral" },
  { id: "assedio_sexual", label: "Assédio Sexual" },
  { id: "clima_sobrecarga", label: "Clima de Trabalho & Sobrecarga" },
  { id: "ergonomia_seguranca", label: "Segurança / Condições de Trabalho" },
  { id: "discriminacao", label: "Discriminação e Desigualdade" },
  { id: "outro", label: "Outros Assuntos" }
];

export const rewardCategories = [
  { id: "todos", label: "Todos" },
  { id: "brindes", label: "Brindes" },
  { id: "folgas", label: "Folgas" },
  { id: "pontos", label: "Vouchers" },
  { id: "parceiros", label: "Parceiros" }
];

export const mockRewards = [
  {
    id: "rew_1",
    name: "Squeeze Personalizada Passos Saúde",
    category: "brindes",
    price: 200,
    tag: "Popular",
    description: "Garrafa térmica de inox 650ml com indicador de hidratação diária.",
    icon: "bottle",
    requiresApproval: false
  },
  {
    id: "rew_2",
    name: "Voucher Café Especial (R$ 25)",
    category: "pontos",
    price: 200,
    tag: "Imediato",
    description: "Crédito digital para Starbucks, The Coffee ou cafeterias parceiras.",
    icon: "coffee",
    requiresApproval: false
  },
  {
    id: "rew_3",
    name: "Camiseta Dry-Fit Passos Saúde",
    category: "brindes",
    price: 500,
    tag: "Exclusivo",
    description: "Tecido respirável antibacteriano premium, ideal para caminhadas corporativas.",
    icon: "shirt",
    requiresApproval: false
  },
  {
    id: "rew_4",
    name: "Voucher Farmácia & Cuidados (R$ 50)",
    category: "pontos",
    price: 500,
    tag: "Saúde",
    description: "Válido para suplementos, protetor solar e itens de farmácia credenciada.",
    icon: "pill",
    requiresApproval: false
  },
  {
    id: "rew_5",
    name: "Meia Folga Remunerada",
    category: "folgas",
    price: 1000,
    tag: "Bem-estar",
    description: "Dispensa de 4 horas da jornada de trabalho alinhada previamente com o gestor.",
    icon: "calendar",
    requiresApproval: true
  },
  {
    id: "rew_6",
    name: "Folga Integral (Day Off)",
    category: "folgas",
    price: 2000,
    tag: "Prêmio Máximo",
    description: "1 dia inteiro de descanso remunerado para recarregar as energias.",
    icon: "sun",
    requiresApproval: true
  },
  {
    id: "rew_7",
    name: "Passe Academia / Gympass 1 Mês",
    category: "parceiros",
    price: 850,
    tag: "Parceria",
    description: "Acesso a mais de 3.000 academias e estúdios de pilates e yoga.",
    icon: "activity",
    requiresApproval: false
  },
  {
    id: "rew_8",
    name: "Kit Ergonômico de Mesa",
    category: "brindes",
    price: 600,
    tag: "Ergonomia NR-17",
    description: "Suporte articulado para notebook + almofada lombar ergonômica.",
    icon: "shield",
    requiresApproval: false
  }
];

export const healthProfessionals = [
  {
    id: "prof_1",
    name: "Dra. Ana Ribeiro",
    title: "Psicóloga Clínica",
    crp: "CRP 06/142981",
    rating: 5.0,
    reviewsCount: 48,
    specialty: "Especialista em Gestão de Ansiedade e Prevenção de Burnout",
    initials: "AR",
    color: "#16a34a",
    availableTimes: ["09:00", "10:30", "14:00", "15:30", "17:00", "18:30"]
  },
  {
    id: "prof_2",
    name: "Dr. Rafael Mendes",
    title: "Terapeuta Cognitivo-Comportamental",
    crp: "CRP 06/158220",
    rating: 5.0,
    reviewsCount: 36,
    specialty: "Terapia breve focada em estresse ocupacional e foco executivo",
    initials: "RM",
    color: "#d97706",
    availableTimes: ["08:30", "11:00", "13:30", "16:00", "17:30"]
  },
  {
    id: "prof_3",
    name: "Dra. Beatriz Souza",
    title: "Psicóloga Organizacional",
    crp: "CRP 06/139401",
    rating: 5.0,
    reviewsCount: 52,
    specialty: "Relacionamentos no trabalho, segurança psicológica e resiliência",
    initials: "BS",
    color: "#2563eb",
    availableTimes: ["10:00", "14:00", "15:00", "16:30"]
  },
  {
    id: "prof_4",
    name: "Dr. Lucas Carvalho",
    title: "Educador Físico & Ergonomista",
    crp: "CREF 042190-G/SP",
    rating: 4.9,
    reviewsCount: 29,
    specialty: "Ginástica laboral, mobilidade articular e alívio de DORT/LER",
    initials: "LC",
    color: "#059669",
    availableTimes: ["08:00", "09:30", "11:30", "14:30", "16:00"]
  }
];

export const meditationSessions = [
  {
    id: "med_1",
    title: "Respiração Consciente & Foco",
    duration: "5 minutos",
    durationSeconds: 300,
    instructor: "Camila Duarte",
    coinsReward: 50,
    description: "Técnica de alívio de estresse imediato recomendada para pausas entre reuniões.",
    audioTone: "mindful-bells"
  },
  {
    id: "med_2",
    title: "Pausa Anti-Estresse e Relaxamento Ocular",
    duration: "3 minutos",
    durationSeconds: 180,
    instructor: "Felipe Rocha",
    coinsReward: 30,
    description: "Alívio da tensão nos olhos, ombros e cervical causados por telas contínuas.",
    audioTone: "ocean-breeze"
  },
  {
    id: "med_3",
    title: "Descompressão de Fim de Turno",
    duration: "10 minutos",
    durationSeconds: 600,
    instructor: "Dra. Ana Ribeiro",
    coinsReward: 100,
    description: "Separação saudável entre o horário de trabalho e o tempo de descanso pessoal.",
    audioTone: "forest-ambient"
  }
];

export const nr1ComplianceReport = {
  company: "TechCorp Brasil Ltda",
  cnpj: "12.345.678/0001-90",
  totalEmployees: 342,
  activeParticipationRate: 87.4,
  nr1NormReference: "Norma Regulamentadora NR-1 (Portaria MTP nº 4.219 / Diretrizes GRO & PGR)",
  riskSummary: {
    lowRiskPct: 82,
    moderateRiskPct: 15,
    highRiskPct: 3
  },
  totalPhysicalActivityMinutes: 38450,
  averageStepsPerDay: 8640,
  scheduledPsychologicalSupports: 47,
  activeCampaigns: [
    { title: "Campanha Movimento Saudável 2026", progress: 92, status: "Em andamento" },
    { title: "Avaliação Periódica de Riscos Psicossociais", progress: 84, status: "Em andamento" },
    { title: "Treinamento CIPA + Canal de Escuta Ativa", progress: 100, status: "Concluído" }
  ],
  departmentRankings: [
    { dept: "Operações & Logística", avgSteps: 9420, participation: "94%", healthIndex: "Excelente" },
    { dept: "Tecnologia", avgSteps: 8850, participation: "89%", healthIndex: "Muito Bom" },
    { dept: "Comercial & Vendas", avgSteps: 8410, participation: "86%", healthIndex: "Bom" },
    { dept: "Recursos Humanos", avgSteps: 7920, participation: "91%", healthIndex: "Bom" },
    { dept: "Financeiro & Jurídico", avgSteps: 7340, participation: "78%", healthIndex: "Atenção (Sedentarismo)" }
  ]
};

export const initialEmployeesList = [
  {
    id: "colab_01",
    name: "Ana Colaboradora",
    email: "ana.colaboradora@empresa.com.br",
    phone: "(11) 98765-4321",
    department: "Tecnologia",
    avgSteps: 8640,
    nr1Attends: 1,
    meditationTime: "25 min",
    pointsBalance: 1250
  },
  {
    id: "colab_02",
    name: "Carlos Eduardo Silva",
    email: "carlos.silva@empresa.com.br",
    phone: "(11) 97123-4567",
    department: "Operações & Logística",
    avgSteps: 10250,
    nr1Attends: 0,
    meditationTime: "15 min",
    pointsBalance: 2100
  },
  {
    id: "colab_03",
    name: "Mariana Costa Rios",
    email: "mariana.costa@empresa.com.br",
    phone: "(21) 98877-6655",
    department: "Comercial & Vendas",
    avgSteps: 7890,
    nr1Attends: 2,
    meditationTime: "40 min",
    pointsBalance: 980
  },
  {
    id: "colab_04",
    name: "Roberto Almeida Jr.",
    email: "roberto.almeida@empresa.com.br",
    phone: "(31) 99234-5678",
    department: "Recursos Humanos",
    avgSteps: 8120,
    nr1Attends: 1,
    meditationTime: "30 min",
    pointsBalance: 1450
  },
  {
    id: "colab_05",
    name: "Juliana Ferreira Prado",
    email: "juliana.prado@empresa.com.br",
    phone: "(11) 96543-2109",
    department: "Financeiro & Jurídico",
    avgSteps: 6950,
    nr1Attends: 0,
    meditationTime: "20 min",
    pointsBalance: 720
  },
  {
    id: "colab_06",
    name: "Fernando Henrique Dias",
    email: "fernando.dias@empresa.com.br",
    phone: "(41) 98456-7890",
    department: "Tecnologia",
    avgSteps: 9150,
    nr1Attends: 1,
    meditationTime: "35 min",
    pointsBalance: 1680
  }
];

