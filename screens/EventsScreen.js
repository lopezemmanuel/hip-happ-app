import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
import { Ionicons } from '@expo/vector-icons';
import CreateEventScreen from './CreateEventScreen';
import EventsMap from '../components/EventsMap';
import { supabase } from '../lib/supabase';

// Tipos de evento disponibles
const EVENT_TYPES = ['Freestyle', 'Show', 'Batallas', 'Dance', 'DJing', 'Jam', 'Cypher', 'Breaking', 'Festival', 'Taller', 'Expo', 'Graffiti', 'Street art', 'Encuentro'];

const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const parseEventTimeFromDescription = (description) => {
  const match = description?.match(/Hora:\s*(.+?)\s*HS/i);
  return match ? match[1].trim() : null;
};

// Normaliza cualquier hora tipeada por el usuario ("18", "18.30", "18h30"...) a "HH:MM Hs"
const formatTimeLabel = (rawTime) => {
  if (!rawTime) return null;
  const match = rawTime.match(/(\d{1,2})[:.hH]?(\d{2})?/);
  if (!match) return rawTime;
  const hours = match[1].padStart(2, '0');
  const minutes = (match[2] || '00').padStart(2, '0');
  return `${hours}:${minutes} Hs`;
};

const formatEventDateLabel = (isoDate) => {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  return `${DAY_ABBR[d.getDay()]} ${d.getDate()} ${MONTH_ABBR[d.getMonth()]}, ${d.getFullYear()}`;
};

const MOCK_EVENTS = [
  {
    id: '1',
    title: 'Batalla de Gallos: King of the Mic',
    date: '15 AGOSTO',
    time: '18:00 HS',
    location: 'Plaza de la Estación, Lomas',
    address: 'Plaza de la Estación, Lomas de Zamora',
    latitude: -34.7592,
    longitude: -58.4022,
    price: 'Gratis',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    freestyle: true,
    show: false,
    batallas: true,
    dance: false,
    djing: false,
    jam: false,
    cypher: true,
    breaking: false,
    festival: false,
    taller: false,
    expo: false,
    graffiti: false,
    street_art: false,
    encuentro: false,
  },
  {
    id: '2',
    title: 'Underground Jam & Breaking Session',
    date: '22 AGOSTO',
    time: '16:00 HS',
    location: 'Centro Cultural Urbano',
    address: 'Centro Cultural Urbano, Lanús',
    latitude: -34.7001,
    longitude: -58.3912,
    price: '$2000',
    image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&auto=format&fit=crop&q=80',
    freestyle: false,
    show: false,
    batallas: false,
    dance: false,
    djing: false,
    jam: true,
    cypher: false,
    breaking: true,
    festival: false,
    taller: false,
    expo: false,
    graffiti: false,
    street_art: false,
    encuentro: false,
  },
  {
    id: '3',
    title: 'Beatmakers Showcase & Live DJing',
    date: '05 SEPTIEMBRE',
    time: '21:00 HS',
    location: 'Club Búnker, CABA',
    address: 'Av. Corrientes 1234, CABA',
    latitude: -34.6037,
    longitude: -58.3815,
    price: '$3500',
    image: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=600&auto=format&fit=crop&q=80',
    freestyle: false,
    show: false,
    batallas: false,
    dance: false,
    djing: true,
    jam: false,
    cypher: false,
    breaking: false,
    festival: false,
    taller: false,
    expo: false,
    graffiti: false,
    street_art: false,
    encuentro: false,
  },
];

