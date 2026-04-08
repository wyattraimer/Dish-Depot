create extension if not exists pgcrypto;
create extension if not exists citext;
set search_path = public, extensions;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'group_role') then
    create type public.group_role as enum ('viewer', 'contributor', 'editor', 'admin');
  end if;
end
$$;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.group_role not null default 'viewer',
  added_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_recipes (
  group_id uuid not null references public.groups(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  added_by uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (group_id, recipe_id)
);

create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  invited_email citext,
  invited_user_id uuid references auth.users(id) on delete cascade,
  role public.group_role not null default 'viewer',
  token uuid not null default gen_random_uuid() unique,
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  constraint group_invites_target_check check ((invited_email is not null) <> (invited_user_id is not null))
);

create table if not exists public.group_activity_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  activity_type text not null,
  occurred_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id) on delete set null,
  recipe_id uuid,
  recipe_name text,
  created_at timestamptz not null default now(),
  constraint group_activity_events_type_check check (activity_type in ('recipe_added', 'recipe_removed'))
);

create index if not exists idx_group_members_user_group on public.group_members(user_id, group_id);
create index if not exists idx_group_members_group_role on public.group_members(group_id, role);
create index if not exists idx_group_recipes_recipe on public.group_recipes(recipe_id);
create index if not exists idx_group_recipes_group_added on public.group_recipes(group_id, added_at desc);
create index if not exists idx_group_invites_group on public.group_invites(group_id);
create index if not exists idx_group_invites_user on public.group_invites(invited_user_id);
create index if not exists idx_group_invites_email on public.group_invites(invited_email);
create index if not exists idx_group_activity_events_group_occurred on public.group_activity_events(group_id, occurred_at desc);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_recipes enable row level security;
alter table public.group_invites enable row level security;
alter table public.group_activity_events enable row level security;

create or replace function public.current_group_role(target_group_id uuid)
returns public.group_role
language sql
stable
security definer
set search_path = public
as $$
  select gm.role
  from public.group_members gm
  where gm.group_id = target_group_id
    and gm.user_id = auth.uid()
  limit 1
$$;

create or replace function public.has_group_role(target_group_id uuid, minimum_role public.group_role)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  member_role public.group_role;
begin
  member_role := public.current_group_role(target_group_id);

  if member_role is null then
    return false;
  end if;

  if minimum_role = 'viewer' then
    return true;
  end if;

  if minimum_role = 'contributor' then
    return member_role in ('contributor', 'editor', 'admin');
  end if;

  if minimum_role = 'editor' then
    return member_role in ('editor', 'admin');
  end if;

  if minimum_role = 'admin' then
    return member_role = 'admin';
  end if;

  return false;
end;
$$;

create or replace function public.log_group_recipe_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipe_title text;
  actor_id uuid;
begin
  if tg_op = 'INSERT' then
    select r.name into recipe_title
    from public.recipes r
    where r.id = new.recipe_id;

    insert into public.group_activity_events (
      group_id,
      activity_type,
      occurred_at,
      actor_user_id,
      recipe_id,
      recipe_name
    )
    values (
      new.group_id,
      'recipe_added',
      coalesce(new.added_at, now()),
      new.added_by,
      new.recipe_id,
      recipe_title
    );

    return new;
  end if;

  if tg_op = 'DELETE' then
    select r.name into recipe_title
    from public.recipes r
    where r.id = old.recipe_id;

    actor_id := coalesce(auth.uid(), old.added_by);

    insert into public.group_activity_events (
      group_id,
      activity_type,
      occurred_at,
      actor_user_id,
      recipe_id,
      recipe_name
    )
    values (
      old.group_id,
      'recipe_removed',
      now(),
      actor_id,
      old.recipe_id,
      coalesce(recipe_title, old.recipe_id::text)
    );

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists group_recipe_activity_insert on public.group_recipes;
create trigger group_recipe_activity_insert
after insert on public.group_recipes
for each row
execute function public.log_group_recipe_activity();

