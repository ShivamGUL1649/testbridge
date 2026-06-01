-- TestBridge / Online Examination System
-- Supabase Schema

create extension if not exists "pgcrypto";

-- =========================
-- ENUM TYPES
-- =========================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('STUDENT', 'TUTOR', 'ADMIN');
  end if;

  if not exists (select 1 from pg_type where typname = 'exam_status') then
    create type exam_status as enum (
      'DRAFT',
      'PENDING_APPROVAL',
      'APPROVED',
      'REJECTED'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'option_key') then
    create type option_key as enum ('A', 'B', 'C', 'D');
  end if;
end $$;

-- =========================
-- PROFILES
-- =========================

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role user_role not null default 'STUDENT',
  created_at timestamptz not null default now()
);

-- =========================
-- EXAMS
-- =========================

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  total_time_minutes integer not null check (total_time_minutes > 0),
  passing_marks integer not null check (passing_marks >= 0),
  status exam_status not null default 'DRAFT',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- =========================
-- EXAM QUESTIONS
-- =========================

create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option option_key not null,
  explanation text,
  marks integer not null default 1 check (marks > 0),
  question_order integer not null default 1,
  created_at timestamptz not null default now()
);

-- =========================
-- EXAM ATTEMPTS
-- =========================

create table if not exists public.exam_attempts (
  id uuid primary key,
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null,
  submitted_at timestamptz,
  expires_at timestamptz not null,
  score integer not null default 0,
  total_marks integer not null default 0,
  passed boolean not null default false,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================
-- INDEXES
-- =========================

create index if not exists idx_profiles_auth_user_id
on public.profiles(auth_user_id);

create index if not exists idx_exams_created_by
on public.exams(created_by);

create index if not exists idx_exams_status
on public.exams(status);

create index if not exists idx_exam_questions_exam_id
on public.exam_questions(exam_id);

create index if not exists idx_exam_attempts_exam_id
on public.exam_attempts(exam_id);

create index if not exists idx_exam_attempts_student_id
on public.exam_attempts(student_id);

-- =========================
-- ROW LEVEL SECURITY
-- =========================

alter table public.profiles enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_attempts enable row level security;

-- =========================
-- DROP OLD POLICIES
-- =========================

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

drop policy if exists "exams_select_policy" on public.exams;
drop policy if exists "exams_insert_tutor" on public.exams;
drop policy if exists "exams_update_tutor_admin" on public.exams;

drop policy if exists "questions_select_policy" on public.exam_questions;
drop policy if exists "questions_insert_tutor" on public.exam_questions;
drop policy if exists "questions_update_tutor" on public.exam_questions;
drop policy if exists "questions_delete_tutor" on public.exam_questions;

drop policy if exists "attempts_select_own" on public.exam_attempts;
drop policy if exists "attempts_insert_own" on public.exam_attempts;

-- =========================
-- PROFILE POLICIES
-- =========================

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = auth_user_id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = auth_user_id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

-- =========================
-- EXAM POLICIES
-- =========================

create policy "exams_select_policy"
on public.exams
for select
using (
  status = 'APPROVED'
  or created_by in (
    select id from public.profiles where auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
    and role = 'ADMIN'
  )
);

create policy "exams_insert_tutor"
on public.exams
for insert
with check (
  created_by in (
    select id
    from public.profiles
    where auth_user_id = auth.uid()
    and role = 'TUTOR'
  )
);

create policy "exams_update_tutor_admin"
on public.exams
for update
using (
  created_by in (
    select id
    from public.profiles
    where auth_user_id = auth.uid()
    and role = 'TUTOR'
  )
  or exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
    and role = 'ADMIN'
  )
)
with check (
  created_by in (
    select id
    from public.profiles
    where auth_user_id = auth.uid()
    and role = 'TUTOR'
  )
  or exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
    and role = 'ADMIN'
  )
);

-- =========================
-- QUESTION POLICIES
-- =========================

create policy "questions_select_policy"
on public.exam_questions
for select
using (
  exam_id in (
    select id
    from public.exams
    where status = 'APPROVED'
  )
  or exam_id in (
    select exams.id
    from public.exams
    join public.profiles
      on profiles.id = exams.created_by
    where profiles.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
    and role = 'ADMIN'
  )
);

create policy "questions_insert_tutor"
on public.exam_questions
for insert
with check (
  exam_id in (
    select exams.id
    from public.exams
    join public.profiles
      on profiles.id = exams.created_by
    where profiles.auth_user_id = auth.uid()
    and profiles.role = 'TUTOR'
    and exams.status in ('DRAFT', 'REJECTED')
  )
);

create policy "questions_update_tutor"
on public.exam_questions
for update
using (
  exam_id in (
    select exams.id
    from public.exams
    join public.profiles
      on profiles.id = exams.created_by
    where profiles.auth_user_id = auth.uid()
    and profiles.role = 'TUTOR'
    and exams.status in ('DRAFT', 'REJECTED')
  )
)
with check (
  exam_id in (
    select exams.id
    from public.exams
    join public.profiles
      on profiles.id = exams.created_by
    where profiles.auth_user_id = auth.uid()
    and profiles.role = 'TUTOR'
    and exams.status in ('DRAFT', 'REJECTED')
  )
);

create policy "questions_delete_tutor"
on public.exam_questions
for delete
using (
  exam_id in (
    select exams.id
    from public.exams
    join public.profiles
      on profiles.id = exams.created_by
    where profiles.auth_user_id = auth.uid()
    and profiles.role = 'TUTOR'
    and exams.status in ('DRAFT', 'REJECTED')
  )
);

-- =========================
-- ATTEMPT POLICIES
-- =========================

create policy "attempts_select_own"
on public.exam_attempts
for select
using (
  student_id in (
    select id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

create policy "attempts_insert_own"
on public.exam_attempts
for insert
with check (
  student_id in (
    select id
    from public.profiles
    where auth_user_id = auth.uid()
    and role = 'STUDENT'
  )
);

-- =========================
-- NOTES
-- =========================
-- After running this SQL, create users from the app.
-- To make an admin, manually update that user's role:
--
-- update public.profiles
-- set role = 'ADMIN'
-- where email = 'your-admin-email@example.com';