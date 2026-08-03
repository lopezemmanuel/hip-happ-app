-- Migración: bucket de Storage para fotos de perfil (avatar).
-- Ejecutar en Supabase SQL Editor.

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update their avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "Owners can delete their avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND owner = auth.uid());
