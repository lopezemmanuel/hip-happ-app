import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function BottomTab({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'Home', label: 'Home', iconFamily: 'Ionicons', iconName: 'home' },
    { id: 'Explorar', label: 'Explorar', iconFamily: 'Ionicons', iconName: 'search' },
    { id: 'Eventos', label: 'Eventos', iconFamily: 'MaterialCommunityIcons', iconName: 'calendar-month' },
    { id: 'Comunidad', label: 'Comunidad', iconFamily: 'Ionicons', iconName: 'people' },
  ];

  return (
    <View
      style={{
        backgroundColor: '#18181b',
        borderRadius: 32,
        paddingVertical: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
            }}
            activeOpacity={0.7}
          >
            {/* CÍRCULO AMARILLO CUANDO ESTÁ ACTIVO */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isActive ? '#facc15' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
              }}
            >
              {tab.iconFamily === 'Ionicons' ? (
                <Ionicons
                  name={isActive ? tab.iconName : `${tab.iconName}-outline`}
                  size={22}
                  color={isActive ? '#000000' : '#9ca3af'}
                />
              ) : (
                <MaterialCommunityIcons
                  name={tab.iconName}
                  size={22}
                  color={isActive ? '#000000' : '#9ca3af'}
                />
              )}
            </View>

            {/* ETIQUETA EN ESPAÑOL */}
            <Text
              style={{
                color: isActive ? '#ffffff' : '#9ca3af',
                fontSize: 12,
                fontWeight: isActive ? '700' : '500',
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}