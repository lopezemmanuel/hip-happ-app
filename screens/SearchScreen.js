import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const RESULTS_LIMIT = 25;
const SUGGESTIONS_LIMIT = 20;
const DEBOUNCE_MS = 350;

const USER_FIELDS = 'id, username, aka, first_name, last_name, avatar_url, disciplines';

export default function SearchScreen({ onSelectUser }) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('users')
      .select(USER_FIELDS)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })
      .limit(SUGGESTIONS_LIMIT);

    setLoading(false);

    if (error) {
      console.log('Error al traer sugerencias de usuarios:', error.message);
      return;
    }

    setUsers(data || []);
  }, []);

  const runSearch = useCallback(async (term) => {
    setLoading(true);

    const like = `%${term}%`;
    const { data, error } = await supabase
      .from('users')
      .select(USER_FIELDS)
      .or(`username.ilike.${like},aka.ilike.${like},first_name.ilike.${like},last_name.ilike.${like}`)
      .limit(RESULTS_LIMIT);

    setLoading(false);

    if (error) {
      console.log('Error al buscar usuarios:', error.message);
      return;
    }

    setUsers(data || []);
  }, []);

  // Sugerencias iniciales al montar la pantalla
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Búsqueda con debounce cada vez que cambia el texto
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setHasSearched(false);
      fetchSuggestions();
      return;
    }

    setHasSearched(true);
    const timer = setTimeout(() => {
      runSearch(trimmed);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, fetchSuggestions, runSearch]);

  const handleClear = () => setQuery('');

  const renderUserCard = ({ item }) => {
    const displayName = item.aka || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Usuario';
    const disciplines = Array.isArray(item.disciplines) ? item.disciplines : [];

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelectUser?.(item)}
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
        {item.avatar_url ? (
          <Image
            source={{ uri: item.avatar_url }}
            style={{ width: 56, height: 56, borderRadius: 28, marginRight: 14, backgroundColor: '#1e293b' }}
          />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              marginRight: 14,
              backgroundColor: '#1e293b',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="person" size={26} color="#64748b" />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }} numberOfLines={1}>
            {displayName}
          </Text>
          {!!item.username && (
            <Text style={{ color: '#facc15', fontSize: 12, fontWeight: '600', marginTop: 2 }} numberOfLines={1}>
              @{item.username}
            </Text>
          )}

          {disciplines.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {disciplines.map((discipline) => (
                <View
                  key={discipline}
                  style={{
                    backgroundColor: 'rgba(250, 204, 21, 0.15)',
                    borderColor: '#facc15',
                    borderWidth: 1,
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    marginRight: 6,
                    marginTop: 4,
                  }}
                >
                  <Text style={{ color: '#facc15', fontSize: 10, fontWeight: '700' }}>{discipline}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '800', marginBottom: 16 }}>
        Explorar 🔎
      </Text>

      {/* BARRA DE BÚSQUEDA */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#0f172a',
          borderColor: '#1e293b',
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 14,
          marginBottom: 18,
        }}
      >
        <Ionicons name="search" size={18} color="#64748b" style={{ marginRight: 8 }} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre, @usuario, AKA o disciplina..."
          placeholderTextColor="#64748b"
          style={{ flex: 1, color: '#ffffff', paddingVertical: 12, fontSize: 14 }}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {!hasSearched && (
        <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 12 }}>
          Sugerencias para vos
        </Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#facc15" style={{ marginTop: 30 }} />
      ) : users.length === 0 ? (
        <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 30 }}>
          No se encontraron usuarios con esa búsqueda.
        </Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserCard}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}
