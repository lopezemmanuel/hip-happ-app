-- Migración: bucket de Storage para fotos de eventos subidas desde el celular.
-- Ejecutar en Supabase SQL Editor.

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública (para que las fotos se vean en la app sin login)
CREATE POLICY "Public read event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Solo usuarios autenticados pueden subir
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-images' AND auth.uid() IS NOT NULL);

-- Solo el dueño del archivo puede editarlo/borrarlo
CREATE POLICY "Owners can update their event images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-images' AND owner = auth.uid());

CREATE POLICY "Owners can delete their event images"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-images' AND owner = auth.uid());
