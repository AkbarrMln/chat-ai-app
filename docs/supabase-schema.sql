-- Supabase Database Schema for Chat AI App
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (idempotent)

-- =====================================================
-- 1. PROFILES TABLE (linked to auth.users)
-- =====================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

-- Trigger to auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================
-- 2. ROOMS TABLE (chat rooms)
-- =====================================================
create table if not exists public.rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text default 'group' check (type in ('direct', 'group')),
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

-- =====================================================
-- 3. ROOM_MEMBERS TABLE (who is in which room)
-- =====================================================
create table if not exists public.room_members (
  room_id uuid references public.rooms on delete cascade,
  user_id uuid references auth.users on delete cascade,
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);

-- =====================================================
-- 4. MESSAGES TABLE (chat messages)
-- =====================================================
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  is_ai boolean default false,
  created_at timestamptz default now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;

-- =====================================================
-- RLS POLICIES (Drop first, then create)
-- =====================================================

-- Profiles policies
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can update own profile" on profiles;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Rooms policies
drop policy if exists "Users can view rooms they are member of" on rooms;
drop policy if exists "Authenticated users can create rooms" on rooms;

create policy "Users can view rooms they are member of"
  on rooms for select using (
    id in (select room_id from room_members where user_id = auth.uid())
  );

create policy "Authenticated users can create rooms"
  on rooms for insert with check (auth.uid() = created_by);

-- Room Members policies
drop policy if exists "Users can view room members" on room_members;
drop policy if exists "Users can join rooms" on room_members;

create policy "Users can view room members"
  on room_members for select using (
    room_id in (select room_id from room_members where user_id = auth.uid())
  );

create policy "Users can join rooms"
  on room_members for insert with check (auth.uid() = user_id);

-- Messages policies
drop policy if exists "Users can read messages in their rooms" on messages;
drop policy if exists "Users can send messages to their rooms" on messages;

create policy "Users can read messages in their rooms"
  on messages for select using (
    room_id in (select room_id from room_members where user_id = auth.uid())
  );

create policy "Users can send messages to their rooms"
  on messages for insert with check (
    auth.uid() = user_id and
    room_id in (select room_id from room_members where user_id = auth.uid())
  );

-- =====================================================
-- ENABLE REALTIME (safe to run multiple times)
-- =====================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;

-- =====================================================
-- HELPER: Create a room and add creator as member
-- =====================================================
create or replace function create_room_with_member(
  room_name text,
  room_type text default 'group'
)
returns uuid as $$
declare
  new_room_id uuid;
begin
  -- Create the room
  insert into rooms (name, type, created_by)
  values (room_name, room_type, auth.uid())
  returning id into new_room_id;
  
  -- Add creator as member
  insert into room_members (room_id, user_id)
  values (new_room_id, auth.uid());
  
  return new_room_id;
end;
$$ language plpgsql security definer;

-- Done! ✅
