import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MOCK_NEWS = [
  {
    id: '1',
    title: 'Anuncian la fecha oficial de la Final Nacional de Freestyle',
    category: 'Competencias',
    date: 'Hace 2 hs',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    excerpt: 'Los mejores clasificatorios se enfrentarán el próximo mes en un evento épico.',
  },
  {
    id: '2',
    title: 'Nuevo álbum colaborativo reúne a referentes del Beatmaking',
    category: 'Música & Beats',
    date: 'Hace 5 hs',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80',
    excerpt: 'Un proyecto independiente que fusiona ritmos clásicos de Boom Bap con sonidos modernos.',
  },
  {
    id: '3',
    title: 'Murales & Graffiti: Exposición urbana en el centro cultural',
    category: 'Arte Urbano',
    date: 'Ayer',
    image: 'https://images.unsplash.com/photo-1561055657-b9e0bf0fa360?w=600&auto=format&fit=crop&q=80',
    excerpt: 'Artistas locales se reúnen para intervenir en vivo las paredes del anfiteatro.',
  },
];

export default function HomeNews() {
  return (
    <View style={{ width: '100%', marginTop: 24 }}>
      {/* CABECERA DE LA SECCIÓN */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800' }}>
          Últimas Noticias 📰
        </Text>
        <TouchableOpacity onPress={() => Alert.alert('Noticias', 'Mostrando todas las noticias...')}>
          <Text style={{ color: '#facc15', fontSize: 13, fontWeight: '700' }}>
            Ver todas
          </Text>
        </TouchableOpacity>
      </View>

      {/* TARJETAS DE NOTICIAS */}
      {MOCK_NEWS.map((item) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.8}
          onPress={() => Alert.alert('Noticia', item.title)}
          style={{
            backgroundColor: '#0f172a',
            borderColor: '#1e293b',
            borderWidth: 1,
            borderRadius: 18,
            marginBottom: 14,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {/* IMAGEN THUMBNAIL */}
          <Image
            source={{ uri: item.image }}
            style={{ width: 80, height: 80, borderRadius: 12, marginRight: 12 }}
            resizeMode="cover"
          />

          {/* CONTENIDO TEXTO */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ color: '#facc15', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                {item.category}
              </Text>
              <Text style={{ color: '#64748b', fontSize: 11 }}>
                {item.date}
              </Text>
            </View>

            <Text
              numberOfLines={2}
              style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', lineHeight: 18, marginBottom: 4 }}
            >
              {item.title}
            </Text>

            <Text numberOfLines={1} style={{ color: '#94a3b8', fontSize: 12 }}>
              {item.excerpt}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}