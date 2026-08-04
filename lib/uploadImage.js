import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

// Sube un asset de expo-image-picker a un bucket de Supabase Storage.
// En nativo, expo-file-system + base64 es lo único que sube el archivo
// completo (fetch(uri).blob() sube 0 bytes en RN). En web, el asset.uri es un
// blob: URL en memoria que expo-file-system no sabe leer, así que ahí hay que
// usar fetch().blob() en su lugar (el problema inverso al de nativo).
export async function uploadPickedImage(bucket, filePath, asset) {
  const contentType = asset.mimeType || 'image/jpeg';

  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const { error } = await supabase.storage.from(bucket).upload(filePath, blob, { contentType, upsert: true });
    if (error) throw error;
  } else {
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const { error } = await supabase.storage.from(bucket).upload(filePath, decode(base64), { contentType, upsert: true });
    if (error) throw error;
  }

  return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
}