drop trigger if exists group_recipe_activity_delete on public.group_recipes;
create trigger group_recipe_activity_delete
after delete on public.group_recipes
for each row
execute function public.log_group_recipe_activity();

insert into public.group_activity_events (
  group_id,
  activity_type,
  occurred_at,
  actor_user_id,
  recipe_id,
  recipe_name
)
select gr.group_id,
       'recipe_added',
       gr.added_at,
       gr.added_by,
       gr.recipe_id,
       r.name
from public.group_recipes gr
join public.recipes r
  on r.id = gr.recipe_id
where not exists (
  select 1
  from public.group_activity_events gae
  where gae.group_id = gr.group_id
    and gae.activity_type = 'recipe_added'
    and gae.recipe_id = gr.recipe_id
);

drop policy if exists groups_select_member on public.groups;
create policy groups_select_member on public.groups
for select
using (public.has_group_role(id, 'viewer') or created_by = auth.uid());

drop policy if exists groups_insert_authenticated on public.groups;
create policy groups_insert_authenticated on public.groups
for insert
with check (auth.uid() = created_by);

drop policy if exists groups_update_admin on public.groups;
create policy groups_update_admin on public.groups
for update
using (public.has_group_role(id, 'admin'))
with check (public.has_group_role(id, 'admin'));

drop policy if exists groups_delete_admin on public.groups;
create policy groups_delete_admin on public.groups
for delete
using (public.has_group_role(id, 'admin'));

drop policy if exists group_members_select_member on public.group_members;
create policy group_members_select_member on public.group_members
for select
using (auth.uid() = group_members.user_id);

drop policy if exists group_members_insert_admin_or_self on public.group_members;
create policy group_members_insert_admin_or_self on public.group_members
for insert
with check (
  auth.uid() is not null
  and (
    public.current_group_role(group_members.group_id) = 'admin'
    or (
      auth.uid() = group_members.user_id
      and group_members.role = 'admin'
      and exists (
        select 1
        from public.groups g
        where g.id = group_members.group_id
          and g.created_by = auth.uid()
      )
    )
    or (
      auth.uid() = group_members.user_id
      and exists (
        select 1
        from public.group_invites gi
        where gi.group_id = group_members.group_id
          and gi.invited_user_id = auth.uid()
          and gi.accepted_at is null
          and gi.expires_at > now()
      )
    )
  )
);

drop policy if exists group_members_update_admin on public.group_members;
create policy group_members_update_admin on public.group_members
for update
using (public.has_group_role(group_members.group_id, 'admin'))
with check (public.has_group_role(group_members.group_id, 'admin'));

drop policy if exists group_members_delete_admin_or_self on public.group_members;
create policy group_members_delete_admin_or_self on public.group_members
for delete
using (
  public.has_group_role(group_members.group_id, 'admin')
  or auth.uid() = group_members.user_id
);

drop policy if exists group_recipes_select_member on public.group_recipes;
create policy group_recipes_select_member on public.group_recipes
for select
using (public.has_group_role(group_id, 'viewer'));

drop policy if exists group_recipes_insert_contributor on public.group_recipes;
create policy group_recipes_insert_contributor on public.group_recipes
for insert
with check (
  public.has_group_role(group_id, 'contributor')
  and auth.uid() = added_by
);

drop policy if exists group_recipes_delete_editor on public.group_recipes;
create policy group_recipes_delete_editor on public.group_recipes
for delete
using (public.has_group_role(group_id, 'editor') or added_by = auth.uid());

drop policy if exists group_invites_select_admin on public.group_invites;
create policy group_invites_select_admin on public.group_invites
for select
using (public.has_group_role(group_id, 'admin'));

drop policy if exists group_invites_select_recipient on public.group_invites;
create policy group_invites_select_recipient on public.group_invites
for select
using (
  invited_user_id = auth.uid()
  and accepted_at is null
);

drop policy if exists group_invites_insert_admin on public.group_invites;
create policy group_invites_insert_admin on public.group_invites
for insert
with check (
  public.has_group_role(group_id, 'admin')
  and auth.uid() = invited_by
);

