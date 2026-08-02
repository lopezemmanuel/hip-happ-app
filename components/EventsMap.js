import React from 'react';
import { View, Text, Platform } from 'react-native';

// 1. Cargamos react-native-maps SOLO si NO estamos en la Web
let MapView, Marker, Callout;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Callout = Maps.Callout;
}

export default function EventsMap({ events = [], onSelectEvent, onPress }) {

  // 2. Si estamos en la Web, mostramos este bloque para evitar que se ponga la pantalla en blanco
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 20 }}>
        <Text style={{ color: '#ffffff', textAlign: 'center', fontSize: 16 }}>
          📍 [Vista previa Web]
          {"\n\n"}
          El mapa nativo está oculto en la web para evitar el error 500. ¡El resto de tu app y pantallas sí se verán aquí!
        </Text>
      </View>
    );
  }

  // 3. Si estás en celular (Android / iOS), renderiza tu mapa normalmente
  const markers = events.filter(
    (event) => typeof event.latitude === 'number' && typeof event.longitude === 'number'
  );
  const firstMarker = markers[0];

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: firstMarker?.latitude ?? -34.6037,
        longitude: firstMarker?.longitude ?? -58.3816,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      onPress={onPress}
    >
      {markers.map((event) => (
        <Marker
          key={event.id}
          coordinate={{ latitude: event.latitude, longitude: event.longitude }}
          pinColor="#facc15"
          onPress={() => onSelectEvent?.(event)}
        >
          <Callout>
            <View style={{ padding: 6, maxWidth: 220 }}>
              <Text style={{ fontWeight: '700', color: '#020617' }}>{event.title}</Text>
              {!!event.subtitle && (
                <Text style={{ color: '#334155', fontSize: 12, marginTop: 2 }}>{event.subtitle}</Text>
              )}
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}