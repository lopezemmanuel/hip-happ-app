import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

// URL obtenida de tu proyecto de Supabase
const supabaseUrl = 'https://eqilqcyywmfesvegzduz.supabase.co';

// ⚠️ REEMPLAZÁ ESTE TEXTO POR TU ANON/PUBLIC KEY OBTENIDA DE SUPABASE:
// Ir a: Project Settings (icono de engranaje ⚙️) -> API -> "anon" "public" key
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaWxxY3l5d21mZXN2ZWd6ZHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NTE2NjQsImV4cCI6MjEwMTEyNzY2NH0.w6cPBEEIykirUSIKaSCWpu2NURhX1LIJNKwdo2MNLbk';

const storage = Platform.OS === 'web' && typeof window !== 'undefined'
  ? window.localStorage
  : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});