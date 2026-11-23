-- ==============================================================================
-- BRYSS PORTFOLIO - SUPABASE SETUP SCRIPT
-- ==============================================================================
-- Run this entire script in your Supabase Dashboard:
-- 1. Go to SQL Editor (left sidebar)
-- 2. Click "New query"
-- 3. Paste this script and click "Run" (or Ctrl + Enter)
-- ==============================================================================

create extension if not exists pgcrypto;

-- 1. Create artworks table
create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('murals','sculpture','photography','film')),
  description text default '',
  image_url text not null,
  video_url text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.artworks enable row level security;

-- 2. RLS Policies for artworks table
-- Allow anyone (public) to view published artworks; authenticated users can view all (including drafts)
drop policy if exists "Anyone can view published artworks" on public.artworks;
create policy "Anyone can view published artworks" on public.artworks
  for select using (published = true or auth.role() = 'authenticated');

-- Allow authenticated artist/admin to insert new artworks
drop policy if exists "Artist can add artworks" on public.artworks;
create policy "Artist can add artworks" on public.artworks
  for insert to authenticated with check (true);

-- Allow authenticated artist/admin to update artworks
drop policy if exists "Artist can update artworks" on public.artworks;
create policy "Artist can update artworks" on public.artworks
  for update to authenticated using (true) with check (true);

-- Allow authenticated artist/admin to delete artworks
drop policy if exists "Artist can delete artworks" on public.artworks;
create policy "Artist can delete artworks" on public.artworks
  for delete to authenticated using (true);

-- 3. Create public storage bucket for artwork images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('artwork-images', 'artwork-images', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set 
  public = true, 
  file_size_limit = 10485760, 
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- 4. Storage Policies for artwork-images bucket
-- Allow anyone to view and download images
drop policy if exists "Public can view artwork images" on storage.objects;
create policy "Public can view artwork images" on storage.objects
  for select using (bucket_id = 'artwork-images');

-- Allow authenticated artist to upload images
drop policy if exists "Artist can upload artwork images" on storage.objects;
create policy "Artist can upload artwork images" on storage.objects
  for insert to authenticated with check (bucket_id = 'artwork-images');

-- Allow authenticated artist to update/overwrite images
drop policy if exists "Artist can update artwork images" on storage.objects;
create policy "Artist can update artwork images" on storage.objects
  for update to authenticated using (bucket_id = 'artwork-images') with check (bucket_id = 'artwork-images');

-- Allow authenticated artist to delete images
drop policy if exists "Artist can delete artwork images" on storage.objects;
create policy "Artist can delete artwork images" on storage.objects
  for delete to authenticated using (bucket_id = 'artwork-images');
