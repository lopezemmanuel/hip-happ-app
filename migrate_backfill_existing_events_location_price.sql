-- Migración: completa latitude/longitude/price de los 2 eventos ya cargados
-- ("Festival a beneficio" y "Festival solidario"), que quedaron en null porque
-- se crearon antes de que el mapa y el precio guardaran bien (bug ya corregido).
-- Geocodifiqué la dirección real ("Parque municipal Finky, Turdera, Partido de
-- Lomas de Zamora, Buenos Aires, Argentina") contra OpenStreetMap.
-- Ejecutar en Supabase SQL Editor.

UPDATE public.events
SET
  latitude = -34.7869862,
  longitude = -58.3985095,
  price = 'Gratis'
WHERE id IN (
  'dc06c566-f9f8-4b7e-969d-6139506c85bb',
  'fa887543-f6b5-4bda-b942-ac26c21e7edb'
);
