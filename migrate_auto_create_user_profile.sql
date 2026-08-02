-- Migración crítica: hasta ahora, cuando alguien se registraba (Supabase Auth),
-- NUNCA se creaba su fila correspondiente en public.users. Resultado: username,
-- role e is_verified quedaban sin existir para cualquier usuario nuevo, y todo
-- el sistema de permisos (admin / verificado) no podía funcionar para nadie
-- excepto la única cuenta cargada a mano. Ejecutar en Supabase SQL Editor.

-- Documentar columna existente en producción (no estaba en schema.sql)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Función que crea automáticamente la fila en public.users al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
