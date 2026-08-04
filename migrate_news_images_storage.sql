-- Migración: bucket de Storage para la imagen de portada de noticias/notas.
-- Ejecutar en Supabase SQL Editor.

INSERT INTO storage.buckets (id, name, public)
VALUES ('news-images', 'news-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read news images"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-images');

CREATE POLICY "Authenticated users can upload news images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'news-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update their news images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'news-images' AND owner = auth.uid());

CREATE POLICY "Owners can delete their news images"
ON storage.objects FOR DELETE
USING (bucket_id = 'news-images' AND owner = auth.uid());
