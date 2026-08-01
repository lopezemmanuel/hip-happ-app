import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const EVENT_TYPES = [
  'Freestyle', 'Show', 'Batallas', 'Dance', 'DJing', 'Jam',
  'Cypher', 'Breaking', 'Festival', 'Taller', 'Expo',
  'Graffiti', 'Street art', 'Encuentro',
];

export default function AddEventModal({ visible, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [locationName, setLocationName] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para autocompletado y coordenadas
  const [suggestions, setSuggestions] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [coords, setCoords] = useState({ latitude: null, longitude: null });

  // Buscar direcciones mediante la API de Nominatim
  const handleAddressChange = async (text) => {
    setAddress(text);

    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setSearchingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'MiAppEventos/1.0',
          },
        }
      );
      const data = await response.json();
      setSuggestions(data || []);
    } catch (err) {
      console.log('Error buscando dirección:', err);
    } finally {
      setSearchingAddress(false);
    }
  };

  // Seleccionar sugerencia y guardar coordenadas
  const selectSuggestion = (item) => {
    setAddress(item.display_name);
    if (item.lat && item.lon) {
      setCoords({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      });
    }
    setSuggestions([]);
  };

  const toggleEventType = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !date.trim() || !address.trim()) {
      Alert.alert('Atención', 'Por favor completá título, fecha y dirección.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Formatear la fecha
      let formattedDate = date;
      if (date.includes('/')) {
        const parts = date.split('/');
        if (parts.length === 3) {
          const formattedTime = time.trim() ? time.replace('hs', '').trim() : '00:00';
          formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T${formattedTime}:00Z`;
        }
      }

      // Formatear la descripción
      const extraInfo = [];
      if (selectedTypes.length > 0) extraInfo.push(`Categorías: ${selectedTypes.join(', ')}`);
      extraInfo.push(isFree ? 'Entrada: Gratuita' : `Precio: $${price || 0}`);
      const fullDescription = extraInfo.join(' | ');

      // Insertar evento guardando la latitud y longitud
      const { error } = await supabase.from('events').insert([
        {
          title: title.trim(),
          description: fullDescription,
          location: locationName.trim() || title.trim(),
          address: address.trim(),
          event_date: formattedDate,
          organizer_id: user?.id || null,
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      ]);

      if (error) throw error;

      Alert.alert('¡Éxito!', 'El evento fue publicado correctamente.');

      // Limpiar formulario
      setTitle('');
      setDate('');
      setTime('');
      setAddress('');
      setLocationName('');
      setPrice('');
      setSelectedTypes([]);
      setIsFree(false);
      setSuggestions([]);
      setCoords({ latitude: null, longitude: null });

      onSuccess?.();
      onClose();
    } catch (error) {
      Alert.alert('Error al publicar', error.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' }}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800' }}>📌 Publicar Nuevo Evento</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 6, backgroundColor: '#1e293b', borderRadius: 12 }}>
              <Ionicons name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>TÍTULO DEL EVENTO</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Cypher BBOY Underground"
              placeholderTextColor="#475569"
              style={{ backgroundColor: '#020617', color: '#fff', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' }}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>FECHA</Text>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#475569"
                  style={{ backgroundColor: '#020617', color: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b' }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>HORARIO</Text>
                <TextInput
                  value={time}
                  onChangeText={setTime}
                  placeholder="Ej: 18:00"
                  placeholderTextColor="#475569"
                  style={{ backgroundColor: '#020617', color: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b' }}
                />
              </View>
            </View>

            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>NOMBRE DEL LUGAR / ESTABLECIMIENTO</Text>
            <TextInput
              value={locationName}
              onChangeText={setLocationName}
              placeholder="Ej: Niceto Club, Parque Centenario, etc."
              placeholderTextColor="#475569"
              style={{ backgroundColor: '#020617', color: '#fff', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' }}
            />

            {/* Buscador predictivo de Dirección */}
            <View style={{ marginBottom: 16, zIndex: 10 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>DIRECCIÓN (BUSCADOR AUTOMÁTICO)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 12 }}>
                <TextInput
                  value={address}
                  onChangeText={handleAddressChange}
                  placeholder="Escribí una calle o lugar..."
                  placeholderTextColor="#475569"
                  style={{ flex: 1, color: '#fff', paddingVertical: 12 }}
                />
                {searchingAddress && <ActivityIndicator size="small" color="#facc15" />}
              </View>

              {suggestions.length > 0 && (
                <View style={{ backgroundColor: '#1e293b', borderRadius: 12, marginTop: 6, maxHeight: 180, borderWidth: 1, borderColor: '#334155' }}>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {suggestions.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => selectSuggestion(item)}
                        style={{ padding: 12, borderBottomWidth: index === suggestions.length - 1 ? 0 : 1, borderBottomColor: '#334155' }}
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

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700' }}>ENTRADA GRATUITA</Text>
              <Switch
                value={isFree}
                onValueChange={setIsFree}
                trackColor={{ false: '#334155', true: '#facc15' }}
                thumbColor={isFree ? '#000000' : '#cbd5e1'}
              />
            </View>

            {!isFree && (
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="Precio en $ ARS"
                placeholderTextColor="#475569"
                style={{ backgroundColor: '#020617', color: '#fff', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' }}
              />
            )}

            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>TIPO DE EVENTO</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {EVENT_TYPES.map((type) => {
                const isSelected = selectedTypes.includes(type);
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => toggleEventType(type)}
                    style={{
                      backgroundColor: isSelected ? '#facc15' : '#1e293b',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: isSelected ? '#facc15' : '#334155',
                    }}
                  >
                    <Text style={{ color: isSelected ? '#000000' : '#ffffff', fontWeight: '700', fontSize: 12 }}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: '#facc15',
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ color: '#000000', fontWeight: '800', fontSize: 15 }}>
                {loading ? 'Publicando...' : 'Publicar Evento'}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}