export default function EventsScreen({ onSelectEvent, session, isGuest, userRole, isVerified }) {
  const [filter, setFilter] = useState('Todos');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const categories = ['Todos', ...EVENT_TYPES];
  const isAdmin = userRole?.toLowerCase() === 'admin';
  const canManageEvents = !isGuest && (isAdmin || isVerified === true);

  const canEditEvent = (event) => {
    if (!event || isGuest) return false;
    if (isAdmin) return true;
    return !!session?.user?.id && event.organizer_id === session.user.id;
  };

  const getEventTagLabels = (event) => {
    if (!event) return [];
    const result = EVENT_TYPES.filter((type) => {
      const key = type.toLowerCase().replace(/ /g, '_');
      const value = event?.[key];
      return value === true;
    });
    return result;
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setEvents(data);
      } else {
        setEvents(MOCK_EVENTS);
      }
    } catch (err) {
      console.log('Error al cargar eventos:', err.message);
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
    const tagKey = filter.toLowerCase();
    return event?.[tagKey] === true || event?.[tagKey] === 'true' || event?.[tagKey] === 1;
  });

  // Para el mapa: arma un subtítulo con día, horario y lugar que se muestra en el callout del pin
  const mapMarkers = filteredEvents.map((event) => {
    const dateLabel = event.date || formatEventDateLabel(event.event_date);
    const timeLabel = formatTimeLabel(event.time || parseEventTimeFromDescription(event.description));
    const placeLabel = event.location || event.address;
    const subtitle = [
      [dateLabel, timeLabel].filter(Boolean).join(' · '),
      placeLabel,
    ].filter(Boolean).join('\n');

    return { ...event, subtitle };
  });

  const handleCreateEvent = (newEvent) => {
    if (newEvent) {
      const normalizedTags = Array.isArray(newEvent.tags)
        ? newEvent.tags
        : Array.isArray(newEvent.category)
          ? newEvent.category
          : Array.isArray(newEvent.event_type)
            ? newEvent.event_type
            : Array.isArray(newEvent.type)
              ? newEvent.type
              : [];

      const normalizedEvent = {
        ...newEvent,
        id: newEvent.id || `local-${Date.now()}`,
        tags: normalizedTags,
        event_type: normalizedTags,
        type: normalizedTags,
      };

      setEvents((prev) => {
        const existingIndex = prev.findIndex((e) => e.id === normalizedEvent.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = normalizedEvent;
          return updated;
        }
        return [normalizedEvent, ...prev];
      });
    }
    setShowCreateEvent(false);
    setEventToEdit(null);
  };

  const handleEditRequest = (event) => {
    setEventToEdit(event);
    setShowEventDetails(false);
    setShowCreateEvent(true);
  };

  const handleDeleteEvent = (event) => {
    Alert.alert(
      'Eliminar evento',
      `¿Seguro que querés eliminar "${event.title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('events').delete().eq('id', event.id);
            if (error) {
              Alert.alert('Error', 'No se pudo eliminar el evento.');
              return;
            }
            setEvents((prev) => prev.filter((e) => e.id !== event.id));
            setShowEventDetails(false);
          },
        },
      ]
    );
  };

  const handleMapSelectEvent = (event) => {
    setSelectedEventId(event.id);
  };

  const getSelectedTags = (event) => {
    return getEventTagLabels(event);
  };

  if (showCreateEvent) {
    return (
      <CreateEventScreen
        onCancel={() => {
          setShowCreateEvent(false);
          setEventToEdit(null);
        }}
        onCreateEvent={handleCreateEvent}
        session={session}
        eventToEdit={eventToEdit}
      />
    );
  }

  const selectedEventImages = selectedEvent
    ? (selectedEvent.image_urls?.length > 0
        ? selectedEvent.image_urls
        : [selectedEvent.image || selectedEvent.image_url]
      ).filter(Boolean)
    : [];

  return (
    <>
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '800', marginBottom: 4 }}>
          Próximos Eventos
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, maxHeight: 40 }}>
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

        {/* MAPA INTERACTIVO */}
        <View
          style={{
            height: 220,
            borderRadius: 18,
            overflow: 'hidden',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#1e293b',
          }}
        >
          <EventsMap
            key={loading ? 'map-loading' : 'map-ready'}
            events={mapMarkers}
            onSelectEvent={handleMapSelectEvent}
          />
        </View>

        {/* LISTADO DE EVENTOS EN PLACAS */}
        {loading ? (
          <ActivityIndicator size="large" color="#facc15" style={{ marginTop: 20 }} />
        ) : (
          filteredEvents.map((event) => {
            const isSelected = selectedEventId === event.id;
            const imageUrl = event.image || event.image_url || event.imageUrl || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80';
            const eventDate = event.date || formatEventDateLabel(event.event_date) || 'Sin fecha';
            const eventTime = formatTimeLabel(event.time || parseEventTimeFromDescription(event.description));
            const tags = getSelectedTags(event);
            const priceTag = event.price || event.precio;

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
                <View style={{ height: 160, width: '100%', position: 'relative' }}>
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={{ width: '100%', height: '100%' }} 
                    resizeMode="cover" 
                  />
                  <View 
                    style={{ 
                      position: 'absolute', 
                      top: 10, 
                      left: 10, 
                      right: 80, 
                      flexDirection: 'row', 
                      flexWrap: 'wrap', 
                      zIndex: 10,
                      paddingRight: 8,
                    }}
                  >
                    {tags.map((tag, idx) => (
                      <View 
                        key={idx}
                        style={{ 
                          backgroundColor: 'rgba(2, 6, 23, 0.90)', 
                          paddingHorizontal: 8, 
                          paddingVertical: 4, 
                          borderRadius: 8, 
                          borderWidth: 1, 
                          borderColor: '#facc15',
                          marginRight: 6,
                          marginBottom: 6,
                        }}
                      >
                        <Text style={{ color: '#facc15', fontSize: 10, fontWeight: '800' }}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {priceTag ? (
                    <View
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        backgroundColor: '#facc15',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#facc15',
                      }}
                    >
                      <Text style={{ color: '#020617', fontSize: 10, fontWeight: '800' }}>
                        {priceTag}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ padding: 16, paddingRight: 60 }}>
                  <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>{event.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="calendar-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginRight: 12 }}>{eventDate}</Text>
                    {eventTime && (
                      <>
                        <Ionicons name="time-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600' }}>{eventTime}</Text>
                      </>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="location-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#64748b', fontSize: 13 }} numberOfLines={1}>
                      {event.location || event.address || 'Ubicación a confirmar'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedEvent(event);
                    setShowEventDetails(true);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    backgroundColor: '#facc15',
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 5,
                  }}
                >
                  <Ionicons name="add" size={28} color="#000000" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={showEventDetails}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEventDetails(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {selectedEvent && (
                <>
                  <View style={{ height: 220, position: 'relative' }}>
                    {selectedEventImages.length > 0 ? (
                      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                        {selectedEventImages.map((url, idx) => (
                          <Image
                            key={idx}
                            source={{ uri: url }}
                            style={{ width: SCREEN_WIDTH, height: 220 }}
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                    ) : (
                      <View style={{ width: '100%', height: 220, backgroundColor: '#1e293b' }} />
                    )}
                    <TouchableOpacity
                      onPress={() => setShowEventDetails(false)}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        backgroundColor: 'rgba(2,6,23,0.85)',
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="close" size={20} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ padding: 20 }}>
                    <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800', marginBottom: 8 }}>
                      {selectedEvent.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Ionicons name="calendar-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginRight: 12 }}>
                        {selectedEvent.date || formatEventDateLabel(selectedEvent.event_date) || 'Sin fecha'}
                      </Text>
                      {formatTimeLabel(selectedEvent.time || parseEventTimeFromDescription(selectedEvent.description)) && (
                        <>
                          <Ionicons name="time-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                          <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600' }}>
                            {formatTimeLabel(selectedEvent.time || parseEventTimeFromDescription(selectedEvent.description))}
                          </Text>
                        </>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Ionicons name="location-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#64748b', fontSize: 13 }}>
                        {selectedEvent.location || selectedEvent.address || 'Ubicación a confirmar'}
                      </Text>
                    </View>
                    {(selectedEvent.price || selectedEvent.precio) && (
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          backgroundColor: '#1e293b',
                          borderWidth: 1,
                          borderColor: '#facc15',
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          marginBottom: 14,
                        }}
                      >
                        <Text style={{ color: '#facc15', fontSize: 12, fontWeight: '800' }}>
                          {selectedEvent.price || selectedEvent.precio}
                        </Text>
                      </View>
                    )}
                    {selectedEvent.description_long && (
                      <Text style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 20 }}>
                        {selectedEvent.description_long}
                      </Text>
                    )}
                    {canEditEvent(selectedEvent) && (
                      <View style={{ flexDirection: 'row', marginTop: 20, gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => handleEditRequest(selectedEvent)}
                          style={{
                            flex: 1,
                            backgroundColor: '#1e293b',
                            borderWidth: 1,
                            borderColor: '#facc15',
                            borderRadius: 12,
                            paddingVertical: 12,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Ionicons name="pencil" size={16} color="#facc15" style={{ marginRight: 6 }} />
                          <Text style={{ color: '#facc15', fontWeight: '800', fontSize: 13 }}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteEvent(selectedEvent)}
                          style={{
                            flex: 1,
                            backgroundColor: '#1e293b',
                            borderWidth: 1,
                            borderColor: '#ef4444',
                            borderRadius: 12,
                            paddingVertical: 12,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Ionicons name="trash" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                          <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 13 }}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
