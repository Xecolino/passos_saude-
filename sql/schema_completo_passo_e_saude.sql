-- ==============================================================================
-- PROJETO PASSO É SAÚDE — ARQUITETURA DE BANCO DE DADOS DEFINITIVA
-- CONFORMIDADE NR-1 (GERENCIAMENTO DE RISCOS PSICOSSOCIAIS) & LGPD (ART. 11)
-- MULTI-TENANT ISOLADO POR EMPRESA (empresa_id + RLS)
-- ==============================================================================

-- 0. EXTENSÕES NECESSÁRIAS
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ==============================================================================
-- 1. TIPOS ENUMERADOS (IDEMPOTENTES)
-- ==============================================================================
do $$ begin
  if not exists (select 1 from pg_type where typname = 'papel_usuario') then
    create type papel_usuario as enum (
      'colaborador',
      'gestor',
      'rh_operador',
      'rh_admin',
      'psicologo',
      'admin_plataforma'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'situacao_usuario') then
    create type situacao_usuario as enum (
      'convidado',
      'ativo',
      'inativo',
      'afastado',
      'desligado'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'situacao_convite') then
    create type situacao_convite as enum (
      'pendente',
      'enviado',
      'aceito',
      'expirado',
      'cancelado'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'origem_passos') then
    create type origem_passos as enum (
      'manual',
      'google_fit',
      'health_connect',
      'apple_health',
      'outro'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'tipo_moeda') then
    create type tipo_moeda as enum (
      'credito_passos',
      'credito_desafio',
      'credito_conquista',
      'doacao_empresa',
      'debito_consulta',
      'debito_beneficio',
      'estorno',
      'expiracao'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'status_agendamento') then
    create type status_agendamento as enum (
      'solicitado',
      'confirmado',
      'realizado',
      'cancelado',
      'remarcado',
      'nao_compareceu'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'status_resgate') then
    create type status_resgate as enum (
      'solicitado',
      'aprovado',
      'em_transito',
      'entregue',
      'cancelado'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'status_ciclo') then
    create type status_ciclo as enum (
      'rascunho',
      'coletando',
      'encerrado',
      'publicado'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'nivel_risco') then
    create type nivel_risco as enum (
      'baixo',
      'moderado',
      'alto',
      'critico'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'modalidade') then
    create type modalidade as enum (
      'online',
      'presencial'
    );
  end if;
end $$;

-- ==============================================================================
-- DOMÍNIO 1: TENANT E IDENTIDADE
-- ==============================================================================

-- 1.1 Empresas (Tenant Raiz)
create table if not exists public.empresas (
  id                    uuid primary key default gen_random_uuid(),
  razao_social          text not null,
  nome_fantasia         text,
  cnpj                  text not null unique,
  email_contato         text not null,
  telefone              text,
  responsavel_nome      text,
  segmento              text,
  logo_url              text,
  total_colaboradores   int,
  moedas_apoio_mensais  int not null default 0,
  ativo                 boolean not null default true,
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now()
);

-- 1.2 Setores / GHE (Base do recorte de risco psicossocial da NR-1)
create table if not exists public.setores (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas(id) on delete cascade,
  nome         text not null,
  centro_custo text,
  ghe          text,
  ativo        boolean not null default true,
  criado_em    timestamptz not null default now(),
  unique (empresa_id, nome)
);

create index if not exists ix_setores_empresa on public.setores (empresa_id);

-- 1.3 Usuários (1:1 com auth.users)
create table if not exists public.usuarios (
  id                 uuid primary key references auth.users(id) on delete cascade,
  empresa_id         uuid references public.empresas(id) on delete restrict,
  setor_id           uuid references public.setores(id) on delete set null,
  papel              papel_usuario   not null default 'colaborador',
  situacao           situacao_usuario not null default 'convidado',
  nome               text not null,
  email              text not null,
  cpf                text,
  matricula          text,
  cargo              text,
  telefone           text,
  data_nascimento    date,
  data_admissao      date,
  avatar_url         text,
  meta_diaria_passos int not null default 8000,
  aceitou_termo_em   timestamptz,
  ultimo_acesso_em   timestamptz,
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);

create unique index if not exists ux_usuarios_email      on public.usuarios (lower(email));
create unique index if not exists ux_usuarios_cpf        on public.usuarios (empresa_id, cpf) where cpf is not null;
create unique index if not exists ux_usuarios_matricula  on public.usuarios (empresa_id, matricula) where matricula is not null;
create index if not exists ix_usuarios_empresa          on public.usuarios (empresa_id, situacao);
create index if not exists ix_usuarios_setor            on public.usuarios (setor_id);

-- 1.4 Convites para Onboarding
create table if not exists public.convites (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  setor_id      uuid references public.setores(id) on delete set null,
  nome          text not null,
  email         text not null,
  cpf           text,
  matricula     text,
  cargo         text,
  papel         papel_usuario not null default 'colaborador',
  token         uuid not null default gen_random_uuid(),
  situacao      situacao_convite not null default 'pendente',
  convidado_por uuid references public.usuarios(id),
  enviado_em    timestamptz,
  expira_em     timestamptz not null default (now() + interval '7 days'),
  aceito_em     timestamptz,
  usuario_id    uuid references public.usuarios(id),
  criado_em     timestamptz not null default now()
);

create unique index if not exists ux_convites_token on public.convites (token);
create unique index if not exists ux_convites_aberto on public.convites (empresa_id, lower(email))
  where situacao in ('pendente','enviado');

-- 1.5 Termos de Uso e Política de Privacidade (Versionados)
create table if not exists public.termos (
  id           uuid primary key default gen_random_uuid(),
  versao       text not null unique,
  titulo       text not null,
  conteudo     text not null,
  publicado_em timestamptz,
  ativo        boolean not null default true,
  criado_em    timestamptz not null default now()
);

-- 1.6 Aceites de Termo (Prova Jurídica de Consentimento LGPD)
create table if not exists public.aceites_termo (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  termo_id   uuid not null references public.termos(id) on delete restrict,
  aceito_em  timestamptz not null default now(),
  ip         inet,
  user_agent text,
  unique (usuario_id, termo_id)
);

create index if not exists ix_aceites_termo_usuario on public.aceites_termo (usuario_id);

-- ==============================================================================
-- DOMÍNIO 2: GAMIFICAÇÃO & FATOS DIÁRIOS
-- ==============================================================================

