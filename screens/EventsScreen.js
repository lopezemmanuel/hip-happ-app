import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CreateEventScreen from './CreateEventScreen';
import EventsMap from '../components/EventsMap';
import { supabase } from '../lib/supabase';

const MOCK_EVENTS = [
  {
    id: '1',
    title: 'Batalla de Gallos: King of the Mic',
    category: 'Freestyle / Batallas',
    date: '15 AGOSTO',
    time: '18:00 HS',
    location: 'Plaza de la Estación, Lomas',
    address: 'Plaza de la Estación, Lomas de Zamora',
    latitude: -34.7592,
    longitude: -58.4022,
    price: 'Gratis',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    title: 'Underground Jam & Breaking Session',
    category: 'Breaking / Dance',
    date: '22 AGOSTO',
    time: '16:00 HS',
    location: 'Centro Cultural Urbano',
    address: 'Centro Cultural Urbano, Lanús',
    latitude: -34.7001,
    longitude: -58.3912,
    price: '$2000',
    image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    title: 'Beatmakers Showcase & Live DJing',
    category: 'DJing / Beats',
    date: '05 SEPTIEMBRE',
    time: '21:00 HS',
    location: 'Club Búnker, CABA',
    address: 'Av. Corrientes 1234, CABA',
    latitude: -34.6037,
    longitude: -58.3815,
    price: '$3500',
    image: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=600&auto=format&fit=crop&q=80',
  },
];

export default function EventsScreen({ onSelectEvent, session, isGuest }) {
  const [filter, setFilter] = useState('Todos');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const categories = ['Todos', 'Freestyle', 'Breaking', 'Beats'];
  const canManageEvents = !isGuest && (session?.user?.role === 'admin' || session?.user?.verified === true);

  // Función para obtener eventos de Supabase
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Si hay datos en Supabase los usamos; si la tabla está vacía, mostramos los MOCK de prueba
      if (data && data.length > 0) {
        setEvents(data);
      } else {
        setEvents(MOCK_EVENTS);
      }
    } catch (err) {
      console.log('Error al cargar eventos de Supabase:', err.message);
      setEvents(MOCK_EVENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    if (filter === 'Todos') return true;
    const cat = event.category || '';
    return cat.toLowerCase().includes(filter.toLowerCase());
  });

  const handleCreateEvent = (newEvent) => {
    if (newEvent) {
      setEvents((prev) => [newEvent, ...prev]);
    }
    setShowCreateEvent(false);
    fetchEvents(); // Sincroniza con Supabase
  };

  const handleMapSelectEvent = (event) => {
    setSelectedEventId(event.id);
  };

  if (showCreateEvent) {
    return (
      <CreateEventScreen
        onCancel={() => setShowCreateEvent(false)}
        onCreateEvent={handleCreateEvent}
      />
    );
  }

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '800', marginBottom: 4 }}>
        Próximos Eventos 📅
      </Text>
      <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
        Fechas, batallas y encuentros de la cultura urbana.
      </Text>

      {/* BOTÓN INGRESAR EVENTO */}
      {canManageEvents && (
        <TouchableOpacity
          onPress={() => setShowCreateEvent(true)}
          style={{
            backgroundColor: '#facc15',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 14,
            alignSelf: 'flex-start',
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="add-circle-outline" size={18} color="#000000" style={{ marginRight: 6 }} />
          <Text style={{ color: '#000000', fontWeight: '800', fontSize: 13 }}>Ingresar evento</Text>
        </TouchableOpacity>
      )}

      {/* FILTROS POR CATEGORÍA */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12, maxHeight: 40 }}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setFilter(cat)}
            style={{
              backgroundColor: filter === cat ? '#facc15' : '#1e293b',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 10,
            }}
          >
            <Text style={{ color: filter === cat ? '#000000' : '#94a3b8', fontWeight: '700', fontSize: 13 }}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* MAPA REAL INTERACTIVO */}
      <EventsMap events={filteredEvents} onSelectEvent={handleMapSelectEvent} />

      {/* LISTADO DE EVENTOS */}
      {loading ? (
        <ActivityIndicator size="large" color="#facc15" style={{ marginTop: 20 }} />
      ) : (
        filteredEvents.map((event) => {
          const isSelected = selectedEventId === event.id;
          const imageUrl = event.image || event.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80';
          const eventDate = event.date || (event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Sin fecha');

          return (
            <TouchableOpacity
              key={event.id}
              onPress={() => setSelectedEventId(event.id)}
              activeOpacity={0.9}
              style={{
                backgroundColor: isSelected ? '#111827' : '#0f172a',
                borderColor: isSelected ? '#facc15' : '#1e293b',
                borderWidth: isSelected ? 2 : 1,
                borderRadius: 20,
                marginBottom: 16,
                overflow: 'hidden',
              }}
            >
              <View style={{ height: 140, width: '100%', position: 'relative' }}>
                <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                {event.category && (
                  <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(2, 6, 23, 0.85)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: '#facc15', fontSize: 11, fontWeight: '700' }}>{event.category}</Text>
                  </View>
                )}
                <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#facc15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: '#000000', fontSize: 11, fontWeight: '800' }}>{event.price || 'Gratis'}</Text>
                </View>
              </View>

              <View style={{ padding: 16 }}>
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>{event.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="calendar-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginRight: 12 }}>{eventDate}</Text>
                  {event.time && (
                    <>
                      <Ionicons name="time-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600' }}>{event.time}</Text>
                    </>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <Ionicons name="location-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#64748b', fontSize: 13 }}>{event.location || event.address || 'Ubicación a confirmar'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}