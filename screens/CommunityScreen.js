import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import CreateNewsScreen from './CreateNewsScreen';

// Datos de ejemplo para los mensajes del Chat
const MOCK_CHAT_MESSAGES = [
  { id: '1', user: 'BeatMaker99', text: '¿Alguien para meter cypher hoy en la plaza?', time: '14:20' },
  { id: '2', user: 'FlowMaster', text: '¡Se viene alta fecha el finde que viene!', time: '14:22' },
  { id: '3', user: 'GraffArt', text: 'Subí un par de bocetos al perfil, pasen a dar amor 🎨', time: '14:35' },
];

function formatNewsDate(isoDate) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CommunityScreen({ isGuest, onRequireAuth, session }) {
  const [subTab, setSubTab] = useState('blog'); // 'blog' o 'chat'
  const [message, setMessage] = useState('');
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [showCreateNews, setShowCreateNews] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState(null);
  const [expandedNewsIds, setExpandedNewsIds] = useState({});

  const toggleNewsExpanded = (id) => {
    setExpandedNewsIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const loadNews = useCallback(async () => {
    setLoadingNews(true);
    const { data, error } = await supabase
      .from('news')
      .select('id, title, content, image_url, created_at, author_id, author:users!news_author_id_fkey(aka, username)')
      .eq('published', true)
      .order('created_at', { ascending: false });
    if (error) console.log('Error cargando notas de la comunidad:', error.message);
    setNews(data || []);
    setLoadingNews(false);
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const handleSendMessage = () => {
    if (isGuest) {
      Alert.alert(
        'Cuenta requerida 🎤',
        'Para chatear con la comunidad necesitas iniciar sesión o crear una cuenta.',
        [
          { text: 'Seguir explorando', style: 'cancel' },
          { text: 'Crear cuenta / Entrar', onPress: () => onRequireAuth() },
        ]
      );
      return;
    }

    if (message.trim().length === 0) return;
    Alert.alert('Mensaje enviado', `Enviando: "${message}"`);
    setMessage('');
  };

  const handleCreateNewsPress = () => {
    if (isGuest) {
      Alert.alert('Cuenta requerida', 'Para publicar una nota necesitás iniciar sesión o crear una cuenta.');
      return;
    }
    setNoteToEdit(null);
    setShowCreateNews(true);
  };

  const handleEditNewsPress = (post) => {
    setNoteToEdit(post);
    setShowCreateNews(true);
  };

  const handleDeleteNewsPress = (post) => {
    Alert.alert(
      'Eliminar nota',
      `¿Seguro que querés eliminar "${post.title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('news').delete().eq('id', post.id);
            if (error) {
              Alert.alert('Error', 'No se pudo eliminar la nota.');
              return;
            }
            loadNews();
          },
        },
      ]
    );
  };

  if (showCreateNews) {
    return (
      <CreateNewsScreen
        session={session}
        noteToEdit={noteToEdit}
        onCancel={() => {
          setShowCreateNews(false);
          setNoteToEdit(null);
        }}
        onDone={() => {
          setShowCreateNews(false);
          setNoteToEdit(null);
          loadNews();
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1, width: '100%' }}>
      {/* HEADER Y SELECTOR DE SUB-SECCIONES (BLOG / CHAT) */}
      <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '800', marginBottom: 12 }}>
        Comunidad 💬
      </Text>

      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#0f172a',
          borderRadius: 16,
          padding: 4,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#1e293b',
        }}
      >
        <TouchableOpacity
          onPress={() => setSubTab('blog')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: subTab === 'blog' ? '#facc15' : 'transparent',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: subTab === 'blog' ? '#000000' : '#94a3b8', fontWeight: '700', fontSize: 14 }}>
            📰 Blog & Notas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSubTab('chat')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: subTab === 'chat' ? '#facc15' : 'transparent',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: subTab === 'chat' ? '#000000' : '#94a3b8', fontWeight: '700', fontSize: 14 }}>
            💬 Chat en Vivo
          </Text>
        </TouchableOpacity>
      </View>

      {/* SECCIÓN 1: BLOG */}
      {subTab === 'blog' && (
        <View>
          <TouchableOpacity
            onPress={handleCreateNewsPress}
            style={{
              backgroundColor: '#facc15',
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 14,
              alignSelf: 'flex-start',
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#000000" style={{ marginRight: 6 }} />
            <Text style={{ color: '#000000', fontWeight: '800', fontSize: 13 }}>Crear nota</Text>
          </TouchableOpacity>

          {loadingNews ? (
            <ActivityIndicator size="large" color="#facc15" style={{ marginTop: 20 }} />
          ) : news.length === 0 ? (
            <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 20 }}>
              Todavía no hay notas publicadas.
            </Text>
          ) : (
            news.map((post) => {
              const authorLabel = post.author?.aka || post.author?.username || 'Hip-Happ';
              const isExpanded = !!expandedNewsIds[post.id];
              const isOwner = !!session?.user?.id && post.author_id === session.user.id;
              return (
                <TouchableOpacity
                  key={post.id}
                  activeOpacity={0.85}
                  onPress={() => toggleNewsExpanded(post.id)}
                  style={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderWidth: 1,
                    borderRadius: 20,
                    marginBottom: 16,
                    overflow: 'hidden',
                  }}
                >
                  {!!post.image_url && (
                    <Image source={{ uri: post.image_url }} style={{ width: '100%', aspectRatio: 1 }} contentFit="cover" />
                  )}
                  <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700' }}>
                        <Text style={{ color: '#64748b' }}>Por </Text>
                        <Text style={{ color: '#facc15' }}>{authorLabel}</Text>
                      </Text>
                      <Text style={{ color: '#64748b', fontSize: 12 }}>{formatNewsDate(post.created_at)}</Text>
                    </View>
                    <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '800', marginBottom: 6 }}>
                      {post.title}
                    </Text>
                    <Text style={{ color: '#94a3b8', fontSize: 13, lineHeight: 18 }} numberOfLines={isExpanded ? undefined : 3}>
                      {post.content}
                    </Text>
                    {isExpanded && isOwner && (
                      <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => handleEditNewsPress(post)}
                          style={{ flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#facc15', borderRadius: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                        >
                          <Ionicons name="pencil" size={14} color="#facc15" style={{ marginRight: 6 }} />
                          <Text style={{ color: '#facc15', fontWeight: '800', fontSize: 12 }}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteNewsPress(post)}
                          style={{ flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#ef4444', borderRadius: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                        >
                          <Ionicons name="trash" size={14} color="#ef4444" style={{ marginRight: 6 }} />
                          <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 12 }}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#64748b" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      {/* SECCIÓN 2: CHAT */}
      {subTab === 'chat' && (
        <View style={{ width: '100%' }}>
          {/* BANNER AVISO SI ES INVITADO */}
          {isGuest && (
            <TouchableOpacity
              onPress={onRequireAuth}
              style={{
                backgroundColor: 'rgba(250, 204, 21, 0.15)',
                borderColor: '#facc15',
                borderWidth: 1,
                padding: 12,
                borderRadius: 14,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="lock-closed" size={20} color="#facc15" style={{ marginRight: 10 }} />
              <Text style={{ color: '#ffffff', fontSize: 12, flex: 1, fontWeight: '600' }}>
                Estás en modo visitante. <Text style={{ color: '#facc15', textDecorationLine: 'underline' }}>Iniciá sesión</Text> para escribir en la sala pública.
              </Text>
            </TouchableOpacity>
          )}

          {/* LISTA DE MENSAJES DE CHAT */}
          <View style={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1, borderRadius: 20, padding: 14, marginBottom: 14 }}>
            {MOCK_CHAT_MESSAGES.map((msg) => (
              <View key={msg.id} style={{ marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={{ color: '#facc15', fontWeight: '700', fontSize: 13 }}>@{msg.user}</Text>
                  <Text style={{ color: '#64748b', fontSize: 11 }}>{msg.time}</Text>
                </View>
                <Text style={{ color: '#e2e8f0', fontSize: 14 }}>{msg.text}</Text>
              </View>
            ))}
          </View>

          {/* INPUT PARA ENVIAR MENSAJE */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={isGuest ? "Inicia sesión para chatear..." : "Escribe tu mensaje..."}
              placeholderTextColor="#64748b"
              style={{
                flex: 1,
                backgroundColor: '#0f172a',
                borderColor: '#1e293b',
                borderWidth: 1,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: '#ffffff',
                marginRight: 8,
              }}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              style={{
                backgroundColor: '#facc15',
                borderRadius: 14,
                padding: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="send" size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}