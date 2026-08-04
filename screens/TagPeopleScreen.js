import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const RESULTS_LIMIT = 25;
const SUGGESTIONS_LIMIT = 20;
const DEBOUNCE_MS = 350;

const USER_FIELDS = 'id, username, aka, first_name, last_name, avatar_url';

export default function TagPeopleScreen({ initialSelected, onCancel, onDone }) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(initialSelected || []);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select(USER_FIELDS)
      .order('created_at', { ascending: false })
      .limit(SUGGESTIONS_LIMIT);
    setLoading(false);
    if (!error) setUsers(data || []);
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
    if (!error) setUsers(data || []);
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      fetchSuggestions();
      return;
    }
    const timer = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions, runSearch]);

  const toggleUser = (user) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  };

  const removeSelected = (id) => {
    setSelected((prev) => prev.filter((u) => u.id !== id));
  };

  const displayNameOf = (item) => item.aka || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Usuario';

  const renderUserCard = ({ item }) => {
    const isChecked = selected.some((u) => u.id === item.id);
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => toggleUser(item)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#0f172a',
          borderColor: isChecked ? '#facc15' : '#1e293b',
          borderWidth: 1,
          borderRadius: 18,
          padding: 12,
          marginBottom: 12,
        }}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#1e293b' }} />
        ) : (
          <View style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person" size={22} color="#64748b" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }} numberOfLines={1}>{displayNameOf(item)}</Text>
          {!!item.username && (
            <Text style={{ color: '#facc15', fontSize: 12, fontWeight: '600', marginTop: 2 }} numberOfLines={1}>@{item.username}</Text>
          )}
        </View>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: isChecked ? '#facc15' : '#334155',
            backgroundColor: isChecked ? '#facc15' : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isChecked && <Ionicons name="checkmark" size={16} color="#000000" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#020617', zIndex: 1100 }}>
      {/* CABECERA */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 }}>
        <TouchableOpacity onPress={onCancel} style={{ padding: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>Etiquetar persona</Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* BUSCADOR */}
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
            placeholder="Buscar por nombre, @usuario o AKA..."
            placeholderTextColor="#64748b"
            style={{ flex: 1, color: '#ffffff', paddingVertical: 12, fontSize: 14 }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {/* SELECCIONADOS */}
        {selected.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '700', marginBottom: 10 }}>Seleccionados</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selected.map((user) => (
                <View key={user.id} style={{ marginRight: 14, alignItems: 'center', width: 56 }}>
                  <View style={{ position: 'relative' }}>
                    {user.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#1e293b' }} />
                    ) : (
                      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="person" size={22} color="#64748b" />
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => removeSelected(user.id)}
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        backgroundColor: '#ef4444',
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: '#020617',
                      }}
                    >
                      <Ionicons name="close" size={12} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: '#94a3b8', fontSize: 10, marginTop: 4 }} numberOfLines={1}>
                    {user.username ? `@${user.username}` : displayNameOf(user)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#facc15" style={{ marginTop: 30 }} />
        ) : users.length === 0 ? (
          <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 30 }}>No se encontraron usuarios.</Text>
        ) : (
          <FlatList data={users} keyExtractor={(item) => item.id} renderItem={renderUserCard} contentContainerStyle={{ paddingBottom: 90 }} />
        )}
      </View>

      {/* BOTÓN LARGO INFERIOR */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#020617', borderTopWidth: 1, borderTopColor: '#1e293b' }}>
        <TouchableOpacity
          onPress={() => onDone(selected)}
          style={{ backgroundColor: '#facc15', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
        >
          <Text style={{ color: '#000000', fontWeight: '800', fontSize: 15 }}>Listo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
