import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const DISCIPLINES_LIST = [
  'MC', 'Rapper', 'Freestyler', 'DJ', 'Turntablism',
  'B-Boy', 'B-Girl', 'Breaker', 'Grafitero', 'Writer',
  'Beatboxer', 'Productor', 'Beatmaker', 'Host', 'Videograph', 'Photograph'
];

export default function OnboardingScreen({ onComplete }) {
  const [aka, setAka] = useState('');
  const [selectedDisciplines, setSelectedDisciplines] = useState([]);
  const [availabilityStatus, setAvailabilityStatus] = useState('idle');
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const toggleDiscipline = (item) => {
    if (selectedDisciplines.includes(item)) {
      setSelectedDisciplines(selectedDisciplines.filter((d) => d !== item));
    } else {
      if (selectedDisciplines.length >= 2) {
        Alert.alert('Límite alcanzado', 'Solo puedes elegir hasta 2 disciplinas.');
        return;
      }
      setSelectedDisciplines([...selectedDisciplines, item]);
    }
  };

  const checkAvailability = async (value) => {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      setAvailabilityStatus('idle');
      setAvailabilityMessage('');
      return false;
    }

    if (normalized.length < 3) {
      setAvailabilityStatus('idle');
      setAvailabilityMessage('Usa al menos 3 caracteres.');
      return false;
    }

    setCheckingAvailability(true);
    setAvailabilityStatus('checking');
    setAvailabilityMessage('Verificando disponibilidad...');

    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', normalized)
      .maybeSingle();

    setCheckingAvailability(false);

    if (error) {
      setAvailabilityStatus('idle');
      setAvailabilityMessage('No se pudo verificar. Intenta de nuevo.');
      return false;
    }

    const isAvailable = !data;
    setAvailabilityStatus(isAvailable ? 'available' : 'taken');
    setAvailabilityMessage(
      isAvailable ? 'A.K.A. disponible' : 'Este A.K.A. ya está en uso. Elige otro.'
    );

    return isAvailable;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAvailability(aka);
    }, 400);

    return () => clearTimeout(timer);
  }, [aka]);

  const handleFinish = async () => {
    const trimmedAka = aka.trim();

    if (!trimmedAka) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu A.K.A.');
      return;
    }

    if (trimmedAka.length < 3) {
      Alert.alert('A.K.A. muy corto', 'Usa al menos 3 caracteres.');
      return;
    }

    const isAvailable = await checkAvailability(trimmedAka);

    if (!isAvailable) {
      Alert.alert('A.K.A. no disponible', 'Elige otro nombre de usuario para continuar.');
      return;
    }

    onComplete({ aka: trimmedAka, disciplines: selectedDisciplines });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
        
        <Text style={{ color: '#facc15', fontSize: 28, fontWeight: '900', marginTop: 20, textAlign: 'center' }}>
          ¡Bienvenido a Hip-Happ! 🎤
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
          Configura tu identidad en la cultura para continuar.
        </Text>

        {/* CAMPO A.K.A. */}
        <View style={{ width: '100%', marginBottom: 28 }}>
          <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', marginBottom: 8 }}>
            Tu A.K.A. (Nombre de Usuario) *
          </Text>
          <TextInput
            value={aka}
            onChangeText={setAka}
            placeholder="Ej: MC_KRAKEN / DJ_FLOW"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            style={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderWidth: 1,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: '#ffffff',
              fontSize: 15,
              fontWeight: '600',
            }}
          />
          <Text
            style={{
              marginTop: 8,
              color:
                availabilityStatus === 'available'
                  ? '#4ade80'
                  : availabilityStatus === 'taken'
                    ? '#fb7185'
                    : '#94a3b8',
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            {availabilityMessage || 'Confirma que el A.K.A. esté disponible antes de continuar.'}
          </Text>
        </View>

        {/* SELECCIÓN DE DISCIPLINAS */}
        <View style={{ width: '100%', marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>
              Selecciona tus Disciplinas
            </Text>
            <Text style={{ color: '#facc15', fontSize: 12, fontWeight: '700' }}>
              {selectedDisciplines.length}/2 Elegidas
            </Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DISCIPLINES_LIST.map((item) => {
              const isSelected = selectedDisciplines.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => toggleDiscipline(item)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: isSelected ? '#facc15' : '#0f172a',
                    borderColor: isSelected ? '#facc15' : '#1e293b',
                    borderWidth: 1,
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? '#000000' : '#cbd5e1',
                      fontWeight: isSelected ? '800' : '600',
                      fontSize: 13,
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* BOTÓN GUARDAR Y CONTINUAR */}
        <TouchableOpacity
          onPress={handleFinish}
          activeOpacity={0.8}
          disabled={checkingAvailability}
          style={{
            width: '100%',
            backgroundColor: checkingAvailability ? '#a16207' : '#facc15',
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            opacity: checkingAvailability ? 0.8 : 1,
          }}
        >
          <Text style={{ color: '#000000', fontWeight: '800', fontSize: 16 }}>
            {checkingAvailability ? 'Verificando A.K.A...' : 'Guardar Perfil y Entrar'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#000000" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}