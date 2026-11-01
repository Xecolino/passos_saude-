create table public.beneficios (
  id                  uuid primary key default gen_random_uuid(),
  empresa_id          uuid references public.empresas(id) on delete cascade, -- null = global
  nome                text not null,
  descricao           text,
  categoria           text,
  imagem_url          text,
  custo_moedas        int not null check (custo_moedas > 0),
  estoque             int,                       -- null = ilimitado
  limite_colaborador_mes smallint default 1,
  ativo               boolean not null default true,
  criado_em           timestamptz not null default now()
);

create table public.resgates (
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

create index ix_resgates_usuario on public.resgates (usuario_id, criado_em desc);