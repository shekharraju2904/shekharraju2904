import React, { useState } from 'react';

interface SupabaseInstructionsProps {
  onSave: (url: string, key: string) => void;
}

const SQL_SCRIPT = `-- This script is idempotent, meaning it can be run multiple times without causing errors.

-- 1. Create essential tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  name text,
  email text,
  role text NOT NULL DEFAULT 'requestor'::text,
  status text NOT NULL DEFAULT 'active'::text
);
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    attachment_required boolean NOT NULL DEFAULT false,
    auto_approve_amount numeric NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.subcategories (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name text NOT NULL,
    attachment_required boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS public.sites (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reference_number text NOT NULL UNIQUE,
    requestor_id uuid NOT NULL REFERENCES public.profiles(id),
    category_id uuid NOT NULL REFERENCES public.categories(id),
    subcategory_id uuid REFERENCES public.subcategories(id),
    amount numeric NOT NULL,
    description text,
    project_id uuid NOT NULL REFERENCES public.projects(id),
    site_id uuid NOT NULL REFERENCES public.sites(id),
    submitted_at timestamp with time zone NOT NULL DEFAULT now(),
    status text NOT NULL,
    is_high_priority boolean NOT NULL DEFAULT false,
    attachment_path text,
    subcategory_attachment_path text,
    history jsonb,
    deleted_at timestamp with time zone,
    deleted_by uuid REFERENCES public.profiles(id),
    status_before_delete text,
    paid_at timestamp with time zone,
    paid_by uuid REFERENCES public.profiles(id),
    payment_attachment_path text,
    payment_reference_number text
);
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "timestamp" timestamp with time zone NOT NULL DEFAULT now(),
    actor_id uuid REFERENCES public.profiles(id),
    actor_name text,
    action text NOT NULL,
    details text
);

-- 1.5 Add soft delete and payment columns to expenses table if they don't exist (for migrations)
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.expenses ADD COLUMN deleted_at timestamp with time zone;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'deleted_by') THEN
    ALTER TABLE public.expenses ADD COLUMN deleted_by uuid REFERENCES public.profiles(id);
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'status_before_delete') THEN
    ALTER TABLE public.expenses ADD COLUMN status_before_delete text;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'paid_at') THEN
    ALTER TABLE public.expenses ADD COLUMN paid_at timestamp with time zone;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'paid_by') THEN
    ALTER TABLE public.expenses ADD COLUMN paid_by uuid REFERENCES public.profiles(id);
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'payment_attachment_path') THEN
    ALTER TABLE public.expenses ADD COLUMN payment_attachment_path text;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'payment_reference_number') THEN
    ALTER TABLE public.expenses ADD COLUMN payment_reference_number text;
  END IF;
END $$;

-- 2. Create the function to auto-create user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  admin_count integer;
  user_role text;
  generated_username text;
  full_name text;
BEGIN
  -- Determine user role
  SELECT count(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  IF admin_count = 0 THEN
    user_role := 'admin';
  ELSE
    user_role := 'requestor';
  END IF;
  
  -- Use name from metadata if available, otherwise fallback to part of email
  full_name := new.raw_user_meta_data->>'name';
  IF full_name IS NULL OR full_name = '' THEN
    full_name := split_part(new.email, '@', 1);
  END IF;

  -- Generate a more unique username to prevent collisions
  generated_username := split_part(new.email, '@', 1) || '-' || substr(gen_random_uuid()::text, 1, 4);

  INSERT INTO public.profiles (id, username, name, email, role)
  VALUES (new.id, generated_username, full_name, new.email, user_role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger to fire the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Create Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 6. Create NEW, SAFER helper function to get a user's role
DROP FUNCTION IF EXISTS public.get_user_role(user_id uuid); -- Drop the old problematic function
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  select role from public.profiles where id = auth.uid();
$$;

-- 7. Define all RLS Policies (REWRITTEN FOR STABILITY AND SECURITY)
-- PROFILES
DROP POLICY IF EXISTS "Allow all access for system user" ON public.profiles;
CREATE POLICY "Allow all access for system user" ON public.profiles FOR ALL USING (current_user = 'postgres');
DROP POLICY IF EXISTS "Allow user to view their own profile." ON public.profiles;
CREATE POLICY "Allow user to view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
-- FIX: Replaced admin-only policy with a policy that includes verifiers and approvers to allow DB joins to succeed.
DROP POLICY IF EXISTS "Allow admins to view all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Allow elevated roles to view profiles." ON public.profiles;
CREATE POLICY "Allow elevated roles to view profiles." ON public.profiles FOR SELECT USING (public.get_my_role() IN ('admin', 'verifier', 'approver'));
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Allow user to update their own profile." ON public.profiles;
CREATE POLICY "Allow user to update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Allow admins to update any profile." ON public.profiles;
CREATE POLICY "Allow admins to update any profile." ON public.profiles FOR UPDATE USING (public.get_my_role() = 'admin');

-- CONFIG TABLES (categories, projects, etc.)
DROP POLICY IF EXISTS "Allow authenticated users to read config." ON public.categories;
CREATE POLICY "Allow authenticated users to read config." ON public.categories FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow admins to manage config." ON public.categories;
CREATE POLICY "Allow admins to manage config." ON public.categories FOR ALL USING (public.get_my_role() = 'admin');
DROP POLICY IF EXISTS "Allow authenticated users to read config." ON public.subcategories;
CREATE POLICY "Allow authenticated users to read config." ON public.subcategories FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow admins to manage config." ON public.subcategories;
CREATE POLICY "Allow admins to manage config." ON public.subcategories FOR ALL USING (public.get_my_role() = 'admin');
DROP POLICY IF EXISTS "Allow authenticated users to read config." ON public.projects;
CREATE POLICY "Allow authenticated users to read config." ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow admins to manage config." ON public.projects;
CREATE POLICY "Allow admins to manage config." ON public.projects FOR ALL USING (public.get_my_role() = 'admin');
DROP POLICY IF EXISTS "Allow authenticated users to read config." ON public.sites;
CREATE POLICY "Allow authenticated users to read config." ON public.sites FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow admins to manage config." ON public.sites;
CREATE POLICY "Allow admins to manage config." ON public.sites FOR ALL USING (public.get_my_role() = 'admin');
-- AUDIT LOG
DROP POLICY IF EXISTS "Allow admins to access audit log." ON public.audit_log;
CREATE POLICY "Allow admins to access audit log." ON public.audit_log FOR ALL USING (public.get_my_role() = 'admin');

-- EXPENSES
-- NEW CHANGE FOR UNIVERSAL VIEW:
-- This new, simpler policy allows ANY authenticated user to see ALL expenses.
-- This fulfills the requirement for a universal transaction log.
-- The UI and more restrictive UPDATE/INSERT policies still control who can act on which expenses.
DROP POLICY IF EXISTS "Allow user to manage their own expenses." ON public.expenses;
DROP POLICY IF EXISTS "Allow requestor to view their own expenses." ON public.expenses;
DROP POLICY IF EXISTS "Allow verifiers/approvers/admins to see relevant expenses." ON public.expenses;
DROP POLICY IF EXISTS "Allow users to view expenses based on role." ON public.expenses;
DROP POLICY IF EXISTS "Allow authenticated users to view all expenses." ON public.expenses;
CREATE POLICY "Allow authenticated users to view all expenses." ON public.expenses FOR SELECT USING (
    auth.role() = 'authenticated'
);

-- INSERT policy remains the same and is correct.
DROP POLICY IF EXISTS "Allow requestor to insert their own expenses." ON public.expenses;
CREATE POLICY "Allow requestor to insert their own expenses." ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = requestor_id);

-- UPDATE policies remain the same; they correctly restrict actions to specific queues.
DROP POLICY IF EXISTS "Allow verifiers/approvers to update expenses." ON public.expenses;
DROP POLICY IF EXISTS "Allow verifiers to update expenses." ON public.expenses;
CREATE POLICY "Allow verifiers to update expenses." ON public.expenses FOR UPDATE
USING (public.get_my_role() = 'verifier' AND status IN ('Pending Verification', 'Approved'))
WITH CHECK (status IN ('Pending Approval', 'Rejected', 'Pending Verification', 'Paid'));

DROP POLICY IF EXISTS "Allow approvers to update expenses." ON public.expenses;
CREATE POLICY "Allow approvers to update expenses." ON public.expenses FOR UPDATE
USING (public.get_my_role() = 'approver' AND status IN ('Pending Approval', 'Approved'))
WITH CHECK (status IN ('Approved', 'Rejected', 'Pending Approval', 'Paid'));

-- Admin UPDATE policy allows them to edit fields like priority.
DROP POLICY IF EXISTS "Allow admins to update expenses." ON public.expenses;
CREATE POLICY "Allow admins to update expenses." ON public.expenses FOR UPDATE
USING (public.get_my_role() = 'admin')
WITH CHECK (true);

-- DELETE policy for admin (for permanent deletion from recycle bin)
DROP POLICY IF EXISTS "Allow admins to delete expenses." ON public.expenses;
CREATE POLICY "Allow admins to delete expenses." ON public.expenses FOR DELETE
USING (public.get_my_role() = 'admin');


-- STORAGE
DROP POLICY IF EXISTS "Allow users to upload attachments." ON storage.objects;
CREATE POLICY "Allow users to upload attachments." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.uid() = owner);
DROP POLICY IF EXISTS "Allow relevant users to view attachments." ON storage.objects;
CREATE POLICY "Allow relevant users to view attachments." ON storage.objects FOR SELECT USING (bucket_id = 'attachments' AND (
    auth.uid() = owner OR
    public.get_my_role() = 'admin' OR
    (public.get_my_role() IN ('verifier', 'approver'))
));
`;

