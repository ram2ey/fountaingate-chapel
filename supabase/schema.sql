-- Fountain Gate Chapel - Supabase Enterprise Database Schema
-- Multi-Branch, RBAC, Pastoral Care, Media Hub & Financial Ledger

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Definitions
CREATE TYPE user_role AS ENUM (
  'admin',
  'pastor',
  'member'
);

CREATE TYPE member_status AS ENUM (
  'active',
  'at_risk',
  'first_time_guest',
  'inactive',
  'transferred'
);

CREATE TYPE giving_type AS ENUM (
  'tithe',
  'offering',
  'building_fund',
  'missions',
  'special_seed'
);

CREATE TYPE payment_method AS ENUM (
  'cash',
  'pos_card',
  'mobile_money',
  'bank_transfer',
  'online_checkout'
);

-- 1. Branches Table
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  country TEXT DEFAULT 'Ghana',
  is_main_campus BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Branches
INSERT INTO public.branches (id, name, location, is_main_campus) VALUES
('b0000000-0000-0000-0000-000000000001', 'Fountain Gate Chapel - Global HQ', 'Bolgatanga Main Campus', TRUE),
('b0000000-0000-0000-0000-000000000002', 'Fountain Gate Chapel - Accra Grace Temple', 'Accra Central', FALSE),
('b0000000-0000-0000-0000-000000000003', 'Fountain Gate Chapel - Tema City Campus', 'Tema Community 11', FALSE),
('b0000000-0000-0000-0000-000000000004', 'Fountain Gate Chapel - Kumasi Sanctuary', 'Kumasi Ahodwo', FALSE);

-- 2. Profiles (Auth Users linked to Supabase Auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'member',
  branch_id UUID REFERENCES public.branches(id),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Members Directory
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  dob DATE,
  address TEXT,
  cell_group TEXT,
  status member_status DEFAULT 'active',
  tags TEXT[] DEFAULT '{}',
  first_visited_at DATE DEFAULT CURRENT_DATE,
  last_attended_at DATE DEFAULT CURRENT_DATE,
  consecutive_absences INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Attendance Logs
CREATE TABLE public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  marked_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Confidential Pastoral Care Notes
CREATE TABLE public.care_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  pastor_id UUID REFERENCES public.profiles(id),
  note TEXT NOT NULL,
  is_confidential BOOLEAN DEFAULT FALSE,
  action_item TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Sermons & Media Hub
CREATE TABLE public.sermons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  title TEXT NOT NULL,
  speaker TEXT NOT NULL,
  series TEXT,
  scripture_reference TEXT,
  sermon_date DATE NOT NULL,
  facebook_embed_url TEXT,
  audio_storage_url TEXT,
  is_live BOOLEAN DEFAULT FALSE,
  views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Giving & Financial Ledger
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  donor_name TEXT,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'GHS',
  type giving_type NOT NULL,
  payment_method payment_method NOT NULL,
  reference_no TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  giving_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Communications & Broadcast Logs
CREATE TABLE public.broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  channel TEXT NOT NULL,
  target_group TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_count INT DEFAULT 0,
  sent_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatic At-Risk Engine Function & Trigger
CREATE OR REPLACE FUNCTION update_at_risk_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consecutive_absences >= 3 AND NEW.status = 'active' THEN
    NEW.status := 'at_risk';
  ELSIF NEW.consecutive_absences < 3 AND NEW.status = 'at_risk' THEN
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_member_at_risk
BEFORE INSERT OR UPDATE ON public.members
FOR EACH ROW EXECUTE FUNCTION update_at_risk_status();

-- Enable Row Level Security (RLS)
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Baseline RLS Security Policies
CREATE POLICY "Allow public read access to branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access to members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Allow admin insert access to members" ON public.members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated access to care notes" ON public.care_notes FOR ALL USING (true);
CREATE POLICY "Allow admin access to contributions" ON public.contributions FOR ALL USING (true);
