-- Kişiye özel yönetici hesapları. ADMIN_PASSWORD ortak şifresi yalnızca
-- kurtarma girişi olarak kalır; günlük kullanım bu tablodaki hesaplarla yapılır.
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
