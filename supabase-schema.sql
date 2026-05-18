create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin', 'master'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'name', '와인러'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.wine_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wine_name text not null,
  image_url text,
  story text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.meetups (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  place text not null,
  starts_at timestamptz not null,
  capacity integer not null check (capacity > 0),
  deposit_amount integer not null default 0,
  bank_account text not null,
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.meetup_applications (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (meetup_id, user_id)
);

create table if not exists public.admin_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.wine_posts enable row level security;
alter table public.meetups enable row level security;
alter table public.meetup_applications enable row level security;
alter table public.admin_requests enable row level security;

create policy "Profiles are readable" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Wine posts are readable" on public.wine_posts
  for select using (true);

create policy "Users can create own wine posts" on public.wine_posts
  for insert with check (auth.uid() = user_id);

create policy "Meetups are readable" on public.meetups
  for select using (true);

create policy "Admins can create meetups" on public.meetups
  for insert with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'master')
    )
  );

create policy "Users can create own meetup applications" on public.meetup_applications
  for insert with check (auth.uid() = user_id);

create policy "Users can read own applications and admins can read all" on public.meetup_applications
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'master')
    )
  );

create policy "Admins can confirm applications" on public.meetup_applications
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'master')
    )
  );

create policy "Users can request admin" on public.admin_requests
  for insert with check (auth.uid() = user_id);

create policy "Users can read own admin requests and admins can read all" on public.admin_requests
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins can review admin requests" on public.admin_requests;
drop policy if exists "Masters can review admin requests" on public.admin_requests;

create policy "Masters can review admin requests" on public.admin_requests
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'master'
    )
  );

insert into storage.buckets (id, name, public)
values ('wine-photos', 'wine-photos', true)
on conflict (id) do nothing;

create policy "Wine photos are publicly readable" on storage.objects
  for select using (bucket_id = 'wine-photos');

create policy "Authenticated users can upload wine photos" on storage.objects
  for insert with check (
    bucket_id = 'wine-photos'
    and auth.role() = 'authenticated'
  );
