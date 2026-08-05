import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function MenuItem({ icon, label, onPress, color = '#ffffff', isLast }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#1e293b',
      }}
    >
      <Ionicons name={icon} size={18} color={color} style={{ marginRight: 12 }} />
      <Text style={{ color, fontSize: 14, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}

// Ícono de "⋮" que abre un menú modal con opciones distintas según sea el
// dueño del posteo o no. El fondo y la tarjeta del menú son hermanos (no
// están anidados) para que tocar el fondo cierre el menú sin interferir con
// los toques de cada opción.
export default function PostOptionsMenu({ isOwner, onEdit, onShare, onArchive, onDelete, onReport }) {
  const [open, setOpen] = useState(false);

  const handle = (action) => {
    setOpen(false);
    action?.();
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ padding: 4 }}
      >
        <Ionicons name="ellipsis-vertical" size={18} color="#94a3b8" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.6)' }}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        />
        <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 260, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden' }}>
            {isOwner ? (
              <>
                <MenuItem icon="pencil-outline" label="Editar" onPress={() => handle(onEdit)} />
                <MenuItem icon="share-social-outline" label="Compartir" onPress={() => handle(onShare)} />
                <MenuItem icon="archive-outline" label="Archivar" onPress={() => handle(onArchive)} />
                <MenuItem icon="trash-outline" label="Eliminar publicación" color="#ef4444" onPress={() => handle(onDelete)} isLast />
              </>
            ) : (
              <MenuItem icon="flag-outline" label="Denunciar Post" color="#ef4444" onPress={() => handle(onReport)} isLast />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
