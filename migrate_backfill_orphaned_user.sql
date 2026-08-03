-- Migración puntual: crea la fila faltante en public.users para la cuenta
-- que quedó huérfana (se registró antes de que existiera el trigger de
-- creación automática, y luego se le vinculó Google al mismo email).
-- Ejecutar en Supabase SQL Editor.

INSERT INTO public.users (id, full_name)
VALUES ('fc3df2ae-5fe1-40a7-8b09-5a76af3bcf6b', 'lopezemmanuelgm@gmail.com')
ON CONFLICT (id) DO NOTHING;