-- 2.1 Fato Diário de Passos (Com empresa_id para performance e RLS instantâneo)
create table if not exists public.registros_passos (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references public.usuarios(id) on delete cascade,
  empresa_id     uuid not null references public.empresas(id) on delete cascade,
  data           date not null,
  passos         int not null check (passos between 0 and 200000),
  distancia_km   numeric(6,2),
  minutos_ativos int,
  calorias       int,
  origem         origem_passos not null default 'manual',
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  unique (usuario_id, data)
);

create index if not exists ix_passos_empresa_data on public.registros_passos (empresa_id, data desc);
create index if not exists ix_passos_usuario_data on public.registros_passos (usuario_id, data desc);

-- 2.2 Regras de Pontuação por Empresa
create table if not exists public.regras_pontuacao (
  id                 uuid primary key default gen_random_uuid(),
  empresa_id         uuid not null references public.empresas(id) on delete cascade,
  passos_por_moeda   int not null default 1000,
  bonus_meta_diaria  int not null default 2,
  limite_moedas_dia  int not null default 10,
  dias_validos       smallint[] not null default '{1,2,3,4,5,6,7}',
  vigencia_inicio    date not null default current_date,
  vigencia_fim       date,
  criado_em          timestamptz not null default now(),
  unique (empresa_id, vigencia_inicio)
);

-- 2.3 Carteiras (Saldo Consolidado — Check impede saldo negativo)
create table if not exists public.carteiras (
  usuario_id      uuid primary key references public.usuarios(id) on delete cascade,
  saldo           bigint not null default 0 check (saldo >= 0),
  total_creditado bigint not null default 0,
  total_debitado  bigint not null default 0,
  atualizado_em   timestamptz not null default now()
);

-- 2.4 Transações de Moedas (Extrato Imutável — Fonte da Verdade)
create table if not exists public.transacoes_moedas (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null references public.usuarios(id) on delete cascade,
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  tipo          tipo_moeda not null,
  valor         int not null check (valor <> 0),
  saldo_apos    bigint,
  descricao     text,
  origem_tabela text,
  origem_id     uuid,
  criado_em     timestamptz not null default now()
);

create index if not exists ix_transacoes_usuario on public.transacoes_moedas (usuario_id, criado_em desc);
create index if not exists ix_transacoes_empresa on public.transacoes_moedas (empresa_id, criado_em desc);

-- 2.5 Desafios Corporativos
create table if not exists public.desafios (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references public.empresas(id) on delete cascade,
  setor_id          uuid references public.setores(id) on delete set null,
  titulo            text not null,
  descricao         text,
  tipo              text not null default 'passos',
  meta_valor        int not null,
  recompensa_moedas int not null default 0,
  inicio            date not null,
  fim               date not null,
  ativo             boolean not null default true,
  criado_em         timestamptz not null default now()
);

create index if not exists ix_desafios_empresa on public.desafios (empresa_id, ativo);

-- 2.6 Participações em Desafios
create table if not exists public.participacoes_desafio (
  desafio_id   uuid references public.desafios(id) on delete cascade,
  usuario_id   uuid references public.usuarios(id) on delete cascade,
  progresso    int not null default 0,
  concluido_em timestamptz,
  primary key (desafio_id, usuario_id)
);

-- 2.7 Conquistas / Medalhas
create table if not exists public.conquistas (
  id         uuid primary key default gen_random_uuid(),
  codigo     text not null unique,
  titulo     text not null,
  descricao  text,
  icone_url  text,
  criterio   jsonb,
  ativo      boolean not null default true
);

-- 2.8 Conquistas Desbloqueadas pelo Usuário
create table if not exists public.conquistas_usuario (
  conquista_id   uuid references public.conquistas(id) on delete cascade,
  usuario_id     uuid references public.usuarios(id) on delete cascade,
  conquistado_em timestamptz not null default now(),
  primary key (conquista_id, usuario_id)
);

-- ==============================================================================
-- DOMÍNIO 3: SAÚDE MENTAL & PREVENÇÃO DE BURNOUT (NR-1)
-- ==============================================================================

-- 3.1 Biblioteca de Meditações
create table if not exists public.meditacoes (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descricao   text,
  categoria   text,
  url_audio   text not null,
  duracao_seg int,
  capa_url    text,
  publicado   boolean not null default false,
  criado_em   timestamptz not null default now()
);

-- 3.2 Sessões de Meditação Realizadas
create table if not exists public.sessoes_meditacao (
  id               uuid primary key default gen_random_uuid(),
  usuario_id       uuid not null references public.usuarios(id) on delete cascade,
  empresa_id       uuid not null references public.empresas(id) on delete cascade,
  meditacao_id     uuid not null references public.meditacoes(id) on delete cascade,
  iniciado_em      timestamptz not null default now(),
  concluido_em     timestamptz,
  segundos_ouvidos int not null default 0
);

create index if not exists ix_sessoes_med_usuario on public.sessoes_meditacao (usuario_id, iniciado_em desc);

-- 3.3 Instrumentos Psicométricos (Ex: Burnout, Maslach, SRQ-20)
create table if not exists public.instrumentos (
  id            uuid primary key default gen_random_uuid(),
  codigo        text not null unique,
  nome          text not null,
  descricao     text,
  versao        text not null default '1.0',
  escala_min    smallint not null default 0,
  escala_max    smallint not null default 4,
  pontos_corte  jsonb,
  ativo         boolean not null default true
);

-- 3.4 Dimensões do Instrumento (Ex: Exaustão emocional, Despersonalização, Realização)
create table if not exists public.instrumento_dimensoes (
  id             uuid primary key default gen_random_uuid(),
  instrumento_id uuid not null references public.instrumentos(id) on delete cascade,
  nome           text not null,
  ordem          smallint not null default 1
);

-- 3.5 Questões do Instrumento
create table if not exists public.instrumento_questoes (
  id             uuid primary key default gen_random_uuid(),
  instrumento_id uuid not null references public.instrumentos(id) on delete cascade,
  dimensao_id    uuid references public.instrumento_dimensoes(id) on delete set null,
  ordem          smallint not null,
  enunciado      text not null,
  invertida      boolean not null default false,
  unique (instrumento_id, ordem)
);

-- 3.6 Opções de Resposta das Questões
create table if not exists public.instrumento_opcoes (
  id         uuid primary key default gen_random_uuid(),
  questao_id uuid not null references public.instrumento_questoes(id) on delete cascade,
  rotulo     text not null,
  valor      smallint not null,
  ordem      smallint not null default 1
);

