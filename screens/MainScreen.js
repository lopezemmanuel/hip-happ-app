import React, { useState, useEffect } from 'react';
import { View, Text, Alert, SafeAreaView, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomTab from '../components/BottomTab';
import UserDrawer from '../components/UserDrawer';
import AddEventModal from '../components/AddEventModal';
import EventsScreen from './EventsScreen';
import CommunityScreen from './CommunityScreen';
import { supabase } from '../lib/supabase';

const MOCK_NEWS = [
  {
    id: '1',
    title: 'Anuncian la fecha oficial de la Final Nacional de Freestyle',
    category: 'Competencias',
    date: 'Hace 2 hs',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    excerpt: 'Los mejores clasificatorios se enfrentarán el próximo mes en un evento épico.',
  },
  {
    id: '2',
    title: 'Nuevo álbum colaborativo reúne a referentes del Beatmaking',
    category: 'Música & Beats',
    date: 'Hace 5 hs',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80',
    excerpt: 'Un proyecto independiente que fusiona ritmos clásicos de Boom Bap con sonidos modernos.',
  },
  {
    id: '3',
    title: 'Murales & Graffiti: Exposición urbana en el centro cultural',
    category: 'Arte Urbano',
    date: 'Ayer',
    image: 'https://images.unsplash.com/photo-1561055657-b9e0bf0fa360?w=600&auto=format&fit=crop&q=80',
    excerpt: 'Artistas locales se reúnen para intervenir en vivo las paredes del anfiteatro.',
  },
];

export default function MainScreen({ session, isGuest, userProfile, onRequireAuth }) {
  const [activeTab, setActiveTab] = useState('Home');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  // 1. Obtenemos permisos desde la tabla 'users'
  useEffect(() => {
    async function fetchUserPermissions() {
      if (isGuest || !session?.user?.id) return;

      // Si userProfile ya viene cargado con los datos
      if (userProfile) {
        setUserRole(userProfile.role);
        setIsVerified(userProfile.is_verified || userProfile.isVerified);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role, is_verified')
          .eq('id', session.user.id)
          .maybeSingle(); // 👈 Usamos maybeSingle para evitar excepciones en caso de no hallar registros

        if (error) {
          console.log('Error Supabase RLS/Consulta:', error.message);
          return;
        }

        if (data) {
          setUserRole(data.role);
          setIsVerified(data.is_verified);
        }
      } catch (err) {
        console.log('Error inesperado al consultar permisos:', err);
      }
    }

    fetchUserPermissions();
  }, [session, userProfile, isGuest]);

  // 2. SOLO MOSTRAR A ADMINS O VERIFICADOS
  const canAddEvents = 
    !isGuest && 
    (userRole?.toLowerCase() === 'admin' || isVerified === true);

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={{ color: '#ffffff', fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>
              Hip-Happ
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: 20 }}>
              {isGuest ? 'Modo Explorador (Invitado)' : `Conectado como: ${session?.user?.email}`}
            </Text>

            <View style={{ width: '100%', marginTop: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800' }}>
                  Últimas Noticias 📰
                </Text>
                <TouchableOpacity onPress={() => Alert.alert('Noticias', 'Mostrando todas las noticias...')}>
                  <Text style={{ color: '#facc15', fontSize: 13, fontWeight: '700' }}>
                    Ver todas
                  </Text>
                </TouchableOpacity>
              </View>

              {MOCK_NEWS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => Alert.alert('Noticia', item.title)}
                  style={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderWidth: 1,
                    borderRadius: 18,
                    marginBottom: 14,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    minHeight: 100,
                  }}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={{ width: 76, height: 76, borderRadius: 12, marginRight: 12, backgroundColor: '#1e293b' }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ color: '#facc15', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                        {item.category}
                      </Text>
                      <Text style={{ color: '#64748b', fontSize: 11 }}>
                        {item.date}
                      </Text>
                    </View>
                    <Text
                      numberOfLines={2}
                      style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', lineHeight: 18, marginBottom: 4 }}
                    >
                      {item.title}
                    </Text>
                    <Text numberOfLines={1} style={{ color: '#94a3b8', fontSize: 12 }}>
                      {item.excerpt}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'Elementos':
        return (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Elementos</Text>
            <Text style={{ color: '#94a3b8' }}>Explora DJing, MCing, Breaking y Graffiti.</Text>
          </View>
        );

      case 'Eventos':
        return (
          <EventsScreen 
            onSelectEvent={(event) => Alert.alert('Evento', `Elegiste: ${event.title}`)}
            session={session}
            isGuest={isGuest}
          />
        );

      case 'Comunidad':
        return (
          <CommunityScreen 
            isGuest={isGuest} 
            session={session} 
            onRequireAuth={onRequireAuth} 
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
      
      {/* HEADER SUPERIOR CON BOTÓN "AGREGAR EVENTO" Y AVATAR */}
      <View style={{ width: '100%', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* BOTÓN SUPERIOR "AGREGAR EVENTO" (SOLO EN PESTAÑA EVENTOS Y SI TIENE PERMISOS) */}
        {activeTab === 'Eventos' && canAddEvents ? (
          <TouchableOpacity
            onPress={() => setEventModalVisible(true)}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#facc15',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Ionicons name="add-circle" size={18} color="#000000" />
            <Text style={{ color: '#000000', fontWeight: '800', fontSize: 12 }}>
              Agregar evento
            </Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {/* AVATAR DE USUARIO */}
        <TouchableOpacity
          onPress={() => setDrawerVisible(true)}
          activeOpacity={0.8}
          style={{ position: 'relative' }}
        >
          <Image
            source={{ uri: isGuest ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' }}
            style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#facc15' }}
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ 
          paddingHorizontal: 20, 
          paddingTop: 10, 
          paddingBottom: 110, 
          alignItems: 'center' 
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 500, alignItems: 'center' }}>
          {renderContent()}
        </View>
      </ScrollView>

      {/* BARRA DE NAVEGACIÓN FLOTANTE */}
      <BottomTab activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* SOLAPA DESLIZABLE DE USUARIO */}
      <UserDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        session={session}
        isGuest={isGuest}
        onLogout={() => {
          setDrawerVisible(false);
          onRequireAuth();
        }}
      />

      {/* MODAL DE AGREGAR EVENTO */}
      <AddEventModal
        visible={eventModalVisible}
        onClose={() => setEventModalVisible(false)}
        onSuccess={() => {
          // Recargar eventos si es necesario
        }}
      />

    </SafeAreaView>
  );
}