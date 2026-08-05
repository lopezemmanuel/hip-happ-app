import React from 'react';
import { View } from 'react-native';

export default function Divider({ style }) {
  return <View style={[{ height: 1, backgroundColor: '#1e293b', marginVertical: 16 }, style]} />;
}
