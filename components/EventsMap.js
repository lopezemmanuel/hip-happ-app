import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';

export default function EventsMap({ events = [], onSelectEvent }) {
  // Coordenadas iniciales centradas en Zona Sur / CABA
  const defaultRegion = {
    latitude: -34.7592,
    longitude: -58.4022,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  // Procesamos los eventos para evitar que dos pines coincidan exactamente en el mismo punto
  const processedEvents = events.map((event, index) => {
    let lat = parseFloat(event.latitude);
    let lng = parseFloat(event.longitude);

    // Si no tienen lat/lng válidos, asignamos un punto inicial con un leve desplazamiento
    if (isNaN(lat) || isNaN(lng)) {
      lat = defaultRegion.latitude + index * 0.008;
      lng = defaultRegion.longitude + index * 0.008;
    } else {
      // Si hay eventos duplicados en la misma coordenada, los separamos ligeramente
      const duplicateIndex = events.findIndex(
        (e, idx) => idx < index && parseFloat(e.latitude) === lat && parseFloat(e.longitude) === lng
      );
      if (duplicateIndex !== -1) {
        lat += 0.002 * index;
        lng += 0.002 * index;
      }
    }

    return {
      ...event,
      markerLat: lat,
      markerLng: lng,
    };
  });

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={defaultRegion}
        showsUserLocation={true}
      >
        {processedEvents.map((event) => (
          <Marker
            key={String(event.id || Math.random())}
            coordinate={{
              latitude: event.markerLat,
              longitude: event.markerLng,
            }}
            pinColor="#facc15"
            onPress={() => onSelectEvent && onSelectEvent(event)}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{event.title || 'Evento'}</Text>
                <Text style={styles.calloutText}>
                  📍 {event.address || event.location || 'Ubicación sin especificar'}
                </Text>
                {event.date && <Text style={styles.calloutDate}>📅 {event.date}</Text>}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 250,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  calloutContainer: {
    padding: 6,
    maxWidth: 200,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 2,
  },
  calloutText: {
    fontSize: 11,
    color: '#334155',
  },
  calloutDate: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
});