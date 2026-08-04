-- Migración: updated_at nunca se actualizaba en ningún UPDATE (quedaba fijo
-- en la fecha de creación de la fila) porque el schema solo le pone un
-- DEFAULT NOW() al insertar, pero nada lo toca después. Afecta a users,
-- artists, events y news. Ejecutar en Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.artists;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.artists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.events;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.news;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
