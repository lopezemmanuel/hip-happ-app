import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reportPost } from '../lib/postActions';

const REASONS = ['Spam', 'Contenido inapropiado', 'Acoso o bullying', 'Información falsa', 'Otro'];

export default function ReportPostModal({ visible, postId, session, onClose }) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setSelectedReason(null);
    setDetail('');
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;
    if (selectedReason === 'Otro' && !detail.trim()) {
      Alert.alert('Contanos el motivo', 'Describí brevemente por qué estás denunciando este posteo.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await reportPost(postId, session.user.id, selectedReason, detail.trim());
      if (error) throw error;
      Alert.alert('Gracias', 'Recibimos tu denuncia y la vamos a revisar.');
      handleClose();
    } catch (err) {
      console.log('Error al denunciar posteo:', err.message);
      Alert.alert('Error', 'No se pudo enviar la denuncia. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.75)' }} activeOpacity={1} onPress={handleClose} />
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 340, backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 20 }}>
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800', marginBottom: 4 }}>Denunciar posteo</Text>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 16 }}>Elegí el motivo que mejor describe el problema.</Text>

          {REASONS.map((reason) => (
            <TouchableOpacity
              key={reason}
              onPress={() => setSelectedReason(reason)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
            >
              <Ionicons
                name={selectedReason === reason ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={selectedReason === reason ? '#facc15' : '#64748b'}
                style={{ marginRight: 10 }}
              />
              <Text style={{ color: '#ffffff', fontSize: 14 }}>{reason}</Text>
            </TouchableOpacity>
          ))}

          {selectedReason === 'Otro' && (
            <TextInput
              value={detail}
              onChangeText={setDetail}
              placeholder="Describí el motivo..."
              placeholderTextColor="#64748b"
              multiline
              style={{
                color: '#ffffff',
                fontSize: 13,
                backgroundColor: '#020617',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#1e293b',
                padding: 10,
                marginTop: 6,
                minHeight: 60,
                textAlignVertical: 'top',
              }}
            />
          )}

          <View style={{ flexDirection: 'row', marginTop: 20, gap: 10 }}>
            <TouchableOpacity
              onPress={handleClose}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155', alignItems: 'center' }}
            >
              <Text style={{ color: '#94a3b8', fontWeight: '700', fontSize: 13 }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!selectedReason || submitting}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: selectedReason ? '#ef4444' : '#334155', alignItems: 'center' }}
            >
              {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>Denunciar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
