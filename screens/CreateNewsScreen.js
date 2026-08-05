import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadPickedImage } from '../lib/uploadImage';
import { capLineBreaks } from '../lib/textLimits';

const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 1000;
const MAX_CONTENT_LINE_BREAKS = 25;

export default function CreateNewsScreen({ session, onCancel, onDone, noteToEdit }) {
  const isEditing = !!noteToEdit;
  const [title, setTitle] = useState(noteToEdit?.title || '');
  const [content, setContent] = useState(noteToEdit?.content || '');
  const [imageUrl, setImageUrl] = useState(noteToEdit?.image_url || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para agregar una imagen de portada.');
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
    setUploadingImage(true);
    try {
      const fileExt = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;
      const publicUrl = await uploadPickedImage('news-images', filePath, asset);
      setImageUrl(publicUrl);
    } catch (err) {
      console.log('Error subiendo imagen de la nota:', err);
      Alert.alert('Error', 'No se pudo subir la imagen. Intenta de nuevo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePublish = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
      Alert.alert('Campos incompletos', 'Completá el título y el contenido antes de publicar.');
      return;
    }

    setSaving(true);
    try {
      const { error } = isEditing
        ? await supabase.from('news').update({
            title: trimmedTitle,
            content: trimmedContent,
            image_url: imageUrl,
          }).eq('id', noteToEdit.id)
        : await supabase.from('news').insert([{
            title: trimmedTitle,
            content: trimmedContent,
            image_url: imageUrl,
            author_id: session.user.id,
          }]);

      if (error) throw error;

      Alert.alert('Listo', isEditing ? 'Tu nota fue actualizada.' : 'Tu nota fue publicada.');
      onDone?.();
    } catch (err) {
      console.log('Error guardando la nota:', err);
      Alert.alert('Error', 'No se pudo guardar la nota. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, width: '100%' }}>
      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '800' }}>{isEditing ? 'Editar nota' : 'Nueva nota'}</Text>
          <TouchableOpacity onPress={onCancel} style={{ padding: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
          Se publica en Comunidad → Blog & Notas, y en el Home de todos los usuarios.
        </Text>

        {/* IMAGEN DE PORTADA */}
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Imagen de portada (opcional)</Text>
        {imageUrl ? (
          <View style={{ marginBottom: 20 }}>
            <Image source={{ uri: imageUrl }} style={{ width: '100%', aspectRatio: 1, borderRadius: 14, backgroundColor: '#1e293b' }} contentFit="cover" />
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity
                onPress={pickImage}
                disabled={uploadingImage}
                style={{ backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8 }}
              >
                {uploadingImage ? <ActivityIndicator size="small" color="#facc15" /> : <Text style={{ color: '#facc15', fontWeight: '700', fontSize: 12 }}>Cambiar</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setImageUrl(null)}
                style={{ backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={pickImage}
            disabled={uploadingImage}
            style={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderWidth: 1,
              borderRadius: 14,
              paddingVertical: 24,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            {uploadingImage ? (
              <ActivityIndicator color="#facc15" />
            ) : (
              <>
                <Ionicons name="image-outline" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                <Text style={{ color: '#94a3b8', fontWeight: '700', fontSize: 13 }}>Elegir imagen desde el dispositivo</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* TÍTULO */}
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Título</Text>
        <TextInput
          value={title}
          onChangeText={(text) => setTitle(text.slice(0, MAX_TITLE_LENGTH))}
          placeholder="Ej: Anuncian la fecha de la Final Nacional de Freestyle"
          placeholderTextColor="#64748b"
          style={{
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 12,
            color: '#ffffff',
            marginBottom: 4,
          }}
        />
        <Text style={{ color: '#64748b', fontSize: 11, marginBottom: 16, textAlign: 'right' }}>{title.length}/{MAX_TITLE_LENGTH}</Text>

        {/* CONTENIDO */}
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Contenido</Text>
        <TextInput
          value={content}
          onChangeText={(text) => setContent(capLineBreaks(text.slice(0, MAX_CONTENT_LENGTH), MAX_CONTENT_LINE_BREAKS))}
          placeholder="Contá la noticia o nota..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={8}
          maxLength={MAX_CONTENT_LENGTH}
          style={{
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 12,
            color: '#ffffff',
            height: 180,
            textAlignVertical: 'top',
            marginBottom: 4,
          }}
        />
        <Text style={{ color: '#64748b', fontSize: 11, marginBottom: 24, textAlign: 'right' }}>{content.length}/{MAX_CONTENT_LENGTH}</Text>

        <TouchableOpacity
          onPress={handlePublish}
          disabled={saving}
          style={{ backgroundColor: '#facc15', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
        >
          {saving ? <ActivityIndicator color="#000000" /> : <Text style={{ color: '#000000', fontWeight: '800', fontSize: 15 }}>{isEditing ? 'Guardar cambios' : 'Publicar nota'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
