import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadPickedImage } from '../lib/uploadImage';

const DISCIPLINES_LIST = [
  'Agente', 'B-Boy', 'B-Girl', 'Beatboxer', 'Beatmaker', 'Breaker',
  'DJ', 'Freestyler', 'Grafitero', 'Host', 'Manager', 'MC',
  'Photograph', 'Productor', 'Productora', 'Rapper', 'Turntablism',
  'Videograph', 'Writer',
];

const stripHandle = (value) => value.trim().replace(/^@+/, '');

const isValidHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const hostMatches = (value, domains) => {
  try {
    const host = new URL(value).hostname.replace(/^www\./, '');
    return domains.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
};

const SOCIAL_DOMAINS = {
  Facebook: ['facebook.com', 'fb.com'],
  Spotify: ['spotify.com'],
  SoundCloud: ['soundcloud.com'],
  YouTube: ['youtube.com', 'youtu.be'],
};

// Valida un link con dominio esperado, para no guardar links rotos o de otro sitio ("evitar virus, errores").
const validateSocialUrl = (rawValue, platformLabel) => {
  const value = rawValue.trim();
  if (!value) return { ok: true, value: '' };
  if (!isValidHttpUrl(value)) {
    return { ok: false, message: `El link de ${platformLabel} tiene que ser una URL válida (empezar con https://).` };
  }
  const domains = SOCIAL_DOMAINS[platformLabel];
  if (domains && !hostMatches(value, domains)) {
    return { ok: false, message: `Ese link no parece apuntar a ${platformLabel}. Revisalo.` };
  }
  return { ok: true, value };
};

// Valida un @usuario (Instagram / X): saca el @ si lo escribieron, chequea formato.
const validateHandle = (rawValue, platformLabel) => {
  const value = stripHandle(rawValue);
  if (!value) return { ok: true, value: '' };
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(value)) {
    return { ok: false, message: `El usuario de ${platformLabel} tiene caracteres inválidos.` };
  }
  return { ok: true, value };
};

// Nombre de usuario de la app: solo minúsculas, números, guiones bajos y puntos. Máximo 24 caracteres.
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

