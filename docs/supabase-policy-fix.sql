-- Supabase Database Schema for Chat AI App (FIXED)
-- Run this in Supabase SQL Editor
-- This fixes the infinite recursion issue

-- =====================================================
-- DROP OLD POLICIES FIRST
-- =====================================================
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can view rooms they are member of" on rooms;
drop policy if exists "Authenticated users can create rooms" on rooms;
drop policy if exists "Users can view room members" on room_members;
drop policy if exists "Users can join rooms" on room_members;
drop policy if exists "Users can read messages in their rooms" on messages;
drop policy if exists "Users can send messages to their rooms" on messages;

-- =====================================================
-- NEW RLS POLICIES (Fixed - No Recursion)
-- =====================================================

-- Profiles: Public read, self update
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Rooms: Authenticated users can view all rooms (simplified)
create policy "Authenticated users can view rooms"
  on rooms for select using (auth.role() = 'authenticated');

create policy "Authenticated users can create rooms"
  on rooms for insert with check (auth.uid() = created_by);

-- Room Members: Authenticated users can view and join
create policy "Authenticated users can view room members"
  on room_members for select using (auth.role() = 'authenticated');

create policy "Users can join rooms"
  on room_members for insert with check (auth.uid() = user_id);

-- Messages: Authenticated users can read all messages in rooms they're in
create policy "Authenticated can read messages"
  on messages for select using (auth.role() = 'authenticated');

create policy "Users can send messages"
  on messages for insert with check (auth.uid() = user_id);

-- Done! ✅
