import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Guarda el último perfil conocido de cada cuenta en este dispositivo, para
// poder pintar el avatar/nombre en el primer render (sin esperar la consulta
// a Supabase) en vez de mostrar un estado vacío o una foto genérica.
const keyFor = (userId) => `hiphapp_profile_cache_${userId}`;

// En web, localStorage es sincrónico: se puede leer ANTES del primer pintado
// (como valor inicial de un useState), lo que evita el flash por completo.
// En nativo no hay forma sincrónica, así que ahí solo se usa la versión async.
export function getCachedProfileSync(userId) {
  if (!userId || Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function getCachedProfile(userId) {
  if (!userId) return null;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return getCachedProfileSync(userId);
  }
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setCachedProfile(userId, profile) {
  if (!userId || !profile) return;
  const raw = JSON.stringify(profile);
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(keyFor(userId), raw);
    } catch {
      // Ignorar (ej: localStorage lleno o deshabilitado)
    }
    return;
  }
  try {
    await AsyncStorage.setItem(keyFor(userId), raw);
  } catch {
    // Ignorar
  }
}
