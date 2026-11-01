-- ==============================================================================
-- BLOCO 3: GAMIFICAÇÃO (PASSOS -> MOEDAS) & DESAFIOS
-- ==============================================================================

create table public.registros_passos (
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

create index ix_passos_empresa_data on public.registros_passos (empresa_id, data desc);
create index ix_passos_usuario_data on public.registros_passos (usuario_id, data desc);
create index ix_passos_data         on public.registros_passos (data);

-- Regra de conversão por empresa, com vigência (histórico preservado)
create table public.regras_pontuacao (
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

create table public.carteiras (
  usuario_id      uuid primary key references public.usuarios(id) on delete cascade,
  saldo           bigint not null default 0 check (saldo >= 0),
  total_creditado bigint not null default 0,
  total_debitado  bigint not null default 0,
  atualizado_em   timestamptz not null default now()
);

-- Fonte da verdade do saldo
create table public.transacoes_moedas (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null references public.usuarios(id) on delete cascade,
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  tipo          tipo_moeda not null,
  valor         int not null check (valor <> 0),  -- + crédito / - débito
  saldo_apos    bigint,
  descricao     text,
  origem_tabela text,
  origem_id     uuid,
  criado_em     timestamptz not null default now()
);

create index ix_transacoes_usuario on public.transacoes_moedas (usuario_id, criado_em desc);
create index ix_transacoes_empresa on public.transacoes_moedas (empresa_id, criado_em desc);

create table public.desafios (
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

create table public.participacoes_desafio (
  desafio_id   uuid references public.desafios(id) on delete cascade,
  usuario_id   uuid references public.usuarios(id) on delete cascade,
  progresso    int not null default 0,
  concluido_em timestamptz,
  primary key (desafio_id, usuario_id)
);

create table public.conquistas (
  id         uuid primary key default gen_random_uuid(),
  codigo     text not null unique,
  titulo     text not null,
  descricao  text,
  icone_url  text,
  criterio   jsonb,          -- {"tipo":"passos_total","valor":100000}
  ativo      boolean not null default true
);

create table public.conquistas_usuario (
  conquista_id   uuid references public.conquistas(id) on delete cascade,
  usuario_id     uuid references public.usuarios(id) on delete cascade,
  conquistado_em timestamptz not null default now(),
  primary key (conquista_id, usuario_id)
);

-- Auto-populamento de empresa_id
create or replace function public.fn_definir_empresa_id_padrao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.empresa_id is null then
    select empresa_id into new.empresa_id from public.usuarios where id = new.usuario_id;
  end if;
  return new;
end $$;

create trigger tg_set_empresa_passos
  before insert on public.registros_passos
  for each row execute function public.fn_definir_empresa_id_padrao();

create trigger tg_set_empresa_transacoes
  before insert on public.transacoes_moedas
  for each row execute function public.fn_definir_empresa_id_padrao();

-- Trigger: manter saldo consistente
create or replace function public.fn_aplicar_transacao_moeda()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.carteiras (usuario_id, saldo, total_creditado, total_debitado)
  values (new.usuario_id, greatest(new.valor,0), greatest(new.valor,0), greatest(-new.valor,0))
  on conflict (usuario_id) do update
    set saldo          = public.carteiras.saldo + new.valor,
        total_creditado = public.carteiras.total_creditado + greatest(new.valor,0),
        total_debitado  = public.carteiras.total_debitado + greatest(-new.valor,0),
        atualizado_em   = now();

  update public.transacoes_moedas t
     set saldo_apos = (select saldo from public.carteiras where usuario_id = new.usuario_id)
   where t.id = new.id;

  return new;
end $$;

create trigger tg_transacao_moeda after insert on public.transacoes_moedas
for each row execute function public.fn_aplicar_transacao_moeda();