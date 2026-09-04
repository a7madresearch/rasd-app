-- ============================================================
-- منصة رصد — Database Migration for Supabase (PostgreSQL)
-- يطبّق مباشرة نموذج البيانات الموثّق في rasd-database-schema.md
-- ينفَّذ عبر: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ================= ENUM TYPES =================
create type user_role as enum ('owner', 'contractor', 'consultant');
create type project_status as enum ('active', 'completed', 'on_hold');
create type priority_level as enum ('urgent', 'normal');
create type note_status as enum ('open', 'pending_review', 'closed', 'rejected');
create type consultation_status as enum ('submitted', 'answered', 'converted');
create type entity_type_enum as enum ('note', 'consultation');
create type notification_type as enum (
  'note_assigned', 'note_pending_review', 'note_closed', 'note_rejected',
  'consultation_submitted', 'consultation_answered', 'consultation_converted'
);

-- ================= PROFILES (تمتد من auth.users المدمج في Supabase) =================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name varchar(120) not null,
  role user_role not null,
  phone varchar(20),
  created_at timestamptz not null default now()
);

-- إنشاء صف profile تلقائياً عند تسجيل أي مستخدم جديد
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'مستخدم جديد'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'owner')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================= PROJECTS =================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null,
  location varchar(200),
  owner_id uuid not null references public.profiles(id),
  contractor_id uuid not null references public.profiles(id),
  consultant_id uuid not null references public.profiles(id),
  start_date date,
  end_date date,
  contract_value numeric(14,2),
  status project_status not null default 'active',
  created_at timestamptz not null default now()
);

create index idx_projects_owner on public.projects(owner_id);
create index idx_projects_contractor on public.projects(contractor_id);
create index idx_projects_consultant on public.projects(consultant_id);

-- ================= CONTRACTOR UPDATES =================
create table public.contractor_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  contractor_id uuid not null references public.profiles(id),
  phase varchar(150),
  completion_pct numeric(5,2),
  obstacles text,
  requirements text,
  created_at timestamptz not null default now()
);

create index idx_contractor_updates_project on public.contractor_updates(project_id, created_at desc);

-- ================= CONSULTANT VISITS =================
create table public.consultant_visits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  consultant_id uuid not null references public.profiles(id),
  visit_date date not null default current_date,
  verified_pct numeric(5,2),
  technical_notes text,
  created_at timestamptz not null default now()
);

create index idx_consultant_visits_project on public.consultant_visits(project_id, created_at desc);

-- ================= NOTES (الملاحظات) =================
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  visit_id uuid references public.consultant_visits(id),
  source_consultation_id uuid,
  created_by uuid not null references public.profiles(id),
  assigned_to uuid not null references public.profiles(id),
  priority priority_level not null default 'normal',
  status note_status not null default 'open',
  note_text text not null,
  photo_url varchar(500),
  closed_by uuid references public.profiles(id),
  closed_at timestamptz,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notes_project_status on public.notes(project_id, status);
create index idx_notes_assigned on public.notes(assigned_to, status);

-- ================= CONSULTATIONS (الاستشارات / RFI) =================
create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  raised_by uuid not null references public.profiles(id),
  priority priority_level not null default 'normal',
  status consultation_status not null default 'submitted',
  question_text text not null,
  answer_text text,
  answered_by uuid references public.profiles(id),
  converted_note_id uuid references public.notes(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_consultations_project_status on public.consultations(project_id, status);

alter table public.notes
  add constraint fk_notes_source_consultation
  foreign key (source_consultation_id) references public.consultations(id);

-- ================= STATUS HISTORY (سجل تدقيق عام) =================
create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  entity_type entity_type_enum not null,
  entity_id uuid not null,
  old_status varchar(30),
  new_status varchar(30) not null,
  changed_by uuid not null references public.profiles(id),
  comment text,
  created_at timestamptz not null default now()
);

create index idx_status_history_entity on public.status_history(entity_type, entity_id);

-- ================= NOTIFICATIONS =================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  project_id uuid references public.projects(id),
  type notification_type not null,
  related_entity_type varchar(30),
  related_entity_id uuid,
  message varchar(300),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id, is_read);

-- ============================================================
-- Row Level Security (RLS) — طبقة الصلاحيات
-- القاعدة الذهبية: المستخدم ما يشوف/يعدّل إلا بيانات مشاريعه فقط
-- ============================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.contractor_updates enable row level security;
alter table public.consultant_visits enable row level security;
alter table public.notes enable row level security;
alter table public.consultations enable row level security;
alter table public.status_history enable row level security;
alter table public.notifications enable row level security;

-- دالة مساعدة: هل المستخدم الحالي طرف بهذا المشروع؟ (تُستخدم بكل الجداول الفرعية)
create function public.is_project_member(pid uuid)
returns boolean as $$
  select exists (
    select 1 from public.projects
    where id = pid
    and auth.uid() in (owner_id, contractor_id, consultant_id)
  );
$$ language sql security definer stable;

-- profiles
create policy "profiles readable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- projects
create policy "members view their project"
  on public.projects for select
  using (auth.uid() in (owner_id, contractor_id, consultant_id));

create policy "owner creates project"
  on public.projects for insert
  with check (auth.uid() = owner_id);

create policy "members update their project"
  on public.projects for update
  using (auth.uid() in (owner_id, contractor_id, consultant_id));

-- contractor_updates
create policy "members view contractor updates"
  on public.contractor_updates for select
  using (public.is_project_member(project_id));

create policy "contractor inserts own updates"
  on public.contractor_updates for insert
  with check (auth.uid() = contractor_id and public.is_project_member(project_id));

-- consultant_visits
create policy "members view visits"
  on public.consultant_visits for select
  using (public.is_project_member(project_id));

create policy "consultant inserts own visits"
  on public.consultant_visits for insert
  with check (auth.uid() = consultant_id and public.is_project_member(project_id));

-- notes
create policy "members view notes"
  on public.notes for select
  using (public.is_project_member(project_id));

create policy "consultant creates notes"
  on public.notes for insert
  with check (auth.uid() = created_by and public.is_project_member(project_id));

create policy "assignee or consultant updates note"
  on public.notes for update
  using (
    public.is_project_member(project_id)
    and (auth.uid() = assigned_to or auth.uid() = created_by)
  );

-- consultations
create policy "members view consultations"
  on public.consultations for select
  using (public.is_project_member(project_id));

create policy "owner or contractor raises consultation"
  on public.consultations for insert
  with check (auth.uid() = raised_by and public.is_project_member(project_id));

create policy "consultant answers consultation"
  on public.consultations for update
  using (public.is_project_member(project_id));

-- status_history (سجل للقراءة فقط من العميل — الإدراج عبر server-side فقط)
create policy "status history readable by members"
  on public.status_history for select
  using (auth.role() = 'authenticated');

-- notifications
create policy "users see only own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "users mark own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id);

-- ============================================================
-- Storage bucket لصور ملاحظات الموقع (تُنفَّذ من Storage tab بالواجهة أو هنا)
-- ============================================================
insert into storage.buckets (id, name, public) values ('site-notes-photos', 'site-notes-photos', false)
on conflict (id) do nothing;

create policy "authenticated users upload site photos"
  on storage.objects for insert
  with check (bucket_id = 'site-notes-photos' and auth.role() = 'authenticated');

create policy "authenticated users view site photos"
  on storage.objects for select
  using (bucket_id = 'site-notes-photos' and auth.role() = 'authenticated');
