-- Agrega ubicación al perfil de usuario (texto libre, ej: "Buenos Aires, AR").
-- Antes esto era solo un mock hardcodeado en el drawer de ajustes (UserDrawer.js).
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS location TEXT;
