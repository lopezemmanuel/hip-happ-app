import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadPickedImage } from '../lib/uploadImage';
import { capLineBreaks } from '../lib/textLimits';
import TagPeopleScreen from './TagPeopleScreen';
import TagLocationScreen from './TagLocationScreen';
import TagEventScreen from './TagEventScreen';

const MAX_IMAGES = 5;
const MAX_TEXT_LENGTH = 500;
const MAX_LINE_BREAKS = 20;

export default function NewPostScreen({ session, onCancel, onPosted, postToEdit }) {
  const isEditing = !!postToEdit;
  const [ownProfile, setOwnProfile] = useState(null);
  const [mode, setMode] = useState('compose'); // 'compose' | 'writing'
  const [activeSubScreen, setActiveSubScreen] = useState(null); // null | 'people' | 'location' | 'event'

  const [text, setText] = useState(postToEdit?.text || '');
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [taggedLocation, setTaggedLocation] = useState(null);
  const [taggedEvent, setTaggedEvent] = useState(null);
  const [images, setImages] = useState(postToEdit?.image_urls || []);
  const [imageAspect, setImageAspect] = useState(postToEdit?.image_aspect || 'square');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    async function loadOwnProfile() {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('users')
        .select('aka, username, avatar_url')
        .eq('id', session.user.id)
        .maybeSingle();
      if (data) setOwnProfile(data);
    }
    loadOwnProfile();
  }, [session?.user?.id]);

  const pickImage = async () => {
    if (images.length >= MAX_IMAGES) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para agregarlas a la publicación.');
      return;
    }

    // Los posteos solo admiten formato cuadrado (1080x1080) o vertical
    // (1080x1350, relación 4:5): forzamos el recorte a la relación elegida.
    // Nota: en web expo-image-picker no soporta el recorte nativo
    // (allowsEditing se ignora ahí), la foto se sube tal cual se eligió.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: imageAspect === 'portrait' ? [4, 5] : [1, 1],
      quality: 0.6,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingImage(true);
    try {
      const fileExt = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;
      const publicUrl = await uploadPickedImage('post-images', filePath, asset);
      setImages((prev) => [...prev, publicUrl]);
    } catch (err) {
      console.log('Error subiendo foto del post:', err);
      Alert.alert('Error', 'No se pudo subir la foto. Intenta de nuevo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    const trimmedText = text.trim();
    if (!trimmedText && images.length === 0) {
      Alert.alert('Publicación vacía', 'Escribí algo o agregá al menos una foto antes de publicar.');
      return;
    }

    setPosting(true);
    try {
      // Editar solo modifica texto e imágenes: la ubicación, el evento y las
      // personas etiquetadas no se tocan (no hay UI para editarlos acá).
      if (isEditing) {
        const { error } = await supabase
          .from('posts')
          .update({
            text: trimmedText || null,
            image_urls: images,
            image_aspect: imageAspect,
          })
          .eq('id', postToEdit.id);

        if (error) throw error;

        Alert.alert('Listo', 'Tu publicación fue actualizada.');
        onPosted?.({ id: postToEdit.id });
        return;
      }

      const { data: post, error } = await supabase
        .from('posts')
        .insert([{
          author_id: session.user.id,
          text: trimmedText || null,
          image_urls: images,
          image_aspect: imageAspect,
          location_name: taggedLocation?.name || null,
          location_lat: taggedLocation?.lat ?? null,
          location_lng: taggedLocation?.lng ?? null,
          tagged_event_id: taggedEvent?.id || null,
        }])
        .select('id')
        .single();

      if (error) throw error;

      if (taggedUsers.length > 0) {
        const rows = taggedUsers.map((user) => ({ post_id: post.id, user_id: user.id }));
        const { error: tagError } = await supabase.from('post_tagged_users').insert(rows);
        if (tagError) console.log('Error etiquetando usuarios:', tagError.message);
      }

      Alert.alert('Listo', 'Tu publicación fue creada.');
      onPosted?.(post);
    } catch (err) {
      console.log('Error creando/editando publicación:', err);
      Alert.alert('Error', 'No se pudo guardar la publicación. Intentá de nuevo.');
    } finally {
      setPosting(false);
    }
  };

  const displayName = ownProfile?.aka || 'Vos';

  // --- SOLAPAS DE ETIQUETADO ---
  if (activeSubScreen === 'people') {
    return (
      <TagPeopleScreen
        initialSelected={taggedUsers}
        onCancel={() => setActiveSubScreen(null)}
        onDone={(selected) => {
          setTaggedUsers(selected);
          setActiveSubScreen(null);
        }}
      />
    );
  }

  if (activeSubScreen === 'location') {
    return (
      <TagLocationScreen
        onCancel={() => setActiveSubScreen(null)}
        onSelect={(location) => {
          setTaggedLocation(location);
          setActiveSubScreen(null);
        }}
      />
    );
  }

  if (activeSubScreen === 'event') {
    return (
      <TagEventScreen
        onCancel={() => setActiveSubScreen(null)}
        onSelect={(event) => {
          setTaggedEvent(event);
          setActiveSubScreen(null);
        }}
      />
    );
  }

  // --- MODO ESCRITURA ---
  if (mode === 'writing') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#020617', zIndex: 1000 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 }}>
          <View style={{ width: 34 }} />
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>Agregar texto</Text>
          <TouchableOpacity onPress={() => setMode('compose')} style={{ padding: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: '#facc15', fontSize: 14, fontWeight: '800' }}>Listo</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {!text && (
              <MaterialCommunityIcons name="feather" size={19} color="#64748b" style={{ marginTop: 3, marginRight: 3 }} />
            )}
            <TextInput
              value={text}
              onChangeText={(value) => setText(capLineBreaks(value.slice(0, MAX_TEXT_LENGTH), MAX_LINE_BREAKS))}
              placeholder="Contanos algo..."
              placeholderTextColor="#64748b"
              multiline
              autoFocus
              textAlignVertical="top"
              style={{ flex: 1, color: '#ffffff', fontSize: 18, lineHeight: 26 }}
            />
          </View>
          <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'right', paddingBottom: 12 }}>
            {text.length}/{MAX_TEXT_LENGTH}
          </Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // --- MODO COMPOSICIÓN ---
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#020617', zIndex: 1000 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 }}>
        <TouchableOpacity onPress={onCancel} style={{ padding: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>{isEditing ? 'Editar publicación' : 'Nueva publicación'}</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        {/* AUTOR */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          {ownProfile?.avatar_url ? (
            <Image source={{ uri: ownProfile.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#1e293b' }} />
          ) : (
            <View style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="person" size={20} color="#64748b" />
            </View>
          )}
          <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }}>{displayName}</Text>
        </View>

        {/* BOTONES DE ETIQUETADO (editar solo modifica texto e imágenes) */}
        {!isEditing && (
          <>
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setActiveSubScreen('people')}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, marginRight: 10 }}
            >
              <Ionicons name="at-outline" size={16} color="#facc15" style={{ marginRight: 6 }} />
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>Persona</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveSubScreen('location')}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, marginRight: 10 }}
            >
              <Ionicons name="location-outline" size={16} color="#facc15" style={{ marginRight: 6 }} />
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>Ubicación</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveSubScreen('event')}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 }}
            >
              <Ionicons name="calendar-outline" size={16} color="#facc15" style={{ marginRight: 6 }} />
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>Evento</Text>
            </TouchableOpacity>
          </View>

          {/* RESUMEN DE LO ETIQUETADO */}
          {taggedUsers.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
              {taggedUsers.map((user) => (
                <View key={user.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(250, 204, 21, 0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, marginRight: 8, marginBottom: 8 }}>
                  <Text style={{ color: '#facc15', fontSize: 12, fontWeight: '700' }}>@{user.username || user.aka}</Text>
                  <TouchableOpacity onPress={() => setTaggedUsers((prev) => prev.filter((u) => u.id !== user.id))} style={{ marginLeft: 6 }}>
                    <Ionicons name="close" size={12} color="#facc15" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {taggedLocation && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(250, 204, 21, 0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10, alignSelf: 'flex-start' }}>
              <Ionicons name="location" size={12} color="#facc15" style={{ marginRight: 6 }} />
              <Text style={{ color: '#facc15', fontSize: 12, fontWeight: '700', maxWidth: 220 }} numberOfLines={1}>{taggedLocation.name}</Text>
              <TouchableOpacity onPress={() => setTaggedLocation(null)} style={{ marginLeft: 6 }}>
                <Ionicons name="close" size={12} color="#facc15" />
              </TouchableOpacity>
            </View>
          )}

          {taggedEvent && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(250, 204, 21, 0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10, alignSelf: 'flex-start' }}>
              <Ionicons name="calendar" size={12} color="#facc15" style={{ marginRight: 6 }} />
              <Text style={{ color: '#facc15', fontSize: 12, fontWeight: '700', maxWidth: 220 }} numberOfLines={1}>{taggedEvent.title}</Text>
              <TouchableOpacity onPress={() => setTaggedEvent(null)} style={{ marginLeft: 6 }}>
                <Ionicons name="close" size={12} color="#facc15" />
              </TouchableOpacity>
            </View>
          )}
          </>
        )}

        {/* TEXTO */}
        <TouchableOpacity onPress={() => setMode('writing')} style={{ marginTop: 8, marginBottom: 20 }}>
          {text ? (
            <Text style={{ color: '#ffffff', fontSize: 15, lineHeight: 22 }}>{text}</Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="feather" size={18} color="#64748b" style={{ marginRight: 3 }} />
              <Text style={{ color: '#64748b', fontSize: 17, fontStyle: 'italic' }}>Contanos algo...</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* FORMATO DE IMAGEN: cuadrada (1080x1080) o vertical (1080x1350) */}
        <View style={{ flexDirection: 'row', marginBottom: 10, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setImageAspect('square')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: imageAspect === 'square' ? 'rgba(250, 204, 21, 0.15)' : '#0f172a',
              borderColor: imageAspect === 'square' ? '#facc15' : '#1e293b',
              borderWidth: 1,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Ionicons name="square-outline" size={14} color={imageAspect === 'square' ? '#facc15' : '#94a3b8'} style={{ marginRight: 6 }} />
            <Text style={{ color: imageAspect === 'square' ? '#facc15' : '#94a3b8', fontSize: 11, fontWeight: '700' }}>Cuadrada (1080x1080)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setImageAspect('portrait')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: imageAspect === 'portrait' ? 'rgba(250, 204, 21, 0.15)' : '#0f172a',
              borderColor: imageAspect === 'portrait' ? '#facc15' : '#1e293b',
              borderWidth: 1,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <MaterialCommunityIcons name="rectangle-outline" size={14} color={imageAspect === 'portrait' ? '#facc15' : '#94a3b8'} style={{ marginRight: 6 }} />
            <Text style={{ color: imageAspect === 'portrait' ? '#facc15' : '#94a3b8', fontSize: 11, fontWeight: '700' }}>Vertical (1080x1350)</Text>
          </TouchableOpacity>
        </View>

        {/* CARRUSEL DE FOTOS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {images.map((url, index) => (
            <View key={url} style={{ marginRight: 10, position: 'relative' }}>
              <Image source={{ uri: url }} style={{ width: 90, height: imageAspect === 'portrait' ? 112 : 90, borderRadius: 14, backgroundColor: '#1e293b' }} />
              <TouchableOpacity
                onPress={() => removeImage(index)}
                style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#020617' }}
              >
                <Ionicons name="close" size={12} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ))}

          {images.length < MAX_IMAGES && (
            <TouchableOpacity
              onPress={pickImage}
              disabled={uploadingImage}
              style={{ width: 90, height: imageAspect === 'portrait' ? 112 : 90, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#334155', alignItems: 'center', justifyContent: 'center' }}
            >
              {uploadingImage ? (
                <ActivityIndicator color="#facc15" />
              ) : (
                <>
                  <Ionicons name="image-outline" size={22} color="#94a3b8" />
                  <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', marginTop: 4 }}>{images.length}/{MAX_IMAGES}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <TouchableOpacity
          onPress={handlePublish}
          disabled={posting}
          style={{ backgroundColor: '#facc15', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
        >
          {posting ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={{ color: '#000000', fontWeight: '800', fontSize: 15 }}>{isEditing ? 'Guardar cambios' : 'Publicar'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
