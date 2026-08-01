import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EVENT_TYPES = ['Freestyle', 'Breaking', 'Beats', 'Cultural'];

export default function CreateEventScreen({ onCancel, onCreateEvent }) {
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState('Freestyle');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [mapPoint, setMapPoint] = useState({ x: 0.5, y: 0.5 });

  const handleMapPress = (event) => {
    const x = event.nativeEvent.locationX / (event.nativeEvent.target || 1);
    const y = event.nativeEvent.locationY / (event.nativeEvent.target || 1);
    setMapPoint({ x: Math.max(0.08, Math.min(0.92, x)), y: Math.max(0.12, Math.min(0.88, y)) });
  };

  const handleCreate = () => {
    if (!title.trim() || !eventDate.trim() || !eventTime.trim() || !locationName.trim()) {
      Alert.alert('Campos incompletos', 'Completa título, fecha, hora y lugar para publicar el evento.');
      return;
    }

    const newEvent = {
      id: Date.now().toString(),
      title: title.trim(),
      category: selectedType,
      date: eventDate.trim().toUpperCase(),
      time: `${eventTime.trim()} HS`,
      location: locationName.trim(),
      price: 'Gratis',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
      mapPoint,
    };

    if (onCreateEvent) {
      onCreateEvent(newEvent);
    }
  };

  return (
    <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '800' }}>Ingresar evento</Text>
        <TouchableOpacity onPress={onCancel} style={{ padding: 6 }}>
          <Ionicons name="close" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
        Elige el tipo, completa fecha/hora y selecciona la ubicación en el mapa.
      </Text>

      <View style={{ marginBottom: 14 }}>
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Tipo de evento</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {EVENT_TYPES.map((type) => {
            const isActive = selectedType === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedType(type)}
                style={{
                  backgroundColor: isActive ? '#facc15' : '#1e293b',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 16,
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: isActive ? '#000000' : '#ffffff', fontWeight: '700', fontSize: 12 }}>{type}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Mapa interactivo</Text>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleMapPress}
          style={{
            height: 220,
            borderRadius: 18,
            overflow: 'hidden',
            backgroundColor: '#0f172a',
            borderWidth: 1,
            borderColor: '#334155',
          }}
        >
          <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
              <View style={{ position: 'absolute', left: 0, right: 0, top: '25%', height: 1, backgroundColor: '#334155' }} />
              <View style={{ position: 'absolute', left: 0, right: 0, top: '60%', height: 1, backgroundColor: '#334155' }} />
              <View style={{ position: 'absolute', top: 0, bottom: 0, left: '30%', width: 1, backgroundColor: '#334155' }} />
              <View style={{ position: 'absolute', top: 0, bottom: 0, left: '70%', width: 1, backgroundColor: '#334155' }} />
            </View>
            <View
              style={{
                position: 'absolute',
                left: `${mapPoint.x * 100}%`,
                top: `${mapPoint.y * 100}%`,
                marginLeft: -14,
                marginTop: -14,
                width: 28,
                height: 28,
                borderRadius: 14,
                borderWidth: 3,
                borderColor: '#ffffff',
                backgroundColor: '#facc15',
              }}
            />
            <View style={{ position: 'absolute', left: 12, bottom: 12, backgroundColor: 'rgba(2,6,23,0.8)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: '#facc15', fontSize: 12, fontWeight: '700' }}>Toca para mover el pin</Text>
            </View>
          </View>
        </TouchableOpacity>
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

      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Lugar</Text>
        <TextInput
          value={locationName}
          onChangeText={setLocationName}
          placeholder="Plaza Central"
          placeholderTextColor="#64748b"
          style={{ backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: '#ffffff' }}
        />
      </View>

      <TouchableOpacity
        onPress={handleCreate}
        style={{ backgroundColor: '#facc15', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
      >
        <Text style={{ color: '#000000', fontWeight: '800', fontSize: 15 }}>Publicar evento</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
