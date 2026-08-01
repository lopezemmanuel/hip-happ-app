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
import { supabase } from '../lib/supabase';

export default function RegisterScreen({ onBackToLogin, onRegisterSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !password || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Completa todos los campos para continuar.');
      return false;
    }

    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Correo inválido', 'Ingresa un correo electrónico válido.');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Contraseñas diferentes', 'La contraseña y su confirmación deben coincidir.');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data?.session) {
        if (onRegisterSuccess) {
          onRegisterSuccess(data);
        }
      } else {
        Alert.alert(
          'Cuenta creada',
          'Tu cuenta fue creada correctamente. Revisa tu correo para confirmar el acceso.'
        );
        if (onBackToLogin) {
          onBackToLogin();
        }
      }
    } catch (error) {
      Alert.alert('Error al crear cuenta', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0B0F19' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#EAB308', fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
          Crear cuenta
        </Text>
        <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
          Registra tu correo y crea una contraseña segura.
        </Text>

        <View style={{ gap: 14 }}>
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

          <View style={{ position: 'relative' }}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholder="Confirmar contraseña"
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
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              style={{
                position: 'absolute',
                right: 12,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleRegister}
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
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onBackToLogin}
            style={{ alignItems: 'center', marginTop: 8 }}
          >
            <Text style={{ color: '#94A3B8', fontSize: 13, textDecorationLine: 'underline' }}>
              Volver al inicio de sesión
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
