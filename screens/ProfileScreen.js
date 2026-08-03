import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Linking, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const PROFILE_FIELDS = 'id, username, aka, first_name, last_name, avatar_url, bio, disciplines, is_verified, instagram_username, facebook_url, x_username, spotify_url, soundcloud_url, youtube_url, website_url';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

function buildSocialLinks(profile) {
  const links = [];
  if (profile.instagram_username) {
    links.push({ key: 'instagram', family: 'Ionicons', icon: 'logo-instagram', url: `https://instagram.com/${profile.instagram_username}` });
  }
  if (profile.x_username) {
    links.push({ key: 'x', family: 'Ionicons', icon: 'logo-twitter', url: `https://x.com/${profile.x_username}` });
  }
  if (profile.facebook_url) {
    links.push({ key: 'facebook', family: 'Ionicons', icon: 'logo-facebook', url: profile.facebook_url });
  }
  if (profile.spotify_url) {
    links.push({ key: 'spotify', family: 'MaterialCommunityIcons', icon: 'spotify', url: profile.spotify_url });
  }
  if (profile.soundcloud_url) {
    links.push({ key: 'soundcloud', family: 'MaterialCommunityIcons', icon: 'soundcloud', url: profile.soundcloud_url });
  }
  if (profile.youtube_url) {
    links.push({ key: 'youtube', family: 'Ionicons', icon: 'logo-youtube', url: profile.youtube_url });
  }
  if (profile.website_url) {
    links.push({ key: 'website', family: 'Ionicons', icon: 'globe-outline', url: profile.website_url });
  }
  return links;
}

export default function ProfileScreen({ userId, session, onBack, onEditProfile }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !!userId && userId === session?.user?.id;

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select(PROFILE_FIELDS)
      .eq('id', userId)
      .maybeSingle();

    setLoading(false);

    if (error) {
      console.log('Error al cargar el perfil:', error.message);
      return;
    }

    setProfile(data);
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleOpenLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Link inválido', 'No se pudo abrir ese enlace.');
    }
  };

  const displayName = profile?.aka || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Usuario';
  const disciplines = Array.isArray(profile?.disciplines) ? profile.disciplines : [];
  const socialLinks = profile ? buildSocialLinks(profile) : [];

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#020617',
        zIndex: 900,
      }}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 50, paddingBottom: 40 }}>
        {/* BARRA SUPERIOR: VOLVER Y EDITAR */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center' }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', marginLeft: 2 }}>Atrás</Text>
          </TouchableOpacity>

          {isOwnProfile && (
            <TouchableOpacity
              onPress={onEditProfile}
              style={{ backgroundColor: '#facc15', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}
            >
              <Text style={{ color: '#000000', fontWeight: '800', fontSize: 13 }}>Editar perfil</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#facc15" style={{ marginTop: 40 }} />
        ) : !profile ? (
          <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 40 }}>
            No se encontró este usuario.
          </Text>
        ) : (
          <View style={{ alignItems: 'center', width: '100%' }}>
            {/* FOTO DE PERFIL */}
            <View style={{ position: 'relative', marginBottom: 14 }}>
              <Image
                source={{ uri: profile.avatar_url || DEFAULT_AVATAR }}
                style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#facc15' }}
              />
              {profile.is_verified === true && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: '#facc15',
                    borderRadius: 13,
                    width: 26,
                    height: 26,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#020617',
                  }}
                >
                  <Ionicons name="checkmark-sharp" size={16} color="#000000" />
                </View>
              )}
            </View>

            {/* A.K.A. Y USERNAME */}
            <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '800', textAlign: 'center' }}>
              {displayName}
            </Text>
            {!!profile.username && (
              <Text style={{ color: '#facc15', fontSize: 14, fontWeight: '600', marginTop: 4 }}>
                @{profile.username}
              </Text>
            )}

            {/* BIO */}
            {!!profile.bio && (
              <Text style={{ color: '#cbd5e1', fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 14 }}>
                {profile.bio}
              </Text>
            )}

            {/* DISCIPLINAS */}
            {disciplines.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                {disciplines.map((discipline) => (
                  <View
                    key={discipline}
                    style={{
                      backgroundColor: 'rgba(250, 204, 21, 0.15)',
                      borderColor: '#facc15',
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                    }}
                  >
                    <Text style={{ color: '#facc15', fontSize: 12, fontWeight: '700' }}>{discipline}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* REDES SOCIALES */}
            {socialLinks.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 24 }}>
                {socialLinks.map((link) => (
                  <TouchableOpacity
                    key={link.key}
                    onPress={() => handleOpenLink(link.url)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderWidth: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {link.family === 'MaterialCommunityIcons' ? (
                      <MaterialCommunityIcons name={link.icon} size={20} color="#facc15" />
                    ) : (
                      <Ionicons name={link.icon} size={20} color="#facc15" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
