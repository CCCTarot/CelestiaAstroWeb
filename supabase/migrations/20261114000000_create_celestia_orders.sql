create table if not exists public.celestia_orders (
  id uuid primary key,
  created_at timestamptz not null default now(),
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  service_title text not null check (char_length(service_title) between 1 and 180),
  category text not null check (category in ('western', 'vedic', 'both')),
  birth_date date not null,
  birth_time text not null,
  time_unknown boolean not null default false,
  birth_place text not null check (char_length(birth_place) between 2 and 180),
  timezone text not null,
  chart jsonb not null,
  consent_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled'))
);

alter table public.celestia_orders
  add column if not exists status text not null default 'pending'
  check (status in ('pending', 'confirmed', 'completed', 'cancelled'));

create index if not exists celestia_orders_created_at_idx on public.celestia_orders (created_at desc);
alter table public.celestia_orders enable row level security;
revoke all on table public.celestia_orders from anon, authenticated;
grant select, insert on table public.celestia_orders to service_role;
