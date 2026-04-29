-- =============================================================
-- Cars Health — Schéma Supabase
-- À coller dans : Supabase Dashboard > SQL Editor > New query
-- =============================================================

-- Tables
CREATE TABLE public.vehicles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  make             TEXT NOT NULL,
  model            TEXT NOT NULL,
  year             INTEGER NOT NULL,
  vin              TEXT,
  license_plate    TEXT NOT NULL,
  mileage          INTEGER NOT NULL DEFAULT 0,
  color            TEXT,
  fuel_type        TEXT NOT NULL DEFAULT 'gasoline',
  purchase_date    DATE,
  notes            TEXT,
  share_token      UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  is_share_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.interventions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id           UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type                 TEXT NOT NULL DEFAULT 'other',
  title                TEXT NOT NULL,
  description          TEXT,
  date                 DATE NOT NULL,
  mileage              INTEGER NOT NULL DEFAULT 0,
  cost                 NUMERIC(10,2),
  garage               TEXT,
  technician           TEXT,
  parts                JSONB,
  next_service_mileage INTEGER,
  next_service_date    DATE,
  created_at           TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.alerts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id              UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trigger_type            TEXT NOT NULL DEFAULT 'mileage',
  title                   TEXT NOT NULL,
  description             TEXT,
  trigger_mileage         INTEGER,
  trigger_date            DATE,
  interval_mileage        INTEGER,
  interval_days           INTEGER,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  is_dismissed            BOOLEAN NOT NULL DEFAULT false,
  last_triggered_date     DATE,
  last_triggered_mileage  INTEGER,
  created_at              TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Row Level Security
ALTER TABLE public.vehicles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts       ENABLE ROW LEVEL SECURITY;

-- Vehicles : propriétaire peut tout faire
CREATE POLICY "owner_all_vehicles" ON public.vehicles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Vehicles : lecture publique si partage activé
CREATE POLICY "public_read_shared_vehicles" ON public.vehicles
  FOR SELECT USING (is_share_enabled = true);

-- Interventions : propriétaire peut tout faire
CREATE POLICY "owner_all_interventions" ON public.interventions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Interventions : lecture publique si le véhicule parent est partagé
CREATE POLICY "public_read_shared_interventions" ON public.interventions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = interventions.vehicle_id
        AND vehicles.is_share_enabled = true
    )
  );

-- Alertes : propriétaire seulement (jamais publiques)
CREATE POLICY "owner_all_alerts" ON public.alerts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
