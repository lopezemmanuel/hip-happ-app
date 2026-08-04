-- Hip-Happ Supabase schema
-- Tablas principales para usuarios, artistas, eventos y noticias

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios autenticados
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  aka TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'artist', 'admin')),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_validated BOOLEAN NOT NULL DEFAULT FALSE,
  disciplines TEXT[] DEFAULT '{}',
  instagram_username TEXT,
  facebook_url TEXT,
  x_username TEXT,
  spotify_url TEXT,
  soundcloud_url TEXT,
  youtube_url TEXT,
  website_url TEXT,
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

-- Tabla de solicitudes de validación de perfil ("Perfil Validado")
CREATE TABLE IF NOT EXISTS public.artist_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  real_name TEXT NOT NULL,
  artistic_name TEXT NOT NULL,
  genre TEXT NOT NULL,
  social_link TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de publicaciones ("Nueva publicación" / Spit yo' mind). Un usuario
-- puede fijar como máximo un post O un evento a la vez (se controla desde la
-- app: al fijar uno se desfijan todos los demás posts y eventos suyos).
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

-- Seguidores
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);

-- Likes en posteos
CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- "Asistiré" en eventos
CREATE TABLE IF NOT EXISTS public.event_attendance (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
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

-- Mantiene updated_at al día en cada UPDATE (el DEFAULT NOW() solo aplica al insertar)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.artists;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.artists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.events;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.news;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.posts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON public.artists(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_news_published ON public.news(published);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at);
CREATE INDEX IF NOT EXISTS idx_post_tagged_users_user_id ON public.post_tagged_users(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_id ON public.follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON public.event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_user_id ON public.event_attendance(user_id);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tagged_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

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

-- Posts: lectura pública, escritura y borrado solo del autor
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

-- Seguidores
CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can follow as themselves"
  ON public.follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow their own follows"
  ON public.follows FOR DELETE
  USING (follower_id = auth.uid());

-- Likes en posteos
CREATE POLICY "Post likes are viewable by everyone"
  ON public.post_likes FOR SELECT USING (true);

CREATE POLICY "Users can like as themselves"
  ON public.post_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike their own likes"
  ON public.post_likes FOR DELETE
  USING (user_id = auth.uid());

-- "Asistiré" en eventos
CREATE POLICY "Event attendance is viewable by everyone"
  ON public.event_attendance FOR SELECT USING (true);

CREATE POLICY "Users can mark attendance as themselves"
  ON public.event_attendance FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own attendance"
  ON public.event_attendance FOR DELETE
  USING (user_id = auth.uid());

-- Solicitudes de validación de perfil: el usuario ve/crea las suyas, los admins ven/editan todas
CREATE POLICY "Users can view their own verification requests"
  ON public.artist_verifications
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert their own verification requests"
  ON public.artist_verifications
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update verification requests"
  ON public.artist_verifications
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
