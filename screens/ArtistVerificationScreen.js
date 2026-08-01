import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';

export default function ArtistVerificationScreen() {
  const [realName, setRealName] = useState('');
  const [artisticName, setArtisticName] = useState('');
  const [genre, setGenre] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!realName || !artisticName || !genre || !socialLink) {
      Alert.alert('Atención', 'Por favor completa todos los campos.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('artist_verifications')
        .insert([
          {
            real_name: realName,
            artistic_name: artisticName,
            genre: genre,
            social_link: socialLink,
          },
        ]);

      if (error) throw error;

      Alert.alert('¡Éxito!', 'Tu solicitud de verificación se envió correctamente.');
      
      // Limpiar formulario
      setRealName('');
      setArtisticName('');
      setGenre('');
      setSocialLink('');
    } catch (error) {
      Alert.alert('Error al enviar', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 p-4">
      <View className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <Text className="text-white text-2xl font-bold mb-2">Verificación de artista</Text>
        <Text className="text-gray-400 mb-6">
          Completa este formulario para validar tu perfil dentro de la comunidad Hip Hop.
        </Text>

        <Text className="text-gray-300 font-medium mb-1">Nombre real</Text>
        <TextInput
          className="bg-slate-800/80 text-white p-3 rounded-xl mb-4 border border-slate-700"
          placeholder="Tu nombre"
          placeholderTextColor="#6b7280"
          value={realName}
          onChangeText={setRealName}
        />

        <Text className="text-gray-300 font-medium mb-1">Nombre artístico</Text>
        <TextInput
          className="bg-slate-800/80 text-white p-3 rounded-xl mb-4 border border-slate-700"
          placeholder="Alias o nombre artístico"
          placeholderTextColor="#6b7280"
          value={artisticName}
          onChangeText={setArtisticName}
        />

        <Text className="text-gray-300 font-medium mb-1">Género / estilo</Text>
        <TextInput
          className="bg-slate-800/80 text-white p-3 rounded-xl mb-4 border border-slate-700"
          placeholder="Trap, Boom Bap, Underground..."
          placeholderTextColor="#6b7280"
          value={genre}
          onChangeText={setGenre}
        />

        <Text className="text-gray-300 font-medium mb-1">Red social o enlace</Text>
        <TextInput
          className="bg-slate-800/80 text-white p-3 rounded-xl mb-6 border border-slate-700"
          placeholder="Instagram, Spotify, YouTube..."
          placeholderTextColor="#6b7280"
          value={socialLink}
          onChangeText={setSocialLink}
        />

        <TouchableOpacity
          className="bg-fuchsia-600 p-4 rounded-xl items-center active:opacity-80"
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">Enviar verificación</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}