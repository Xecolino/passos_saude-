/**
 * ============================================================================
 * SERVIÇO DE INTEGRAÇÃO SUPABASE — PASSO É SAÚDE (ARQUITETURA 31 TABELAS)
 * ============================================================================
 * Conecta o aplicativo aos 6 domínios do banco PostgreSQL / Supabase:
 *   1. Tenant & Identidade: empresas, setores, usuarios, convites, termos, aceites_termo
 *   2. Gamificação & Passos: registros_passos, regras_pontuacao, carteiras, transacoes_moedas, desafios, vw_ranking_passos
 *   3. Saúde Mental & NR-1: meditacoes, sessoes_meditacao, instrumentos, instrumento_questoes, ciclos_psicossociais, avaliacoes, respostas_avaliacao
 *   4. Apoio Clínico: psicologos, agendamentos, vw_agendamentos_rh (prontuarios_agendamentos isolado)
 *   5. Benefícios & Resgates: beneficios, resgates, RPC fn_resgatar_beneficio
 *   6. Relatórios NR-1 & Auditoria: relatorios_nr1, RPC fn_consolidar_ciclo_nr1, notificacoes, logs_auditoria
 * ============================================================================
 */

const rawUrl = import.meta.env?.VITE_SUPABASE_URL || '';
export const SUPABASE_URL = rawUrl.trim().replace(/\.supabase\.com\/?$/, '.supabase.co');
export const SUPABASE_ANON_KEY = (import.meta.env?.VITE_SUPABASE_ANON_KEY || '').trim();

// ID padrão da empresa (Tenant Raiz) usado como fallback caso ainda não haja sessão Auth ativa
export const DEFAULT_EMPRESA_ID = '11111111-1111-1111-1111-111111111111';
export const DEFAULT_INSTRUMENTO_ID = '55555555-5555-5555-5555-555555555501';
export const DEFAULT_CICLO_ID = '55555555-5555-5555-5555-555555555599';

// Mapa de setores padrão (compatível com sql/seed_dados_iniciais.sql)
const DEFAULT_SECTOR_MAP = {
  'Tecnologia': '22222222-2222-2222-2222-222222222201',
  'Operações & Logística': '22222222-2222-2222-2222-222222222202',
  'Comercial & Vendas': '22222222-2222-2222-2222-222222222203',
  'Recursos Humanos': '22222222-2222-2222-2222-222222222204',
  'Financeiro & Jurídico': '22222222-2222-2222-2222-222222222205',
  'Marketing & Produto': '22222222-2222-2222-2222-222222222206',
  'Administrativo / Geral': '22222222-2222-2222-2222-222222222207'
};

// Armazenamento de sessão Auth (JWT) em memória/localStorage
let currentAuthToken = null;
try {
  currentAuthToken = localStorage.getItem('passo_saude_sb_token') || null;
} catch {}