-- 3.7 Ciclos de Coleta Psicossocial (Configuração do RH)
create table if not exists public.ciclos_psicossociais (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references public.empresas(id) on delete cascade,
  nome              text not null,
  instrumento_id    uuid not null references public.instrumentos(id),
  inicio            date not null,
  fim               date not null,
  status            status_ciclo not null default 'rascunho',
  minimo_agregacao  smallint not null default 5, -- Regra k-anonimato (mínimo 5 respondentes)
  criado_em         timestamptz not null default now()
);

create index if not exists ix_ciclos_empresa on public.ciclos_psicossociais (empresa_id, status);

-- 3.8 Avaliações Individuais (DADO CLÍNICO SENSÍVEL - LGPD ART. 11 - BLINDADO)
create table if not exists public.avaliacoes (
  id                   uuid primary key default gen_random_uuid(),
  usuario_id           uuid not null references public.usuarios(id) on delete cascade,
  empresa_id           uuid not null references public.empresas(id) on delete cascade,
  instrumento_id       uuid not null references public.instrumentos(id),
  ciclo_id             uuid references public.ciclos_psicossociais(id) on delete set null,
  iniciado_em          timestamptz not null default now(),
  concluido_em         timestamptz,
  pontuacao_total      int,
  nivel_risco          nivel_risco,
  pontuacao_dimensoes  jsonb,
  encaminhado_apoio    boolean not null default false
);

create index if not exists ix_avaliacoes_ciclo on public.avaliacoes (ciclo_id, concluido_em);
create index if not exists ix_avaliacoes_usuario on public.avaliacoes (usuario_id);

-- 3.9 Respostas Item a Item (DADO CLÍNICO SENSÍVEL - EXCLUSIVO DO COLABORADOR)
create table if not exists public.respostas_avaliacao (
  avaliacao_id uuid not null references public.avaliacoes(id) on delete cascade,
  questao_id   uuid not null references public.instrumento_questoes(id),
  opcao_id     uuid not null references public.instrumento_opcoes(id),
  valor        smallint not null,
  primary key (avaliacao_id, questao_id)
);

-- ==============================================================================
-- DOMÍNIO 4: APOIO CLÍNICO & AGENDAMENTOS
-- ==============================================================================

-- 4.1 Psicólogos Credenciados
create table if not exists public.psicologos (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid unique references public.usuarios(id) on delete set null,
  nome           text not null,
  crp            text not null unique,
  email          text,
  telefone       text,
  bio            text,
  foto_url       text,
  especialidades text[] not null default '{}',
  modalidade     modalidade not null default 'online',
  valor_moedas   int not null default 0,
  duracao_min    int not null default 50,
  aceita_novos   boolean not null default true,
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now()
);

-- 4.2 Agendamentos (DADOS OPERACIONAIS / ADMINISTRATIVOS — SEM OBSERVAÇÕES CLÍNICAS)
create table if not exists public.agendamentos (
  id                  uuid primary key default gen_random_uuid(),
  usuario_id          uuid not null references public.usuarios(id) on delete cascade,
  psicologo_id        uuid not null references public.psicologos(id) on delete restrict,
  empresa_id          uuid not null references public.empresas(id) on delete cascade,
  agendado_para       timestamptz not null,
  duracao_min         int not null default 50,
  modalidade          modalidade not null default 'online',
  status              status_agendamento not null default 'solicitado',
  valor_moedas        int not null default 0,
  link_sessao         text,
  motivo_cancelamento text,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now()
);

create unique index if not exists ux_agenda_horario on public.agendamentos (psicologo_id, agendado_para)
  where status in ('solicitado','confirmado');

create index if not exists ix_agenda_usuario on public.agendamentos (usuario_id, agendado_para desc);
create index if not exists ix_agenda_empresa on public.agendamentos (empresa_id, agendado_para desc);

