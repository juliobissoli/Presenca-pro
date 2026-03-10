-- 1. Create Profiles table (linked to Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text,
  telegran_chat_id text,
  updated_at timestamp with time zone default now()
);

-- 2. Create Classes table
create table if not exists public.classes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default now()
);

-- 3. Create Students table
create table if not exists public.students (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.classes on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default now()
);

-- 4. Create Attendance Records table
create table if not exists public.attendance_records (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.classes on delete cascade not null,
  date date not null default current_date,
  created_at timestamp with time zone default now()
);

-- 5. Create Attendance Entries table
create table if not exists public.attendance_entries (
  id uuid default gen_random_uuid() primary key,
  record_id uuid references public.attendance_records on delete cascade not null,
  student_id uuid references public.students on delete cascade not null,
  is_present boolean not null default true,
  observation text,
  created_at timestamp with time zone default now()
);

-- 6. Create Class Reminders table
create table if not exists public.class_reminders (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.classes on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  hour integer not null check (hour between 0 and 23),
  minute integer not null check (minute between 0 and 59),
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_entries enable row level security;
alter table public.class_reminders enable row level security;

-- Create RLS Policies (using DO blocks to avoid errors if they already exist)
do $$ 
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own profile') then
    create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
  end if;
  
  if not exists (select 1 from pg_policies where policyname = 'Users can update own profile') then
    create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can manage own classes') then
    create policy "Users can manage own classes" on public.classes for all using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can manage students of own classes') then
    create policy "Users can manage students of own classes" on public.students for all using (
      exists (select 1 from public.classes where public.classes.id = public.students.class_id and public.classes.user_id = auth.uid())
    );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can manage attendance records of own classes') then
    create policy "Users can manage attendance records of own classes" on public.attendance_records for all using (
      exists (select 1 from public.classes where public.classes.id = public.attendance_records.class_id and public.classes.user_id = auth.uid())
    );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can manage attendance entries of own records') then
    create policy "Users can manage attendance entries of own records" on public.attendance_entries for all using (
      exists (
        select 1 from public.attendance_records
        join public.classes on public.classes.id = public.attendance_records.class_id
        where public.attendance_records.id = public.attendance_entries.record_id
        and public.classes.user_id = auth.uid()
      )
    );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own reminders') then
    create policy "Users can manage their own reminders" on public.class_reminders for all using (auth.uid() = user_id);
  end if;
end $$;

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;