export function setSupabaseAuthToken(token) {
  currentAuthToken = token;
  try {
    if (token) {
      localStorage.setItem('passo_saude_sb_token', token);
    } else {
      localStorage.removeItem('passo_saude_sb_token');
    }
  } catch {}
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function isValidUuid(val) {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

function getHeaders(extraHeaders = {}, useUserJwt = true) {
  const bearer = useUserJwt && currentAuthToken ? currentAuthToken : SUPABASE_ANON_KEY;
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${bearer}`,
    ...extraHeaders
  };
}

function parseSupabaseError(errText, tableName = '') {
  let isRls = false;
  let isMissingTable = false;
  let msg = errText;

  try {
    const parsed = JSON.parse(errText);
    const code = parsed.code || '';
    const rawMsg = parsed.message || parsed.error_description || parsed.msg || errText;

    if (code === '42501' || rawMsg.toLowerCase().includes('row-level security') || rawMsg.toLowerCase().includes('permission denied')) {
      isRls = true;
      msg = `Política RLS ativa na tabela ${tableName || 'do Supabase'}. Execute os scripts schema_completo_passo_e_saude.sql e seed_dados_iniciais.sql no SQL Editor.`;
    } else if (code === '42P01' || code === 'PGRST205' || rawMsg.includes('Could not find the table')) {
      isMissingTable = true;
      msg = `Tabela "${tableName}" ainda não encontrada no Supabase. Execute o script sql/schema_completo_passo_e_saude.sql no SQL Editor.`;
    } else {
      msg = rawMsg;
    }
  } catch {}

  return { message: msg, isRlsError: isRls, isMissingTable };
}

// ============================================================================
// AUTENTICAÇÃO SUPABASE AUTH (/auth/v1)
// ============================================================================

/**
 * Autentica um usuário no Supabase Auth e retorna a sessão + perfil em public.usuarios
 */
export async function signInWithSupabase(email, password) {
  if (!isSupabaseConfigured()) {
    return { success: false, localOnly: true, error: 'Supabase não configurado no .env' };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: getHeaders({}, false),
      body: JSON.stringify({ email: email.trim(), password })
    });

    if (!response.ok) {
      const errText = await response.text();
      const parsed = parseSupabaseError(errText, 'auth.users');
      return { success: false, error: parsed.message };
    }

    const authData = await response.json();
    if (authData?.access_token) {
      setSupabaseAuthToken(authData.access_token);
    }

    const userId = authData?.user?.id;
    let profile = null;
    if (userId) {
      const profRes = await fetchUserProfileById(userId);
      if (profRes.success) profile = profRes.data;
    }

    return {
      success: true,
      session: authData,
      user: authData.user,
      profile
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Cria conta no Supabase Auth para um colaborador convidado pelo RH.
 * Dispara automaticamente a trigger `tg_novo_usuario` no banco, que:
 *   1. Lê o convite em `public.convites` pelo e-mail
 *   2. Cria o registro em `public.usuarios` vinculado à `empresa_id` e `setor_id`
 *   3. Inicializa a carteira em `public.carteiras` com saldo 0
 *   4. Marca o convite como `aceito`
 */
export async function signUpCollaboratorAuth({ email, password, name, phone }) {
  if (!isSupabaseConfigured() || !email || !password) {
    return { success: false, localOnly: true };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: getHeaders({}, false),
      body: JSON.stringify({
        email: email.trim(),
        password,
        data: {
          nome: name,
          telefone: phone || ''
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: errText };
    }

    const data = await response.json();
    const createdUserId = data?.user?.id || data?.id || null;
    return { success: true, userId: createdUserId, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function signOutSupabase() {
  setSupabaseAuthToken(null);
}

// ============================================================================
// DOMÍNIO 1: TENANT (EMPRESAS), SETORES, USUÁRIOS E CONVITES
// ============================================================================

/**
 * Busca os dados da empresa (Tenant) em `public.empresas`
 */
export async function fetchCompanyFromSupabase(empresaId = DEFAULT_EMPRESA_ID) {
  if (!isSupabaseConfigured()) return { success: false, localOnly: true };

  try {
    const url = isValidUuid(empresaId)
      ? `${SUPABASE_URL}/rest/v1/empresas?id=eq.${empresaId}&select=*&limit=1`
      : `${SUPABASE_URL}/rest/v1/empresas?ativo=eq.true&select=*&order=criado_em.asc&limit=1`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, ...parseSupabaseError(errText, 'empresas') };
    }

    const rows = await response.json();
    if (!rows || rows.length === 0) {
      return { success: false, error: 'Nenhuma empresa encontrada em public.empresas.' };
    }

    return { success: true, data: rows[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Lista setores da empresa em `public.setores`
 */
export async function fetchSectorsFromSupabase(empresaId = DEFAULT_EMPRESA_ID) {
  if (!isSupabaseConfigured()) return { success: false, localOnly: true };

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/setores?empresa_id=eq.${empresaId}&ativo=eq.true&select=*&order=nome.asc`,
      { method: 'GET', headers: getHeaders() }
    );

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, ...parseSupabaseError(errText, 'setores') };
    }

    const rows = await response.json();
    return { success: true, data: rows || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Garante que um setor exista em `public.setores` e retorna seu `id` (UUID)
 */
export async function ensureSectorInSupabase(sectorName, empresaId = DEFAULT_EMPRESA_ID) {
  const cleanName = (sectorName || 'Administrativo / Geral').trim();

  if (!isSupabaseConfigured()) {
    return DEFAULT_SECTOR_MAP[cleanName] || DEFAULT_SECTOR_MAP['Administrativo / Geral'];
  }

  try {
    // 1. Tenta localizar pelo nome na empresa
    const searchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/setores?empresa_id=eq.${empresaId}&nome=eq.${encodeURIComponent(cleanName)}&select=id,nome&limit=1`,
      { method: 'GET', headers: getHeaders() }
    );

    if (searchRes.ok) {
      const found = await searchRes.json();
      if (found && found.length > 0) {
        return found[0].id;
      }
    }

    // 2. Cria o setor se não existir
    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/setores`, {
      method: 'POST',
      headers: getHeaders({ 'Prefer': 'return=representation' }),
      body: JSON.stringify({
        empresa_id: empresaId,
        nome: cleanName,
        ativo: true
      })
    });

    if (createRes.ok) {
      const created = await createRes.json();
      if (created && created.length > 0) {
        return created[0].id;
      }
    }
  } catch (err) {
    console.warn('[Supabase Service] Aviso ao resolver setor:', err);
  }

  return DEFAULT_SECTOR_MAP[cleanName] || DEFAULT_SECTOR_MAP['Administrativo / Geral'];
}

/**
 * Busca o perfil completo de um usuário em `public.usuarios` com setor, empresa e carteira
 */
