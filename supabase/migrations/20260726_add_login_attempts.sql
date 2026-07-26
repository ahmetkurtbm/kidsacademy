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
