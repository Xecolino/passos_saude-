-- ==============================================================================
-- TRIGGER DE PROVISIONAMENTO DE USUÁRIOS E LIQUIDAÇÃO DE CONVITES
-- ==============================================================================

create or replace function public.fn_novo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_convite public.convites%rowtype;
  v_nome text;
begin
  v_nome := coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1));

  -- 1. Verifica se existe convite válido e pendente para o e-mail cadastrado
  select * into v_convite
  from public.convites
  where lower(email) = lower(new.email)
    and situacao in ('pendente', 'enviado')
    and expira_em > now()
  order by criado_em desc
  limit 1;

  if found then
    -- Usuário entra vinculado à empresa, setor e papel configurados pelo RH
    insert into public.usuarios (
      id, empresa_id, setor_id, papel, situacao, nome, email, cpf, matricula, cargo, criado_em, atualizado_em
    ) values (
      new.id,
      v_convite.empresa_id,
      v_convite.setor_id,
      v_convite.papel,
      'ativo',
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
      situacao      = 'ativo',
      atualizado_em = now();

    -- Marca o convite como aceito
    update public.convites
       set situacao   = 'aceito',
           aceito_em  = now(),
           usuario_id = new.id
     where id = v_convite.id;

  else
    -- Cadastro autônomo sem convite prévio
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