export async function fetchUserProfileById(usuarioId) {
  if (!isSupabaseConfigured() || !isValidUuid(usuarioId)) {
    return { success: false, localOnly: true };
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/usuarios?id=eq.${usuarioId}&select=*,setores(id,nome,ghe),empresas(id,razao_social,nome_fantasia,cnpj),carteiras(saldo,total_creditado,total_debitado)&limit=1`,
      { method: 'GET', headers: getHeaders() }
    );

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, ...parseSupabaseError(errText, 'usuarios') };
    }

    const rows = await response.json();
    if (!rows || rows.length === 0) return { success: false, error: 'Usuário não encontrado.' };

    const u = rows[0];
    const wallet = Array.isArray(u.carteiras) ? u.carteiras[0] : u.carteiras;
    return {
      success: true,
      data: {
        id: u.id,
        empresaId: u.empresa_id || DEFAULT_EMPRESA_ID,
        setorId: u.setor_id,
        name: u.nome,
        email: u.email,
        phone: u.telefone || '',
        cpf: u.cpf || '',
        matricula: u.matricula || '',
        role: u.cargo || 'Colaborador Corporativo',
        papel: u.papel || 'colaborador',
        situacao: u.situacao || 'ativo',
        department: u.setores?.nome || 'Tecnologia',
        companyName: u.empresas?.nome_fantasia || u.empresas?.razao_social || 'TechCorp Brasil',
        stepsGoal: u.meta_diaria_passos || 10000,
        coins: wallet?.saldo !== undefined ? Number(wallet.saldo) : 0,
        avatarUrl: u.avatar_url || null
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Consulta todos os colaboradores da empresa na nova estrutura do banco:
 * Unifica `public.usuarios` (colaboradores ativos) + `public.convites` (colaboradores convidados/onboarding),
 * enriquecendo com `public.setores`, `public.carteiras` e `public.vw_ranking_passos`.
 */
export async function fetchEmployeesFromSupabase(empresaId = DEFAULT_EMPRESA_ID) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Credenciais Supabase não configuradas no .env.' };
  }

  try {
    const [usuariosRes, convitesRes, rankingRes] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/usuarios?empresa_id=eq.${empresaId}&select=*,setores(id,nome),carteiras(saldo)&order=criado_em.desc`,
        { method: 'GET', headers: getHeaders() }
      ),
      fetch(
        `${SUPABASE_URL}/rest/v1/convites?empresa_id=eq.${empresaId}&select=*,setores(id,nome)&order=criado_em.desc`,
        { method: 'GET', headers: getHeaders() }
      ),
      fetch(
        `${SUPABASE_URL}/rest/v1/vw_ranking_passos?empresa_id=eq.${empresaId}&select=*`,
        { method: 'GET', headers: getHeaders() }
      )
    ]);

    if (!usuariosRes.ok && !convitesRes.ok) {
      const errText = await (usuariosRes.ok ? convitesRes.text() : usuariosRes.text());
      const parsed = parseSupabaseError(errText, 'usuarios / convites');
      return { success: false, error: parsed.message, isRlsError: parsed.isRlsError };
    }

    const usuariosRows = usuariosRes.ok ? await usuariosRes.json() : [];
    const convitesRows = convitesRes.ok ? await convitesRes.json() : [];
    const rankingRows = rankingRes.ok ? await rankingRes.json() : [];

    // Índice de média de passos por usuario_id a partir da view vw_ranking_passos
    const stepsByUserId = {};
    for (const r of rankingRows || []) {
      if (r.usuario_id) {
        stepsByUserId[r.usuario_id] = Number(r.media_diaria) || 0;
      }
    }

    const unifiedByEmail = new Map();

    // 1. Mapeia usuários ativos em public.usuarios
    for (const u of usuariosRows || []) {
      const emailKey = (u.email || '').toLowerCase();
      const wallet = Array.isArray(u.carteiras) ? u.carteiras[0] : u.carteiras;
      unifiedByEmail.set(emailKey, {
        id: u.id,
        usuarioId: u.id,
        conviteId: null,
        sourceTable: 'usuarios',
        name: u.nome,
        email: u.email,
        phone: u.telefone || '-',
        cpf: u.cpf || '',
        matricula: u.matricula || '',
        cargo: u.cargo || 'Colaborador',
        papel: u.papel || 'colaborador',
        situacao: u.situacao || 'ativo',
        department: u.setores?.nome || 'Tecnologia',
        setorId: u.setor_id,
        stepsGoal: u.meta_diaria_passos || 8000,
        avgSteps: stepsByUserId[u.id] || 0,
        nr1Attends: 0,
        meditationTime: '0 min',
        pointsBalance: wallet?.saldo !== undefined ? Number(wallet.saldo) : 0
      });
    }

    // 2. Mescla convites de onboarding em public.convites que ainda não viraram usuarios
    for (const c of convitesRows || []) {
      const emailKey = (c.email || '').toLowerCase();
      if (unifiedByEmail.has(emailKey)) {
        const existing = unifiedByEmail.get(emailKey);
        existing.conviteId = c.id;
        existing.tokenConvite = c.token;
        if (!existing.cpf && c.cpf) existing.cpf = c.cpf;
        if (!existing.matricula && c.matricula) existing.matricula = c.matricula;
        if ((!existing.cargo || existing.cargo === 'Colaborador') && c.cargo) existing.cargo = c.cargo;
      } else if (c.situacao !== 'cancelado') {
        unifiedByEmail.set(emailKey, {
          id: c.usuario_id || c.id,
          usuarioId: c.usuario_id || null,
          conviteId: c.id,
          tokenConvite: c.token,
          sourceTable: 'convites',
          name: c.nome,
          email: c.email,
          phone: '-',
          cpf: c.cpf || '',
          matricula: c.matricula || '',
          cargo: c.cargo || 'Colaborador',
          papel: c.papel || 'colaborador',
          situacao: c.situacao === 'aceito' ? 'ativo' : 'convidado',
          department: c.setores?.nome || 'Tecnologia',
          setorId: c.setor_id,
          stepsGoal: 8000,
          avgSteps: c.usuario_id ? (stepsByUserId[c.usuario_id] || 0) : 0,
          nr1Attends: 0,
          meditationTime: '0 min',
          pointsBalance: 0
        });
      }
    }

    return {
      success: true,
      data: Array.from(unifiedByEmail.values())
    };
  } catch (error) {
    console.warn('[Supabase Service] Erro ao buscar colaboradores na nova estrutura:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cadastra um novo colaborador na nova arquitetura do banco:
 *   1. Resolve ou cria o setor em `public.setores`
 *   2. Cria o registro de onboarding em `public.convites` (vinculado à `empresa_id` e `setor_id`)
 *   3. Se uma senha provisória foi gerada, cria o usuário em `auth.users` via SignUp,
 *      disparando a trigger `tg_novo_usuario` que popula `public.usuarios` e `public.carteiras`!
 */
export async function saveEmployeeToSupabase(employeeData, empresaId = DEFAULT_EMPRESA_ID) {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configuradas no .env.',
      localOnly: true
    };
  }

  try {
    // 1. Garante o setor em public.setores
    const setorId = await ensureSectorInSupabase(employeeData.department, empresaId);

    // 2. Monta o payload para public.convites
    const convitePayload = {
      empresa_id: empresaId,
      setor_id: setorId,
      nome: (employeeData.name || '').trim(),
      email: (employeeData.email || '').trim().toLowerCase(),
      cpf: employeeData.cpf ? employeeData.cpf.trim() : null,
      matricula: employeeData.matricula ? employeeData.matricula.trim() : null,
      cargo: employeeData.cargo || employeeData.role || 'Colaborador',
      papel: employeeData.papel || 'colaborador',
      situacao: 'enviado',
      enviado_em: new Date().toISOString()
    };

    console.log('[Supabase Service] Gravando convite de onboarding em public.convites:', convitePayload);

    // Verifica se já existe convite aberto para este e-mail na empresa
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/convites?empresa_id=eq.${empresaId}&email=ilike.${encodeURIComponent(convitePayload.email)}&select=id,situacao&limit=1`,
      { method: 'GET', headers: getHeaders() }
    );

    let conviteResult = null;
    const existingConvites = checkRes.ok ? await checkRes.json() : [];

    if (existingConvites && existingConvites.length > 0) {
      // Atualiza convite existente
      const conviteId = existingConvites[0].id;
      const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/convites?id=eq.${conviteId}`, {
        method: 'PATCH',
        headers: getHeaders({ 'Prefer': 'return=representation' }),
        body: JSON.stringify({
          setor_id: setorId,
          nome: convitePayload.nome,
          cpf: convitePayload.cpf,
          matricula: convitePayload.matricula,
          cargo: convitePayload.cargo,
          papel: convitePayload.papel
        })
      });

      if (!patchRes.ok) {
        const errText = await patchRes.text();
        return { success: false, ...parseSupabaseError(errText, 'convites') };
      }
      const patched = await patchRes.json();
      conviteResult = patched?.[0] || existingConvites[0];
    } else {
      // Insere novo convite em public.convites
      const postRes = await fetch(`${SUPABASE_URL}/rest/v1/convites`, {
        method: 'POST',
        headers: getHeaders({ 'Prefer': 'return=representation' }),
        body: JSON.stringify(convitePayload)
      });

      if (!postRes.ok) {
        const errText = await postRes.text();
        const parsed = parseSupabaseError(errText, 'convites');
        console.error('[Supabase Service] Erro ao inserir em public.convites:', postRes.status, parsed.message);
        return {
          success: false,
          error: parsed.message,
          isRlsError: parsed.isRlsError,
          status: postRes.status
        };
      }

      const inserted = await postRes.json();
      conviteResult = inserted?.[0] || null;
    }

    // 3. Se houver senha provisória, provisiona a conta em auth.users para acionar tg_novo_usuario
    let provisionedUserId = null;
    if (employeeData.password) {
      const signUpRes = await signUpCollaboratorAuth({
        email: convitePayload.email,
        password: employeeData.password,
        name: convitePayload.nome,
        phone: employeeData.phone
      });

      if (signUpRes.success && signUpRes.userId) {
        provisionedUserId = signUpRes.userId;
        // Atualiza telefone na tabela public.usuarios recém-provisionada pela trigger
        if (employeeData.phone) {
          await fetch(`${SUPABASE_URL}/rest/v1/usuarios?id=eq.${provisionedUserId}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({
              telefone: employeeData.phone.trim(),
              atualizado_em: new Date().toISOString()
            })
          });
        }
      }
    }

    return {
      success: true,
      data: {
        ...conviteResult,
        usuario_id: provisionedUserId || conviteResult?.usuario_id || null,
        setor_id: setorId
      }
    };
  } catch (error) {
    console.error('[Supabase Service] Falha de conexão ao cadastrar colaborador:', error);
    return {
      success: false,
      error: error.message || 'Falha de conexão com o Supabase.'
    };
  }
}

/**
 * Atualiza dados de um colaborador em `public.usuarios` e/ou `public.convites`
 */
export async function updateEmployeeInSupabase(id, updatedFields, empresaId = DEFAULT_EMPRESA_ID) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Credenciais ausentes.' };
  }

  try {
    let setorId = updatedFields.setorId;
    if (updatedFields.department) {
      setorId = await ensureSectorInSupabase(updatedFields.department, empresaId);
    }

    const userPayload = {
      ...(updatedFields.name && { nome: updatedFields.name.trim() }),
      ...(updatedFields.email && { email: updatedFields.email.trim().toLowerCase() }),
      ...(updatedFields.phone && { telefone: updatedFields.phone.trim() }),
      ...(updatedFields.cpf !== undefined && { cpf: updatedFields.cpf || null }),
      ...(updatedFields.matricula !== undefined && { matricula: updatedFields.matricula || null }),
      ...(updatedFields.cargo !== undefined && { cargo: updatedFields.cargo || null }),
      ...(updatedFields.papel !== undefined && { papel: updatedFields.papel }),
      ...(updatedFields.situacao !== undefined && { situacao: updatedFields.situacao }),
      ...(updatedFields.stepsGoal !== undefined && { meta_diaria_passos: Number(updatedFields.stepsGoal) }),
      ...(setorId && { setor_id: setorId }),
      atualizado_em: new Date().toISOString()
    };

    const convitePayload = {
      ...(updatedFields.name && { nome: updatedFields.name.trim() }),
      ...(updatedFields.email && { email: updatedFields.email.trim().toLowerCase() }),
      ...(updatedFields.cpf !== undefined && { cpf: updatedFields.cpf || null }),
      ...(updatedFields.matricula !== undefined && { matricula: updatedFields.matricula || null }),
      ...(updatedFields.cargo !== undefined && { cargo: updatedFields.cargo || null }),
      ...(updatedFields.papel !== undefined && { papel: updatedFields.papel }),
      ...(setorId && { setor_id: setorId })
    };

    // Atualiza por UUID (se for válido) ou por e-mail
    if (isValidUuid(id)) {
      await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/usuarios?id=eq.${id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(userPayload)
        }),
        fetch(`${SUPABASE_URL}/rest/v1/convites?id=eq.${id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(convitePayload)
        })
      ]);
    } else if (updatedFields.email) {
      const cleanEmail = encodeURIComponent(updatedFields.email.trim().toLowerCase());
      await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/usuarios?email=ilike.${cleanEmail}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(userPayload)
        }),
        fetch(`${SUPABASE_URL}/rest/v1/convites?email=ilike.${cleanEmail}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(convitePayload)
        })
      ]);
    }

    return { success: true, data: userPayload };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sincroniza em lote a lista de colaboradores locais com `public.setores` e `public.convites`
 */
export async function syncAllEmployeesToSupabase(employees = [], empresaId = DEFAULT_EMPRESA_ID) {
  let successCount = 0;
  let errorCount = 0;
  let lastError = null;
  let isRlsError = false;

  for (const emp of employees) {
    const res = await saveEmployeeToSupabase(emp, empresaId);
    if (res.success) {
      successCount++;
    } else {
      errorCount++;
      lastError = res.error;
      if (res.isRlsError) isRlsError = true;
    }
  }

  return { successCount, errorCount, lastError, isRlsError };
}

// ============================================================================
// DOMÍNIO 2: GAMIFICAÇÃO, PASSOS DIÁRIOS, CARTEIRA E TRANSAÇÕES
// ============================================================================

/**
 * Grava ou atualiza os passos do dia em `public.registros_passos` (chave única: usuario_id, data)
 */
export async function syncDailyStepsToSupabase({
  usuarioId,
  empresaId = DEFAULT_EMPRESA_ID,
  date,
  steps,
  distanceKm,
  activeMinutes,
  calories,
  origin = 'manual'
}) {
  if (!isSupabaseConfigured() || !isValidUuid(usuarioId)) {
    return { success: false, localOnly: true };
  }

  const todayStr = date || new Date().toISOString().split('T')[0];
  const payload = {
    usuario_id: usuarioId,
    empresa_id: empresaId,
    data: todayStr,
    passos: Math.min(200000, Math.max(0, Math.round(steps || 0))),
    distancia_km: Number((distanceKm || 0).toFixed(2)),
    minutos_ativos: Math.round(activeMinutes || 0),
    calorias: Math.round(calories || 0),
    origem: origin,
    atualizado_em: new Date().toISOString()
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/registros_passos?on_conflict=usuario_id,data`, {
      method: 'POST',
      headers: getHeaders({
        'Prefer': 'resolution=merge-duplicates,return=representation'
      }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, ...parseSupabaseError(errText, 'registros_passos') };
    }

    const data = await response.json();
    return { success: true, data: data?.[0] || payload };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Busca carteira (`public.carteiras`) e extrato (`public.transacoes_moedas`) do colaborador
 */
export async function fetchWalletAndTransactionsFromSupabase(usuarioId) {
  if (!isSupabaseConfigured() || !isValidUuid(usuarioId)) {
    return { success: false, localOnly: true };
  }

  try {
    const [walletRes, txRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/carteiras?usuario_id=eq.${usuarioId}&select=*&limit=1`, {
        method: 'GET',
        headers: getHeaders()
      }),
      fetch(`${SUPABASE_URL}/rest/v1/transacoes_moedas?usuario_id=eq.${usuarioId}&select=*&order=criado_em.desc&limit=25`, {
        method: 'GET',
        headers: getHeaders()
      })
    ]);

    const walletRows = walletRes.ok ? await walletRes.json() : [];
    const txRows = txRes.ok ? await txRes.json() : [];

    return {
      success: true,
      wallet: walletRows?.[0] || null,
      transactions: txRows || []
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// DOMÍNIO 3: SAÚDE MENTAL, MEDITAÇÃO & AVALIAÇÕES PSICOSSOCIAIS (NR-1 / LGPD)
// ============================================================================

/**
 * Busca catálogo de meditações publicadas em `public.meditacoes`
 */
export async function fetchMeditationsFromSupabase() {
  if (!isSupabaseConfigured()) return { success: false, localOnly: true };

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/meditacoes?publicado=eq.true&select=*&order=criado_em.asc`,
      { method: 'GET', headers: getHeaders() }
    );

    if (!response.ok) return { success: false };
    const rows = await response.json();
    if (!rows || rows.length === 0) return { success: false };

    const mapped = rows.map((m) => ({
      id: m.id,
      title: m.titulo,
      duration: `${Math.max(1, Math.round((m.duracao_seg || 300) / 60))} minutos`,
      durationSeconds: m.duracao_seg || 300,
      category: m.categoria || 'Mindfulness',
      instructor: m.descricao?.includes('Instrutor')
        ? m.descricao.split('Instrutor')[1].replace(/^a?:\s*/i, '').replace(/\.$/, '')
        : 'Camila Duarte',
      coinsReward: Math.max(30, Math.round((m.duracao_seg || 300) / 6)),
      description: m.descricao || '',
      audioTone: m.url_audio || 'mindful-bells'
    }));

    return { success: true, data: mapped };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Registra uma sessão de meditação realizada em `public.sessoes_meditacao`
 */
export async function saveMeditationSessionToSupabase({
  usuarioId,
  empresaId = DEFAULT_EMPRESA_ID,
  meditacaoId,
  segundosOuvidos = 300,
  concluido = true
}) {
  if (!isSupabaseConfigured() || !isValidUuid(usuarioId) || !isValidUuid(meditacaoId)) {
    return { success: false, localOnly: true };
  }

  try {
    const payload = {
      usuario_id: usuarioId,
      empresa_id: empresaId,
      meditacao_id: meditacaoId,
      iniciado_em: new Date(Date.now() - segundosOuvidos * 1000).toISOString(),
      concluido_em: concluido ? new Date().toISOString() : null,
      segundos_ouvidos: segundosOuvidos
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/sessoes_meditacao`, {
      method: 'POST',
      headers: getHeaders({ 'Prefer': 'return=representation' }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, ...parseSupabaseError(errText, 'sessoes_meditacao') };
    }

    const data = await response.json();
    return { success: true, data: data?.[0] || payload };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Busca questões do instrumento de Burnout em `public.instrumento_questoes`
 */
export async function fetchBurnoutInstrumentFromSupabase() {
  if (!isSupabaseConfigured()) return { success: false, localOnly: true };

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/instrumento_questoes?instrumento_id=eq.${DEFAULT_INSTRUMENTO_ID}&select=*&order=ordem.asc`,
      { method: 'GET', headers: getHeaders() }
    );

    if (!response.ok) return { success: false };
    const rows = await response.json();
    if (!rows || rows.length === 0) return { success: false };

    const mapped = rows.map((q) => ({
      id: q.ordem,
      uuid: q.id,
      instrumentoId: q.instrumento_id,
      dimensaoId: q.dimensao_id,
      text: q.enunciado
    }));

    return { success: true, data: mapped };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Salva autoavaliação individual de Burnout em `public.avaliacoes`
 * (Tabela blindada por RLS LGPD Art. 11: RH não possui acesso às avaliações individuais)
 */
export async function saveBurnoutAssessmentToSupabase({
  usuarioId,
  empresaId = DEFAULT_EMPRESA_ID,
  instrumentoId = DEFAULT_INSTRUMENTO_ID,
  cicloId = DEFAULT_CICLO_ID,
  selectedQuestionIds = [],
  encaminhadoApoio = false
}) {
  if (!isSupabaseConfigured() || !isValidUuid(usuarioId)) {
    return { success: false, localOnly: true };
  }

  const count = selectedQuestionIds.length;
  // Escala 0 a 100 proporcional às 6 questões
  const pontuacaoTotal = Math.round((count / 6) * 100);
  let nivelRisco = 'baixo';
  if (count >= 5) nivelRisco = 'critico';
  else if (count >= 4) nivelRisco = 'alto';
  else if (count >= 2) nivelRisco = 'moderado';

  const payload = {
    usuario_id: usuarioId,
    empresa_id: empresaId,
    instrumento_id: instrumentoId,
    ciclo_id: cicloId,
    iniciado_em: new Date().toISOString(),
    concluido_em: new Date().toISOString(),
    pontuacao_total: pontuacaoTotal,
    nivel_risco: nivelRisco,
    pontuacao_dimensoes: {
      questoes_marcadas: selectedQuestionIds,
      total_marcadas: count
    },
    encaminhado_apoio: encaminhadoApoio
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/avaliacoes`, {
      method: 'POST',
      headers: getHeaders({ 'Prefer': 'return=representation' }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, ...parseSupabaseError(errText, 'avaliacoes') };
    }

    const data = await response.json();
    return { success: true, data: data?.[0] || payload };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// DOMÍNIO 4: APOIO CLÍNICO & AGENDAMENTOS (PSICÓLOGOS E SESSÕES)
// ============================================================================

/**
 * Busca psicólogos credenciados em `public.psicologos`
 */
export async function fetchPsychologistsFromSupabase() {
  if (!isSupabaseConfigured()) return { success: false, localOnly: true };

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/psicologos?ativo=eq.true&select=*&order=nome.asc`,
      { method: 'GET', headers: getHeaders() }
    );

    if (!response.ok) return { success: false };
    const rows = await response.json();
    if (!rows || rows.length === 0) return { success: false };

    const colors = ['#16a34a', '#d97706', '#2563eb', '#059669'];
    const mapped = rows.map((p, idx) => {
      const cleanName = p.nome.replace(/^Dra?\.\s*/i, '');
      const parts = cleanName.split(' ');
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : cleanName.slice(0, 2).toUpperCase();

      return {
        id: p.id,
        name: p.nome,
        title: p.especialidades?.[0] || 'Psicólogo(a) Clínico(a)',
        crp: p.crp,
        rating: 5.0,
        reviewsCount: 40 + idx * 6,
        specialty: p.bio || (p.especialidades || []).join(' • '),
        initials,
        color: colors[idx % colors.length],
        valorMoedas: p.valor_moedas || 0,
        duracaoMin: p.duracao_min || 50,
        modalidade: p.modalidade || 'online',
        availableTimes: ['09:00', '10:30', '14:00', '15:30', '17:00']
      };
    });

    return { success: true, data: mapped };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Cria agendamento psicológico em `public.agendamentos`
 * (Sem observações clínicas na tabela operacional, respeitando a segregação de `prontuarios_agendamentos`)
 */
export async function createAppointmentInSupabase({
  usuarioId,
  psicologoId,
  empresaId = DEFAULT_EMPRESA_ID,
  dateStr,
  timeStr,
  duracaoMin = 50,
  modalidade = 'online',
  valorMoedas = 0
}) {
  if (!isSupabaseConfigured() || !isValidUuid(usuarioId) || !isValidUuid(psicologoId)) {
    return { success: false, localOnly: true };
  }

  // Converte DD/MM/AAAA + HH:mm para ISO timestamptz
  let agendadoParaIso = new Date().toISOString();
  try {
    if (dateStr && dateStr.includes('/')) {
      const [dd, mm, yyyy] = dateStr.split('/');
      agendadoParaIso = new Date(`${yyyy}-${mm}-${dd}T${timeStr || '14:00'}:00-03:00`).toISOString();
    }
  } catch {}

  const payload = {
    usuario_id: usuarioId,
    psicologo_id: psicologoId,
    empresa_id: empresaId,
    agendado_para: agendadoParaIso,
    duracao_min: duracaoMin,
    modalidade,
    status: 'confirmado',
    valor_moedas: valorMoedas
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/agendamentos`, {
      method: 'POST',
      headers: getHeaders({ 'Prefer': 'return=representation' }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, ...parseSupabaseError(errText, 'agendamentos') };
    }

    const data = await response.json();
    return { success: true, data: data?.[0] || payload };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// DOMÍNIO 5: BENEFÍCIOS & RESGATES (CATÁLOGO E RPC ATÔMICA)
// ============================================================================

/**
 * Busca catálogo de benefícios ativos em `public.beneficios`
 */
export async function fetchBenefitsCatalogFromSupabase(empresaId = DEFAULT_EMPRESA_ID) {
  if (!isSupabaseConfigured()) return { success: false, localOnly: true };

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/beneficios?ativo=eq.true&or=(empresa_id.is.null,empresa_id.eq.${empresaId})&select=*&order=custo_moedas.asc`,
      { method: 'GET', headers: getHeaders() }
    );

    if (!response.ok) return { success: false };
    const rows = await response.json();
    if (!rows || rows.length === 0) return { success: false };

    const getIconByCategory = (cat = '', nome = '') => {
      const lower = (cat + ' ' + nome).toLowerCase();
      if (lower.includes('café') || lower.includes('cafe')) return 'coffee';
      if (lower.includes('camiseta') || lower.includes('dry-fit')) return 'shirt';
      if (lower.includes('meia folga')) return 'calendar';
      if (lower.includes('folga') || lower.includes('day off')) return 'sun';
      if (lower.includes('farmácia') || lower.includes('farmacia')) return 'pill';
      if (lower.includes('academia') || lower.includes('gympass')) return 'activity';
      if (lower.includes('ergonômico') || lower.includes('ergonomico')) return 'shield';
      return 'bottle';
    };

    const mapped = rows.map((b) => ({
      id: b.id,
      name: b.nome,
      category: b.categoria || 'brindes',
      price: Number(b.custo_moedas) || 200,
      tag: b.categoria === 'folgas' ? 'Bem-estar' : b.estoque ? `${b.estoque} disp.` : 'Disponível',
      description: b.descricao || '',
      icon: getIconByCategory(b.categoria, b.nome),
      requiresApproval: b.categoria === 'folgas',
      estoque: b.estoque
    }));

    return { success: true, data: mapped };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Executa o resgate de benefício via Stored Procedure `fn_resgatar_beneficio`
 * (Debita da carteira via `transacoes_moedas`, valida estoque e gera registro em `resgates`)
 */
export async function redeemBenefitInSupabase({ beneficioId, endereco = null }) {
  if (!isSupabaseConfigured() || !isValidUuid(beneficioId)) {
    return { success: false, localOnly: true };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_resgatar_beneficio`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        p_beneficio_id: beneficioId,
        p_endereco: endereco
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, ...parseSupabaseError(errText, 'fn_resgatar_beneficio') };
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// DOMÍNIO 6: RELATÓRIOS NR-1 AGREGADOS (K-ANONIMATO) & AUDITORIA
// ============================================================================

/**
 * Busca os relatórios agregados de conformidade NR-1 em `public.relatorios_nr1`,
 * dados da empresa em `public.empresas`, desafios em `public.desafios` e ranking em `public.vw_ranking_passos`
 */
export async function fetchNr1ComplianceDataFromSupabase(empresaId = DEFAULT_EMPRESA_ID) {
  if (!isSupabaseConfigured()) return { success: false, localOnly: true };

  try {
    const [empresaRes, relatoriosRes, desafiosRes, rankingRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/empresas?id=eq.${empresaId}&select=*&limit=1`, {
        method: 'GET',
        headers: getHeaders()
      }),
      fetch(`${SUPABASE_URL}/rest/v1/relatorios_nr1?empresa_id=eq.${empresaId}&select=*,setores(id,nome,ghe)&order=gerado_em.desc`, {
        method: 'GET',
        headers: getHeaders()
      }),
      fetch(`${SUPABASE_URL}/rest/v1/desafios?empresa_id=eq.${empresaId}&ativo=eq.true&select=*`, {
        method: 'GET',
        headers: getHeaders()
      }),
      fetch(`${SUPABASE_URL}/rest/v1/vw_ranking_passos?empresa_id=eq.${empresaId}&select=*`, {
        method: 'GET',
        headers: getHeaders()
      })
    ]);

    const empresaRows = empresaRes.ok ? await empresaRes.json() : [];
    const relatoriosRows = relatoriosRes.ok ? await relatoriosRes.json() : [];
    const desafiosRows = desafiosRes.ok ? await desafiosRes.json() : [];
    const rankingRows = rankingRes.ok ? await rankingRes.json() : [];

    if (!empresaRows?.length && !relatoriosRows?.length) {
      return { success: false };
    }

    const empresa = empresaRows?.[0] || {};
    const geralReport = (relatoriosRows || []).find((r) => r.setor_id === null) || {};
    const sectorReports = (relatoriosRows || []).filter((r) => r.setor_id !== null);

    const ind = geralReport.indicadores || {};

    // Monta ranking de setores a partir de relatorios_nr1 (ou vw_ranking_passos)
    const departmentRankings = sectorReports.map((sr) => ({
      dept: sr.setores?.nome || 'Setor',
      ghe: sr.setores?.ghe || '',
      nRespondentes: sr.n_respondentes,
      nivelRisco: sr.nivel_risco,
      indiceRisco: Number(sr.indice_risco || 0),
      avgSteps: Number(sr.indicadores?.avgSteps || 8500),
      participation: sr.indicadores?.participation || '88%',
      healthIndex: sr.indicadores?.healthIndex || (sr.nivel_risco === 'baixo' ? 'Muito Bom' : 'Atenção')
    })).sort((a, b) => b.avgSteps - a.avgSteps);

    return {
      success: true,
      data: {
        empresaId: empresa.id || empresaId,
        company: empresa.razao_social || 'TechCorp Brasil Ltda',
        cnpj: empresa.cnpj || '12.345.678/0001-90',
        totalEmployees: empresa.total_colaboradores || 342,
        activeParticipationRate: Number(ind.activeParticipationRate || 87.4),
        nr1NormReference: 'Norma Regulamentadora NR-1 (Portaria MTP nº 4.219 / Diretrizes GRO & PGR — K-Anonimato N ≥ 5)',
        riskSummary: {
          lowRiskPct: Number(ind.lowRiskPct ?? 82),
          moderateRiskPct: Number(ind.moderateRiskPct ?? 15),
          highRiskPct: Number(ind.highRiskPct ?? 3)
        },
        totalPhysicalActivityMinutes: Number(ind.totalPhysicalActivityMinutes || 38450),
        averageStepsPerDay: Number(ind.averageStepsPerDay || 8640),
        scheduledPsychologicalSupports: Number(ind.scheduledPsychologicalSupports || 47),
        activeCampaigns: desafiosRows?.length
          ? desafiosRows.map((d) => ({
              id: d.id,
              title: d.titulo,
              progress: 88,
              status: d.ativo ? 'Em andamento' : 'Concluído'
            }))
          : undefined,
        departmentRankings: departmentRankings.length > 0 ? departmentRankings : undefined,
        rankingRows
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Aciona a Stored Procedure `fn_consolidar_ciclo_nr1` no banco para recalcular
 * os relatórios psicossociais aplicando a trava de k-anonimato (N >= 5)
 */
export async function consolidateNr1CycleInSupabase(cicloId = DEFAULT_CICLO_ID) {
  if (!isSupabaseConfigured()) return { success: false, localOnly: true };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_consolidar_ciclo_nr1`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ p_ciclo_id: cicloId })
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, ...parseSupabaseError(errText, 'fn_consolidar_ciclo_nr1') };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Registra evento na trilha de auditoria imutável (`public.logs_auditoria`)
 */
export async function saveAuditLogToSupabase({
  empresaId = DEFAULT_EMPRESA_ID,
  usuarioId = null,
  acao,
  entidade,
  entidadeId = null,
  dados = {}
}) {
  if (!isSupabaseConfigured()) return { success: false, localOnly: true };

  try {
    const payload = {
      empresa_id: empresaId,
      usuario_id: isValidUuid(usuarioId) ? usuarioId : null,
      acao,
      entidade,
      entidade_id: isValidUuid(entidadeId) ? entidadeId : null,
      dados
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/logs_auditoria`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    return { success: response.ok };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
