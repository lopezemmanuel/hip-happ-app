import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
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
import SettingsScreen from './SettingsScreen';
import { supabase } from '../lib/supabase';
import { getCachedProfileSync, getCachedProfile, setCachedProfile } from '../lib/profileCache';

export default function MainScreen({ session, isGuest, userProfile, onRequireAuth }) {
  const [activeTab, setActiveTab] = useState('Home');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showValidateProfile, setShowValidateProfile] = useState(false);
  const [pendingOpenCreateEvent, setPendingOpenCreateEvent] = useState(false);
  // Arranca leyendo el último perfil conocido de esta cuenta en este
  // dispositivo (guardado la vez anterior que se cargó bien), para que el
  // primer render ya salga con el avatar/nombre correcto — sin esperar la
  // consulta a Supabase, que siempre tarda un poco.
  const [profile, setProfile] = useState(() => getCachedProfileSync(session?.user?.id));
  const [viewedProfileId, setViewedProfileId] = useState(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowNewPost(true);
  };

  // Estilo "push" (como X): la solapa de perfil es un panel fijo de fondo,
  // del lado izquierdo (más cómodo para diestros). Lo que se anima es el
  // CONTENIDO PRINCIPAL, deslizándose hacia la derecha para revelarla.
  const DRAWER_WIDTH = Dimensions.get('window').width;
  const REVEAL_WIDTH = DRAWER_WIDTH * 0.8;
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerDragging, setDrawerDragging] = useState(false);

  const openDrawer = () => {
    translateX.value = withTiming(REVEAL_WIDTH, { duration: 220 });
    setDrawerVisible(true);
  };
  const closeDrawer = () => {
    translateX.value = withTiming(0, { duration: 180 });
    setDrawerVisible(false);
  };

  // Gesture handler negocia correctamente con los TouchableOpacity anidados
  // (posts, botones), a diferencia de PanResponder — activeOffsetX/failOffsetY
  // le dicen al reconocedor nativo que solo tome el gesto si el movimiento es
  // predominantemente horizontal, y si no, lo cede al scroll/los toques.
  const panGesture = Gesture.Pan()
    .enabled(!viewedProfileId)
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20])
    .onStart(() => {
      startX.value = translateX.value;
      runOnJS(setDrawerDragging)(true);
    })
    .onUpdate((e) => {
      const next = startX.value + e.translationX;
      translateX.value = Math.min(REVEAL_WIDTH, Math.max(0, next));
    })
    .onEnd((e) => {
      const passedThreshold = translateX.value > REVEAL_WIDTH * 0.4;
      const shouldOpen = e.velocityX > 500 ? true : e.velocityX < -500 ? false : passedThreshold;
      translateX.value = withTiming(shouldOpen ? REVEAL_WIDTH : 0, { duration: 200 });
      runOnJS(setDrawerVisible)(shouldOpen);
    })
    .onFinalize(() => {
      runOnJS(setDrawerDragging)(false);
    });

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: (translateX.value / REVEAL_WIDTH) * 0.75,
  }));

  // Traemos el perfil completo apenas se monta la pantalla (no cuando se abre
  // la solapa), para que esté listo de antemano y no haya que esperar.
  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      if (isGuest || !session?.user?.id) return;

      // Si userProfile ya viene cargado con los datos (recién después del onboarding)
      if (userProfile) {
        const withId = { ...userProfile, id: session.user.id };
        setProfile(withId);
        setCachedProfile(session.user.id, withId);
        return;
      }

      // Si no lo teníamos ya como valor inicial (primera vez en este
      // dispositivo, o después de un logout que limpió el estado), lo
      // buscamos en caché igual antes de ir a la red.
      const cached = await getCachedProfile(session.user.id);
      if (!cancelled && cached) setProfile(cached);

      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, role, is_verified, is_validated, username, aka, full_name, avatar_url, disciplines')
          .eq('id', session.user.id)
          .maybeSingle(); // 👈 Usamos maybeSingle para evitar excepciones en caso de no hallar registros

        if (error) {
          console.log('Error Supabase RLS/Consulta:', error.message);
          return;
        }

        if (data && !cancelled) {
          setProfile(data);
          setCachedProfile(session.user.id, data);
        }
      } catch (err) {
        console.log('Error inesperado al consultar perfil:', err);
      }
    }

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, userProfile, isGuest]);

  // No confiamos en `profile` hasta que coincida con la sesión actual: entre
  // que cambia `session` y termina de correr el fetch de arriba, React ya
  // pintó al menos un frame con los datos de la cuenta anterior. Filtrando
  // acá (en el render, no en un efecto) evitamos ese flash del avatar/nombre
  // viejo al cambiar de cuenta.
  const currentProfile = profile?.id === session?.user?.id ? profile : null;

  const userRole = currentProfile?.role ?? null;
  const isVerified = currentProfile?.is_verified === true;
  const isValidated = currentProfile?.is_validated === true;

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
                onEditPost={handleEditPost}
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
            setProfile((prev) => {
              const next = { ...prev, ...updatedFields };
              setCachedProfile(session.user.id, next);
              return next;
            });
          }
        }}
      />
    );
  }

  if (showNewPost) {
    return (
      <NewPostScreen
        session={session}
        postToEdit={editingPost}
        onCancel={() => {
          setShowNewPost(false);
          setEditingPost(null);
        }}
        onPosted={() => {
          setShowNewPost(false);
          setEditingPost(null);
        }}
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
            setProfile((prev) => {
              const next = { ...prev, ...updatedFields };
              setCachedProfile(session.user.id, next);
              return next;
            });
          }
          // Por ahora, en esta etapa, no hace falta esperar la revisión: lo mandamos
          // directo a crear su evento.
          setActiveTab('Eventos');
          setPendingOpenCreateEvent(true);
        }}
      />
    );
  }

  if (showSettings) {
    return (
      <SettingsScreen
        session={session}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>

      {/* CAPA DE FONDO FIJA: LA SOLAPA (izquierda, no se anima ella, la revela el contenido de encima) */}
      <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: REVEAL_WIDTH }}>
        <UserDrawer
          session={session}
          isGuest={isGuest}
          profile={currentProfile}
          onClose={closeDrawer}
          onLogout={() => {
            closeDrawer();
            onRequireAuth();
          }}
          onEditProfile={() => {
            closeDrawer();
            setShowEditProfile(true);
          }}
          onViewProfile={() => {
            closeDrawer();
            setViewedProfileId(session?.user?.id ?? null);
          }}
          onOpenSettings={() => {
            closeDrawer();
            setShowSettings(true);
          }}
        />
      </View>

      {/* CAPA DE ENCIMA: TODA LA APP, SE DESLIZA A LA DERECHA PARA REVELAR LA SOLAPA */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ flex: 1 }, contentAnimatedStyle]}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>

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

                {/* HEADER CON AVATAR (izq) Y LOGO (der), se va con el scroll */}
                <View style={{ width: '100%', paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

                  {/* AVATAR DE USUARIO */}
                  <TouchableOpacity
                    onPress={openDrawer}
                    activeOpacity={0.8}
                    style={{ position: 'relative' }}
                  >
                    {isGuest ? (
                      <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80' }}
                        style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#facc15' }}
                      />
                    ) : currentProfile ? (
                      <Image
                        source={{ uri: currentProfile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' }}
                        style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#facc15' }}
                      />
                    ) : (
                      // Todavía no sabemos si esta cuenta tiene avatar o no: mejor un
                      // círculo vacío que mostrar la foto de stock y después "pegar el salto".
                      <View
                        style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#facc15', backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons name="person" size={18} color="#64748b" />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* LOGO HIP-HAPP (genérico por el momento) */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800', marginRight: 8 }}>Hip-Happ</Text>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: '#facc15',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="mic" size={18} color="#000000" />
                    </View>
                  </View>
                </View>

                {renderContent()}
              </View>
            </ScrollView>

            {/* BARRA DE NAVEGACIÓN FLOTANTE */}
            <BottomTab activeTab={activeTab} setActiveTab={setActiveTab} />

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
                onEditPost={handleEditPost}
              />
            )}
          </SafeAreaView>

          {/* FONDO OSCURECIDO, TAPA EL CONTENIDO PRINCIPAL MIENTRAS LA SOLAPA ESTÁ VISIBLE O SE ESTÁ ARRASTRANDO */}
          {(drawerVisible || drawerDragging) && (
            <Animated.View
              style={[
                { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000000' },
                backdropAnimatedStyle,
              ]}
            >
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDrawer} />
            </Animated.View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}