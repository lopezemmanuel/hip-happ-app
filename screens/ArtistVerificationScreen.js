import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

// Solo minúsculas, números, guiones bajos y puntos. Máximo 24 caracteres.
const sanitizeUsername = (value) => value.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 24);

// Letras (con acentos/ñ), espacios, guiones y apóstrofos — lo habitual para nombres propios.
const NAME_REGEX = /^[\p{L}\s'-]+$/u;
const validateNamePart = (value, label) => {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: '' };
  if (trimmed.length > 50) return { ok: false, message: `${label} no puede superar los 50 caracteres.` };
  if (!NAME_REGEX.test(trimmed)) return { ok: false, message: `${label} solo puede tener letras, espacios, guiones y apóstrofos.` };
  return { ok: true, value: trimmed };
};

// Misma lista y orden que en Editar Perfil — comparten la columna disciplines.
const DISCIPLINES_LIST = [
  'Agente', 'B-Boy', 'B-Girl', 'Beatboxer', 'Beatmaker', 'Breaker',
  'DJ', 'Freestyler', 'Grafitero', 'Host', 'Manager', 'MC',
  'Photograph', 'Productor', 'Productora', 'Rapper', 'Turntablism',
  'Videograph', 'Writer',
];

export default function ArtistVerificationScreen({ session, onCancel, onDone }) {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [usernameMessage, setUsernameMessage] = useState('');

  const [aka, setAka] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [disciplines, setDisciplines] = useState([]);
  const [socialLink, setSocialLink] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleDiscipline = (item) => {
    setDisciplines((prev) => {
      if (prev.includes(item)) return prev.filter((d) => d !== item);
      if (prev.length >= 2) {
        Alert.alert('Límite alcanzado', 'Solo podés elegir hasta 2 disciplinas.');
        return prev;
      }
      return [...prev, item];
    });
  };

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.id) {
        setLoadingProfile(false);
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('avatar_url, username, aka, first_name, last_name, disciplines')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!error && data) {
        setAvatarUrl(data.avatar_url || null);
        setUsername(data.username || '');
        setOriginalUsername((data.username || '').toLowerCase());
        setAka(data.aka || '');
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setDisciplines(data.disciplines || []);
      }
      setLoadingProfile(false);
    }

    loadProfile();
  }, [session?.user?.id]);

  const checkUsername = async (value) => {
    const normalized = sanitizeUsername(value);
    if (!normalized || normalized === originalUsername) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return !!normalized;
    }
    if (normalized.length < 3) {
      setUsernameStatus('idle');
      setUsernameMessage('Usa al menos 3 caracteres.');
      return false;
    }
    setUsernameStatus('checking');
    const { data } = await supabase
      .from('users')
      .select('username')
      .eq('username', normalized)
      .maybeSingle();

    const available = !data;
    setUsernameStatus(available ? 'available' : 'taken');
    setUsernameMessage(available ? 'Nombre de usuario disponible' : 'Ese nombre de usuario ya está en uso.');
    return available;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.trim()) checkUsername(username);
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para tu foto de perfil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const fileExt = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const filePath = `${session?.user?.id || 'anon'}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), { contentType: asset.mimeType || 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (err) {
      console.log('Error subiendo avatar:', err);
      Alert.alert('Error', 'No se pudo subir la foto. Intenta de nuevo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async () => {
    const normalizedUsername = sanitizeUsername(username);

    if (!avatarUrl || !normalizedUsername || !aka.trim() || !firstName.trim() || !lastName.trim() || !socialLink.trim()) {
      Alert.alert('Atención', 'Por favor completa todos los campos, incluida la foto de perfil.');
      return;
    }

    if (disciplines.length === 0) {
      Alert.alert('Elegí una disciplina', 'Seleccioná al menos 1 disciplina (hasta 2).');
      return;
    }

    const firstCheck = validateNamePart(firstName, 'Nombre/s');
    if (!firstCheck.ok) return Alert.alert('Nombre inválido', firstCheck.message);
    const lastCheck = validateNamePart(lastName, 'Apellido/s');
    if (!lastCheck.ok) return Alert.alert('Apellido inválido', lastCheck.message);

    const isAvailable = await checkUsername(normalizedUsername);
    if (!isAvailable) {
      Alert.alert('Usuario no disponible', 'Elegí otro nombre de usuario para continuar.');
      return;
    }

    setLoading(true);

    try {
      const fullName = `${firstCheck.value} ${lastCheck.value}`.trim();

      // Estos campos son compartidos con "Editar Perfil": se guardan en el perfil real del usuario.
      // is_validated en true de una: en esta etapa no hay revisión manual todavía.
      const { error: profileError } = await supabase
        .from('users')
        .update({
          avatar_url: avatarUrl,
          username: normalizedUsername,
          aka: aka.trim().slice(0, 24),
          first_name: firstCheck.value,
          last_name: lastCheck.value,
          full_name: fullName,
          disciplines,
          is_validated: true,
        })
        .eq('id', session?.user?.id);

      if (profileError) throw profileError;

      const { error } = await supabase
        .from('artist_verifications')
        .insert([
          {
            user_id: session?.user?.id || null,
            real_name: fullName,
            artistic_name: aka.trim().slice(0, 24),
            genre: disciplines.join(', '),
            social_link: socialLink.trim(),
            status: 'approved',
          },
        ]);

      if (error) throw error;

      Alert.alert('¡Éxito!', 'Tu perfil fue validado. Ya podés publicar tu primer evento.');
      onDone?.({ is_validated: true });
    } catch (error) {
      Alert.alert('Error al enviar', error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#ffffff',
    marginBottom: 16,
  };

  const handleInputRowStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  };

  if (loadingProfile) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#020617' }}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 50, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '800' }}>Validar mi perfil</Text>
          <TouchableOpacity onPress={() => onCancel?.()} style={{ padding: 6 }}>
            <Ionicons name="close" size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
          Completa este formulario para validar tu perfil dentro de la comunidad Hip-Happ. Todos los campos son obligatorios.
        </Text>

        {/* FOTO DE PERFIL */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar} style={{ position: 'relative' }}>
            <Image
              source={{
                uri: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
              }}
              style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: avatarUrl ? '#facc15' : '#ef4444' }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: '#facc15',
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#020617',
              }}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Ionicons name="camera" size={16} color="#000000" />
              )}
            </View>
          </TouchableOpacity>
          {!avatarUrl && (
            <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 6 }}>Obligatorio</Text>
          )}
        </View>

        {/* NOMBRE DE USUARIO */}
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Nombre de usuario</Text>
        <View style={handleInputRowStyle}>
          <Text style={{ color: '#facc15', fontWeight: '800', fontSize: 15, marginRight: 2 }}>@</Text>
          <TextInput
            value={username}
            onChangeText={(text) => setUsername(sanitizeUsername(text))}
            placeholder="Ej: mc_kraken"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            maxLength={24}
            style={{ flex: 1, color: '#ffffff', paddingVertical: 12 }}
          />
        </View>
        <Text
          style={{
            marginTop: -12,
            marginBottom: 16,
            fontSize: 12,
            fontWeight: '600',
            color: usernameStatus === 'available' ? '#4ade80' : usernameStatus === 'taken' ? '#fb7185' : '#94a3b8',
          }}
        >
          {usernameMessage || ' '}
        </Text>

        {/* A.K.A. */}
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>A.K.A.</Text>
        <TextInput
          value={aka}
          onChangeText={(text) => setAka(text.slice(0, 24))}
          placeholder="Ej: MC Kraken"
          placeholderTextColor="#64748b"
          maxLength={24}
          style={inputStyle}
        />

        {/* NOMBRE/S */}
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Nombre/s</Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Ej: Juan"
          placeholderTextColor="#64748b"
          style={inputStyle}
        />

        {/* APELLIDO/S */}
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Apellido/s</Text>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Ej: Pérez"
          placeholderTextColor="#64748b"
          style={inputStyle}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Disciplinas</Text>
          <Text style={{ color: disciplines.length === 0 ? '#ef4444' : '#facc15', fontSize: 12, fontWeight: '700' }}>
            {disciplines.length}/2 {disciplines.length === 0 ? '(obligatorio)' : ''}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {DISCIPLINES_LIST.map((item) => {
            const isSelected = disciplines.includes(item);
            return (
              <TouchableOpacity
                key={item}
                onPress={() => toggleDiscipline(item)}
                style={{
                  backgroundColor: isSelected ? '#facc15' : '#0f172a',
                  borderColor: isSelected ? '#facc15' : '#334155',
                  borderWidth: 1,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: isSelected ? '#000000' : '#cbd5e1', fontWeight: isSelected ? '800' : '600', fontSize: 13 }}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Red social o enlace</Text>
        <TextInput
          value={socialLink}
          onChangeText={setSocialLink}
          placeholder="Instagram, Spotify, YouTube..."
          placeholderTextColor="#64748b"
          style={[inputStyle, { marginBottom: 24 }]}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{ backgroundColor: '#facc15', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
        >
          {loading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={{ color: '#000000', fontWeight: '800', fontSize: 15 }}>Enviar validación</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
