import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';

// 1. Cargamos react-native-maps SOLO si NO estamos en la Web
let MapView, Marker, Callout;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Callout = Maps.Callout;
}

export default function EventsMap({ events = [], onSelectEvent, onPress, selectedEventId, focusEventId }) {

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
  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const [trackingId, setTrackingId] = useState(null);

  // Solo "trackeamos" (re-dibujamos) el pin que acaba de cambiar de tamaño, y
  // por poco tiempo. Si tracksViewChanges quedara en true siempre, el pin (y el
  // cartel) titilan sin parar.
  useEffect(() => {
    if (!selectedEventId) return;
    setTrackingId(selectedEventId);
    const timer = setTimeout(() => setTrackingId(null), 300);
    return () => clearTimeout(timer);
  }, [selectedEventId]);

  const markers = events.filter(
    (event) => typeof event.latitude === 'number' && typeof event.longitude === 'number'
  );
  const firstMarker = markers[0];

  // Cuando se selecciona un evento desde la TARJETA (no desde el mapa: ahí el pin
  // ya abre su propio cartel solo), centra el mapa y fuerza la apertura del cartel.
  // Si esto se disparara también al tocar el pin, se abriría dos veces y parpadea.
  useEffect(() => {
    if (!focusEventId) return;
    const focusedEvent = markers.find((event) => event.id === focusEventId);
    if (!focusedEvent) return;

    mapRef.current?.animateToRegion(
      {
        latitude: focusedEvent.latitude,
        longitude: focusedEvent.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      400
    );

    const marker = markerRefs.current[focusEventId];
    setTimeout(() => marker?.showCallout?.(), 350);
  }, [focusEventId]);

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      initialRegion={{
        latitude: firstMarker?.latitude ?? -34.6037,
        longitude: firstMarker?.longitude ?? -58.3816,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      onPress={onPress}
    >
      {markers.map((event) => {
        const isSelected = event.id === selectedEventId;
        return (
          <Marker
            key={event.id}
            ref={(ref) => { markerRefs.current[event.id] = ref; }}
            coordinate={{ latitude: event.latitude, longitude: event.longitude }}
            onPress={() => onSelectEvent?.(event)}
            tracksViewChanges={event.id === trackingId}
          >
            <View
              style={{
                width: isSelected ? 34 : 22,
                height: isSelected ? 34 : 22,
                borderRadius: isSelected ? 17 : 11,
                backgroundColor: '#facc15',
                borderWidth: isSelected ? 3 : 2,
                borderColor: '#020617',
              }}
            />
            <Callout tooltip={false} style={{ width: 200 }}>
              <View style={{ width: 200, padding: 8 }}>
                <Text style={{ fontWeight: '700', color: '#020617', flexWrap: 'wrap' }} numberOfLines={2}>
                  {event.title}
                </Text>
                {!!event.subtitle && (
                  <Text style={{ color: '#334155', fontSize: 12, marginTop: 2, flexWrap: 'wrap' }} numberOfLines={3}>
                    {event.subtitle}
                  </Text>
                )}
              </View>
            </Callout>
          </Marker>
        );
      })}
    </MapView>
  );
}