-- 4.3 Prontuário Clínico Segregado (DADO ULTRA-SENSÍVEL — ISOLADO FISICAMENTE DO RH)
-- Garante conformidade com Código de Ética do Psicólogo e LGPD Art. 11
create table if not exists public.prontuarios_agendamentos (
  id             uuid primary key default gen_random_uuid(),
  agendamento_id uuid not null unique references public.agendamentos(id) on delete cascade,
  psicologo_id   uuid not null references public.psicologos(id) on delete restrict,
  usuario_id     uuid not null references public.usuarios(id) on delete cascade,
  anotacoes      text not null,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

create index if not exists ix_prontuarios_agendamento on public.prontuarios_agendamentos (agendamento_id);

-- ==============================================================================
-- DOMÍNIO 5: BENEFÍCIOS & RESGATES
-- ==============================================================================

-- 5.1 Catálogo de Benefícios
create table if not exists public.beneficios (
  id                     uuid primary key default gen_random_uuid(),
  empresa_id             uuid references public.empresas(id) on delete cascade, -- null = benefício global
  nome                   text not null,
  descricao              text,
  categoria              text,
  imagem_url             text,
  custo_moedas           int not null check (custo_moedas > 0),
  estoque                int, -- null = ilimitado
  limite_colaborador_mes smallint default 1,
  ativo                  boolean not null default true,
  criado_em              timestamptz not null default now()
);

create index if not exists ix_beneficios_empresa on public.beneficios (empresa_id, ativo);

-- 5.2 Resgates Solicitados
create table if not exists public.resgates (
  id               uuid primary key default gen_random_uuid(),
  usuario_id       uuid not null references public.usuarios(id) on delete cascade,
  beneficio_id     uuid not null references public.beneficios(id) on delete restrict,
  empresa_id       uuid not null references public.empresas(id) on delete cascade,
  custo_moedas     int not null,
  quantidade       smallint not null default 1,
  status           status_resgate not null default 'solicitado',
  endereco_entrega jsonb,
  codigo_rastreio  text,
  aprovado_por     uuid references public.usuarios(id),
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

create index if not exists ix_resgates_usuario on public.resgates (usuario_id, criado_em desc);
create index if not exists ix_resgates_empresa on public.resgates (empresa_id, status);

-- ==============================================================================
-- DOMÍNIO 6: NR-1 AGREGADO, NOTIFICAÇÕES & AUDITORIA
-- ==============================================================================

-- 6.1 Relatórios NR-1 Agregados (FONTE OFICIAL CONSUMIDA PELO RH)
-- Respeita rigorosamente o k-anonimato (mínimo de respondentes por setor)
create table if not exists public.relatorios_nr1 (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas(id) on delete cascade,
  ciclo_id       uuid references public.ciclos_psicossociais(id) on delete set null,
  setor_id       uuid references public.setores(id) on delete set null, -- null = consolidado geral da empresa
  periodo_inicio date not null,
  periodo_fim    date not null,
  n_respondentes int not null,
  indice_risco   numeric(5,2),
  nivel_risco    nivel_risco,
  indicadores    jsonb, -- médias por dimensão, distribuição %
  medidas_acao   text,
  gerado_em      timestamptz not null default now(),
  unique (empresa_id, ciclo_id, setor_id)
);

create index if not exists ix_relatorios_nr1_empresa on public.relatorios_nr1 (empresa_id, ciclo_id);

-- 6.2 Notificações In-App
create table if not exists public.notificacoes (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  tipo       text not null,
  titulo     text not null,
  mensagem   text,
  payload    jsonb,
  lida_em    timestamptz,
  criado_em  timestamptz not null default now()
);

create index if not exists ix_notificacoes_usuario on public.notificacoes (usuario_id, criado_em desc);

-- 6.3 Trilha de Auditoria (Imutável)
create table if not exists public.logs_auditoria (
  id          bigserial primary key,
  empresa_id  uuid,
  usuario_id  uuid,
  acao        text not null,
  entidade    text,
  entidade_id uuid,
  dados       jsonb,
  ip          inet,
  criado_em   timestamptz not null default now()
);

create index if not exists ix_logs_auditoria_empresa on public.logs_auditoria (empresa_id, criado_em desc);

-- ==============================================================================
-- 7. REGRAS DE INTEGRIDADE, TRIGGERS E FUNÇÕES DE AUTOMAÇÃO
-- ==============================================================================

-- 7.1 Auto-preenchimento de empresa_id em tabelas de alto volume
create or replace function public.fn_definir_empresa_id_padrao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.empresa_id is null then
    select empresa_id into new.empresa_id from public.usuarios where id = new.usuario_id;
  end if;
  return new;
end $$;

drop trigger if exists tg_set_empresa_passos on public.registros_passos;
create trigger tg_set_empresa_passos
  before insert on public.registros_passos
  for each row execute function public.fn_definir_empresa_id_padrao();

drop trigger if exists tg_set_empresa_transacoes on public.transacoes_moedas;
create trigger tg_set_empresa_transacoes
  before insert on public.transacoes_moedas
  for each row execute function public.fn_definir_empresa_id_padrao();

drop trigger if exists tg_set_empresa_meditacao on public.sessoes_meditacao;
create trigger tg_set_empresa_meditacao
  before insert on public.sessoes_meditacao
  for each row execute function public.fn_definir_empresa_id_padrao();

-- 7.2 Atualização Atômica de Saldo da Carteira via Transação
create or replace function public.fn_aplicar_transacao_moeda()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Atualiza ou cria a carteira do usuário com controle de concorrência
  insert into public.carteiras (usuario_id, saldo, total_creditado, total_debitado, atualizado_em)
  values (
    new.usuario_id,
    greatest(new.valor, 0),
    greatest(new.valor, 0),
    greatest(-new.valor, 0),
    now()
  )
  on conflict (usuario_id) do update
    set saldo           = public.carteiras.saldo + new.valor,
        total_creditado = public.carteiras.total_creditado + greatest(new.valor, 0),
        total_debitado  = public.carteiras.total_debitado + greatest(-new.valor, 0),
        atualizado_em   = now();

  -- Atualiza o extrato com o saldo exato após a operação
  update public.transacoes_moedas t
     set saldo_apos = (select saldo from public.carteiras where usuario_id = new.usuario_id)
   where t.id = new.id;

  return new;
end $$;

drop trigger if exists tg_transacao_moeda on public.transacoes_moedas;
create trigger tg_transacao_moeda
  after insert on public.transacoes_moedas
  for each row execute function public.fn_aplicar_transacao_moeda();

-- 7.3 Provisionamento Automático de Usuário e Vinculação de Convite
-- Retificado: o usuário convidado entra com situacao = 'convidado' e só muda para 'ativo'
-- quando aceita o Termo de Responsabilidade (public.aceites_termo) no seu 1º acesso no App.
create or replace function public.fn_novo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_convite public.convites%rowtype;
  v_nome text;
  v_situacao_inicial public.situacao_usuario;
begin
  v_nome := coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1));

  -- 1. Verifica se existe convite válido e pendente/enviado para o e-mail cadastrado
  select * into v_convite
  from public.convites
  where lower(email) = lower(new.email)
    and situacao in ('pendente', 'enviado')
    and expira_em > now()
  order by criado_em desc
  limit 1;

  if found then
    -- Apenas admin_plataforma nasce ativo; demais papéis (inclusive rh_admin) nascem como 'convidado' até o aceite do termo
    v_situacao_inicial := case
      when v_convite.papel = 'admin_plataforma' then 'ativo'::public.situacao_usuario
      else 'convidado'::public.situacao_usuario
    end;

    insert into public.usuarios (
      id, empresa_id, setor_id, papel, situacao, nome, email, cpf, matricula, cargo, criado_em, atualizado_em
    ) values (
      new.id,
      v_convite.empresa_id,
      v_convite.setor_id,
      v_convite.papel,
      v_situacao_inicial,
      coalesce(v_convite.nome, v_nome),
      new.email,
      v_convite.cpf,
      v_convite.matricula,
      v_convite.cargo,
      now(),
      now()
    )
    on conflict (id) do update set
      empresa_id    = excluded.empresa_id,
      setor_id      = excluded.setor_id,
      papel         = excluded.papel,
      cpf           = coalesce(excluded.cpf, public.usuarios.cpf),
      matricula     = coalesce(excluded.matricula, public.usuarios.matricula),
      cargo         = coalesce(excluded.cargo, public.usuarios.cargo),
      atualizado_em = now();

    -- Vincula o usuario_id ao convite (mantendo situacao = 'enviado' até o aceite do termo)
    update public.convites
       set usuario_id = new.id
     where id = v_convite.id;

  else
    -- Cadastro sem convite prévio entra como 'convidado'
    insert into public.usuarios (id, nome, email, situacao, criado_em, atualizado_em)
    values (new.id, v_nome, new.email, 'convidado', now(), now())
    on conflict (id) do nothing;
  end if;

  -- 2. Inicializa a carteira com saldo zero
  insert into public.carteiras (usuario_id, saldo, total_creditado, total_debitado, atualizado_em)
  values (new.id, 0, 0, 0, now())
  on conflict (usuario_id) do nothing;

  return new;
