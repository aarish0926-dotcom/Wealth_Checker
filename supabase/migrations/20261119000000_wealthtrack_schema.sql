-- WealthTrack isolated owner-scoped financial records
create extension if not exists pgcrypto;
create table if not exists public.finance_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 salary numeric(14,2) not null default 90000 check(salary>=0),
 expense_budget numeric(14,2) not null default 15000 check(expense_budget>=0),
 savings_target numeric(14,2) not null default 10000 check(savings_target>=0),
 emi numeric(14,2) not null default 19900 check(emi>=0),
 loan_balance numeric(14,2) not null default 2192890 check(loan_balance>=0)
);
create table if not exists public.transactions(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 occurred_on date not null default current_date,
 amount numeric(14,2) not null check(amount>0),
 kind text not null check(kind in ('income','expense')),
 category text not null default 'Other',
 note text not null default '',
 created_at timestamptz not null default now()
);
create index if not exists transactions_owner_date on public.transactions(user_id,occurred_on desc);
create table if not exists public.holdings(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null,
 value numeric(14,2) not null default 0 check(value>=0),
 kind text not null check(kind in ('Investment','Emergency Fund')),
 created_at timestamptz not null default now()
);
create index if not exists holdings_owner on public.holdings(user_id);
alter table public.finance_settings enable row level security;
alter table public.transactions enable row level security;
alter table public.holdings enable row level security;
create policy "own finance settings select" on public.finance_settings for select to authenticated using ((select auth.uid())=user_id);
create policy "own finance settings insert" on public.finance_settings for insert to authenticated with check ((select auth.uid())=user_id);
create policy "own finance settings update" on public.finance_settings for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "own transactions select" on public.transactions for select to authenticated using ((select auth.uid())=user_id);
create policy "own transactions insert" on public.transactions for insert to authenticated with check ((select auth.uid())=user_id);
create policy "own transactions update" on public.transactions for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "own transactions delete" on public.transactions for delete to authenticated using ((select auth.uid())=user_id);
create policy "own holdings select" on public.holdings for select to authenticated using ((select auth.uid())=user_id);
create policy "own holdings insert" on public.holdings for insert to authenticated with check ((select auth.uid())=user_id);
create policy "own holdings update" on public.holdings for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "own holdings delete" on public.holdings for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.finance_settings,public.transactions,public.holdings to authenticated;