const SetupStep: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
  <div className="p-4 border-l-4 border-primary bg-primary-light">
    <h4 className="text-lg font-bold text-gray-900">Step {number}: {title}</h4>
    <div className="mt-2 space-y-2 text-sm text-gray-700">{children}</div>
  </div>
);

const SupabaseInstructions: React.FC<SupabaseInstructionsProps> = ({ onSave }) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (supabaseUrl.trim() && supabaseKey.trim()) {
      onSave(supabaseUrl.trim(), supabaseKey.trim());
    }
  };
  
  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SQL_SCRIPT).then(() => {
        alert('SQL script copied to clipboard!');
    }, (err) => {
        alert('Failed to copy script. Please copy it manually.');
        console.error('Could not copy text: ', err);
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl p-8 m-4 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">First-time Setup</h2>
          <p className="mt-2 text-sm text-gray-600">
            Please follow these steps to configure your database before using the application.
          </p>
        </div>
        
        <div className="space-y-4">
            <SetupStep number={1} title="Create Database Schema">
                 <p>This script creates all the necessary tables, security policies, and functions for the application to work. It is safe to run multiple times.</p>
                 <ol className="pl-5 list-decimal">
                    <li>Go to your Supabase project's <a href="https://app.supabase.io" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">SQL Editor</a>.</li>
                    <li>Click the button below to copy the full database setup script.</li>
                    <li>Paste the script into your Supabase SQL Editor and click "RUN".</li>
                 </ol>
                <textarea
                    readOnly
                    value={SQL_SCRIPT}
                    className="w-full h-32 p-2 mt-2 text-xs border border-gray-300 rounded-md font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={copySqlToClipboard}
                  className="px-4 py-2 mt-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-secondary hover:bg-green-600"
                >
                  Copy SQL
                </button>
            </SetupStep>

            <SetupStep number={2} title="Connect Your Application">
                <p>Finally, provide your Supabase Project URL and Anon Key to connect the application. You can find these in your Supabase project's API settings.</p>
                <form className="pt-2 space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="supabase-url" className="block text-sm font-medium text-gray-700">Supabase Project URL</label>
                    <input
                      id="supabase-url"
                      type="text"
                      required
                      className="relative block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="https://your-project-ref.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="supabase-key" className="block text-sm font-medium text-gray-700">Supabase Anon (Public) Key</label>
                    <input
                      id="supabase-key"
                      type="password"
                      required
                      className="relative block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="ey..."
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="relative flex justify-center w-full px-4 py-2 mt-2 text-sm font-medium text-white border border-transparent rounded-md group bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Save and Connect
                    </button>
                  </div>
                </form>
            </SetupStep>
        </div>
      </div>
    </div>
  );
};

export default SupabaseInstructions;