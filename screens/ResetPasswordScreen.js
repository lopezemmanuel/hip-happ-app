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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Completa ambos campos para continuar.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Contraseñas diferentes', 'La contraseña y su confirmación deben coincidir.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      Alert.alert('Listo', 'Tu contraseña fue actualizada correctamente.');
      onDone?.();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo actualizar la contraseña.');
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
        <Text style={{ color: '#EAB308', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
          Nueva contraseña
        </Text>
        <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
          Elegí una nueva contraseña para tu cuenta.
        </Text>

        <View style={{ gap: 14 }}>
          <View style={{ position: 'relative' }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Nueva contraseña"
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
              style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}
            >
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            placeholder="Confirmar nueva contraseña"
            placeholderTextColor="#64748B"
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

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={{ backgroundColor: '#EAB308', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 6 }}
          >
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={{ color: '#000000', fontWeight: 'bold', fontSize: 16 }}>Guardar contraseña</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
