-- ==============================================================================
-- BLOCO 7: SUÍTE COMPLETA DE POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

-- 1. FUNÇÕES AUXILIARES DE IDENTIDADE E PERMISSÃO
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

-- 2. HABILITAÇÃO DE RLS EM TODAS AS TABELAS OPERACIONAIS
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

-- 3. POLÍTICAS MULTI-TENANT E ISOLAMENTO
-- Empresas & Setores
create policy empresas_select on public.empresas for select
  using (id = public.fn_empresa_atual() or public.fn_eh_admin_plataforma());

create policy empresas_update on public.empresas for update
  using ((id = public.fn_empresa_atual() and public.fn_eh_rh()) or public.fn_eh_admin_plataforma());

create policy setores_all on public.setores for all
  using (empresa_id = public.fn_empresa_atual() or public.fn_eh_admin_plataforma())
  with check (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh());

-- Usuários e Convites
create policy usuarios_self on public.usuarios for select
  using (id = auth.uid());

create policy usuarios_empresa on public.usuarios for select
  using (empresa_id = public.fn_empresa_atual());

create policy usuarios_update_self on public.usuarios for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy usuarios_rh_manage on public.usuarios for all
  using (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh())
  with check (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh());

create policy convites_rh on public.convites for all
  using (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh())
  with check (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh());

-- Termos
create policy termos_public on public.termos for select to authenticated using (ativo = true);
create policy aceites_self on public.aceites_termo for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Passos e Gamificação
create policy passos_self_write on public.registros_passos for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy passos_empresa_select on public.registros_passos for select
  using (empresa_id = public.fn_empresa_atual());

create policy regras_select on public.regras_pontuacao for select
  using (empresa_id = public.fn_empresa_atual());

create policy regras_rh_write on public.regras_pontuacao for all
  using (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh())
  with check (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh());

-- Carteiras e Transações: LEITURA para dono e RH; inserção apenas via RPCs
create policy carteiras_self on public.carteiras for select using (usuario_id = auth.uid());
create policy transacoes_self on public.transacoes_moedas for select using (usuario_id = auth.uid());
create policy transacoes_rh on public.transacoes_moedas for select
  using (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh());

-- Desafios e Conquistas
create policy desafios_empresa on public.desafios for select using (empresa_id = public.fn_empresa_atual());
create policy desafios_rh_write on public.desafios for all
  using (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh())
  with check (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh());

create policy participacoes_self on public.participacoes_desafio for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy conquistas_public on public.conquistas for select to authenticated using (ativo = true);
create policy conquistas_usuario_self on public.conquistas_usuario for select using (usuario_id = auth.uid());

-- Meditação
create policy meditacoes_public on public.meditacoes for select to authenticated using (publicado = true);
create policy sessoes_med_self on public.sessoes_meditacao for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Instrumentos e Ciclos
create policy instrumentos_public on public.instrumentos for select to authenticated using (ativo = true);
create policy dimensoes_public on public.instrumento_dimensoes for select to authenticated using (true);
create policy questoes_public on public.instrumento_questoes for select to authenticated using (true);
create policy opcoes_public on public.instrumento_opcoes for select to authenticated using (true);

create policy ciclos_empresa on public.ciclos_psicossociais for select using (empresa_id = public.fn_empresa_atual());
create policy ciclos_rh on public.ciclos_psicossociais for all
  using (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh())
  with check (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh());

-- AVALIAÇÃO PSICOSSOCIAL / BURNOUT: BLINDAGEM TOTAL (ZERO VISIBILIDADE PARA RH)
create policy avaliacoes_self on public.avaliacoes for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy respostas_self on public.respostas_avaliacao for all
  using (exists (select 1 from public.avaliacoes a where a.id = respostas_avaliacao.avaliacao_id and a.usuario_id = auth.uid()))
  with check (exists (select 1 from public.avaliacoes a where a.id = respostas_avaliacao.avaliacao_id and a.usuario_id = auth.uid()));

-- Apoio Clínico e Agendamentos
create policy psicologos_public on public.psicologos for select to authenticated using (ativo = true);

create policy agenda_colaborador on public.agendamentos for select using (usuario_id = auth.uid());
create policy agenda_psicologo on public.agendamentos for select
  using (exists (select 1 from public.psicologos p where p.id = agendamentos.psicologo_id and p.usuario_id = auth.uid()));
create policy agenda_rh_operacional on public.agendamentos for select
  using (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh());

-- Prontuários: Acesso restrito a Psicólogo e Colaborador (RH NUNCA ACESSA)
create policy prontuarios_acesso on public.prontuarios_agendamentos for all
  using (
    usuario_id = auth.uid() or
    exists (select 1 from public.psicologos p where p.id = prontuarios_agendamentos.psicologo_id and p.usuario_id = auth.uid())
  )
  with check (
    exists (select 1 from public.psicologos p where p.id = prontuarios_agendamentos.psicologo_id and p.usuario_id = auth.uid())
  );

-- Benefícios e Resgates
create policy beneficios_select on public.beneficios for select to authenticated
  using ((empresa_id is null or empresa_id = public.fn_empresa_atual()) and ativo = true);

create policy beneficios_rh_write on public.beneficios for all
  using (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh())
  with check (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh());

create policy resgates_self on public.resgates for select using (usuario_id = auth.uid());
create policy resgates_rh on public.resgates for all
  using (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh())
  with check (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh());

-- Relatórios NR-1 Agregados (RH consome apenas aqui com k >= 5)
create policy nr1_rh on public.relatorios_nr1 for select
  using (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh());

-- Notificações e Auditoria
create policy notificacoes_self on public.notificacoes for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy logs_auditoria_admin on public.logs_auditoria for select
  using (public.fn_eh_admin_plataforma() or (empresa_id = public.fn_empresa_atual() and public.fn_eh_rh()));

-- 4. RESTRIÇÃO DE PERMISSÕES POSTGREST (LEAST PRIVILEGE)
revoke insert, update, delete on public.carteiras from anon, authenticated;
grant select on public.carteiras to authenticated;

revoke insert, update, delete on public.transacoes_moedas from anon, authenticated;
grant select on public.transacoes_moedas to authenticated;