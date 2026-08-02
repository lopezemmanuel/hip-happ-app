import React, { useState, useEffect } from 'react';
import { Alert, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { supabase } from './lib/supabase';

import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import MainScreen from './screens/MainScreen';
import RegisterScreen from './screens/RegisterScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';

// Los links de recuperación de contraseña llegan con los tokens en la URL
// (como fragmento #... o query ?...). Supabase no los procesa solo en RN
// (detectSessionInUrl: false), así que los extraemos a mano.
function parseTokensFromUrl(url) {
  if (!url) return {};
  const splitIndex = url.indexOf('#') >= 0 ? url.indexOf('#') : url.indexOf('?');
  if (splitIndex < 0) return {};
  const paramsString = url.substring(splitIndex + 1);
  const params = {};
  paramsString.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });
  return params;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
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
      if (_event === 'PASSWORD_RECOVERY') {
        setShowResetPassword(true);
      }
      if (!session) {
        // Si la sesión pasa a null (Cerrar sesión), reseteamos los estados
        setIsGuest(false);
        setNeedsOnboarding(false);
      }
      setLoading(false);
    });

    // 3. Capturar el link de "recuperar contraseña" que abre la app
    const handleIncomingUrl = async (url) => {
      const params = parseTokensFromUrl(url);
      if (params.access_token && params.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (error) {
          console.log('Error al establecer sesión de recuperación:', error.message);
          Alert.alert('Link inválido o vencido', 'Pedí un nuevo correo de recuperación e intentá de nuevo.');
          return;
        }
        setShowResetPassword(true);
      } else {
        console.log('URL de recuperación sin tokens esperados:', url);
      }
    };

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => handleIncomingUrl(url));
    Linking.getInitialURL().then((url) => {
      if (url) handleIncomingUrl(url);
    });

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
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
      {showResetPassword ? (
        <ResetPasswordScreen onDone={() => setShowResetPassword(false)} />
      ) : needsOnboarding ? (
        <OnboardingScreen onComplete={handleOnboardingComplete} session={session} />
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