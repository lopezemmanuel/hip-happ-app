import React from 'react';
import { View, Text } from 'react-native';

export default function EventsMap(props) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 20, borderRadius: 20, height: 250, marginBottom: 16 }}>
      <Text style={{ color: '#ffffff', textAlign: 'center', fontSize: 14 }}>
        📍 [Mapa - Vista previa Web]
        {"\n\n"}
        El mapa interactivo solo está disponible en dispositivos móviles (Android/iOS).
        {"\n\n"}
        {props.events && props.events.length > 0 && props.events[0].id === 'temp-marker' ? (
          <Text style={{ color: '#facc15' }}>
            Simulación: Lat {props.events[0].latitude.toFixed(4)}, Lon {props.events[0].longitude.toFixed(4)}
          </Text>
        ) : (
          `Mostrando ${props.events?.length || 0} eventos.`
        )}
      </Text>
    </View>
  );
}
