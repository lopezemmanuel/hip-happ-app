-- Migración: permitir que admins editen/eliminen cualquier evento,
-- además del propio organizador. Ejecutar en Supabase SQL Editor.

DROP POLICY IF EXISTS "Authenticated users can update their own events" ON public.events;
CREATE POLICY "Owners and admins can update events"
  ON public.events
  FOR UPDATE
  USING (
    organizer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    organizer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;
CREATE POLICY "Owners and admins can delete events"
  ON public.events
  FOR DELETE
  USING (
    organizer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
