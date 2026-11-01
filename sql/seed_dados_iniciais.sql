-- ==============================================================================
-- PROJETO PASSO É SAÚDE — SCRIPT DE SEED (DADOS INICIAIS PARA OS 6 DOMÍNIOS)
-- Execute este script no SQL Editor do Supabase APÓS executar o
-- arquivo sql/schema_completo_passo_e_saude.sql
-- ==============================================================================

begin;

-- ------------------------------------------------------------------------------
-- 1. EMPRESA PADRÃO (TENANT RAIZ)
-- ------------------------------------------------------------------------------
insert into public.empresas (
  id, razao_social, nome_fantasia, cnpj, email_contato, telefone,
  responsavel_nome, segmento, total_colaboradores, moedas_apoio_mensais, ativo
) values (
  '11111111-1111-1111-1111-111111111111',
  'TechCorp Brasil Ltda',
  'TechCorp Brasil',
  '12.345.678/0001-90',
  'techcorpbr@gmail.com',
  '(11) 3000-4000',
  'Gestão de Pessoas & SST',
  'Tecnologia e Inovação',
  342,
  200,
  true
)
on conflict (cnpj) do update set
  razao_social         = excluded.razao_social,
  nome_fantasia        = excluded.nome_fantasia,
  email_contato        = excluded.email_contato,
  total_colaboradores  = excluded.total_colaboradores,
  moedas_apoio_mensais = excluded.moedas_apoio_mensais,
  atualizado_em        = now();

-- ------------------------------------------------------------------------------
-- 2. SETORES / GHE (BASE DO RECORTE NR-1)
-- ------------------------------------------------------------------------------
insert into public.setores (id, empresa_id, nome, centro_custo, ghe, ativo) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'Tecnologia',             'CC-101', 'GHE-01-TEC', true),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'Operações & Logística',  'CC-102', 'GHE-02-OPE', true),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', 'Comercial & Vendas',     'CC-103', 'GHE-03-COM', true),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111', 'Recursos Humanos',       'CC-104', 'GHE-04-RH',  true),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111111', 'Financeiro & Jurídico',  'CC-105', 'GHE-05-FIN', true),
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111111', 'Marketing & Produto',    'CC-106', 'GHE-06-MKT', true),
  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111111', 'Administrativo / Geral', 'CC-107', 'GHE-07-ADM', true)
on conflict (empresa_id, nome) do update set
  centro_custo = excluded.centro_custo,
  ghe          = excluded.ghe,
  ativo        = true;

-- ------------------------------------------------------------------------------
-- 3. REGRAS DE PONTUAÇÃO DA EMPRESA
-- ------------------------------------------------------------------------------
insert into public.regras_pontuacao (
  empresa_id, passos_por_moeda, bonus_meta_diaria, limite_moedas_dia, dias_validos, vigencia_inicio
) values (
  '11111111-1111-1111-1111-111111111111', 100, 20, 150, '{1,2,3,4,5,6,7}', '2026-01-01'
)
on conflict (empresa_id, vigencia_inicio) do update set
  passos_por_moeda  = excluded.passos_por_moeda,
  bonus_meta_diaria = excluded.bonus_meta_diaria,
  limite_moedas_dia = excluded.limite_moedas_dia;

-- ------------------------------------------------------------------------------
-- 4. TERMOS DE USO E POLÍTICA DE PRIVACIDADE (LGPD ART. 11 & NR-1)
-- ------------------------------------------------------------------------------
insert into public.termos (id, versao, titulo, conteudo, publicado_em, ativo) values (
  '33333333-3333-3333-3333-333333333301',
  '2026.1',
  'Termos de Uso e Política de Privacidade — Passo é Saúde (LGPD & NR-1)',
  'O aplicativo Passo é Saúde protege integralmente seus dados clínicos e psicossociais (LGPD Art. 11). O empregador e o RH recebem exclusivamente relatórios estatísticos anonimizados com trava de k-anonimato (mínimo de 5 respondentes por setor).',
  now(),
  true
)
on conflict (versao) do nothing;