export default function EditProfileScreen({ session, onDone }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [aka, setAka] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [originalFullName, setOriginalFullName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [disciplines, setDisciplines] = useState([]);

  const [instagramUsername, setInstagramUsername] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [xUsername, setXUsername] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [soundcloudUrl, setSoundcloudUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [usernameMessage, setUsernameMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('full_name, first_name, last_name, aka, username, bio, location, avatar_url, disciplines, instagram_username, facebook_url, x_username, spotify_url, soundcloud_url, youtube_url, website_url')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!error && data) {
        setUsername(data.username || '');
        setOriginalUsername((data.username || '').toLowerCase());
        setAka(data.aka || '');
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setOriginalFullName(data.full_name || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setAvatarUrl(data.avatar_url || null);
        setDisciplines(data.disciplines || []);
        setInstagramUsername(data.instagram_username || '');
        setFacebookUrl(data.facebook_url || '');
        setXUsername(data.x_username || '');
        setSpotifyUrl(data.spotify_url || '');
        setSoundcloudUrl(data.soundcloud_url || '');
        setYoutubeUrl(data.youtube_url || '');
        setWebsiteUrl(data.website_url || '');
      }
      setLoading(false);
    }

    loadProfile();
  }, [session?.user?.id]);

  const checkUsername = async (value) => {
    const normalized = sanitizeUsername(value);

    if (!normalized || normalized === originalUsername) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return true;
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
      checkUsername(username);
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

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

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para cambiar tu foto de perfil.');
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
      const fileExt = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;
      const publicUrl = await uploadPickedImage('avatars', filePath, asset);
      setAvatarUrl(publicUrl);
    } catch (err) {
      console.log('Error subiendo avatar:', err);
      Alert.alert('Error', 'No se pudo subir la foto. Intenta de nuevo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    const normalizedUsername = sanitizeUsername(username);
    if (normalizedUsername && normalizedUsername !== originalUsername) {
      const available = await checkUsername(normalizedUsername);
      if (!available) {
        Alert.alert('Usuario no disponible', 'Elegí otro nombre de usuario para continuar.');
        return;
      }
    }

    const firstCheck = validateNamePart(firstName, 'Nombre/s');
    if (!firstCheck.ok) return Alert.alert('Nombre inválido', firstCheck.message);
    const lastCheck = validateNamePart(lastName, 'Apellido/s');
    if (!lastCheck.ok) return Alert.alert('Apellido inválido', lastCheck.message);

    const igCheck = validateHandle(instagramUsername, 'Instagram');
    if (!igCheck.ok) return Alert.alert('Instagram inválido', igCheck.message);
    const xCheck = validateHandle(xUsername, 'X');
    if (!xCheck.ok) return Alert.alert('X inválido', xCheck.message);
    const fbCheck = validateSocialUrl(facebookUrl, 'Facebook');
    if (!fbCheck.ok) return Alert.alert('Facebook inválido', fbCheck.message);
    const spCheck = validateSocialUrl(spotifyUrl, 'Spotify');
    if (!spCheck.ok) return Alert.alert('Spotify inválido', spCheck.message);
    const scCheck = validateSocialUrl(soundcloudUrl, 'SoundCloud');
    if (!scCheck.ok) return Alert.alert('SoundCloud inválido', scCheck.message);
    const ytCheck = validateSocialUrl(youtubeUrl, 'YouTube');
    if (!ytCheck.ok) return Alert.alert('YouTube inválido', ytCheck.message);

    const trimmedWebsite = websiteUrl.trim();
    if (trimmedWebsite && !isValidHttpUrl(trimmedWebsite)) {
      Alert.alert('Web inválida', 'El link de tu web tiene que ser una URL válida (empezar con https://).');
      return;
    }

    const combinedFullName = `${firstCheck.value} ${lastCheck.value}`.trim();

    setSaving(true);
    try {
      const updatedFields = {
        username: normalizedUsername || null,
        aka: aka.trim().slice(0, 24) || null,
        first_name: firstCheck.value || null,
        last_name: lastCheck.value || null,
        full_name: combinedFullName || originalFullName || session.user.email,
        bio: bio.trim(),
        location: location.trim().slice(0, 60) || null,
        avatar_url: avatarUrl,
        disciplines,
        instagram_username: igCheck.value || null,
        facebook_url: fbCheck.value || null,
        x_username: xCheck.value || null,
        spotify_url: spCheck.value || null,
        soundcloud_url: scCheck.value || null,
        youtube_url: ytCheck.value || null,
        website_url: trimmedWebsite || null,
      };

      const { data, error } = await supabase
        .from('users')
        .update(updatedFields)
        .eq('id', session.user.id)
        .select('id');

      if (error) throw error;

      if (!data || data.length === 0) {
        Alert.alert(
          'No se pudo guardar',
          'Tu sesión no tiene permiso para editar este perfil. Cerrá sesión y volvé a entrar, o avisá al soporte si persiste.'
        );
        return;
      }

      Alert.alert('Listo', 'Tu perfil fue actualizado.');
      onDone?.(updatedFields);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#020617' }}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 50, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '800' }}>Editar perfil</Text>
          <TouchableOpacity onPress={() => onDone?.()} style={{ padding: 6 }}>
            <Ionicons name="close" size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* FOTO DE PERFIL */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar} style={{ position: 'relative' }}>
            <Image
              source={{
                uri: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
              }}
              style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#facc15' }}
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
        </View>

        {/* NOMBRE DE USUARIO (con @) */}
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
          maxLength={24}
          placeholder="Ej: MC Kraken"
          placeholderTextColor="#64748b"
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

        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Bio</Text>
        <TextInput
          value={bio}
          onChangeText={(text) => setBio(text.slice(0, 150))}
          placeholder="Contá algo sobre vos..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={3}
          maxLength={150}
          style={{
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 12,
            color: '#ffffff',
            height: 80,
            textAlignVertical: 'top',
            marginBottom: 4,
          }}
        />
        <Text style={{ color: '#64748b', fontSize: 11, marginBottom: 16 }}>{bio.length}/150</Text>

        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Ubicación</Text>
        <TextInput
          value={location}
          onChangeText={(text) => setLocation(text.slice(0, 60))}
          placeholder="Ej: Buenos Aires, AR"
          placeholderTextColor="#64748b"
          style={inputStyle}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Disciplinas</Text>
          <Text style={{ color: '#facc15', fontSize: 12, fontWeight: '700' }}>{disciplines.length}/2</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
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

        {/* REDES SOCIALES */}
        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800', marginBottom: 4 }}>Redes sociales</Text>
        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 16 }}>
          Opcional. Revisamos que cada link apunte de verdad a esa red.
        </Text>

        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Instagram</Text>
        <View style={handleInputRowStyle}>
          <Text style={{ color: '#facc15', fontWeight: '800', fontSize: 15, marginRight: 2 }}>@</Text>
          <TextInput
            value={instagramUsername}
            onChangeText={setInstagramUsername}
            placeholder="Ej: mc_kraken"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            style={{ flex: 1, color: '#ffffff', paddingVertical: 12 }}
          />
        </View>

        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Facebook</Text>
        <TextInput
          value={facebookUrl}
          onChangeText={setFacebookUrl}
          placeholder="https://facebook.com/tu.perfil"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          keyboardType="url"
          style={inputStyle}
        />

        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>X</Text>
        <View style={handleInputRowStyle}>
          <Text style={{ color: '#facc15', fontWeight: '800', fontSize: 15, marginRight: 2 }}>@</Text>
          <TextInput
            value={xUsername}
            onChangeText={setXUsername}
            placeholder="Ej: mc_kraken"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            style={{ flex: 1, color: '#ffffff', paddingVertical: 12 }}
          />
        </View>

        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Spotify</Text>
        <TextInput
          value={spotifyUrl}
          onChangeText={setSpotifyUrl}
          placeholder="https://open.spotify.com/artist/..."
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          keyboardType="url"
          style={inputStyle}
        />

        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>SoundCloud</Text>
        <TextInput
          value={soundcloudUrl}
          onChangeText={setSoundcloudUrl}
          placeholder="https://soundcloud.com/tu-usuario"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          keyboardType="url"
          style={inputStyle}
        />

        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>YouTube</Text>
        <TextInput
          value={youtubeUrl}
          onChangeText={setYoutubeUrl}
          placeholder="https://youtube.com/@tu-canal"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          keyboardType="url"
          style={inputStyle}
        />

        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Web</Text>
        <TextInput
          value={websiteUrl}
          onChangeText={setWebsiteUrl}
          placeholder="https://tusitio.com"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          keyboardType="url"
          style={[inputStyle, { marginBottom: 24 }]}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{ backgroundColor: '#facc15', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
        >
          {saving ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={{ color: '#000000', fontWeight: '800', fontSize: 15 }}>Guardar cambios</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