end $$;

drop trigger if exists tg_novo_usuario on auth.users;
create trigger tg_novo_usuario
  after insert on auth.users
  for each row execute function public.fn_novo_usuario();

-- 7.3.1 Stored Procedure: Aceite do Termo de Responsabilidade (convidado -> ativo)
create or replace function public.fn_aceitar_termo(
  p_termo_id uuid default null,
  p_user_agent text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_usuario_id uuid := auth.uid();
  v_termo_id uuid;
  v_email text;
  v_empresa_id uuid;
begin
  if v_usuario_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  -- Localiza o termo ativo caso p_termo_id não seja informado
  if p_termo_id is not null then
    v_termo_id := p_termo_id;
  else
    select id into v_termo_id
    from public.termos
    where ativo = true
    order by publicado_em desc nulls last, criado_em desc
    limit 1;
  end if;

  if v_termo_id is null then
    insert into public.termos (versao, titulo, conteudo, publicado_em, ativo)
    values (
      '2026.1',
      'Termo de Responsabilidade, Uso e Privacidade — Passo é Saúde (LGPD & NR-1)',
      'Declaro ciência e concordância com os Termos de Uso, Política de Privacidade (LGPD Art. 11) e diretrizes de gestão ocupacional NR-1 da plataforma Passo é Saúde.',
      now(),
      true
    )
    on conflict (versao) do update set ativo = true
    returning id into v_termo_id;
  end if;

  -- 1. Registra o aceite em public.aceites_termo
  insert into public.aceites_termo (usuario_id, termo_id, aceito_em, user_agent)
  values (v_usuario_id, v_termo_id, now(), p_user_agent)
  on conflict (usuario_id, termo_id) do update
    set aceito_em  = now(),
        user_agent = coalesce(excluded.user_agent, public.aceites_termo.user_agent);

  -- 2. Atualiza a situação do usuário de 'convidado' para 'ativo'
  update public.usuarios
     set situacao         = 'ativo',
         aceitou_termo_em = now(),
         ultimo_acesso_em = now(),
         atualizado_em    = now()
   where id = v_usuario_id
  returning email, empresa_id into v_email, v_empresa_id;

  -- 3. Atualiza o convite correspondente para 'aceito'
  update public.convites
     set situacao   = 'aceito',
         aceito_em  = now(),
         usuario_id = v_usuario_id
   where usuario_id = v_usuario_id
      or (lower(email) = lower(v_email) and situacao in ('pendente', 'enviado'));

  -- 4. Registra trilha de auditoria
  insert into public.logs_auditoria (empresa_id, usuario_id, acao, entidade, entidade_id, dados, user_agent)
  values (
    v_empresa_id,
    v_usuario_id,
    'ACEITE_TERMO_RESPONSABILIDADE',
    'aceites_termo',
    v_termo_id,
    jsonb_build_object('situacao_anterior', 'convidado', 'situacao_nova', 'ativo'),
    p_user_agent
  );

  return jsonb_build_object(
    'sucesso', true,
    'usuario_id', v_usuario_id,
    'termo_id', v_termo_id,
    'situacao', 'ativo'
  );
end $$;

-- 7.4 Stored Procedure Segura: Consolidação de Ciclo NR-1 (com K-Anonimato >= 5)
create or replace function public.fn_consolidar_ciclo_nr1(p_ciclo_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_ciclo public.ciclos_psicossociais%rowtype;
  v_rec record;
  v_total_inseridos int := 0;
  v_setores_ignorados int := 0;
begin
  select * into v_ciclo from public.ciclos_psicossociais where id = p_ciclo_id;
  if not found then
    raise exception 'Ciclo não encontrado.';
  end if;

  -- 1. Agregação por Setor (Exige N >= minimo_agregacao, padrão 5)
  for v_rec in (
    select
      a.empresa_id,
      a.ciclo_id,
      u.setor_id,
      count(*) as n_resp,
      round(avg(a.pontuacao_total), 2) as media_score,
      round(count(*) filter (where a.nivel_risco in ('alto', 'critico')) * 100.0 / count(*), 1) as pct_alto,
      case
        when round(avg(a.pontuacao_total), 2) >= 70 then 'critico'::nivel_risco
        when round(avg(a.pontuacao_total), 2) >= 50 then 'alto'::nivel_risco
        when round(avg(a.pontuacao_total), 2) >= 30 then 'moderado'::nivel_risco
        else 'baixo'::nivel_risco
      end as risco_calc
    from public.avaliacoes a
    join public.usuarios u on u.id = a.usuario_id
    where a.ciclo_id = p_ciclo_id
      and a.concluido_em is not null
    group by a.empresa_id, a.ciclo_id, u.setor_id
  ) loop
    if v_rec.n_resp >= v_ciclo.minimo_agregacao then
      insert into public.relatorios_nr1 (
        empresa_id, ciclo_id, setor_id, periodo_inicio, periodo_fim,
        n_respondentes, indice_risco, nivel_risco, indicadores, gerado_em
      ) values (
        v_rec.empresa_id, v_rec.ciclo_id, v_rec.setor_id, v_ciclo.inicio, v_ciclo.fim,
        v_rec.n_resp, v_rec.media_score, v_rec.risco_calc,
        jsonb_build_object('pct_risco_alto', v_rec.pct_alto, 'n_respondentes', v_rec.n_resp),
        now()
      )
      on conflict (empresa_id, ciclo_id, setor_id) do update set
        n_respondentes = excluded.n_respondentes,
        indice_risco   = excluded.indice_risco,
        nivel_risco    = excluded.nivel_risco,
        indicadores    = excluded.indicadores,
        gerado_em      = now();

      v_total_inseridos := v_total_inseridos + 1;
    else
      v_setores_ignorados := v_setores_ignorados + 1;
    end if;
  end loop;

  -- 2. Agregação Geral da Empresa (setor_id = NULL)
  for v_rec in (
    select
      a.empresa_id,
      a.ciclo_id,
      count(*) as n_resp,
      round(avg(a.pontuacao_total), 2) as media_score,
      round(count(*) filter (where a.nivel_risco in ('alto', 'critico')) * 100.0 / count(*), 1) as pct_alto,
      case
        when round(avg(a.pontuacao_total), 2) >= 70 then 'critico'::nivel_risco
        when round(avg(a.pontuacao_total), 2) >= 50 then 'alto'::nivel_risco
        when round(avg(a.pontuacao_total), 2) >= 30 then 'moderado'::nivel_risco
        else 'baixo'::nivel_risco
      end as risco_calc
    from public.avaliacoes a
    where a.ciclo_id = p_ciclo_id
      and a.concluido_em is not null
    group by a.empresa_id, a.ciclo_id
  ) loop
    if v_rec.n_resp >= v_ciclo.minimo_agregacao then
      insert into public.relatorios_nr1 (
        empresa_id, ciclo_id, setor_id, periodo_inicio, periodo_fim,
        n_respondentes, indice_risco, nivel_risco, indicadores, gerado_em
      ) values (
        v_rec.empresa_id, v_rec.ciclo_id, null, v_ciclo.inicio, v_ciclo.fim,
        v_rec.n_resp, v_rec.media_score, v_rec.risco_calc,
        jsonb_build_object('pct_risco_alto', v_rec.pct_alto, 'geral_empresa', true),
        now()
      )
      on conflict (empresa_id, ciclo_id, setor_id) do update set
        n_respondentes = excluded.n_respondentes,
        indice_risco   = excluded.indice_risco,
        nivel_risco    = excluded.nivel_risco,
        indicadores    = excluded.indicadores,
        gerado_em      = now();
    end if;
  end loop;

  -- Marca o ciclo como publicado
  update public.ciclos_psicossociais set status = 'publicado' where id = p_ciclo_id;

  return jsonb_build_object(
    'sucesso', true,
    'setores_consolidados', v_total_inseridos,
    'setores_abaixo_k_anonimato', v_setores_ignorados
  );
end $$;

-- 7.5 RPC de Resgate Seguro de Benefício (Atômica, com trava de saldo)
create or replace function public.fn_resgatar_beneficio(
  p_beneficio_id uuid,
  p_endereco jsonb default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_usuario_id uuid := auth.uid();
  v_empresa_id uuid;
  v_beneficio public.beneficios%rowtype;
  v_saldo_atual bigint;
  v_resgate_id uuid;
begin
  if v_usuario_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select empresa_id into v_empresa_id from public.usuarios where id = v_usuario_id;

  -- 1. Bloqueia o benefício para conferência de estoque
  select * into v_beneficio from public.beneficios where id = p_beneficio_id for update;
  if not found or not v_beneficio.ativo then
    raise exception 'Benefício indisponível ou inativo.';
  end if;

  if v_beneficio.estoque is not null and v_beneficio.estoque <= 0 then
    raise exception 'Estoque esgotado.';
  end if;

  -- 2. Bloqueia a carteira do usuário para validação de saldo
  select saldo into v_saldo_atual from public.carteiras where usuario_id = v_usuario_id for update;
  if coalesce(v_saldo_atual, 0) < v_beneficio.custo_moedas then
    raise exception 'Saldo insuficiente de moedas. Saldo atual: %, Custo: %', coalesce(v_saldo_atual, 0), v_beneficio.custo_moedas;
  end if;

  -- 3. Cria a solicitação de resgate
  insert into public.resgates (
    usuario_id, beneficio_id, empresa_id, custo_moedas, quantidade, status, endereco_entrega
  ) values (
    v_usuario_id, v_beneficio.id, v_empresa_id, v_beneficio.custo_moedas, 1, 'solicitado', p_endereco
  ) returning id into v_resgate_id;

  -- 4. Debita o valor através de transação imutável no extrato
  insert into public.transacoes_moedas (
    usuario_id, empresa_id, tipo, valor, descricao, origem_tabela, origem_id
  ) values (
    v_usuario_id, v_empresa_id, 'debito_beneficio', -v_beneficio.custo_moedas,
    'Resgate de benefício: ' || v_beneficio.nome, 'resgates', v_resgate_id
  );

  -- 5. Atualiza estoque se aplicável
  if v_beneficio.estoque is not null then
    update public.beneficios set estoque = estoque - 1 where id = v_beneficio.id;
  end if;

  return jsonb_build_object(
    'sucesso', true,
    'resgate_id', v_resgate_id,
    'novo_saldo', v_saldo_atual - v_beneficio.custo_moedas
  );
end $$;

-- ==============================================================================
-- 8. VIEWS DE CONSUMO
-- ==============================================================================

-- 8.1 Ranking Mensal de Passos (Agregado por empresa e setor)
create or replace view public.vw_ranking_passos with (security_invoker = true) as
select
  p.empresa_id,
  date_trunc('month', p.data)::date as mes,
  u.id as usuario_id,
  u.nome,
  s.nome as setor,
  sum(p.passos) as total_passos,
  round(avg(p.passos))::int as media_diaria,
  count(*) filter (where p.passos >= u.meta_diaria_passos) as dias_meta
from public.registros_passos p
join public.usuarios u on u.id = p.usuario_id
left join public.setores s on s.id = u.setor_id
group by p.empresa_id, date_trunc('month', p.data)::date, u.id, u.nome, s.nome;

-- 8.2 Visão Administrativa do RH para Agendamentos (Totalmente sem prontuário clínico)
create or replace view public.vw_agendamentos_rh with (security_invoker = true) as
select
  a.id,
  a.empresa_id,
  a.usuario_id,
  u.nome as colaborador_nome,
  a.psicologo_id,
  p.nome as psicologo_nome,
  a.agendado_para,
  a.duracao_min,
  a.modalidade,
  a.status,
  a.valor_moedas,
  a.criado_em
from public.agendamentos a
join public.usuarios u on u.id = a.usuario_id
join public.psicologos p on p.id = a.psicologo_id;

-- ==============================================================================
-- 9. SUÍTE COMPLETA DE POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

-- 9.1 Funções Utilitárias de Contexto de Autenticação (STABLE + SECURITY DEFINER)
create or replace function public.fn_empresa_atual()
returns uuid language sql stable security definer set search_path = public as $$
  select empresa_id from public.usuarios where id = auth.uid();
$$;

create or replace function public.fn_papel_atual()
returns papel_usuario language sql stable security definer set search_path = public as $$
  select papel from public.usuarios where id = auth.uid();
$$;

create or replace function public.fn_eh_rh()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select papel in ('rh_operador','rh_admin') from public.usuarios where id = auth.uid()), false);
$$;

create or replace function public.fn_eh_admin_plataforma()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select papel = 'admin_plataforma' from public.usuarios where id = auth.uid()), false);
$$;

