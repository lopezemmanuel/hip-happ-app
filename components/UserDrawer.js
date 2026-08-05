import React from 'react';
import { Image } from 'expo-image';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Estilo "push" (como X): este panel es fijo, vive de fondo. Lo que se anima
// para mostrarlo/ocultarlo es el contenido principal, deslizándose por
// encima — esa animación vive en MainScreen.js, no acá.
export default function UserDrawer({ session, isGuest, onLogout, onEditProfile, onViewProfile, profile, onClose, onOpenSettings }) {
  // El perfil ya viene cargado desde MainScreen (fetch al montar la pantalla,
  // no al abrir la solapa), así que se muestra al instante sin esperas.
  // Orden de prioridad: Administrador > Cuenta verificada > Perfil validado > (nada, Usuario Común)
  const roleLabel = profile?.role === 'admin'
    ? 'Administrador'
    : profile?.is_verified === true
      ? 'Cuenta verificada'
      : profile?.is_validated === true
        ? 'Perfil validado'
        : null;

  const userData = {
    aka: profile?.aka || profile?.username || (session?.user?.email ? session.user.email.split('@')[0] : 'Invitado'),
    username: profile?.username || null,
    isVerified: profile?.is_verified === true,
    disciplines: profile?.disciplines?.length > 0 ? profile.disciplines : [],
    avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0f172a',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 24,
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
          {/* BOTÓN DE CONFIGURACIÓN (engranaje) */}
          {!isGuest && (
            <TouchableOpacity
              onPress={() => onOpenSettings?.()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ alignSelf: 'flex-end', padding: 8, backgroundColor: '#1e293b', borderRadius: 12, marginBottom: 16 }}
            >
              <Ionicons name="settings-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          )}

          {/* 1. MI PERFIL */}
          <View style={{ alignItems: 'center', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 20 }}>
            <TouchableOpacity
              activeOpacity={isGuest ? 1 : 0.8}
              disabled={isGuest}
              onPress={() => onViewProfile?.()}
              style={{ alignItems: 'center' }}
            >
              <View style={{ position: 'relative', marginBottom: 12 }}>
                {isGuest || profile ? (
                  <Image
                    source={{ uri: isGuest ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80' : userData.avatar }}
                    style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: '#facc15' }}
                  />
                ) : (
                  <View style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: '#facc15', backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="person" size={32} color="#64748b" />
                  </View>
                )}
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
                {isGuest ? 'Modo Invitado' : `${userData.aka}`}
              </Text>
            </TouchableOpacity>

            {/* @USUARIO (debajo del AKA, más chico) */}
            {!isGuest && !!userData.username && (
              <Text style={{ color: '#facc15', fontSize: 13, fontWeight: '600', marginTop: 2 }}>
                @{userData.username}
              </Text>
            )}

            {/* CORREO ELECTRÓNICO (debajo del AKA) */}
            {!isGuest && !!session?.user?.email && (
              <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                {session.user.email}
              </Text>
            )}

            {/* ETIQUETA DE ROL (debajo del correo; nada si es Usuario Común) */}
            {!isGuest && !!roleLabel && (
              <View
                style={{
                  backgroundColor: 'rgba(250, 204, 21, 0.15)',
                  borderWidth: 1,
                  borderColor: '#facc15',
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  marginTop: 8,
                }}
              >
                <Text style={{ color: '#facc15', fontSize: 11, fontWeight: '800' }}>{roleLabel}</Text>
              </View>
            )}

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
                    onPress={() => onEditProfile?.()}
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
    </View>
  );
}