-- ------------------------------------------------------------------------------
-- 5. BIBLIOTECA DE MEDITAÇÕES GUIADAS (BLOCO A — RESPIRAÇÃO CONSCIENTE & FOCO)
-- ------------------------------------------------------------------------------
insert into public.meditacoes (id, titulo, descricao, categoria, url_audio, duracao_seg, publicado) values
  (
    '44444444-4444-4444-4444-444444444401',
    'A1 — Respiração 4-4-6 — Ancoragem Rápida',
    'Reduz a dispersão mental e cria um ponto de ancoragem antes de reuniões, apresentações ou tarefas complexas (inspira 4, segura 4, expira 6).',
    'Bloco A • Foco & Atenção',
    'A1_Respiracao_4-4-6_Ancoragem_Rapida.mp3',
    385,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444402',
    'A2 — Respiração Quadrada 4-4-4-4 — Equilíbrio',
    'Estabiliza a atenção e restaura a cadência mental quando há excesso de estímulos e muitas abas abertas (inspira 4, sustenta 4, expira 4, pausa vazio 4).',
    'Bloco A • Foco & Atenção',
    'A2_Respiracao_Quadrada_4-4-4-4_Equilibrio.mp3',
    372,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444403',
    'A3 — Respiração 4-7-8 — Desaceleração Mental',
    'Desativa rapidamente o estado de alerta fisiológico após situações de pressão, prazos curtos ou conversas difíceis (inspira 4, segura 7, expira 8).',
    'Bloco A • Foco & Atenção',
    'A3_Respiracao_4-7-8_Desaceleracao_Mental.mp3',
    358,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444404',
    'A4 — Respiração Alternada 4-6 — Clareza e Presença',
    'Limpa a fadiga cognitiva de meio de expediente combinando atenção alternada entre as narinas e ritmo de coerência 4-6.',
    'Bloco A • Foco & Atenção',
    'A4_Respiracao_Alternada_Clareza_e_Presenca.mp3',
    339,
    true
  )
on conflict (id) do update set
  titulo      = excluded.titulo,
  descricao   = excluded.descricao,
  categoria   = excluded.categoria,
  url_audio   = excluded.url_audio,
  duracao_seg = excluded.duracao_seg,
  publicado   = true;

-- ------------------------------------------------------------------------------
-- 6. INSTRUMENTO PSICOMÉTRICO DE BURNOUT & CICLO NR-1 ATIVO
-- ------------------------------------------------------------------------------
insert into public.instrumentos (id, codigo, nome, descricao, versao, escala_min, escala_max, pontos_corte, ativo) values (
  '55555555-5555-5555-5555-555555555501',
  'BURNOUT-NR1',
  'Inventário Rápido de Fadiga e Riscos Psicossociais (NR-1)',
  'Autoavaliação preventiva de sinais de esgotamento físico, mental e sobrecarga ocupacional.',
  '1.0',
  0,
  1,
  '{"baixo": 1, "moderado": 3, "alto": 5, "critico": 6}'::jsonb,
  true
)
on conflict (codigo) do update set
  nome         = excluded.nome,
  pontos_corte = excluded.pontos_corte,
  ativo        = true;

insert into public.instrumento_dimensoes (id, instrumento_id, nome, ordem) values
  ('55555555-5555-5555-5555-555555555511', '55555555-5555-5555-5555-555555555501', 'Exaustão Emocional e Física', 1),
  ('55555555-5555-5555-5555-555555555512', '55555555-5555-5555-5555-555555555501', 'Foco, Sono e Reconhecimento', 2)
on conflict (id) do nothing;

