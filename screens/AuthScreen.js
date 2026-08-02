import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

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

export default function AuthScreen({ onCreateAccount, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Inicio de sesión directo con Email
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos incompletos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('El correo electrónico o la contraseña son incorrectos.');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Debes confirmar tu correo antes de iniciar sesión.');
        }
        throw error;
      }

      if (onLoginSuccess) {
        onLoginSuccess(data?.session || { user: { email: normalizedEmail } }, false);
      }
    } catch (error) {
      Alert.alert('Error al ingresar', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      Alert.alert('Ingresá tu correo', 'Escribí tu correo electrónico arriba y volvé a tocar "¿Olvidaste la contraseña?".');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (error) throw error;
      Alert.alert('Revisá tu correo', 'Te enviamos un link para restablecer tu contraseña.');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo enviar el correo de recuperación.');
    }
  };

  // Inicio de sesión con Google / Facebook
  const handleOAuthLogin = async (provider) => {
    try {
      const redirectUrl = Linking.createURL('auth-callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUrl, skipBrowserRedirect: false },
      });

      if (error) throw error;

      if (data?.url) {
        console.log('Abriendo sesión OAuth, redirectUrl esperado:', redirectUrl);
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        console.log('Resultado de openAuthSessionAsync:', JSON.stringify(result));

        if (result.type === 'success' && result.url) {
          const params = parseTokensFromUrl(result.url);
          if (params.access_token && params.refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
            if (sessionError) {
              console.log('Error al establecer sesión OAuth:', sessionError.message);
              Alert.alert('Error', 'No se pudo completar el inicio de sesión.');
              return;
            }
          }

          const { data: sessionData } = await supabase.auth.getSession();
          if (onLoginSuccess && sessionData?.session) {
            onLoginSuccess(sessionData.session, false);
          } else {
            console.log('No se encontró sesión después del login OAuth.');
          }
        } else {
          console.log('El navegador de login se cerró sin completar (type):', result.type);
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0B0F19' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        
        {/* 1. Nombre de la App */}
        <Text style={{ color: '#EAB308', fontSize: 36, fontWeight: '900', letterSpacing: 2, textAlign: 'center' }}>
          HIP HAPP
        </Text>

        {/* 2. Slogan */}
        <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 4, marginBottom: 28, textAlign: 'center', fontWeight: '500' }}>
          Conectando la cultura
        </Text>

        {/* 3. Subtítulo: Iniciar sesión (Tamaño 17) */}
        <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: 'bold', marginBottom: 20 }}>
          Iniciar sesión
        </Text>

        <View style={{ gap: 14 }}>
          {/* 4. Caja de texto: Correo electrónico */}
          <View>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Correo electrónico"
              placeholderTextColor="#64748B"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: '#1E293B',
                color: '#FFFFFF',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#334155',
                fontSize: 14,
              }}
            />
          </View>

          {/* 5. Caja de texto: Contraseña */}
          <View style={{ position: 'relative' }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Contraseña"
              placeholderTextColor="#64748B"
              style={{
                backgroundColor: '#1E293B',
                color: '#FFFFFF',
                paddingHorizontal: 16,
                paddingVertical: 14,
                paddingRight: 48,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#334155',
                fontSize: 14,
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={{
                position: 'absolute',
                right: 12,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* 6. Botón: Iniciar sesión */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: '#EAB308',
              paddingVertical: 15,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 6,
            }}
          >
            <Text style={{ color: '#000000', fontWeight: 'bold', fontSize: 16 }}>
              {loading ? 'Cargando...' : 'Iniciar sesión'}
            </Text>
          </TouchableOpacity>

          {/* 7. Texto / Botón: ¿Olvidaste la contraseña? */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={{ alignItems: 'center', marginVertical: 4 }}
          >
            <Text style={{ color: '#94A3B8', fontSize: 13, textDecorationLine: 'underline' }}>
              ¿Olvidaste la contraseña?
            </Text>
          </TouchableOpacity>

          {/* 8. Botón: Iniciar sesión con Google */}
          <TouchableOpacity
            onPress={() => handleOAuthLogin('google')}
            style={{
              flexDirection: 'row',
              backgroundColor: '#1E293B',
              borderWidth: 1,
              borderColor: '#334155',
              paddingVertical: 13,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
              marginTop: 8,
            }}
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>
              Iniciar sesión con Google
            </Text>
          </TouchableOpacity>

          {/* 9. Botón: Iniciar sesión con Facebook */}
          <TouchableOpacity
            onPress={() => handleOAuthLogin('facebook')}
            style={{
              flexDirection: 'row',
              backgroundColor: '#1E293B',
              borderWidth: 1,
              borderColor: '#334155',
              paddingVertical: 13,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Ionicons name="logo-facebook" size={20} color="#1877F2" />
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>
              Iniciar sesión con Facebook
            </Text>
          </TouchableOpacity>

          {/* 10. Botón: Crear una cuenta */}
          <TouchableOpacity
            onPress={() => {
              if (onCreateAccount) {
                onCreateAccount();
              } else {
                Alert.alert('Registro', 'La pantalla de registro estará disponible pronto.');
              }
            }}
            style={{
              borderWidth: 1,
              borderColor: '#EAB308',
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <Text style={{ color: '#EAB308', fontWeight: 'bold', fontSize: 15 }}>
              Crear una cuenta
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}