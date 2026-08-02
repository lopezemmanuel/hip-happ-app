-- Hip-Happ Supabase schema
-- Tablas principales para usuarios, artistas, eventos y noticias

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios autenticados
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'artist', 'admin')),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  disciplines TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crea automáticamente la fila en public.users cuando alguien se registra en Supabase Auth
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

-- Tabla de artistas
CREATE TABLE IF NOT EXISTS public.artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  genre TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  social_link TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de eventos
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  description_long TEXT,
  location TEXT NOT NULL,
  address TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  image_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  main_image_index INTEGER DEFAULT 0,
  price TEXT,
  organizer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  freestyle BOOLEAN NOT NULL DEFAULT FALSE,
  show BOOLEAN NOT NULL DEFAULT FALSE,
  batallas BOOLEAN NOT NULL DEFAULT FALSE,
  dance BOOLEAN NOT NULL DEFAULT FALSE,
  djing BOOLEAN NOT NULL DEFAULT FALSE,
  jam BOOLEAN NOT NULL DEFAULT FALSE,
  cypher BOOLEAN NOT NULL DEFAULT FALSE,
  breaking BOOLEAN NOT NULL DEFAULT FALSE,
  festival BOOLEAN NOT NULL DEFAULT FALSE,
  taller BOOLEAN NOT NULL DEFAULT FALSE,
  expo BOOLEAN NOT NULL DEFAULT FALSE,
  graffiti BOOLEAN NOT NULL DEFAULT FALSE,
  street_art BOOLEAN NOT NULL DEFAULT FALSE,
  encuentro BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de noticias
CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON public.artists(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_news_published ON public.news(published);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de lectura
CREATE POLICY "Users are viewable by everyone"
  ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "Artists are viewable by everyone"
  ON public.artists
  FOR SELECT
  USING (true);

CREATE POLICY "Events are viewable by everyone"
  ON public.events
  FOR SELECT
  USING (true);

CREATE POLICY "News are viewable by everyone"
  ON public.news
  FOR SELECT
  USING (true);

-- Políticas de escritura: solo el dueño puede editar su perfil
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.users
  FOR DELETE
  USING (auth.uid() = id);

-- Para artistas, eventos y noticias, la lectura es pública y la escritura está restringida a usuarios autenticados
CREATE POLICY "Authenticated users can insert artists"
  ON public.artists
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their own artists"
  ON public.artists
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert events"
  ON public.events
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and admins can update events"
  ON public.events
  FOR UPDATE
  USING (
    organizer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    organizer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can insert news"
  ON public.news
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their own news"
  ON public.news
  FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Opcional: permitir que los usuarios eliminen sus propios artistas/eventos/noticias
CREATE POLICY "Users can delete their own artists"
  ON public.artists
  FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Owners and admins can delete events"
  ON public.events
  FOR DELETE
  USING (
    organizer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete their own news"
  ON public.news
  FOR DELETE
  USING (author_id = auth.uid());
