-- ==============================================================================
-- BLOCO 4: SAÚDE MENTAL, INSTRUMENTOS PSICOSSOCIAIS & APOIO CLÍNICO
-- ==============================================================================

create table public.meditacoes (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descricao   text,
  categoria   text,        -- sono, foco, ansiedade, pausa
  url_audio   text not null,
  duracao_seg int,
  capa_url    text,
  publicado   boolean not null default false,
  criado_em   timestamptz not null default now()
);

create table public.sessoes_meditacao (
  id               uuid primary key default gen_random_uuid(),
  usuario_id       uuid not null references public.usuarios(id) on delete cascade,
  empresa_id       uuid not null references public.empresas(id) on delete cascade,
  meditacao_id     uuid not null references public.meditacoes(id) on delete cascade,
  iniciado_em      timestamptz not null default now(),
  concluido_em     timestamptz,
  segundos_ouvidos int not null default 0
);

create index ix_sessoes_med on public.sessoes_meditacao (usuario_id, iniciado_em desc);

-- Instrumento versionado: permite trocar o questionário sem perder histórico
create table public.instrumentos (
  id            uuid primary key default gen_random_uuid(),
  codigo        text not null unique,   -- burnout_autoavaliacao
  nome          text not null,
  descricao     text,
  versao        text not null default '1.0',
  escala_min    smallint not null default 0,
  escala_max    smallint not null default 4,
  pontos_corte  jsonb,                  -- {"baixo":24,"moderado":48,"alto":72}
  ativo         boolean not null default true
);

create table public.instrumento_dimensoes (
  id             uuid primary key default gen_random_uuid(),
  instrumento_id uuid not null references public.instrumentos(id) on delete cascade,
  nome           text not null,          -- exaustão, despersonalização, realização
  ordem          smallint not null default 1
);

create table public.instrumento_questoes (
  id             uuid primary key default gen_random_uuid(),
  instrumento_id uuid not null references public.instrumentos(id) on delete cascade,
  dimensao_id    uuid references public.instrumento_dimensoes(id) on delete set null,
  ordem          smallint not null,
  enunciado      text not null,
  invertida      boolean not null default false,
  unique (instrumento_id, ordem)
);

create table public.instrumento_opcoes (
  id         uuid primary key default gen_random_uuid(),
  questao_id uuid not null references public.instrumento_questoes(id) on delete cascade,
  rotulo     text not null,
  valor      smallint not null,
  ordem      smallint not null default 1
);

create table public.ciclos_psicossociais (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references public.empresas(id) on delete cascade,
  nome              text not null,
  instrumento_id    uuid not null references public.instrumentos(id),
  inicio            date not null,
  fim               date not null,
  status            status_ciclo not null default 'rascunho',
  minimo_agregacao  smallint not null default 5,   -- k-anonimato do relatório
  criado_em         timestamptz not null default now()
);

create table public.avaliacoes (
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

create index ix_avaliacoes_ciclo on public.avaliacoes (ciclo_id, concluido_em);

create table public.respostas_avaliacao (
  avaliacao_id uuid not null references public.avaliacoes(id) on delete cascade,
  questao_id   uuid not null references public.instrumento_questoes(id),
  opcao_id     uuid not null references public.instrumento_opcoes(id),
  valor        smallint not null,
  primary key (avaliacao_id, questao_id)
);

create table public.psicologos (
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

-- AGENDAMENTOS: Registro operacional (livre de notas clínicas confidenciais)
create table public.agendamentos (
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

create unique index ux_agenda_horario on public.agendamentos (psicologo_id, agendado_para)
  where status in ('solicitado','confirmado');

create index ix_agenda_usuario on public.agendamentos (usuario_id, agendado_para desc);

-- PRONTUÁRIOS CLÍNICOS: Segregação física de observações e anotações confidenciais
create table public.prontuarios_agendamentos (
  id             uuid primary key default gen_random_uuid(),
  agendamento_id uuid not null unique references public.agendamentos(id) on delete cascade,
  psicologo_id   uuid not null references public.psicologos(id) on delete restrict,
  usuario_id     uuid not null references public.usuarios(id) on delete cascade,
  anotacoes      text not null,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);