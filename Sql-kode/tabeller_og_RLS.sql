-- Tabell for brukerprofiler (knyttet til auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'user',  -- standardrolle er "user"
  created_at timestamptz default now()
);

-- Gi Supabase Data API tilgang til tabellen
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.profiles to service_role;

-- Slå på RLS (rad-nivå-sikkerhet)
alter table profiles enable row level security;

-- Hjelpefunksjon: sjekk om innlogget bruker er admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Policy: Bruker kan bare lese sin egen profil
drop policy if exists "read-own-profile" on profiles;
create policy "read-own-profile"
on profiles for select using (id = auth.uid());

-- Policy: Admin kan lese alle profiler
drop policy if exists "admin-read-all-profiles" on profiles;
create policy "admin-read-all-profiles"
on profiles for select using (public.is_admin());

-- Trigger: opprett profil og gi admin-rolle til DIN e-post
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    case when lower(new.email) = lower('joachim.rl08@gmail.com') then 'admin' else 'user' end
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();