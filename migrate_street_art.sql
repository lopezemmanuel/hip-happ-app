-- Migración completa para limpiar columnas de etiquetas
-- Ejecutar estas líneas en Supabase SQL Editor en este orden

-- 1. Copiar datos de "street art" (viejo) a street_art (nuevo) si aún no se copió
UPDATE public.events 
SET street_art = COALESCE("street art", FALSE) 
WHERE street_art = FALSE AND "street art" = TRUE;

-- 2. Eliminar la columna antigua con comillas y espacio
ALTER TABLE public.events 
DROP COLUMN IF EXISTS "street art";

-- 3. Verificar que todos los eventos tengan las columnas correctas
-- SELECT id, title, freestyle, show, batallas, dance, djing, jam, cypher, breaking, festival, taller, expo, graffiti, street_art, encuentro FROM public.events LIMIT 5;

-- 4. IMPORTANTE: Los eventos antiguos pueden tener datos en campo "category"
-- Pero el app SOLO debe leer las columnas booleanas (freestyle, show, batallas, etc.)
-- No confiar en el campo "category" para nada
