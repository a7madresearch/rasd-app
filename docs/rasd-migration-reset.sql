-- ============================================================
-- رصد — Reset script: drops everything the migration creates,
-- so rasd-supabase-migration.sql can be run cleanly from scratch.
-- Safe on a fresh project (no real data yet).
-- ============================================================

drop policy if exists "authenticated users upload site photos" on storage.objects;
drop policy if exists "authenticated users view site photos" on storage.objects;
delete from storage.buckets where id = 'site-notes-photos';

drop table if exists public.notifications cascade;
drop table if exists public.status_history cascade;
drop table if exists public.consultations cascade;
drop table if exists public.notes cascade;
drop table if exists public.consultant_visits cascade;
drop table if exists public.contractor_updates cascade;
drop table if exists public.projects cascade;
drop table if exists public.profiles cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_project_member(uuid);

drop type if exists notification_type;
drop type if exists entity_type_enum;
drop type if exists consultation_status;
drop type if exists note_status;
drop type if exists priority_level;
drop type if exists project_status;
drop type if exists user_role;
