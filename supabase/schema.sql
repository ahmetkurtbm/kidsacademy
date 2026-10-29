create extension if not exists "pgcrypto";

create table if not exists public.parent_accounts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]{3,40}$'),
  parent_name text not null,
  student_name text not null,
  phone text,
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parent_accounts(id) on delete cascade,
  title text not null,
  exam_date date not null,
  score numeric(5,2) not null check (score between 0 and 100),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_subjects (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  subject_name text not null,
  correct_count integer not null default 0 check (correct_count >= 0),
  wrong_count integer not null default 0 check (wrong_count >= 0),
  blank_count integer not null default 0 check (blank_count >= 0),
  review_topics text,
  created_at timestamptz not null default now()
);

alter table public.parent_accounts enable row level security;
alter table public.exams enable row level security;
alter table public.exam_subjects enable row level security;

-- Tarayıcıdan doğrudan erişim verilmez. Tüm işlemler Next.js sunucusundan yapılır.
revoke all on public.parent_accounts from anon, authenticated;
revoke all on public.exams from anon, authenticated;
revoke all on public.exam_subjects from anon, authenticated;

create index if not exists exams_parent_date_idx on public.exams(parent_id, exam_date desc);
create index if not exists exam_subjects_exam_idx on public.exam_subjects(exam_id);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  summary text not null,
  details text,
  image_path text,
  image_url text,
  published boolean not null default true,
  share_scope text not null default 'site' check (share_scope in ('site', 'parent')),
  parent_id uuid references public.parent_accounts(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
revoke all on public.events from anon, authenticated;
create index if not exists events_date_idx on public.events(event_date desc, created_at desc);
create index if not exists events_parent_idx on public.events(parent_id, event_date desc);
create index if not exists events_scope_date_idx on public.events(share_scope, event_date desc, created_at desc);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  image_path text,
  image_url text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;
revoke all on public.announcements from anon, authenticated;
create index if not exists announcements_created_idx on public.announcements(created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-images', 'event-images', true, 4194304, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 4194304, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('admin', 'parent')),
  ip text not null,
  account_key text not null,
  success boolean not null,
  created_at timestamptz not null default now()
);

alter table public.login_attempts enable row level security;
revoke all on public.login_attempts from anon, authenticated;

create index if not exists login_attempts_scope_ip_idx on public.login_attempts(scope, ip, created_at desc);
create index if not exists login_attempts_scope_account_idx on public.login_attempts(scope, account_key, created_at desc);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[a-z0-9._-]{3,32}$'),
  display_name text not null,
  password_hash text not null,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
