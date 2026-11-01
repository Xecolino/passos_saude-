create table public.usuarios (
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

create unique index ux_usuarios_email      on public.usuarios (lower(email));
create unique index ux_usuarios_cpf        on public.usuarios (empresa_id, cpf) where cpf is not null;
create unique index ux_usuarios_matricula  on public.usuarios (empresa_id, matricula) where matricula is not null;
create index        ix_usuarios_empresa    on public.usuarios (empresa_id, situacao);
create index        ix_usuarios_setor      on public.usuarios (setor_id);

-- Convite: o RH cadastra no site e o colaborador recebe e-mail com link + senha provisória
create table public.convites (
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
  expira_em     timestamptz not null default now() + interval '7 days',
  aceito_em     timestamptz,
  usuario_id    uuid references public.usuarios(id),
  criado_em     timestamptz not null default now()
);

create unique index ux_convites_token on public.convites (token);
create unique index ux_convites_aberto on public.convites (empresa_id, lower(email))
  where situacao in ('pendente','enviado');

create table public.termos (
  id           uuid primary key default gen_random_uuid(),
  versao       text not null unique,
  titulo       text not null,
  conteudo     text not null,
  publicado_em timestamptz,
  ativo        boolean not null default true,
  criado_em    timestamptz not null default now()
);

create table public.aceites_termo (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  termo_id   uuid not null references public.termos(id) on delete restrict,
  aceito_em  timestamptz not null default now(),
  ip         inet,
  user_agent text,
  unique (usuario_id, termo_id)
);