drop policy if exists group_invites_update_admin on public.group_invites;
create policy group_invites_update_admin on public.group_invites
for update
using (public.has_group_role(group_id, 'admin'))
with check (public.has_group_role(group_id, 'admin'));

drop policy if exists group_invites_delete_admin on public.group_invites;
create policy group_invites_delete_admin on public.group_invites
for delete
using (public.has_group_role(group_id, 'admin'));

drop policy if exists group_invites_delete_recipient on public.group_invites;
create policy group_invites_delete_recipient on public.group_invites
for delete
using (
  invited_user_id = auth.uid()
  and accepted_at is null
);

create or replace function public.prevent_last_group_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_other_admin boolean;
  group_exists boolean;
begin
  if tg_op = 'UPDATE' and old.role = 'admin' and new.role = 'admin' then
    return new;
  end if;

  if tg_op = 'DELETE' and old.role <> 'admin' then
    return old;
  end if;

  if tg_op = 'UPDATE' and old.role <> 'admin' then
    return new;
  end if;

  select exists(select 1 from public.groups g where g.id = old.group_id) into group_exists;
  if not group_exists then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  select exists(
    select 1
    from public.group_members gm
    where gm.group_id = old.group_id
      and gm.user_id <> old.user_id
      and gm.role = 'admin'
  )
  into has_other_admin;

  if not has_other_admin then
    raise exception 'Each group must keep at least one admin.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end
$$;

drop trigger if exists tr_prevent_last_group_admin_change on public.group_members;
create trigger tr_prevent_last_group_admin_change
before update of role or delete on public.group_members
for each row
execute function public.prevent_last_group_admin_change();

create or replace function public.accept_group_invite(invite_token uuid)
returns table (
  group_id uuid,
  group_name text,
  role public.group_role
)
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.group_invites%rowtype;
  user_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select u.email into user_email
  from auth.users u
  where u.id = auth.uid();

  select gi.*
  into invite_row
  from public.group_invites gi
  where gi.token = invite_token
    and gi.accepted_at is null
    and gi.expires_at > now()
    and (
      gi.invited_user_id = auth.uid()
      or (gi.invited_email is not null and lower(gi.invited_email::text) = lower(coalesce(user_email, '')))
    )
  limit 1;

  if invite_row.id is null then
    raise exception 'Invite is invalid, expired, or already used.';
  end if;

  insert into public.group_members (group_id, user_id, role, added_by)
  values (invite_row.group_id, auth.uid(), invite_row.role, invite_row.invited_by)
  on conflict (group_id, user_id)
  do nothing;

  update public.group_invites
  set accepted_at = now()
  where id = invite_row.id;

  return query
  select g.id, g.name, invite_row.role
  from public.groups g
  where g.id = invite_row.group_id;
end
$$;

