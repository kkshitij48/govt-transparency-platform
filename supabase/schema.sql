-- ============================================================
-- GOVERNMENT TRANSPARENCY PLATFORM - DATABASE SCHEMA
-- Supabase PostgreSQL Schema with RLS Policies
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('Citizen', 'Official', 'Admin');

CREATE TYPE complaint_status AS ENUM (
  'Submitted',
  'UnderReview',
  'PendingInfo',
  'InProgress',
  'Escalated',
  'Resolved',
  'Reopened',
  'Rejected',
  'Closed'
);

CREATE TYPE project_status AS ENUM (
  'Planning',
  'Active',
  'Completed',
  'OnHold',
  'Cancelled'
);

-- ============================================================
-- TABLE: departments
-- ============================================================

CREATE TABLE departments (
  department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: profiles (extends Supabase auth.users)
-- ============================================================

CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'Citizen',
  department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: projects
-- ============================================================

CREATE TABLE projects (
  project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_name TEXT NOT NULL,
  status project_status NOT NULL DEFAULT 'Planning',
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  budget NUMERIC(15,2),
  department_id UUID NOT NULL REFERENCES departments(department_id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: complaints
-- ============================================================

CREATE TABLE complaints (
  complaint_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  status complaint_status NOT NULL DEFAULT 'Submitted',
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(department_id) ON DELETE CASCADE,
  assigned_official_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Critical')),
  category TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  additional_info TEXT
);

-- ============================================================
-- TABLE: responses
-- ============================================================

CREATE TABLE responses (
  response_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_text TEXT NOT NULL,
  response_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  complaint_id UUID NOT NULL UNIQUE REFERENCES complaints(complaint_id) ON DELETE CASCADE,
  official_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  action_type TEXT CHECK (action_type IN (
    'InitialReview',
    'RequestInfo',
    'Validate',
    'Reject',
    'Resolve',
    'Escalate',
    'Close',
    'Reopen'
  )),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: complaint_timeline (audit trail)
-- ============================================================

CREATE TABLE complaint_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
  status complaint_status NOT NULL,
  note TEXT,
  created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_department_id ON complaints(department_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_created_date ON complaints(created_date);
CREATE INDEX idx_responses_complaint_id ON responses(complaint_id);
CREATE INDEX idx_projects_department_id ON projects(department_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_department_id ON profiles(department_id);
CREATE INDEX idx_timeline_complaint_id ON complaint_timeline(complaint_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responses_updated_at
  BEFORE UPDATE ON responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'Citizen')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Log complaint status changes to timeline
CREATE OR REPLACE FUNCTION log_complaint_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    INSERT INTO complaint_timeline (complaint_id, status, note, created_by)
    VALUES (
      NEW.complaint_id,
      NEW.status,
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      NEW.assigned_official_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_complaint_status_change
  AFTER UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION log_complaint_status_change();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_timeline ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get current user department
CREATE OR REPLACE FUNCTION get_user_department()
RETURNS UUID AS $$
  SELECT department_id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- RLS: profiles
-- ============================================================

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (
    user_id = auth.uid() OR
    get_user_role() IN ('Admin', 'Official')
  );

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (
    user_id = auth.uid() OR get_user_role() = 'Admin'
  );

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (get_user_role() = 'Admin');

-- ============================================================
-- RLS: departments
-- ============================================================

CREATE POLICY "departments_select_all" ON departments
  FOR SELECT USING (TRUE);

CREATE POLICY "departments_insert_admin" ON departments
  FOR INSERT WITH CHECK (get_user_role() = 'Admin');

CREATE POLICY "departments_update_admin" ON departments
  FOR UPDATE USING (get_user_role() = 'Admin');

CREATE POLICY "departments_delete_admin" ON departments
  FOR DELETE USING (get_user_role() = 'Admin');

-- ============================================================
-- RLS: projects
-- ============================================================

CREATE POLICY "projects_select_all" ON projects
  FOR SELECT USING (TRUE);

CREATE POLICY "projects_insert_admin" ON projects
  FOR INSERT WITH CHECK (get_user_role() = 'Admin');

CREATE POLICY "projects_update_admin" ON projects
  FOR UPDATE USING (get_user_role() = 'Admin');

CREATE POLICY "projects_delete_admin" ON projects
  FOR DELETE USING (get_user_role() = 'Admin');

-- ============================================================
-- RLS: complaints
-- ============================================================

-- Citizens: only own complaints
-- Officials: only department complaints
-- Admins: all complaints
CREATE POLICY "complaints_select" ON complaints
  FOR SELECT USING (
    user_id = auth.uid() OR
    get_user_role() = 'Admin' OR
    (get_user_role() = 'Official' AND department_id = get_user_department())
  );

CREATE POLICY "complaints_insert_citizen" ON complaints
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "complaints_update_authorized" ON complaints
  FOR UPDATE USING (
    get_user_role() = 'Admin' OR
    (get_user_role() = 'Official' AND department_id = get_user_department()) OR
    (user_id = auth.uid() AND status = 'PendingInfo')
  );

CREATE POLICY "complaints_delete_admin" ON complaints
  FOR DELETE USING (get_user_role() = 'Admin');

-- ============================================================
-- RLS: responses
-- ============================================================

CREATE POLICY "responses_select" ON responses
  FOR SELECT USING (
    get_user_role() = 'Admin' OR
    get_user_role() = 'Official' OR
    EXISTS (
      SELECT 1 FROM complaints c
      WHERE c.complaint_id = responses.complaint_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "responses_insert_official" ON responses
  FOR INSERT WITH CHECK (
    get_user_role() IN ('Official', 'Admin') AND
    official_id = auth.uid()
  );

CREATE POLICY "responses_update_official" ON responses
  FOR UPDATE USING (
    official_id = auth.uid() OR get_user_role() = 'Admin'
  );

-- ============================================================
-- RLS: complaint_timeline
-- ============================================================

CREATE POLICY "timeline_select" ON complaint_timeline
  FOR SELECT USING (
    get_user_role() = 'Admin' OR
    get_user_role() = 'Official' OR
    EXISTS (
      SELECT 1 FROM complaints c
      WHERE c.complaint_id = complaint_timeline.complaint_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "timeline_insert_system" ON complaint_timeline
  FOR INSERT WITH CHECK (
    get_user_role() IN ('Official', 'Admin') OR
    EXISTS (
      SELECT 1 FROM complaints c
      WHERE c.complaint_id = complaint_timeline.complaint_id
      AND c.user_id = auth.uid()
    )
  );

-- ============================================================
-- SEED DATA
-- ============================================================

-- Departments
INSERT INTO departments (department_id, department_name, description) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ministry of Finance', 'Manages national budget, taxation, and fiscal policy'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Ministry of Health', 'Oversees public health, hospitals, and medical services'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Ministry of Education', 'Manages schools, universities, and education policy'),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'Ministry of Infrastructure', 'Roads, bridges, transportation and public works'),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'Ministry of Justice', 'Law enforcement, courts, and legal framework'),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'Ministry of Environment', 'Environmental protection and natural resources');
