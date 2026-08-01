import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function UserDrawer({ visible, onClose, session, isGuest, onLogout }) {
  const [notifications, setNotifications] = React.useState(true);
  const [selectedCity, setSelectedCity] = React.useState('Buenos Aires, AR');

  // Posición inicial del panel fuera de la pantalla (a la derecha)
  const translateX = useRef(new Animated.Value(width)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.75,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: width,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const userData = {
    aka: session?.user?.email ? session.user.email.split('@')[0] : 'Invitado',
    isVerified: true,
    disciplines: ['MC', 'Beatmaker'],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  };

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        flexDirection: 'row',
      }}
    >
      {/* CAPA DE FONDO TRANSLÚCIDA CON OPACIDAD ANIMADA */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#020617',
          opacity: backdropOpacity,
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* ÁREA TRANSPARENTE TÁCTIL (20% IZQUIERDA) */}
      <TouchableOpacity
        style={{ width: '20%', height: '100%' }}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* PANEL SLIDER DESDE LA DERECHA (80% ANCHO) */}
      <Animated.View
        style={{
          width: '80%',
          height: '100%',
          backgroundColor: '#0f172a',
          borderColor: '#1e293b',
          borderLeftWidth: 1,
          paddingTop: 50,
          paddingHorizontal: 20,
          paddingBottom: 24,
          transform: [{ translateX }],
          shadowColor: '#000000',
          shadowOffset: { width: -4, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* BOTÓN CERRAR SOLAPA */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              alignSelf: 'flex-end',
              padding: 8,
              backgroundColor: '#1e293b',
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <Ionicons name="close" size={20} color="#ffffff" />
          </TouchableOpacity>

          {/* 1. MI PERFIL */}
          <View style={{ alignItems: 'center', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 20 }}>
            <View style={{ position: 'relative', marginBottom: 12 }}>
              <Image
                source={{ uri: isGuest ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80' : userData.avatar }}
                style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: '#facc15' }}
              />
              {!isGuest && userData.isVerified && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: '#facc15',
                    borderRadius: 12,
                    width: 24,
                    height: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="checkmark-sharp" size={16} color="#000000" />
                </View>
              )}
            </View>

            <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800', textAlign: 'center' }}>
              {isGuest ? 'Modo Invitado' : `@${userData.aka}`}
            </Text>

            {/* DISCIPLINAS (Solo si no es invitado) */}
            {!isGuest && (
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {userData.disciplines.map((disc, idx) => (
                  <View key={idx} style={{ backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#334155' }}>
                    <Text style={{ color: '#facc15', fontSize: 11, fontWeight: '700' }}>{disc}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* BOTONES PERFIL */}
            <View style={{ width: '100%', marginTop: 16, gap: 8 }}>
              {isGuest ? (
                /* BOTÓN DE INICIAR SESIÓN / REGISTRARSE PARA INVITADOS */
                <TouchableOpacity
                  onPress={onLogout}
                  style={{
                    backgroundColor: '#facc15',
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons name="log-in-outline" size={18} color="#000000" />
                  <Text style={{ color: '#000000', fontWeight: '800', fontSize: 13 }}>
                    Iniciar Sesión / Registrarse
                  </Text>
                </TouchableOpacity>
              ) : (
                /* BOTONES PARA USUARIOS LOGUEADOS */
                <>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Editar Perfil', 'Próximamente podrás editar tus datos.')}
                    style={{ backgroundColor: '#1e293b', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Editar Perfil</Text>
                  </TouchableOpacity>

                  {!userData.isVerified && (
                    <TouchableOpacity
                      onPress={() => Alert.alert('Verificación', 'Solicitud de verificación enviada.')}
                      style={{ backgroundColor: 'rgba(250, 204, 21, 0.15)', borderWidth: 1, borderColor: '#facc15', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#facc15', fontWeight: '700', fontSize: 13 }}>Verificar mi Cuenta 🎤</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>

          {/* 2. AJUSTES */}
          <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12 }}>
            Ajustes
          </Text>

          <View style={{ backgroundColor: '#020617', borderRadius: 16, padding: 12, marginBottom: 24, borderWidth: 1, borderColor: '#1e293b' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="notifications-outline" size={18} color="#facc15" style={{ marginRight: 10 }} />
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>Notificaciones</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#334155', true: '#facc15' }}
                thumbColor={notifications ? '#000000' : '#cbd5e1'}
              />
            </View>

            <TouchableOpacity
              onPress={() => Alert.alert('Ubicación', 'Selecciona tu ciudad principal.')}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e293b' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location-outline" size={18} color="#facc15" style={{ marginRight: 10 }} />
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>Ubicación</Text>
              </View>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>{selectedCity}</Text>
            </TouchableOpacity>
          </View>

          {/* 3. SOPORTE Y COMUNIDAD */}
          <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12 }}>
            Soporte & Comunidad
          </Text>

          <View style={{ backgroundColor: '#020617', borderRadius: 16, padding: 12, marginBottom: 24, borderWidth: 1, borderColor: '#1e293b', gap: 12 }}>
            <TouchableOpacity
              onPress={() => Alert.alert('Protocolo', 'Reglas de convivencia de la comunidad Hip-Happ.')}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color="#94a3b8" style={{ marginRight: 10 }} />
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>Reglas de la Comunidad</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Alert.alert('Soporte', 'Contacto con administradores.')}
              style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e293b' }}
            >
              <Ionicons name="help-circle-outline" size={18} color="#94a3b8" style={{ marginRight: 10 }} />
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>Ayuda & Soporte</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* 4. PIE DE SOLAPA */}
        <TouchableOpacity
          onPress={onLogout}
          style={{
            backgroundColor: '#ef444415',
            borderColor: '#ef4444',
            borderWidth: 1,
            borderRadius: 14,
            paddingVertical: 12,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 13 }}>
            {isGuest ? 'Salir de Invitado' : 'Cerrar Sesión'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}