create or replace function public.search_profiles_for_sharing(query_text text, limit_count integer default 8)
returns table (
  id uuid,
  username text,
  display_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id,
         p.username,
         p.display_name
  from public.profiles p
  where p.id <> auth.uid()
    and (
      lower(coalesce(p.username, '')) like lower(query_text) || '%'
      or lower(coalesce(p.display_name, '')) like '%' || lower(query_text) || '%'
    )
  order by lower(coalesce(p.username, p.display_name, '')) asc
  limit greatest(coalesce(limit_count, 8), 1)
$$;

create or replace function public.get_profile_summaries(target_user_ids uuid[])
returns table (
  id uuid,
  username text,
  display_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id,
         p.username,
         p.display_name
  from public.profiles p
  where p.id = any(coalesce(target_user_ids, '{}'::uuid[]))
$$;

create or replace function public.get_group_member_profiles(target_group_id uuid)
returns table (
  user_id uuid,
  role public.group_role,
  joined_at timestamptz,
  added_by uuid,
  username text,
  display_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select gm.user_id,
         gm.role,
         gm.joined_at,
         gm.added_by,
         p.username,
         p.display_name
  from public.group_members gm
  left join public.profiles p
    on p.id = gm.user_id
  where gm.group_id = target_group_id
    and public.has_group_role(target_group_id, 'viewer')
$$;

create or replace function public.get_group_activity(target_group_id uuid, limit_count integer default 20)
returns table (
  activity_type text,
  occurred_at timestamptz,
  actor_user_id uuid,
  actor_username text,
  actor_display_name text,
  subject_user_id uuid,
  subject_username text,
  subject_display_name text,
  recipe_id uuid,
  recipe_name text,
  role public.group_role
)
language sql
stable
security definer
set search_path = public
as $$
  with activity as (
    select
      'recipe_added'::text as activity_type,
      gae.occurred_at as occurred_at,
      gae.actor_user_id as actor_user_id,
      ap.username as actor_username,
      ap.display_name as actor_display_name,
      null::uuid as subject_user_id,
      null::text as subject_username,
      null::text as subject_display_name,
      gae.recipe_id as recipe_id,
      coalesce(gae.recipe_name, r.name) as recipe_name,
      null::public.group_role as role
    from public.group_activity_events gae
    left join public.recipes r
      on r.id = gae.recipe_id
    left join public.profiles ap
      on ap.id = gae.actor_user_id
    where gae.group_id = target_group_id
      and gae.activity_type = 'recipe_added'

    union all

    select
      'recipe_removed'::text as activity_type,
      gae.occurred_at as occurred_at,
      gae.actor_user_id as actor_user_id,
      ap.username as actor_username,
      ap.display_name as actor_display_name,
      null::uuid as subject_user_id,
      null::text as subject_username,
      null::text as subject_display_name,
      gae.recipe_id as recipe_id,
      gae.recipe_name as recipe_name,
      null::public.group_role as role
    from public.group_activity_events gae
    left join public.profiles ap
      on ap.id = gae.actor_user_id
    where gae.group_id = target_group_id
      and gae.activity_type = 'recipe_removed'

    union all

    select
      'member_joined'::text as activity_type,
      gm.joined_at as occurred_at,
      gm.added_by as actor_user_id,
      ap.username as actor_username,
      ap.display_name as actor_display_name,
      gm.user_id as subject_user_id,
      sp.username as subject_username,
      sp.display_name as subject_display_name,
      null::uuid as recipe_id,
      null::text as recipe_name,
      gm.role as role
    from public.group_members gm
    left join public.profiles ap
      on ap.id = gm.added_by
    left join public.profiles sp
      on sp.id = gm.user_id
    where gm.group_id = target_group_id

    union all

    select
      'invite_sent'::text as activity_type,
      gi.created_at as occurred_at,
      gi.invited_by as actor_user_id,
      ap.username as actor_username,
      ap.display_name as actor_display_name,
      gi.invited_user_id as subject_user_id,
      sp.username as subject_username,
      sp.display_name as subject_display_name,
      null::uuid as recipe_id,
      null::text as recipe_name,
      gi.role as role
    from public.group_invites gi
    left join public.profiles ap
      on ap.id = gi.invited_by
    left join public.profiles sp
      on sp.id = gi.invited_user_id
    where gi.group_id = target_group_id

    union all

    select
      'invite_accepted'::text as activity_type,
      gi.accepted_at as occurred_at,
      gi.invited_by as actor_user_id,
      ap.username as actor_username,
      ap.display_name as actor_display_name,
      gi.invited_user_id as subject_user_id,
      sp.username as subject_username,
      sp.display_name as subject_display_name,
      null::uuid as recipe_id,
      null::text as recipe_name,
      gi.role as role
    from public.group_invites gi
    left join public.profiles ap
      on ap.id = gi.invited_by
    left join public.profiles sp
      on sp.id = gi.invited_user_id
    where gi.group_id = target_group_id
      and gi.accepted_at is not null
  )
  select a.activity_type,
         a.occurred_at,
         a.actor_user_id,
         a.actor_username,
         a.actor_display_name,
         a.subject_user_id,
         a.subject_username,
         a.subject_display_name,
         a.recipe_id,
         a.recipe_name,
         a.role
  from activity a
  where public.has_group_role(target_group_id, 'viewer')
    and a.occurred_at is not null
  order by a.occurred_at desc
  limit greatest(coalesce(limit_count, 20), 1)
$$;

create or replace function public.get_pending_group_invites()
returns table (
  id uuid,
  group_id uuid,
  group_name text,
  role public.group_role,
  token uuid,
  invited_by uuid,
  inviter_username text,
  inviter_display_name text,
  created_at timestamptz,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select gi.id,
         gi.group_id,
         g.name,
         gi.role,
         gi.token,
         gi.invited_by,
         ip.username,
         ip.display_name,
         gi.created_at,
         gi.expires_at
  from public.group_invites gi
  join public.groups g
    on g.id = gi.group_id
  left join public.profiles ip
    on ip.id = gi.invited_by
  where gi.invited_user_id = auth.uid()
    and gi.accepted_at is null
    and gi.expires_at > now()
  order by gi.created_at desc
$$;

create or replace function public.get_group_pending_invites(target_group_id uuid)
returns table (
  id uuid,
  invited_user_id uuid,
  role public.group_role,
  token uuid,
  created_at timestamptz,
  expires_at timestamptz,
  invited_username text,
  invited_display_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select gi.id,
         gi.invited_user_id,
         gi.role,
         gi.token,
         gi.created_at,
         gi.expires_at,
         p.username,
         p.display_name
  from public.group_invites gi
  left join public.profiles p
    on p.id = gi.invited_user_id
  where gi.group_id = target_group_id
    and gi.accepted_at is null
    and public.has_group_role(target_group_id, 'admin')
  order by gi.created_at desc
$$;

create or replace function public.get_my_group_memberships()
returns table (
  group_id uuid,
  role public.group_role
)
language sql
stable
security definer
set search_path = public
as $$
  select gm.group_id,
         gm.role
  from public.group_members gm
  where gm.user_id = auth.uid()
$$;

create or replace function public.get_group_recipes(target_group_id uuid)
returns table (
  id uuid,
  owner_id uuid,
  name text,
  url text,
  image text,
  notes text,
  ingredients text[],
  directions text[],
  categories text[],
  pinned boolean,
  type text,
  visibility text,
  share_slug text,
  updated_at timestamptz,
  deleted_at timestamptz,
  added_by uuid,
  added_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id,
         r.owner_id,
         r.name,
         r.url,
         r.image,
         r.notes,
         r.ingredients,
         r.directions,
         r.categories,
         r.pinned,
         r.type,
         r.visibility,
         r.share_slug,
         r.updated_at,
         r.deleted_at,
         gr.added_by,
         gr.added_at
  from public.group_recipes gr
  join public.recipes r
    on r.id = gr.recipe_id
  where gr.group_id = target_group_id
    and r.deleted_at is null
    and public.has_group_role(target_group_id, 'viewer')
  order by gr.added_at desc, r.updated_at desc
$$;

create or replace function public.remove_group_member(target_group_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if auth.uid() <> target_user_id and not public.has_group_role(target_group_id, 'admin') then
    raise exception 'Only group admins can remove other members.';
  end if;

  delete from public.group_members gm
  where gm.group_id = target_group_id
    and gm.user_id = target_user_id;

  if not found then
    raise exception 'Group member not found.';
  end if;
end;
$$;

grant execute on function public.accept_group_invite(uuid) to authenticated;
grant execute on function public.search_profiles_for_sharing(text, integer) to authenticated;
grant execute on function public.get_profile_summaries(uuid[]) to authenticated;
grant execute on function public.get_group_member_profiles(uuid) to authenticated;
grant execute on function public.get_group_activity(uuid, integer) to authenticated;
grant execute on function public.get_pending_group_invites() to authenticated;
grant execute on function public.get_group_pending_invites(uuid) to authenticated;
grant execute on function public.get_my_group_memberships() to authenticated;
grant execute on function public.get_group_recipes(uuid) to authenticated;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;
