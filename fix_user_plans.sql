-- Create the user_plans table if it doesn't exist
create table if not exists public.user_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  units text,
  gender text,
  age int,
  weight numeric,
  height numeric,
  goal text,
  activity_level text,
  dietary_preference text,
  selected_plan text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_plans enable row level security;

-- Policies
create policy "Users can view their own plan"
  on public.user_plans for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own plan"
  on public.user_plans for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own plan"
  on public.user_plans for update
  using ( auth.uid() = user_id );

-- Grant permissions (if needed for anon/authenticated)
grant select, insert, update on public.user_plans to authenticated;
grant select, insert, update on public.user_plans to anon; -- Beware of RLS