insert into public.instrumento_questoes (id, instrumento_id, dimensao_id, ordem, enunciado, invertida) values
  ('55555555-5555-5555-5555-555555555521', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555511', 1, 'Sinto-me exausto(a) ao acordar para trabalhar', false),
  ('55555555-5555-5555-5555-555555555522', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555512', 2, 'Tenho dificuldade de concentração no trabalho', false),
  ('55555555-5555-5555-5555-555555555523', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555511', 3, 'Perdi o interesse por atividades que antes me motivavam', false),
  ('55555555-5555-5555-5555-555555555524', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555511', 4, 'Sinto-me irritado(a) ou impaciente com frequência', false),
  ('55555555-5555-5555-5555-555555555525', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555512', 5, 'Tenho dificuldade para dormir ou sono não reparador', false),
  ('55555555-5555-5555-5555-555555555526', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555512', 6, 'Sinto que minhas conquistas no trabalho não são reconhecidas', false)
on conflict (instrumento_id, ordem) do update set
  enunciado = excluded.enunciado;

insert into public.ciclos_psicossociais (
  id, empresa_id, nome, instrumento_id, inicio, fim, status, minimo_agregacao
) values (
  '55555555-5555-5555-5555-555555555599',
  '11111111-1111-1111-1111-111111111111',
  'Ciclo de Avaliação Psicossocial NR-1 — Outubro/Novembro 2026',
  '55555555-5555-5555-5555-555555555501',
  '2026-10-01',
  '2026-12-31',
  'coletando',
  5
)
on conflict (id) do nothing;

-- ------------------------------------------------------------------------------
-- 7. PSICÓLOGOS E PROFISSIONAIS CREDENCIADOS
-- ------------------------------------------------------------------------------
insert into public.psicologos (
  id, nome, crp, email, telefone, bio, especialidades, modalidade, valor_moedas, duracao_min, aceita_novos, ativo
) values
  (
    '66666666-6666-6666-6666-666666666601',
    'Dra. Ana Ribeiro',
    'CRP 06/142981',
    'ana.ribeiro@passosaude.com.br',
    '(11) 99111-2201',
    'Especialista em Gestão de Ansiedade e Prevenção de Burnout',
    ARRAY['Psicóloga Clínica', 'Ansiedade', 'Prevenção de Burnout'],
    'online',
    0,
    50,
    true,
    true
  ),
  (
    '66666666-6666-6666-6666-666666666602',
    'Dr. Rafael Mendes',
    'CRP 06/158220',
    'rafael.mendes@passosaude.com.br',
    '(11) 99111-2202',
    'Terapia breve focada em estresse ocupacional e foco executivo',
    ARRAY['Terapeuta Cognitivo-Comportamental', 'Estresse Ocupacional', 'Foco Executivo'],
    'online',
    0,
    50,
    true,
    true
  ),
  (
    '66666666-6666-6666-6666-666666666603',
    'Dra. Beatriz Souza',
    'CRP 06/139401',
    'beatriz.souza@passosaude.com.br',
    '(11) 99111-2203',
    'Relacionamentos no trabalho, segurança psicológica e resiliência',
    ARRAY['Psicóloga Organizacional', 'Segurança Psicológica', 'Clima'],
    'online',
    0,
    50,
    true,
    true
  ),
  (
    '66666666-6666-6666-6666-666666666604',
    'Dr. Lucas Carvalho',
    'CREF 042190-G/SP',
    'lucas.carvalho@passosaude.com.br',
    '(11) 99111-2204',
    'Ginástica laboral, mobilidade articular e alívio de DORT/LER',
    ARRAY['Educador Físico & Ergonomista', 'Ergonomia NR-17', 'Mobilidade'],
    'online',
    0,
    50,
    true,
    true
  )
on conflict (crp) do update set
  nome           = excluded.nome,
  bio            = excluded.bio,
  especialidades = excluded.especialidades,
  ativo          = true;

-- ------------------------------------------------------------------------------
-- 8. CATÁLOGO DE BENEFÍCIOS & RECOMPENSAS
-- ------------------------------------------------------------------------------
insert into public.beneficios (
  id, empresa_id, nome, descricao, categoria, custo_moedas, estoque, limite_colaborador_mes, ativo
) values
  (
    '77777777-7777-7777-7777-777777777701',
    '11111111-1111-1111-1111-111111111111',
    'Squeeze Personalizada Passos Saúde',
    'Garrafa térmica de inox 650ml com indicador de hidratação diária.',
    'brindes',
    200,
    50,
    2,
    true
  ),
  (
    '77777777-7777-7777-7777-777777777702',
    '11111111-1111-1111-1111-111111111111',
    'Voucher Café Especial (R$ 25)',
    'Crédito digital para Starbucks, The Coffee ou cafeterias parceiras.',
    'pontos',
    200,
    100,
    4,
    true
  ),
  (
    '77777777-7777-7777-7777-777777777703',
    '11111111-1111-1111-1111-111111111111',
    'Camiseta Dry-Fit Passos Saúde',
    'Tecido respirável antibacteriano premium, ideal para caminhadas corporativas.',
    'brindes',
    500,
    40,
    1,
    true
  ),
  (
    '77777777-7777-7777-7777-777777777704',
    '11111111-1111-1111-1111-111111111111',
    'Voucher Farmácia & Cuidados (R$ 50)',
    'Válido para suplementos, protetor solar e itens de farmácia credenciada.',
    'pontos',
    500,
    80,
    2,
    true
  ),
  (
    '77777777-7777-7777-7777-777777777705',
    '11111111-1111-1111-1111-111111111111',
    'Meia Folga Remunerada',
    'Dispensa de 4 horas da jornada de trabalho alinhada previamente com o gestor.',
    'folgas',
    1000,
    null,
    1,
    true
  ),
  (
    '77777777-7777-7777-7777-777777777706',
    '11111111-1111-1111-1111-111111111111',
    'Folga Integral (Day Off)',
    '1 dia inteiro de descanso remunerado para recarregar as energias.',
    'folgas',
    2000,
    null,
    1,
    true
  ),
  (
    '77777777-7777-7777-7777-777777777707',
    '11111111-1111-1111-1111-111111111111',
    'Passe Academia / Gympass 1 Mês',
    'Acesso a mais de 3.000 academias e estúdios de pilates e yoga.',
    'parceiros',
    850,
    30,
    1,
    true
  ),
  (
    '77777777-7777-7777-7777-777777777708',
    '11111111-1111-1111-1111-111111111111',
    'Kit Ergonômico de Mesa',
    'Suporte articulado para notebook + almofada lombar ergonômica.',
    'brindes',
    600,
    25,
    1,
    true
  )
on conflict (id) do update set
  nome         = excluded.nome,
  descricao    = excluded.descricao,
  categoria    = excluded.categoria,
  custo_moedas = excluded.custo_moedas,
  ativo        = true;

-- ------------------------------------------------------------------------------
-- 9. DESAFIOS CORPORATIVOS & CONQUISTAS
-- ------------------------------------------------------------------------------
insert into public.desafios (
  id, empresa_id, titulo, descricao, tipo, meta_valor, recompensa_moedas, inicio, fim, ativo
) values
  (
    '88888888-8888-8888-8888-888888888801',
    '11111111-1111-1111-1111-111111111111',
    'Campanha Movimento Saudável 2026',
    'Caminhe 200.000 passos no mês para reduzir o sedentarismo ocupacional.',
    'passos',
    200000,
    300,
    '2026-10-01',
    '2026-12-31',
    true
  ),
  (
    '88888888-8888-8888-8888-888888888802',
    '11111111-1111-1111-1111-111111111111',
    'Semana da Mente Sã (Pausas Ativas)',
    'Realize 5 sessões de meditação guiada durante o expediente.',
    'meditacao',
    5,
    150,
    '2026-10-01',
    '2026-12-31',
    true
  )
on conflict (id) do nothing;

insert into public.conquistas (codigo, titulo, descricao, criterio, ativo) values
  ('PRIMEIRO_PASSO', 'Primeira Meta Batida', 'Atingiu 10.000 passos em um único dia.', '{"passos_dia": 10000}'::jsonb, true),
  ('STREAK_5_DIAS',  'Ritmo Constante (5 Dias)', 'Cumpriu a meta diária por 5 dias consecutivos.', '{"streak_dias": 5}'::jsonb, true),
  ('MENTE_ZEN',      'Guardião da Calma', 'Completou 10 sessões de meditação guiada.', '{"sessoes_meditacao": 10}'::jsonb, true)
on conflict (codigo) do nothing;

-- ------------------------------------------------------------------------------
-- 10. RELATÓRIOS NR-1 AGREGADOS (COM K-ANONIMATO N >= 5)
-- ------------------------------------------------------------------------------
insert into public.relatorios_nr1 (
  id, empresa_id, ciclo_id, setor_id, periodo_inicio, periodo_fim,
  n_respondentes, indice_risco, nivel_risco, indicadores, medidas_acao
) values
  (
    '99999999-9999-9999-9999-999999999900',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555599',
    null,
    '2026-10-01',
    '2026-10-31',
    299,
    18.50,
    'baixo',
    '{"lowRiskPct": 82, "moderateRiskPct": 15, "highRiskPct": 3, "activeParticipationRate": 87.4, "averageStepsPerDay": 8640, "totalPhysicalActivityMinutes": 38450, "scheduledPsychologicalSupports": 47}'::jsonb,
    'Manter campanhas de caminhada orientada e pausas de descompressão mental entre reuniões.'
  ),
  (
    '99999999-9999-9999-9999-999999999901',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555599',
    '22222222-2222-2222-2222-222222222202', -- Operações & Logística
    '2026-10-01',
    '2026-10-31',
    84,
    12.40,
    'baixo',
    '{"avgSteps": 9420, "participation": "94%", "healthIndex": "Excelente"}'::jsonb,
    'Setor referência em atividade física diária.'
  ),
  (
    '99999999-9999-9999-9999-999999999902',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555599',
    '22222222-2222-2222-2222-222222222201', -- Tecnologia
    '2026-10-01',
    '2026-10-31',
    92,
    21.00,
    'baixo',
    '{"avgSteps": 8850, "participation": "89%", "healthIndex": "Muito Bom"}'::jsonb,
    'Incentivar pausas visuais e alongamento a cada 90 minutos.'
  ),
  (
    '99999999-9999-9999-9999-999999999903',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555599',
    '22222222-2222-2222-2222-222222222203', -- Comercial & Vendas
    '2026-10-01',
    '2026-10-31',
    58,
    26.80,
    'baixo',
    '{"avgSteps": 8410, "participation": "86%", "healthIndex": "Bom"}'::jsonb,
    'Monitorar metas comerciais de fim de trimestre.'
  ),
  (
    '99999999-9999-9999-9999-999999999904',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555599',
    '22222222-2222-2222-2222-222222222204', -- Recursos Humanos
    '2026-10-01',
    '2026-10-31',
    28,
    19.20,
    'baixo',
    '{"avgSteps": 7920, "participation": "91%", "healthIndex": "Bom"}'::jsonb,
    'Manter rodas de escuta ativa.'
  ),
  (
    '99999999-9999-9999-9999-999999999905',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555599',
    '22222222-2222-2222-2222-222222222205', -- Financeiro & Jurídico
    '2026-10-01',
    '2026-10-31',
    37,
    34.50,
    'moderado',
    '{"avgSteps": 7340, "participation": "78%", "healthIndex": "Atenção (Sedentarismo)"}'::jsonb,
    'Promover desafio de caminhada guiada e ginástica laboral no setor.'
  )
on conflict (id) do update set
  n_respondentes = excluded.n_respondentes,
  indice_risco   = excluded.indice_risco,
  nivel_risco    = excluded.nivel_risco,
  indicadores    = excluded.indicadores,
  medidas_acao   = excluded.medidas_acao,
  gerado_em      = now();

-- ------------------------------------------------------------------------------
-- 11. CONVITES INICIAIS DE COLABORADORES (DOMÍNIO 1 - ONBOARDING)
-- Quando qualquer um destes e-mails se cadastrar no Supabase Auth, a trigger
-- tg_novo_usuario vincula automaticamente à empresa, setor e carteira!
-- ------------------------------------------------------------------------------
insert into public.convites (
  id, empresa_id, setor_id, nome, email, cpf, matricula, cargo, papel, situacao, enviado_em, expira_em
) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa00',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222204',
    'Gestor SST TechCorp',
    'techcorpbr@gmail.com',
    '100.200.300-00',
    'RH-0001',
    'Gerente de Saúde Ocupacional & SST',
    'rh_admin',
    'enviado',
    now(),
    now() + interval '90 days'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222201',
    'Ana Colaboradora',
    'ana.colaboradora@empresa.com.br',
    '111.222.333-01',
    'MAT-1001',
    'Engenheira de Software Pleno',
    'colaborador',
    'enviado',
    now(),
    now() + interval '90 days'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222202',
    'Carlos Eduardo Silva',
    'carlos.silva@empresa.com.br',
    '111.222.333-02',
    'MAT-1002',
    'Analista de Logística Sênior',
    'colaborador',
    'enviado',
    now(),
    now() + interval '90 days'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222203',
    'Mariana Costa Rios',
    'mariana.costa@empresa.com.br',
    '111.222.333-03',
    'MAT-1003',
    'Executiva de Contas',
    'colaborador',
    'enviado',
    now(),
    now() + interval '90 days'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222204',
    'Roberto Almeida Jr.',
    'roberto.almeida@empresa.com.br',
    '111.222.333-04',
    'MAT-1004',
    'Especialista em DHO & Clima',
    'rh_operador',
    'enviado',
    now(),
    now() + interval '90 days'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222205',
    'Juliana Ferreira Prado',
    'juliana.prado@empresa.com.br',
    '111.222.333-05',
    'MAT-1005',
    'Controller Financeiro',
    'colaborador',
    'enviado',
    now(),
    now() + interval '90 days'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222201',
    'Fernando Henrique Dias',
    'fernando.dias@empresa.com.br',
    '111.222.333-06',
    'MAT-1006',
    'Arquiteto de Soluções',
    'colaborador',
    'enviado',
    now(),
    now() + interval '90 days'
  )
on conflict (id) do nothing;

-- ------------------------------------------------------------------------------
-- 12. POLÍTICAS COMPLEMENTARES PARA MODO HÍBRIDO (AUTH REAL + SIMULADOR DEMO)
-- Permite que o app leia os catálogos públicos e opere no modo simulador mesmo
-- antes do login no Supabase Auth, mantendo o sigilo absoluto das tabelas
-- clínicas (avaliacoes, respostas_avaliacao e prontuarios_agendamentos).
-- ------------------------------------------------------------------------------
create or replace function public.fn_empresa_atual()
returns uuid language sql stable security definer set search_path = public as $$
  select coalesce(
    (select empresa_id from public.usuarios where id = auth.uid()),
    '11111111-1111-1111-1111-111111111111'::uuid
  );
$$;

-- Permite leitura de catálogos e relatórios agregados também para o papel anon (simulador)
drop policy if exists empresas_select_demo on public.empresas;
create policy empresas_select_demo on public.empresas for select to anon, authenticated
  using (id = public.fn_empresa_atual() or public.fn_eh_admin_plataforma());

drop policy if exists setores_demo on public.setores;
create policy setores_demo on public.setores for all to anon, authenticated
  using (empresa_id = public.fn_empresa_atual())
  with check (empresa_id = public.fn_empresa_atual());

drop policy if exists convites_demo on public.convites;
create policy convites_demo on public.convites for all to anon, authenticated
  using (empresa_id = public.fn_empresa_atual())
  with check (empresa_id = public.fn_empresa_atual());

drop policy if exists usuarios_demo_select on public.usuarios;
create policy usuarios_demo_select on public.usuarios for select to anon, authenticated
  using (empresa_id = public.fn_empresa_atual());

drop policy if exists meditacoes_demo on public.meditacoes;
create policy meditacoes_demo on public.meditacoes for select to anon, authenticated
  using (publicado = true);

drop policy if exists psicologos_demo on public.psicologos;
create policy psicologos_demo on public.psicologos for select to anon, authenticated
  using (ativo = true);

drop policy if exists beneficios_demo on public.beneficios;
create policy beneficios_demo on public.beneficios for select to anon, authenticated
  using ((empresa_id is null or empresa_id = public.fn_empresa_atual()) and ativo = true);

drop policy if exists instrumentos_demo on public.instrumentos;
create policy instrumentos_demo on public.instrumentos for select to anon, authenticated
  using (ativo = true);

drop policy if exists questoes_demo on public.instrumento_questoes;
create policy questoes_demo on public.instrumento_questoes for select to anon, authenticated
  using (true);

drop policy if exists ciclos_demo on public.ciclos_psicossociais;
create policy ciclos_demo on public.ciclos_psicossociais for select to anon, authenticated
  using (empresa_id = public.fn_empresa_atual());

drop policy if exists nr1_demo_select on public.relatorios_nr1;
create policy nr1_demo_select on public.relatorios_nr1 for select to anon, authenticated
  using (empresa_id = public.fn_empresa_atual());

drop policy if exists desafios_demo_select on public.desafios;
create policy desafios_demo_select on public.desafios for select to anon, authenticated
  using (empresa_id = public.fn_empresa_atual());

drop policy if exists logs_auditoria_insert on public.logs_auditoria;
create policy logs_auditoria_insert on public.logs_auditoria for insert to anon, authenticated
  with check (empresa_id = public.fn_empresa_atual());

commit;

