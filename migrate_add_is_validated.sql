-- Migración: agrega el nivel "Perfil Validado" (distinto de "Cuenta Verificada")
-- y completa la tabla de solicitudes de validación (le faltaba user_id y status,
-- y nunca tuvo RLS habilitado). Ejecutar en Supabase SQL Editor.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_validated BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.artist_verifications
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.artist_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own verification requests" ON public.artist_verifications;
CREATE POLICY "Users can view their own verification requests"
  ON public.artist_verifications
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can insert their own verification requests" ON public.artist_verifications;
CREATE POLICY "Users can insert their own verification requests"
  ON public.artist_verifications
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update verification requests" ON public.artist_verifications;
CREATE POLICY "Admins can update verification requests"
  ON public.artist_verifications
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
