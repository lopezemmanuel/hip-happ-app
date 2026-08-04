import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomTab from '../components/BottomTab';
import UserDrawer from '../components/UserDrawer';
import EventsScreen from './EventsScreen';
import SearchScreen from './SearchScreen';
import CommunityScreen from './CommunityScreen';
import EditProfileScreen from './EditProfileScreen';
import ProfileScreen from './ProfileScreen';
import ArtistVerificationScreen from './ArtistVerificationScreen';
import NewPostScreen from './NewPostScreen';
import HomeFeedScreen from './HomeFeedScreen';
import { supabase } from '../lib/supabase';

export default function MainScreen({ session, isGuest, userProfile, onRequireAuth }) {
  const [activeTab, setActiveTab] = useState('Home');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showValidateProfile, setShowValidateProfile] = useState(false);
  const [pendingOpenCreateEvent, setPendingOpenCreateEvent] = useState(false);
  const [profile, setProfile] = useState(null);
  const [viewedProfileId, setViewedProfileId] = useState(null);
  const [showNewPost, setShowNewPost] = useState(false);

  // Traemos el perfil completo apenas se monta la pantalla (no cuando se abre
  // la solapa), para que esté listo de antemano y no haya que esperar.
  useEffect(() => {
    async function fetchProfile() {
      if (isGuest || !session?.user?.id) return;

      // Si userProfile ya viene cargado con los datos (recién después del onboarding)
      if (userProfile) {
        setProfile(userProfile);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role, is_verified, is_validated, username, full_name, avatar_url, disciplines')
          .eq('id', session.user.id)
          .maybeSingle(); // 👈 Usamos maybeSingle para evitar excepciones en caso de no hallar registros

        if (error) {
          console.log('Error Supabase RLS/Consulta:', error.message);
          return;
        }

        if (data) {
          setProfile(data);
        }
      } catch (err) {
        console.log('Error inesperado al consultar perfil:', err);
      }
    }

    fetchProfile();
  }, [session, userProfile, isGuest]);

  const userRole = profile?.role ?? null;
  const isVerified = profile?.is_verified === true;
  const isValidated = profile?.is_validated === true;

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

            {isGuest ? (
              <TouchableOpacity
                onPress={onRequireAuth}
                style={{
                  backgroundColor: 'rgba(250, 204, 21, 0.15)',
                  borderColor: '#facc15',
                  borderWidth: 1,
                  padding: 14,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Ionicons name="lock-closed" size={20} color="#facc15" style={{ marginRight: 10 }} />
                <Text style={{ color: '#ffffff', fontSize: 13, flex: 1, fontWeight: '600' }}>
                  Estás en modo visitante. <Text style={{ color: '#facc15', textDecorationLine: 'underline' }}>Iniciá sesión</Text> para ver la actividad de la gente que seguís.
                </Text>
              </TouchableOpacity>
            ) : (
              <HomeFeedScreen
                session={session}
                onSelectUser={(user) => setViewedProfileId(user.id)}
              />
            )}
          </View>
        );

      case 'Explorar':
        return (
          <SearchScreen
            onSelectUser={(user) => setViewedProfileId(user.id)}
          />
        );

      case 'Eventos':
        return (
          <EventsScreen
            onSelectEvent={(event) => Alert.alert('Evento', `Elegiste: ${event.title}`)}
            session={session}
            isGuest={isGuest}
            userRole={userRole}
            isVerified={isVerified}
            isValidated={isValidated}
            onRequestValidation={() => setShowValidateProfile(true)}
            autoOpenCreate={pendingOpenCreateEvent}
            onAutoOpenHandled={() => setPendingOpenCreateEvent(false)}
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

  if (showEditProfile) {
    return (
      <EditProfileScreen
        session={session}
        onDone={(updatedFields) => {
          setShowEditProfile(false);
          if (updatedFields) {
            setProfile((prev) => ({ ...prev, ...updatedFields }));
          }
        }}
      />
    );
  }

  if (showNewPost) {
    return (
      <NewPostScreen
        session={session}
        onCancel={() => setShowNewPost(false)}
        onPosted={() => setShowNewPost(false)}
      />
    );
  }

  if (showValidateProfile) {
    return (
      <ArtistVerificationScreen
        session={session}
        onCancel={() => setShowValidateProfile(false)}
        onDone={(updatedFields) => {
          setShowValidateProfile(false);
          if (updatedFields) {
            setProfile((prev) => ({ ...prev, ...updatedFields }));
          }
          // Por ahora, en esta etapa, no hace falta esperar la revisión: lo mandamos
          // directo a crear su evento.
          setActiveTab('Eventos');
          setPendingOpenCreateEvent(true);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>

      {/* HEADER SUPERIOR CON LOGO Y AVATAR */}
      <View style={{ width: '100%', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

        {/* LOGO HIP-HAPP (genérico por el momento) */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#facc15',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 8,
            }}
          >
            <Ionicons name="mic" size={18} color="#000000" />
          </View>
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>Hip-Happ</Text>
        </View>

        {/* AVATAR DE USUARIO */}
        <TouchableOpacity
          onPress={() => setDrawerVisible(true)}
          activeOpacity={0.8}
          style={{ position: 'relative' }}
        >
          <Image
            source={{
              uri: isGuest
                ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
                : (profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'),
            }}
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
        profile={profile}
        onLogout={() => {
          setDrawerVisible(false);
          onRequireAuth();
        }}
        onEditProfile={() => {
          setDrawerVisible(false);
          setShowEditProfile(true);
        }}
        onViewProfile={() => {
          setDrawerVisible(false);
          setViewedProfileId(session?.user?.id ?? null);
        }}
      />

      {/* VISTA DE PERFIL (PROPIO O PÚBLICO) */}
      {viewedProfileId && (
        <ProfileScreen
          userId={viewedProfileId}
          session={session}
          onBack={() => setViewedProfileId(null)}
          onEditProfile={() => {
            setViewedProfileId(null);
            setShowEditProfile(true);
          }}
          onNewPost={() => setShowNewPost(true)}
        />
      )}

    </SafeAreaView>
  );
}