-- 9.2 Habilitação de RLS em TODAS as Tabelas do Sistema
alter table public.empresas                  enable row level security;
alter table public.setores                   enable row level security;
alter table public.usuarios                  enable row level security;
alter table public.convites                  enable row level security;
alter table public.termos                    enable row level security;
alter table public.aceites_termo             enable row level security;
alter table public.registros_passos          enable row level security;
alter table public.regras_pontuacao          enable row level security;
alter table public.carteiras                 enable row level security;
alter table public.transacoes_moedas         enable row level security;
alter table public.desafios                  enable row level security;
alter table public.participacoes_desafio     enable row level security;
alter table public.conquistas                enable row level security;
alter table public.conquistas_usuario        enable row level security;
alter table public.meditacoes                enable row level security;
alter table public.sessoes_meditacao         enable row level security;
alter table public.instrumentos              enable row level security;
alter table public.instrumento_dimensoes     enable row level security;
alter table public.instrumento_questoes      enable row level security;
alter table public.instrumento_opcoes        enable row level security;
alter table public.ciclos_psicossociais      enable row level security;
alter table public.avaliacoes                enable row level security;
alter table public.respostas_avaliacao       enable row level security;
alter table public.psicologos                enable row level security;
alter table public.agendamentos              enable row level security;
alter table public.prontuarios_agendamentos  enable row level security;
alter table public.beneficios                enable row level security;
alter table public.resgates                  enable row level security;
alter table public.relatorios_nr1            enable row level security;
alter table public.notificacoes              enable row level security;
alter table public.logs_auditoria            enable row level security;

