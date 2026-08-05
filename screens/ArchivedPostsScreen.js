import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { unarchivePost } from '../lib/postActions';

export default function ArchivedPostsScreen({ session, onBack }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadArchived = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('id, text, image_urls, created_at')
      .eq('author_id', session.user.id)
      .eq('is_archived', true)
      .order('created_at', { ascending: false });
    if (error) console.log('Error cargando publicaciones archivadas:', error.message);
    setPosts(data || []);
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    loadArchived();
  }, [loadArchived]);

  const handleUnarchive = (postId) => {
    Alert.alert('Dejar visible', 'La publicación va a volver a aparecer en tu perfil y en el feed.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Dejar visible',
        onPress: async () => {
          const { error } = await unarchivePost(postId);
          if (error) {
            Alert.alert('Error', 'No se pudo restaurar la publicación.');
            return;
          }
          setPosts((prev) => prev.filter((p) => p.id !== postId));
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 50, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={() => onBack?.()} style={{ padding: 6, marginRight: 4 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800' }}>Publicaciones archivadas</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#facc15" style={{ marginTop: 20 }} />
        ) : posts.length === 0 ? (
          <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 20 }}>
            No tenés publicaciones archivadas.
          </Text>
        ) : (
          posts.map((post) => (
            <View
              key={post.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#0f172a',
                borderColor: '#1e293b',
                borderWidth: 1,
                borderRadius: 14,
                padding: 12,
                marginBottom: 10,
              }}
            >
              {post.image_urls?.[0] ? (
                <Image source={{ uri: post.image_urls[0] }} style={{ width: 48, height: 48, borderRadius: 10, marginRight: 12, backgroundColor: '#1e293b' }} />
              ) : (
                <View style={{ width: 48, height: 48, borderRadius: 10, marginRight: 12, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="document-text-outline" size={18} color="#64748b" />
                </View>
              )}
              <Text style={{ flex: 1, color: '#e2e8f0', fontSize: 13 }} numberOfLines={2}>
                {post.text || 'Publicación sin texto'}
              </Text>
              <TouchableOpacity
                onPress={() => handleUnarchive(post.id)}
                style={{ marginLeft: 10, backgroundColor: 'rgba(250, 204, 21, 0.15)', borderWidth: 1, borderColor: '#facc15', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}
              >
                <Text style={{ color: '#facc15', fontSize: 11, fontWeight: '800' }}>Dejar visible</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
