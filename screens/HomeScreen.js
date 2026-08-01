import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

const trendingArtists = [
  { id: 1, name: 'Jota B', genre: 'Trap/Latino', followers: '24k' },
  { id: 2, name: 'Nia Flow', genre: 'Boom Bap', followers: '18k' },
  { id: 3, name: 'Dre Rhyme', genre: 'Underground', followers: '12k' },
];

const upcomingEvents = [
  { id: 1, title: 'Open Mic en El Barrio', date: '12 Ago · 8:00 PM' },
  { id: 2, title: 'Battle Night: Urban Legends', date: '18 Ago · 9:30 PM' },
  { id: 3, title: 'Jam Session Hip Hop', date: '22 Ago · 7:00 PM' },
];

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-950 px-4 py-6">
      <View className="mb-6">
        <Text className="text-3xl font-bold text-white">Hip-Happ</Text>
        <Text className="mt-2 text-base text-slate-300">
          Descubre talento, eventos y la cultura Hip Hop en un solo lugar.
        </Text>
      </View>

      <View className="mb-6 rounded-2xl bg-slate-900 p-4">
        <Text className="mb-3 text-xl font-semibold text-white">Artistas en tendencia</Text>
        {trendingArtists.map((artist) => (
          <View
            key={artist.id}
            className="mb-3 flex-row items-center justify-between rounded-xl border border-slate-800 bg-slate-800/70 px-3 py-3"
          >
            <View>
              <Text className="text-base font-semibold text-white">{artist.name}</Text>
              <Text className="text-sm text-slate-400">{artist.genre}</Text>
            </View>
            <Text className="text-sm text-fuchsia-400">{artist.followers}</Text>
          </View>
        ))}
      </View>

      <View className="rounded-2xl bg-slate-900 p-4">
        <Text className="mb-3 text-xl font-semibold text-white">Próximos eventos</Text>
        {upcomingEvents.map((event) => (
          <TouchableOpacity
            key={event.id}
            className="mb-3 rounded-xl border border-slate-800 bg-slate-800/70 px-3 py-3"
          >
            <Text className="text-base font-semibold text-white">{event.title}</Text>
            <Text className="mt-1 text-sm text-slate-400">{event.date}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
