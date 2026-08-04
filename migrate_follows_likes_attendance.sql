-- Migración: sistema de seguidores, likes en posteos y "Asistiré" en eventos.
-- Ejecutar en Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);

CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.event_attendance (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_followed_id ON public.follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON public.event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_user_id ON public.event_attendance(user_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can follow as themselves"
  ON public.follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow their own follows"
  ON public.follows FOR DELETE
  USING (follower_id = auth.uid());

CREATE POLICY "Post likes are viewable by everyone"
  ON public.post_likes FOR SELECT USING (true);

CREATE POLICY "Users can like as themselves"
  ON public.post_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike their own likes"
  ON public.post_likes FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Event attendance is viewable by everyone"
  ON public.event_attendance FOR SELECT USING (true);

CREATE POLICY "Users can mark attendance as themselves"
  ON public.event_attendance FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own attendance"
  ON public.event_attendance FOR DELETE
  USING (user_id = auth.uid());
