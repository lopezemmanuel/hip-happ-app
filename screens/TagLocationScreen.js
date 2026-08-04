import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TagLocationScreen({ onCancel, onSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=8&countrycodes=ar`,
          { headers: { 'User-Agent': 'HipHappApp/1.0' } }
        );
        const data = await response.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log('Error buscando ubicación:', err);
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item) => {
    onSelect({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    });
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#020617', zIndex: 1100 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 }}>
        <TouchableOpacity onPress={onCancel} style={{ padding: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>Agregar ubicación</Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#0f172a',
            borderColor: '#1e293b',
            borderWidth: 1,
            borderRadius: 16,
            paddingHorizontal: 14,
            marginBottom: 16,
          }}
        >
          <Ionicons name="search" size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar lugar o dirección..."
            placeholderTextColor="#64748b"
            autoFocus
            style={{ flex: 1, color: '#ffffff', paddingVertical: 12, fontSize: 14 }}
          />
          {searching && <ActivityIndicator size="small" color="#facc15" />}
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelect(item)}
              style={{
                backgroundColor: '#0f172a',
                borderColor: '#1e293b',
                borderWidth: 1,
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 13 }} numberOfLines={2}>
                📍 {item.display_name}
              </Text>
            </TouchableOpacity>
          ))}
          {!searching && query.trim().length >= 3 && suggestions.length === 0 && (
            <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
              No se encontraron lugares con esa búsqueda.
            </Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
