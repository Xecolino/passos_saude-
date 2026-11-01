-- ==============================================================================
-- VIEWS DE CONSUMO DO APLICATIVO E PAINEL RH
-- ==============================================================================

-- Ranking mensal (app lê daqui para a tabela de líderes da empresa)
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

-- Visão operacional do RH: dados de agendamento 100% livres de conteúdo clínico
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