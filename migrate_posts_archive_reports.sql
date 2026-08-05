-- Permite archivar posteos (ocultarlos sin borrarlos) y denunciarlos.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_posts_is_archived ON public.posts(is_archived);

-- Denuncias de posteos: cualquier usuario autenticado puede denunciar; por
-- ahora solo quedan guardadas para revisión manual, sin acción automática.
CREATE TABLE IF NOT EXISTS public.post_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_reports_post_id ON public.post_reports(post_id);

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report posts as themselves"
  ON public.post_reports
  FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view their own reports, admins view all"
  ON public.post_reports
  FOR SELECT
  USING (
    reporter_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