-- ------------------------------------------------------------------------------
-- POLÍTICAS: EMPRESAS & SETORES
-- ------------------------------------------------------------------------------
drop policy if exists empresas_select on public.empresas;
create policy empresas_select on public.empresas for select
  using (id = public.fn_empresa_atual() or public.fn_eh_admin_plataforma());

drop policy if exists empresas_insert on public.empresas;
create policy empresas_insert on public.empresas for insert
  with check (public.fn_eh_admin_plataforma());

drop policy if exists empresas_update on public.empresas;
create policy empresas_update on public.empresas for update
  using ((id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma())
  with check ((id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma());

drop policy if exists setores_all on public.setores;
create policy setores_all on public.setores for all
  using (empresa_id = public.fn_empresa_atual() or public.fn_eh_admin_plataforma())
  with check ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: USUÁRIOS & CONVITES
-- ------------------------------------------------------------------------------
drop policy if exists usuarios_self on public.usuarios;
create policy usuarios_self on public.usuarios for select
  using (id = auth.uid());

drop policy if exists usuarios_empresa on public.usuarios;
create policy usuarios_empresa on public.usuarios for select
  using (empresa_id = public.fn_empresa_atual() or public.fn_eh_admin_plataforma());

drop policy if exists usuarios_update_self on public.usuarios;
create policy usuarios_update_self on public.usuarios for update
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists usuarios_rh_manage on public.usuarios;
create policy usuarios_rh_manage on public.usuarios for all
  using ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma())
  with check (
    (
      public.fn_eh_admin_plataforma()
      or (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh() and papel <> 'admin_plataforma')
    )
  );

drop policy if exists convites_rh on public.convites;
create policy convites_rh on public.convites for all
  using ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma())
  with check (
    (
      public.fn_eh_admin_plataforma()
      or (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh() and papel <> 'admin_plataforma')
    )
  );

-- ------------------------------------------------------------------------------
-- POLÍTICAS: TERMOS & ACEITES
-- ------------------------------------------------------------------------------
drop policy if exists termos_public on public.termos;
create policy termos_public on public.termos for select to authenticated using (ativo = true);

drop policy if exists termos_admin_write on public.termos;
create policy termos_admin_write on public.termos for all
  using (public.fn_eh_admin_plataforma())
  with check (public.fn_eh_admin_plataforma());

drop policy if exists aceites_self on public.aceites_termo;
create policy aceites_self on public.aceites_termo for all
  using (usuario_id = auth.uid() or public.fn_eh_admin_plataforma() or public.fn_eh_rh())
  with check (usuario_id = auth.uid());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: GAMIFICAÇÃO & PASSOS
-- ------------------------------------------------------------------------------
drop policy if exists passos_self_write on public.registros_passos;
create policy passos_self_write on public.registros_passos for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists passos_empresa_select on public.registros_passos;
create policy passos_empresa_select on public.registros_passos for select
  using (empresa_id = public.fn_empresa_atual() or public.fn_eh_admin_plataforma());

drop policy if exists regras_select on public.regras_pontuacao;
create policy regras_select on public.regras_pontuacao for select
  using (empresa_id = public.fn_empresa_atual() or public.fn_eh_admin_plataforma());

drop policy if exists regras_rh_write on public.regras_pontuacao;
create policy regras_rh_write on public.regras_pontuacao for all
  using ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma())
  with check ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma());

-- Carteiras e Transações: Apenas LEITURA para usuários (escrita exclusiva via trigger/RPC)
drop policy if exists carteiras_self on public.carteiras;
create policy carteiras_self on public.carteiras for select
  using (usuario_id = auth.uid() or public.fn_eh_admin_plataforma() or public.fn_eh_rh());

drop policy if exists transacoes_self on public.transacoes_moedas;
create policy transacoes_self on public.transacoes_moedas for select
  using (usuario_id = auth.uid());

drop policy if exists transacoes_rh on public.transacoes_moedas;
create policy transacoes_rh on public.transacoes_moedas for select
  using ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma());

drop policy if exists desafios_empresa on public.desafios;
create policy desafios_empresa on public.desafios for select
  using (empresa_id = public.fn_empresa_atual() or public.fn_eh_admin_plataforma());

drop policy if exists desafios_rh_write on public.desafios;
create policy desafios_rh_write on public.desafios for all
  using ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma())
  with check ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma());

drop policy if exists participacoes_self on public.participacoes_desafio;
create policy participacoes_self on public.participacoes_desafio for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists conquistas_public on public.conquistas;
create policy conquistas_public on public.conquistas for select to authenticated using (ativo = true);

drop policy if exists conquistas_usuario_self on public.conquistas_usuario;
create policy conquistas_usuario_self on public.conquistas_usuario for select
  using (usuario_id = auth.uid());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: MEDITAÇÃO & INSTRUMENTOS
-- ------------------------------------------------------------------------------
drop policy if exists meditacoes_public on public.meditacoes;
create policy meditacoes_public on public.meditacoes for select to authenticated using (publicado = true);

