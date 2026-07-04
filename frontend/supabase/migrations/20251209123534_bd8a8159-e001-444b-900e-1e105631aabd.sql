-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for server types
CREATE TYPE public.server_type AS ENUM ('database', 'application', 'service_manager');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create infrastructure requirements configuration table (admin configurable)
CREATE TABLE public.infrastructure_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  server_type server_type NOT NULL,
  min_processor TEXT NOT NULL DEFAULT 'Intel Core i3',
  min_ram_gb INTEGER NOT NULL DEFAULT 4,
  min_disk_gb INTEGER NOT NULL DEFAULT 100,
  min_free_disk_gb INTEGER NOT NULL DEFAULT 20,
  supported_os TEXT[] NOT NULL DEFAULT ARRAY['Windows Server 2016', 'Windows Server 2019', 'Windows Server 2022', 'Windows 10', 'Windows 11'],
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assessments table for persistence
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT,
  cnpj TEXT,
  status TEXT DEFAULT 'draft',
  porte TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  validation_results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create homologated peripherals table (admin configurable)
CREATE TABLE public.homologated_peripherals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homologated_peripherals ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for infrastructure_requirements (public read, admin write)
CREATE POLICY "Anyone can view requirements" ON public.infrastructure_requirements
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage requirements" ON public.infrastructure_requirements
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for assessments
CREATE POLICY "Users can view own assessments" ON public.assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assessments" ON public.assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments" ON public.assessments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assessments" ON public.assessments
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all assessments" ON public.assessments
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for homologated_peripherals (public read, admin write)
CREATE POLICY "Anyone can view peripherals" ON public.homologated_peripherals
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage peripherals" ON public.homologated_peripherals
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default infrastructure requirements
INSERT INTO public.infrastructure_requirements (name, server_type, min_processor, min_ram_gb, min_disk_gb, min_free_disk_gb, supported_os, description) VALUES
  ('Servidor de Banco de Dados', 'database', 'Intel Xeon ou equivalente', 16, 500, 100, ARRAY['Windows Server 2016', 'Windows Server 2019', 'Windows Server 2022'], 'Requisitos mínimos para servidor de banco de dados SQL Server'),
  ('Servidor de Aplicação', 'application', 'Intel Core i5 ou equivalente', 8, 256, 50, ARRAY['Windows Server 2016', 'Windows Server 2019', 'Windows Server 2022', 'Windows 10 Pro', 'Windows 11 Pro'], 'Requisitos mínimos para servidor de aplicação'),
  ('Service Manager', 'service_manager', 'Intel Core i3 ou equivalente', 4, 128, 30, ARRAY['Windows Server 2016', 'Windows Server 2019', 'Windows Server 2022', 'Windows 10', 'Windows 11'], 'Requisitos mínimos para Service Manager');

-- Insert default homologated peripherals
INSERT INTO public.homologated_peripherals (category, brand, model) VALUES
  ('impressora_fiscal', 'Epson', 'TM-T20X'),
  ('impressora_fiscal', 'Bematech', 'MP-4200 TH'),
  ('impressora_fiscal', 'Elgin', 'i9'),
  ('scanner', 'Honeywell', 'Voyager 1250g'),
  ('scanner', 'Elgin', 'EL250'),
  ('pinpad', 'Gertec', 'PPC920'),
  ('pinpad', 'Ingenico', 'iPP320'),
  ('sat', 'Elgin', 'Linker SAT'),
  ('sat', 'Bematech', 'SAT RB-2000'),
  ('balanca', 'Toledo', 'Prix 3'),
  ('balanca', 'Filizola', 'Platina');

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_infrastructure_requirements_updated_at
  BEFORE UPDATE ON public.infrastructure_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();