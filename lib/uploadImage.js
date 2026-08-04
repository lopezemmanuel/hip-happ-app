import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

// Sube un asset de expo-image-picker a un bucket de Supabase Storage.
// En nativo, expo-file-system + base64 es lo único que sube el archivo
// completo (fetch(uri).blob() sube 0 bytes en RN). En web, el asset.uri es un
// blob: URL en memoria que expo-file-system no sabe leer, así que ahí hay que
// usar fetch().blob() en su lugar (el problema inverso al de nativo).
// Cada filePath incluye un timestamp único (ver los `pickImage` que llaman a
// esta función): el contenido de una URL ya subida nunca cambia. Por eso se
// puede pedir cacheo agresivo (1 año) sin riesgo de servir una imagen vieja
// por error — de otro modo Supabase devuelve "Cache-Control: no-cache" por
// default, que obliga al navegador a revalidar con el servidor en cada carga
// (esa ida y vuelta es el "salto" visual antes de que aparezca la imagen).
const CACHE_CONTROL_MAX_AGE = '31536000';

export async function uploadPickedImage(bucket, filePath, asset) {
  const contentType = asset.mimeType || 'image/jpeg';

  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const { error } = await supabase.storage.from(bucket).upload(filePath, blob, { contentType, upsert: true, cacheControl: CACHE_CONTROL_MAX_AGE });
    if (error) throw error;
  } else {
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const { error } = await supabase.storage.from(bucket).upload(filePath, decode(base64), { contentType, upsert: true, cacheControl: CACHE_CONTROL_MAX_AGE });
    if (error) throw error;
  }

  return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
}
