-- Migración: tabla de publicaciones ("Nueva publicación" / Spit yo' mind).
-- Un post tiene texto opcional, hasta 5 fotos, ubicación opcional (mismo
-- buscador que "Ingresar evento"), un evento etiquetado opcional (referencia,
-- no crea un evento nuevo) y personas etiquetadas (solo se transforman en link,
-- no generan notificación). Ejecutar en Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT,
  image_urls TEXT[] DEFAULT '{}',
  location_name TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  tagged_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Personas etiquetadas en un post (solo se muestran como link a su perfil, no notifican).
CREATE TABLE IF NOT EXISTS public.post_tagged_users (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Un usuario puede fijar como máximo un post O un evento a la vez (se controla
-- desde la app: al fijar uno se desfijan todos los demás posts y eventos suyos).
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at);
CREATE INDEX IF NOT EXISTS idx_post_tagged_users_user_id ON public.post_tagged_users(user_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.posts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tagged_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone"
  ON public.posts
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert their own posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Owners can update their own posts"
  ON public.posts
  FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Owners can delete their own posts"
  ON public.posts
  FOR DELETE
  USING (author_id = auth.uid());

CREATE POLICY "Post tags are viewable by everyone"
  ON public.post_tagged_users
  FOR SELECT
  USING (true);

CREATE POLICY "Post owners can tag users"
  ON public.post_tagged_users
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND author_id = auth.uid())
  );

CREATE POLICY "Post owners can remove tags"
  ON public.post_tagged_users
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND author_id = auth.uid())
  );

-- Bucket de Storage para las fotos de posts (hasta 5 por post).
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update their post images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'post-images' AND owner = auth.uid());

CREATE POLICY "Owners can delete their post images"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-images' AND owner = auth.uid());
