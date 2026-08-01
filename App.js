import React, { useState, useEffect } from 'react';
import { Alert, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { supabase } from './lib/supabase';

import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import MainScreen from './screens/MainScreen';
import RegisterScreen from './screens/RegisterScreen';

export default function App() {
  const [session, setSession] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener la sesión activa al abrir la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Escuchar cambios de autenticación (Login / Logout en tiempo real)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        // Si la sesión pasa a null (Cerrar sesión), reseteamos los estados
        setIsGuest(false);
        setNeedsOnboarding(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (sessionData, isNewUser) => {
    setSession(sessionData);
    setIsGuest(false);
    if (isNewUser) {
      setNeedsOnboarding(true);
    }
  };

  const handleOnboardingComplete = (profileData) => {
    setUserProfile(profileData);
    setNeedsOnboarding(false);
  };

  const handleRequireAuth = () => {
    supabase.auth.signOut();
    setSession(null);
    setIsGuest(false);
    setNeedsOnboarding(false);
  };

  const handleOpenRegister = () => {
    setShowRegister(true);
  };

  const handleCloseRegister = () => {
    setShowRegister(false);
  };

  const handleRegisterSuccess = (authData) => {
    setShowRegister(false);
    if (authData?.session) {
      setSession(authData.session);
      setIsGuest(false);
      setNeedsOnboarding(true);
    } else {
      Alert.alert('Cuenta creada', 'Revisa tu correo para confirmar la cuenta.');
    }
  };

  // Pantalla de carga mientras lee la sesión de Supabase
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' }}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  // Renderizado según el estado, ENVOLEVIENDO TODO EN NavigationContainer
  return (
    <NavigationContainer>
      {needsOnboarding ? (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      ) : session || isGuest ? (
        <MainScreen
          session={session}
          isGuest={isGuest}
          userProfile={userProfile}
          onRequireAuth={handleRequireAuth}
        />
      ) : showRegister ? (
        <RegisterScreen
          onBackToLogin={handleCloseRegister}
          onRegisterSuccess={handleRegisterSuccess}
        />
      ) : (
        <AuthScreen
          onLoginSuccess={handleLoginSuccess}
          onEnterAsGuest={() => setIsGuest(true)}
          onCreateAccount={handleOpenRegister}
        />
      )}
    </NavigationContainer>
  );
}