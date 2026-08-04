import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const RESULTS_LIMIT = 20;
const DEBOUNCE_MS = 350;

const EVENT_FIELDS = 'id, title, location, event_date, image_url';

export default function TagEventScreen({ onCancel, onSelect }) {
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUpcoming = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_FIELDS)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(RESULTS_LIMIT);
    setLoading(false);
    if (!error) setEvents(data || []);
  }, []);

  const runSearch = useCallback(async (term) => {
    setLoading(true);
    const like = `%${term}%`;
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_FIELDS)
      .gte('event_date', new Date().toISOString())
      .or(`title.ilike.${like},location.ilike.${like}`)
      .order('event_date', { ascending: true })
      .limit(RESULTS_LIMIT);
    setLoading(false);
    if (!error) setEvents(data || []);
  }, []);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      fetchUpcoming();
      return;
    }
    const timer = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, fetchUpcoming, runSearch]);

  const formatDate = (isoDate) => {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  };

  const renderEventCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onSelect(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        borderColor: '#1e293b',
        borderWidth: 1,
        borderRadius: 18,
        padding: 12,
        marginBottom: 12,
      }}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={{ width: 56, height: 56, borderRadius: 12, marginRight: 14, backgroundColor: '#1e293b' }} />
      ) : (
        <View style={{ width: 56, height: 56, borderRadius: 12, marginRight: 14, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="calendar" size={24} color="#64748b" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }} numberOfLines={1}>{item.title}</Text>
        <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }} numberOfLines={1}>{item.location}</Text>
        <Text style={{ color: '#facc15', fontSize: 12, fontWeight: '700', marginTop: 2 }}>{formatDate(item.event_date)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#64748b" />
    </TouchableOpacity>
  );

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#020617', zIndex: 1100 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 }}>
        <TouchableOpacity onPress={onCancel} style={{ padding: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>Etiquetar evento</Text>
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
            placeholder="Buscar evento por nombre o lugar..."
            placeholderTextColor="#64748b"
            autoFocus
            style={{ flex: 1, color: '#ffffff', paddingVertical: 12, fontSize: 14 }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#facc15" style={{ marginTop: 30 }} />
        ) : events.length === 0 ? (
          <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 30 }}>No hay próximos eventos que coincidan.</Text>
        ) : (
          <FlatList data={events} keyExtractor={(item) => item.id} renderItem={renderEventCard} contentContainerStyle={{ paddingBottom: 40 }} />
        )}
      </View>
    </View>
  );
}
