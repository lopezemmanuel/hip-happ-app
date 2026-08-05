-- Los posteos solo admiten dos formatos de imagen (como Instagram):
-- cuadrada (1080x1080) o vertical (1080x1350). El formato se elige una vez
-- por posteo y aplica a todo el carrusel.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS image_aspect TEXT NOT NULL DEFAULT 'square'
  CHECK (image_aspect IN ('square', 'portrait'));
