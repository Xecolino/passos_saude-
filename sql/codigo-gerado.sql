create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type papel_usuario   as enum ('colaborador','gestor','rh_operador','rh_admin','psicologo','admin_plataforma');
create type situacao_usuario as enum ('convidado','ativo','inativo','afastado','desligado');
create type situacao_convite as enum ('pendente','enviado','aceito','expirado','cancelado');
create type origem_passos    as enum ('manual','google_fit','health_connect','apple_health','outro');
create type tipo_moeda       as enum ('credito_passos','credito_desafio','credito_conquista',
                                      'doacao_empresa','debito_consulta','debito_beneficio',
                                      'estorno','expiracao');
create type status_agendamento as enum ('solicitado','confirmado','realizado','cancelado','remarcado','nao_compareceu');
create type status_resgate     as enum ('solicitado','aprovado','em_transito','entregue','cancelado');
create type status_ciclo       as enum ('rascunho','coletando','encerrado','publicado');
create type nivel_risco        as enum ('baixo','moderado','alto','critico');
create type modalidade         as enum ('online','presencial');

-- Empresa contratante (tenant)
create table public.empresas (
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
  moedas_apoio_mensais  int not null default 0,   -- doação mensal por colaborador
  ativo                 boolean not null default true,
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now()
);

-- Setor / GHE: base do recorte de risco psicossocial da NR-1
create table public.setores (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas(id) on delete cascade,
  nome         text not null,
  centro_custo text,
  ghe          text,          -- Grupo Homogêneo de Exposição
  ativo        boolean not null default true,
  criado_em    timestamptz not null default now(),
  unique (empresa_id, nome)
);