drop policy if exists sessoes_med_self on public.sessoes_meditacao;
create policy sessoes_med_self on public.sessoes_meditacao for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists instrumentos_public on public.instrumentos;
create policy instrumentos_public on public.instrumentos for select to authenticated using (ativo = true);

drop policy if exists dimensoes_public on public.instrumento_dimensoes;
create policy dimensoes_public on public.instrumento_dimensoes for select to authenticated using (true);

drop policy if exists questoes_public on public.instrumento_questoes;
create policy questoes_public on public.instrumento_questoes for select to authenticated using (true);

drop policy if exists opcoes_public on public.instrumento_opcoes;
create policy opcoes_public on public.instrumento_opcoes for select to authenticated using (true);

drop policy if exists ciclos_empresa on public.ciclos_psicossociais;
create policy ciclos_empresa on public.ciclos_psicossociais for select
  using (empresa_id = public.fn_empresa_atual() or public.fn_eh_admin_plataforma());

drop policy if exists ciclos_rh on public.ciclos_psicossociais;
create policy ciclos_rh on public.ciclos_psicossociais for all
  using ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma())
  with check ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: AVALIAÇÃO PSICOSSOCIAL / BURNOUT (BLINDAGEM ABSOLUTA LGPD ART. 11)
-- RH E GESTORES TÊM ZERO VISIBILIDADE DAS LINHAS INDIVIDUAIS
-- ------------------------------------------------------------------------------
drop policy if exists avaliacoes_self on public.avaliacoes;
create policy avaliacoes_self on public.avaliacoes for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists respostas_self on public.respostas_avaliacao;
create policy respostas_self on public.respostas_avaliacao for all
  using (exists (select 1 from public.avaliacoes a where a.id = respostas_avaliacao.avaliacao_id and a.usuario_id = auth.uid()))
  with check (exists (select 1 from public.avaliacoes a where a.id = respostas_avaliacao.avaliacao_id and a.usuario_id = auth.uid()));

-- ------------------------------------------------------------------------------
-- POLÍTICAS: APOIO CLÍNICO, AGENDAMENTOS E PRONTUÁRIOS
-- ------------------------------------------------------------------------------
drop policy if exists psicologos_public on public.psicologos;
create policy psicologos_public on public.psicologos for select to authenticated using (ativo = true);

drop policy if exists psicologos_rh_write on public.psicologos;
create policy psicologos_rh_write on public.psicologos for all
  using (public.fn_eh_rh() or public.fn_eh_admin_plataforma())
  with check (public.fn_eh_rh() or public.fn_eh_admin_plataforma());

drop policy if exists agenda_colaborador on public.agendamentos;
create policy agenda_colaborador on public.agendamentos for select
  using (usuario_id = auth.uid());

drop policy if exists agenda_psicologo on public.agendamentos;
create policy agenda_psicologo on public.agendamentos for select
  using (exists (select 1 from public.psicologos p where p.id = agendamentos.psicologo_id and p.usuario_id = auth.uid()));

drop policy if exists agenda_rh_operacional on public.agendamentos;
create policy agenda_rh_operacional on public.agendamentos for select
  using ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma());

-- Prontuários Clínicos: Totalmente inacessível para RH.
drop policy if exists prontuarios_acesso on public.prontuarios_agendamentos;
create policy prontuarios_acesso on public.prontuarios_agendamentos for all
  using (
    usuario_id = auth.uid() or
    exists (select 1 from public.psicologos p where p.id = prontuarios_agendamentos.psicologo_id and p.usuario_id = auth.uid())
  )
  with check (
    exists (select 1 from public.psicologos p where p.id = prontuarios_agendamentos.psicologo_id and p.usuario_id = auth.uid())
  );

-- ------------------------------------------------------------------------------
-- POLÍTICAS: BENEFÍCIOS & RESGATES
-- ------------------------------------------------------------------------------
drop policy if exists beneficios_select on public.beneficios;
create policy beneficios_select on public.beneficios for select to authenticated
  using ((empresa_id is null or empresa_id = public.fn_empresa_atual() or public.fn_eh_admin_plataforma()) and ativo = true);

drop policy if exists beneficios_rh_write on public.beneficios;
create policy beneficios_rh_write on public.beneficios for all
  using ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma())
  with check ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma());

drop policy if exists resgates_self on public.resgates;
create policy resgates_self on public.resgates for select
  using (usuario_id = auth.uid());

drop policy if exists resgates_rh on public.resgates;
create policy resgates_rh on public.resgates for all
  using ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma())
  with check ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: RELATÓRIOS NR-1 AGREGADOS, NOTIFICAÇÕES & AUDITORIA
-- ------------------------------------------------------------------------------
drop policy if exists nr1_rh on public.relatorios_nr1;
create policy nr1_rh on public.relatorios_nr1 for select
  using ((empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma());

drop policy if exists notificacoes_self on public.notificacoes;
create policy notificacoes_self on public.notificacoes for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists logs_auditoria_admin on public.logs_auditoria;
create policy logs_auditoria_admin on public.logs_auditoria for select
  using (public.fn_eh_admin_plataforma() or (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()));

drop policy if exists logs_auditoria_insert on public.logs_auditoria;
create policy logs_auditoria_insert on public.logs_auditoria for insert to authenticated
  with check (usuario_id is null or usuario_id = auth.uid() or public.fn_eh_admin_plataforma() or public.fn_eh_rh());

-- ==============================================================================
-- 10. SEGURANÇA ADICIONAL DE PERMISSÕES POSTGREST (LEAST PRIVILEGE)
-- ==============================================================================
-- Revoga inserções e edições diretas pelo app em carteiras e transações
revoke insert, update, delete on public.carteiras from anon, authenticated;
grant select on public.carteiras to authenticated;

revoke insert, update, delete on public.transacoes_moedas from anon, authenticated;
grant select on public.transacoes_moedas to authenticated;

-- Assegura permissões de execução para as RPCs
grant execute on function public.fn_resgatar_beneficio(uuid, jsonb) to authenticated;
grant execute on function public.fn_consolidar_ciclo_nr1(uuid) to authenticated;
grant execute on function public.fn_aceitar_termo(uuid, text) to authenticated;
grant execute on function public.fn_empresa_atual() to authenticated;
grant execute on function public.fn_papel_atual() to authenticated;
grant execute on function public.fn_eh_rh() to authenticated;
grant execute on function public.fn_eh_admin_plataforma() to authenticated;
