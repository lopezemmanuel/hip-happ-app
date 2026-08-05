import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ArchivedPostsScreen from './ArchivedPostsScreen';

function SettingsRow({ icon, label, onPress, right }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name={icon} size={20} color="#facc15" style={{ marginRight: 14 }} />
        <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600' }}>{label}</Text>
      </View>
      {right || (onPress && <Ionicons name="chevron-forward" size={18} color="#64748b" />)}
    </TouchableOpacity>
  );
}

// Estructura tipo X (lista de filas por sección): por ahora solo
// "Publicaciones archivadas" es funcional, el resto son placeholders que se
// van a terminar de definir más adelante.
export default function SettingsScreen({ session, onClose }) {
  const [notifications, setNotifications] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  if (showArchived) {
    return <ArchivedPostsScreen session={session} onBack={() => setShowArchived(false)} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 50, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '800' }}>Configuración</Text>
          <TouchableOpacity onPress={() => onClose?.()} style={{ padding: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 }}>
          General
        </Text>
        <View style={{ marginBottom: 24 }}>
          <SettingsRow
            icon="notifications-outline"
            label="Notificaciones"
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#334155', true: '#facc15' }}
                thumbColor={notifications ? '#000000' : '#cbd5e1'}
              />
            }
          />
          <SettingsRow
            icon="location-outline"
            label="Ubicación"
            onPress={() => Alert.alert('Ubicación', 'Selecciona tu ciudad principal.')}
          />
        </View>

        <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 }}>
          Publicaciones
        </Text>
        <View style={{ marginBottom: 24 }}>
          <SettingsRow icon="archive-outline" label="Publicaciones archivadas" onPress={() => setShowArchived(true)} />
        </View>
      </ScrollView>
    </View>
  );
}
