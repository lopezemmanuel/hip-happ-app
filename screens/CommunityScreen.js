import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Datos de ejemplo para las entradas del Blog
const MOCK_BLOG_POSTS = [
  {
    id: '1',
    title: 'La evolución del Sound System en la cultura urbana',
    author: 'Admin Hip-Happ',
    date: '31 Jul 2026',
    readTime: '4 min de lectura',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    summary: 'Analizamos cómo los sistemas de sonido itinerantes moldearon las primeras fiestas de calle y el nacimiento del rap.',
  },
  {
    id: '2',
    title: 'Entrevista a DJs locales: El arte del Scratch en la era digital',
    author: 'Redacción',
    date: '28 Jul 2026',
    readTime: '6 min de lectura',
    image: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=600&auto=format&fit=crop&q=80',
    summary: 'Conversamos con referentes de la bandeja giradiscos sobre las técnicas clásicas vs. el software moderno.',
  },
];

// Datos de ejemplo para los mensajes del Chat
const MOCK_CHAT_MESSAGES = [
  { id: '1', user: 'BeatMaker99', text: '¿Alguien para meter cypher hoy en la plaza?', time: '14:20' },
  { id: '2', user: 'FlowMaster', text: '¡Se viene alta fecha el finde que viene!', time: '14:22' },
  { id: '3', user: 'GraffArt', text: 'Subí un par de bocetos al perfil, pasen a dar amor 🎨', time: '14:35' },
];

export default function CommunityScreen({ isGuest, onRequireAuth, session }) {
  const [subTab, setSubTab] = useState('blog'); // 'blog' o 'chat'
  const [message, setMessage] = useState('');

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
          {MOCK_BLOG_POSTS.map((post) => (
            <TouchableOpacity
              key={post.id}
              activeOpacity={0.85}
              onPress={() => Alert.alert('Lectura', post.title)}
              style={{
                backgroundColor: '#0f172a',
                borderColor: '#1e293b',
                borderWidth: 1,
                borderRadius: 20,
                marginBottom: 16,
                overflow: 'hidden',
              }}
            >
              <Image source={{ uri: post.image }} style={{ width: '100%', height: 130 }} resizeMode="cover" />
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: '#facc15', fontSize: 12, fontWeight: '700' }}>{post.author}</Text>
                  <Text style={{ color: '#64748b', fontSize: 12 }}>{post.date} • {post.readTime}</Text>
                </View>
                <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '800', marginBottom: 6 }}>
                  {post.title}
                </Text>
                <Text style={{ color: '#94a3b8', fontSize: 13, lineHeight: 18 }}>
                  {post.summary}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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