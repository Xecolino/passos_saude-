create table public.relatorios_nr1 (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas(id) on delete cascade,
  ciclo_id       uuid references public.ciclos_psicossociais(id) on delete set null,
  setor_id       uuid references public.setores(id) on delete set null,
  periodo_inicio date not null,
  periodo_fim    date not null,
  n_respondentes int not null,
  indice_risco   numeric(5,2),
  nivel_risco    nivel_risco,
  indicadores    jsonb,   -- médias por dimensão, distribuição, % em risco alto
  medidas_acao   text,
  gerado_em      timestamptz not null default now()
);

create table public.notificacoes (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  tipo       text not null,
  titulo     text not null,
  mensagem   text,
  payload    jsonb,
  lida_em    timestamptz,
  criado_em  timestamptz not null default now()
);

create index ix_notificacoes on public.notificacoes (usuario_id, criado_em desc);

create table public.logs_auditoria (
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