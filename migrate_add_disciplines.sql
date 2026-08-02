-- Migración: agrega columna de disciplinas elegidas en el onboarding
-- (hasta ahora se pedían en la UI pero nunca se guardaban). Ejecutar en Supabase SQL Editor.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS disciplines TEXT[] DEFAULT '{}';
