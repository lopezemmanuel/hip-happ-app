import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadPickedImage } from '../lib/uploadImage';
import EventsMap from '../components/EventsMap';

const EVENT_TYPES = ['Freestyle', 'Show', 'Batallas', 'Dance', 'DJing', 'Jam', 'Cypher', 'Breaking', 'Festival', 'Taller', 'Expo', 'Graffiti', 'Street art', 'Encuentro'];

const parseEventTimeFromDescription = (description) => {
  const match = description?.match(/Hora:\s*(.+?)\s*HS/i);
  return match ? match[1].trim() : '';
};

const formatDateForInput = (isoDate) => {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
};

export default function CreateEventScreen({ onCancel, onCreateEvent, session, eventToEdit }) {
  const isEditing = !!eventToEdit;

  const [title, setTitle] = useState(eventToEdit?.title || '');
  const [selectedTypes, setSelectedTypes] = useState(
    eventToEdit
      ? EVENT_TYPES.filter((type) => eventToEdit[type.toLowerCase().replace(/ /g, '_')] === true)
      : []
  );
  const [eventDate, setEventDate] = useState(formatDateForInput(eventToEdit?.event_date));
  const [eventTime, setEventTime] = useState(parseEventTimeFromDescription(eventToEdit?.description));
  const [locationName, setLocationName] = useState(eventToEdit?.location || eventToEdit?.address || '');
  const [descriptionLong, setDescriptionLong] = useState(eventToEdit?.description_long || '');
  const [isFree, setIsFree] = useState(
    eventToEdit ? (!eventToEdit.price || eventToEdit.price === 'Gratis') : false
  );
  const [price, setPrice] = useState(eventToEdit?.price && eventToEdit.price !== 'Gratis' ? eventToEdit.price : '');
  const [imageUrls, setImageUrls] = useState(() => {
    const existing = eventToEdit?.image_urls?.length > 0 ? eventToEdit.image_urls : [];
    const padded = [...existing, '', '', ''].slice(0, 3);
    return padded;
  });
  const [mainImageIndex, setMainImageIndex] = useState(eventToEdit?.main_image_index || 0);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const pickImage = async (idx) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para subir imágenes del evento.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingIndex(idx);
    try {
      const fileExt = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const filePath = `${session?.user?.id || 'anon'}/${Date.now()}_${idx}.${fileExt}`;
      const publicUrl = await uploadPickedImage('event-images', filePath, asset);

      setImageUrls((prev) => {
        const updated = [...prev];
        updated[idx] = publicUrl;
        return updated;
      });
    } catch (err) {
      console.log('Error subiendo imagen:', err);
      Alert.alert('Error', 'No se pudo subir la foto. Intenta de nuevo.');
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeImage = (idx) => {
    setImageUrls((prev) => {
      const updated = [...prev];
      updated[idx] = '';
      return updated;
    });
  };
  const [mapRegion, setMapRegion] = useState({
    latitude: eventToEdit?.latitude || -34.6037,
    longitude: eventToEdit?.longitude || -58.3816,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLocationChange = (text) => {
    setLocationName(text);
  };

  // Debounce: dispara la búsqueda 400ms después de que el usuario deja de tipear,
  // en vez de un fetch por cada tecla (evita spam de pedidos y respuestas fuera de orden).
  useEffect(() => {
    if (locationName.trim().length < 3) {
      setLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingLocation(true);
      try {
        // Sesgamos por país (Argentina) y por cercanía al punto actual del mapa,
        // para que no aparezcan resultados de otros países antes que los locales.
        const bias = 2; // grados ~ escala de ciudad/provincia
        const viewbox = `${mapRegion.longitude - bias},${mapRegion.latitude + bias},${mapRegion.longitude + bias},${mapRegion.latitude - bias}`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&addressdetails=1&limit=8&countrycodes=ar&viewbox=${viewbox}&bounded=0`,
          { headers: { 'User-Agent': 'HipHappApp/1.0' } }
        );
        const data = await response.json();
        setLocationSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log('Error buscando dirección:', err);
        setLocationSuggestions([]);
      } finally {
        setSearchingLocation(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [locationName]);

  const selectLocationSuggestion = (item) => {
    setLocationName(item.display_name);
    setMapRegion({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
    setLocationSuggestions([]);
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        { headers: { 'User-Agent': 'HipHappApp/1.0' } }
      );
      const data = await response.json();
      if (data?.display_name) {
        setLocationName(data.display_name);
      }
    } catch (err) {
      console.log('Error en geocodificación inversa:', err);
    }
  };

  const handleMapPress = (event) => {
    // Extraemos coordinate ANTES de pasarlo al updater: el evento sintético
    // de React Native se libera/nullifica apenas termina este handler, así
    // que acceder a event.nativeEvent dentro de la función de setState (que
    // React ejecuta más tarde) tira "Cannot read property 'coordinate' of null".
    const coordinate = event?.nativeEvent?.coordinate;
    if (!coordinate) return;
    setMapRegion((prev) => ({
      ...prev,
      ...coordinate,
    }));
    reverseGeocode(coordinate.latitude, coordinate.longitude);
  };

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  const parseDateForSupabase = (rawDate) => {
    const value = rawDate?.trim();
    if (!value) return new Date().toISOString();

    const parts = value.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const parsed = new Date(`${year}-${month}-${day}T12:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? new Date().toISOString() : fallback.toISOString();
  };

  const handleCreate = async () => {
    const missingFields = [];
    if (!title.trim()) missingFields.push('Título');
    if (!eventDate.trim()) missingFields.push('Fecha');
    if (!eventTime.trim()) missingFields.push('Hora');
    if (!locationName.trim()) missingFields.push('Lugar');

    if (missingFields.length > 0) {
      Alert.alert('Campos incompletos', `Falta completar: ${missingFields.join(', ')}.`);
      return;
    }

    if (selectedTypes.length === 0) {
      Alert.alert('Sin etiquetas', 'Selecciona al menos una etiqueta para el evento.');
      return;
    }

    setLoading(true);

    const tagColumns = EVENT_TYPES.reduce((acc, type) => {
      // Convierte a snake_case para coincidir con Supabase
      const key = type.toLowerCase().replace(/ /g, '_');
      acc[key] = selectedTypes.includes(type);
      return acc;
    }, {});

    // Filtrar URLs de imágenes que no estén vacías
    const validImageUrls = imageUrls.filter((url) => url.trim() !== '');

    const eventPayload = {
      title: title.trim(),
      location: locationName.trim(),
      address: locationName.trim(),
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
      event_date: parseDateForSupabase(eventDate),
      description: `Hora: ${eventTime.trim()} HS`,
      description_long: descriptionLong.trim(),
      price: isFree ? 'Gratis' : (price.trim() || 'Gratis'),
      image_urls: validImageUrls.length > 0 ? validImageUrls : [],
      main_image_index: mainImageIndex,
      image_url: validImageUrls[mainImageIndex] || null,
      ...tagColumns,
    };

    if (!isEditing) {
      eventPayload.organizer_id = session?.user?.id || null;
    }

    try {
      const { data, error } = isEditing
        ? await supabase.from('events').update(eventPayload).eq('id', eventToEdit.id).select()
        : await supabase.from('events').insert([eventPayload]).select();

      if (error) {
        console.log('Error de Supabase:', error.message);
        Alert.alert('Error', isEditing ? 'No se pudo actualizar el evento.' : 'No se pudo publicar el evento.');
        return;
      }

      if (onCreateEvent) {
        onCreateEvent({
          ...(data ? data[0] : { ...eventPayload, id: eventToEdit?.id }),
          tags: selectedTypes,
          event_type: selectedTypes,
          type: selectedTypes,
          ...tagColumns,
        });
      }
    } catch (err) {
      console.log('Error inesperado:', err);
      Alert.alert('Error', 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '800' }}>{isEditing ? 'Editar evento' : 'Ingresar evento'}</Text>
        <TouchableOpacity onPress={onCancel} style={{ padding: 6 }}>
          <Ionicons name="close" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
        Coloca un título, completa fecha/hora, selecciona la ubicación en el mapa o escribila a mano.
      </Text>

      {/* MAPA INTERACTIVO */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Mapa interactivo (Toca para ubicar el pin)</Text>
        <View
          style={{
            height: 220,
            borderRadius: 18,
            overflow: 'hidden',
            backgroundColor: '#0f172a',
            borderWidth: 1,
            borderColor: '#334155',
          }}
        >
          <EventsMap
            events={[{
              id: 'temp-marker',
              title: locationName || 'Toca el mapa para elegir la ubicación',
              latitude: mapRegion.latitude,
              longitude: mapRegion.longitude
            }]}
            onSelectEvent={null}
            onPress={handleMapPress}
          />
        </View>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Título del evento</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Batalla de Gallos"
          placeholderTextColor="#64748b"
          style={{ backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: '#ffffff' }}
        />
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Fecha</Text>
        <TextInput
          value={eventDate}
          onChangeText={setEventDate}
          placeholder="DD/MM/AAAA"
          placeholderTextColor="#64748b"
          style={{ backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: '#ffffff' }}
        />
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Hora</Text>
        <TextInput
          value={eventTime}
          onChangeText={setEventTime}
          placeholder="18:00"
          placeholderTextColor="#64748b"
          style={{ backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: '#ffffff' }}
        />
      </View>

      <View style={{ marginBottom: 16, zIndex: 10 }}>
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Lugar</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 }}>
          <TextInput
            value={locationName}
            onChangeText={handleLocationChange}
            placeholder="Plaza Central"
            placeholderTextColor="#64748b"
            style={{ flex: 1, paddingVertical: 12, color: '#ffffff' }}
          />
          {searchingLocation && <ActivityIndicator size="small" color="#facc15" />}
        </View>

        {locationSuggestions.length > 0 && (
          <View style={{ backgroundColor: '#1e293b', borderRadius: 12, marginTop: 6, maxHeight: 180, borderWidth: 1, borderColor: '#334155' }}>
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {locationSuggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => selectLocationSuggestion(item)}
                  style={{ padding: 12, borderBottomWidth: index === locationSuggestions.length - 1 ? 0 : 1, borderBottomColor: '#334155' }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 13 }} numberOfLines={2}>
                    📍 {item.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Switch
            value={isFree}
            onValueChange={setIsFree}
            trackColor={{ false: '#334155', true: '#facc15' }}
            thumbColor={isFree ? '#000000' : '#cbd5e1'}
            style={{ marginRight: 10 }}
          />
          <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Entrada gratuita</Text>
        </View>
        {!isFree && (
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="$5000"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            style={{ backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: '#ffffff' }}
          />
        )}
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Descripción extensa (máx 200 caracteres)</Text>
        <TextInput
          value={descriptionLong}
          onChangeText={(text) => setDescriptionLong(text.slice(0, 200))}
          placeholder="Cuéntanos más sobre el evento..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={4}
          maxLength={200}
          style={{ backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: '#ffffff', height: 100, textAlignVertical: 'top' }}
        />
        <Text style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{descriptionLong.length}/200</Text>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Fotos del evento (hasta 3, desde tu dispositivo)</Text>
        {imageUrls.map((url, idx) => (
          <View key={idx} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, flex: 1 }}>Foto {idx + 1}</Text>
              {url && (
                <TouchableOpacity
                  onPress={() => setMainImageIndex(idx)}
                  style={{
                    backgroundColor: mainImageIndex === idx ? '#facc15' : '#334155',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: mainImageIndex === idx ? '#000000' : '#ffffff', fontSize: 11, fontWeight: '700' }}>
                    {mainImageIndex === idx ? '✓ Principal' : 'Portada'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {url ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={{ uri: url }} style={{ width: 64, height: 64, borderRadius: 10, marginRight: 10, backgroundColor: '#1e293b' }} />
                <TouchableOpacity
                  onPress={() => pickImage(idx)}
                  disabled={uploadingIndex === idx}
                  style={{ backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8 }}
                >
                  {uploadingIndex === idx ? (
                    <ActivityIndicator size="small" color="#facc15" />
                  ) : (
                    <Text style={{ color: '#facc15', fontWeight: '700', fontSize: 12 }}>Cambiar</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeImage(idx)}
                  style={{ backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => pickImage(idx)}
                disabled={uploadingIndex === idx}
                style={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingVertical: 16,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {uploadingIndex === idx ? (
                  <ActivityIndicator color="#facc15" />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#94a3b8', fontWeight: '700', fontSize: 13 }}>Elegir foto desde el dispositivo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* SELECCIÓN DE ETIQUETAS */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Etiquetas del evento</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {EVENT_TYPES.map((type) => {
            const isActive = selectedTypes.includes(type);
            return (
              <TouchableOpacity
                key={type}
                onPress={() => toggleType(type)}
                style={{
                  backgroundColor: isActive ? '#facc15' : '#1e293b',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 16,
                  marginRight: 8,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: isActive ? '#facc15' : '#334155',
                }}
              >
                <Text style={{ color: isActive ? '#000000' : '#ffffff', fontWeight: '700', fontSize: 12 }}>{type}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        onPress={handleCreate}
        disabled={loading}
        style={{ backgroundColor: '#facc15', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
      >
        {loading ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <Text style={{ color: '#000000', fontWeight: '800', fontSize: 15 }}>
            {isEditing ? 'Guardar cambios' : 'Publicar evento'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}