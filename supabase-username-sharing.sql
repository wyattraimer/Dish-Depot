alter table public.profiles
  add column if not exists username text;

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null and username <> '';

alter table public.profiles
  add constraint profiles_username_length_check
  check (username is null or char_length(trim(username)) >= 3);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    nullif(lower(trim(new.raw_user_meta_data->>'username')), '')
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        username = coalesce(excluded.username, public.profiles.username),
        updated_at = now();

  return new;
end;
$$;

create or replace function public.search_profiles_for_sharing(query_text text, limit_count int default 8)
returns table (
  id uuid,
  username text,
  display_name text
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.display_name
  from public.profiles p
  where p.id <> auth.uid()
    and (
      coalesce(lower(p.username), '') like lower(trim(query_text)) || '%'
      or coalesce(lower(p.display_name), '') like '%' || lower(trim(query_text)) || '%'
    )
  order by
    case
      when coalesce(lower(p.username), '') = lower(trim(query_text)) then 0
      when coalesce(lower(p.username), '') like lower(trim(query_text)) || '%' then 1
      else 2
    end,
    p.username nulls last,
    p.display_name nulls last
  limit greatest(1, least(limit_count, 25));
$$;

grant execute on function public.search_profiles_for_sharing(text, int) to authenticated;
