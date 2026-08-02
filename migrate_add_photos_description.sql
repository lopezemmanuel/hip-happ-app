-- Migración para agregar campos de fotos y descripción extensa
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS description_long TEXT,
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS main_image_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS price TEXT;

-- Actualizar image_urls con la imagen principal actual si existe
UPDATE public.events
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_urls = '{}';
