import React from 'react';

const sqlSchema = `-- 1. Enable pg_jsonschema extension
create extension if not exists pg_jsonschema with schema extensions;

-- 2. Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  name text,
  email text,
  role text default 'requestor'::text,
  updated_at timestamp with time zone,

  constraint username_length check (char_length(username) >= 3)
);
-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);
create policy "Admins can update any profile." on profiles for update to authenticated with check (((select role from profiles where id = auth.uid()) = 'admin'::text));


-- 3. Trigger to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, name, email, role)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'name', new.email, new.raw_user_meta_data->>'role');
  return new;
end;
$$ language plpgsql security definer;
-- create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Create other application tables
create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table projects enable row level security;
create policy "Allow all access to projects" on projects for all using (true) with check (true);

create table sites (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table sites enable row level security;
create policy "Allow all access to sites" on sites for all using (true) with check (true);

create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  attachment_required boolean default false not null,
  auto_approve_amount numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table categories enable row level security;
create policy "Allow all access to categories" on categories for all using (true) with check (true);

create table subcategories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  attachment_required boolean default false not null,
  category_id uuid references categories(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table subcategories enable row level security;
create policy "Allow all access to subcategories" on subcategories for all using (true) with check (true);

create table expenses (
  id uuid default gen_random_uuid() primary key,
  reference_number text not null,
  requestor_id uuid references profiles(id) not null,
  category_id uuid references categories(id) not null,
  subcategory_id uuid references subcategories(id),
  amount numeric not null,
  description text not null,
  project_id uuid references projects(id) not null,
  site_id uuid references sites(id) not null,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null,
  is_high_priority boolean default false,
  attachment_path text,
  subcategory_attachment_path text,
  history jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table expenses enable row level security;
create policy "Users can view their own expenses" on expenses for select using (auth.uid() = requestor_id);
create policy "Support roles can view all expenses" on expenses for select using ( (select role from profiles where id = auth.uid()) in ('admin', 'verifier', 'approver') );
create policy "Users can create expenses" on expenses for insert with check (auth.uid() = requestor_id);
create policy "Support roles can update expenses" on expenses for update using ( (select role from profiles where id = auth.uid()) in ('admin', 'verifier', 'approver') );

create table audit_log (
  id uuid default gen_random_uuid() primary key,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  actor_id uuid references profiles(id) not null,
  actor_name text not null,
  action text not null,
  details text
);
alter table audit_log enable row level security;
create policy "Admins can manage audit log" on audit_log for all using ( (select role from profiles where id = auth.uid()) = 'admin' );

-- 5. Create Storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', true, 10485760, ARRAY['image/png', 'image/jpeg', 'application/pdf'])
on conflict (id) do nothing;

create policy "Allow authenticated users to upload attachments" on storage.objects for insert to authenticated with check ( bucket_id = 'attachments' );
create policy "Allow users to view their own attachments" on storage.objects for select using ( bucket_id = 'attachments' and (storage.owner_id = auth.uid()) );
create policy "Allow support roles to view all attachments" on storage.objects for select using ( bucket_id = 'attachments' and ((select role from profiles where id = auth.uid()) in ('admin', 'verifier', 'approver')) );

-- 6. Seed initial admin user role after they sign up
-- The application will automatically prompt for admin creation on first run.
-- The manual SQL command is no longer needed.
`;


const SupabaseInstructions: React.FC = () => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema).then(() => {
      alert('SQL schema copied to clipboard!');
    }, (err) => {
      alert('Failed to copy schema. Please copy manually.');
      console.error('Could not copy text: ', err);
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-3xl p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Backend Setup Required
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            This application requires a Supabase backend. Please follow the steps below.
          </p>
        </div>
        
        <div className="p-4 space-y-4 text-left border rounded-lg">
          <h3 className="text-lg font-semibold">1. Set Up Your Supabase Project</h3>
          <p>Go to <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase</a>, create a new project, and find your project's API URL and anon key in the API settings.</p>
          
          <h3 className="text-lg font-semibold">2. Configure Environment Variables</h3>
          <p>You need to set the `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables for this application to connect to your project. This is typically done in your hosting provider's settings or a local `.env` file.</p>
          
          <h3 className="text-lg font-semibold">3. Create Database Schema</h3>
          <p>Go to the "SQL Editor" in your Supabase project dashboard, click "New query", and paste the entire SQL script below. Click "RUN" to create all the necessary tables and policies.</p>
          
          <div className="relative">
            <pre className="p-4 text-sm bg-gray-100 border rounded-md max-h-64 overflow-auto">
              <code>{sqlSchema}</code>
            </pre>
            <button
              onClick={copyToClipboard}
              className="absolute px-2 py-1 text-xs text-white rounded-md top-2 right-2 bg-primary hover:bg-primary-hover"
            >
              Copy SQL
            </button>
          </div>

          <h3 className="text-lg font-semibold">4. Create Your Admin Account</h3>
          <p>After completing the steps above and redeploying/refreshing your application, it will automatically detect that no admin exists and will present you with a form to create the first administrator account.</p>
         
           <p className="pt-4 font-bold text-center">Once these steps are completed, please refresh this page.</p>

        </div>
      </div>
    </div>
  );
};

export default SupabaseInstructions;