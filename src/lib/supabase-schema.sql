-- Run in Supabase SQL editor

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  username_lower text not null unique,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_key text,
  prompt text not null,
  style_id text,
  style_label text,
  size text,
  quality text,
  provider text,
  model text,
  tag_keys jsonb,
  favorite boolean not null default false
);

alter table public.images enable row level security;

create policy "images_select_own"
on public.images
for select
to authenticated
using (auth.uid() = user_id);

create policy "images_insert_own"
on public.images
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "images_update_own"
on public.images
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "images_delete_own"
on public.images
for delete
to authenticated
using (auth.uid() = user_id);
