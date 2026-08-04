import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const parseEventTimeFromDescription = (description) => {
  const match = description?.match(/Hora:\s*(.+?)\s*HS/i);
  return match ? match[1].trim() : null;
};

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

export default function EventCard({ event, tags = [], selected, onPress, isAttending, attendanceCount = 0, onToggleAttendance, disabled }) {
  const imageUrl = event.image || event.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80';
  const eventDate = event.date || formatEventDateLabel(event.event_date) || 'Sin fecha';
  const eventTime = formatTimeLabel(event.time || parseEventTimeFromDescription(event.description));
  const priceTag = event.price || event.precio;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        backgroundColor: selected ? '#111827' : '#0f172a',
        borderColor: selected ? '#facc15' : '#1e293b',
        borderWidth: selected ? 2 : 1,
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      <View style={{ height: 160, width: '100%', position: 'relative' }}>
        <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        {tags.length > 0 && (
          <View style={{ position: 'absolute', top: 10, left: 10, right: 80, flexDirection: 'row', flexWrap: 'wrap', zIndex: 10, paddingRight: 8 }}>
            {tags.map((tag, idx) => (
              <View
                key={idx}
                style={{ backgroundColor: 'rgba(2, 6, 23, 0.90)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#facc15', marginRight: 6, marginBottom: 6 }}
              >
                <Text style={{ color: '#facc15', fontSize: 10, fontWeight: '800' }}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        {priceTag ? (
          <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#facc15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#facc15' }}>
            <Text style={{ color: '#020617', fontSize: 10, fontWeight: '800' }}>{priceTag}</Text>
          </View>
        ) : null}
      </View>

      <View style={{ padding: 16 }}>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="location-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
          <Text style={{ color: '#64748b', fontSize: 13 }} numberOfLines={1}>
            {event.location || event.address || 'Ubicación a confirmar'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onToggleAttendance}
          disabled={disabled}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            backgroundColor: isAttending ? '#facc15' : 'transparent',
            borderWidth: 1,
            borderColor: '#facc15',
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 7,
          }}
        >
          <Ionicons name={isAttending ? 'checkmark-circle' : 'checkmark-circle-outline'} size={16} color={isAttending ? '#000000' : '#facc15'} style={{ marginRight: 6 }} />
          <Text style={{ color: isAttending ? '#000000' : '#facc15', fontWeight: '800', fontSize: 12 }}>
            {isAttending ? 'Asistiré' : 'Asistiré'}{attendanceCount > 0 ? ` · ${attendanceCount}` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
