import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { toggleFollow, toggleLike, toggleAttendance } from '../lib/toggles';
import EventCard from '../components/EventCard';

const PROFILE_FIELDS = 'id, username, aka, avatar_url, bio, location, disciplines, is_verified, instagram_username, facebook_url, x_username, spotify_url, soundcloud_url, youtube_url, website_url';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

function buildSocialLinks(profile) {
  const links = [];
  if (profile.instagram_username) {
    links.push({ key: 'instagram', family: 'Ionicons', icon: 'logo-instagram', label: `@${profile.instagram_username}`, url: `https://instagram.com/${profile.instagram_username}` });
  }
  if (profile.x_username) {
    links.push({ key: 'x', family: 'Ionicons', icon: 'logo-twitter', label: `@${profile.x_username}`, url: `https://x.com/${profile.x_username}` });
  }
  if (profile.facebook_url) {
    links.push({ key: 'facebook', family: 'Ionicons', icon: 'logo-facebook', label: 'Facebook', url: profile.facebook_url });
  }
  if (profile.spotify_url) {
    links.push({ key: 'spotify', family: 'MaterialCommunityIcons', icon: 'spotify', label: 'Spotify', url: profile.spotify_url });
  }
  if (profile.soundcloud_url) {
    links.push({ key: 'soundcloud', family: 'MaterialCommunityIcons', icon: 'soundcloud', label: 'SoundCloud', url: profile.soundcloud_url });
  }
  if (profile.youtube_url) {
    links.push({ key: 'youtube', family: 'Ionicons', icon: 'logo-youtube', label: 'YouTube', url: profile.youtube_url });
  }
  if (profile.website_url) {
    const shortUrl = profile.website_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    links.push({ key: 'website', family: 'Ionicons', icon: 'globe-outline', label: shortUrl, url: profile.website_url });
  }
  return links;
}

function formatItemDate(isoDate) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ProfileScreen({ userId, session, onBack, onEditProfile, onNewPost }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timelineItems, setTimelineItems] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [likeState, setLikeState] = useState({}); // { [postId]: { count, isLiked } }
  const [attendanceState, setAttendanceState] = useState({}); // { [eventId]: { count, isAttending } }

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

  const loadTimeline = useCallback(async () => {
    if (!userId) {
      setLoadingTimeline(false);
      return;
    }

    setLoadingTimeline(true);

    const [postsRes, eventsRes] = await Promise.all([
      supabase
        .from('posts')
        .select('id, text, image_urls, location_name, tagged_event_id, is_pinned, created_at, tagged_event:events(id, title, event_date, location, image_url)')
        .eq('author_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('events')
        .select('id, title, location, event_date, image_url, is_pinned, created_at')
        .eq('organizer_id', userId)
        .order('created_at', { ascending: false }),
    ]);

    const posts = (postsRes.data || []).map((p) => ({ type: 'post', ...p }));
    const events = (eventsRes.data || []).map((e) => ({ type: 'event', ...e }));

    const postIds = posts.map((p) => p.id);
    const tagsByPost = {};
    if (postIds.length > 0) {
      const { data: tagRows } = await supabase
        .from('post_tagged_users')
        .select('post_id, user:users(id, username, aka)')
        .in('post_id', postIds);
      (tagRows || []).forEach((row) => {
        if (!tagsByPost[row.post_id]) tagsByPost[row.post_id] = [];
        if (row.user) tagsByPost[row.post_id].push(row.user);
      });
    }
    posts.forEach((p) => { p.taggedUsers = tagsByPost[p.id] || []; });

    // Likes de los posteos
    if (postIds.length > 0) {
      const { data: likeRows } = await supabase
        .from('post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds);
      const likeMap = {};
      (likeRows || []).forEach((row) => {
        if (!likeMap[row.post_id]) likeMap[row.post_id] = { count: 0, isLiked: false };
        likeMap[row.post_id].count += 1;
        if (row.user_id === session?.user?.id) likeMap[row.post_id].isLiked = true;
      });
      setLikeState(likeMap);
    } else {
      setLikeState({});
    }

    // Asistencias de los eventos
    const eventIds = events.map((e) => e.id);
    if (eventIds.length > 0) {
      const { data: attendanceRows } = await supabase
        .from('event_attendance')
        .select('event_id, user_id')
        .in('event_id', eventIds);
      const attendanceMap = {};
      (attendanceRows || []).forEach((row) => {
        if (!attendanceMap[row.event_id]) attendanceMap[row.event_id] = { count: 0, isAttending: false };
        attendanceMap[row.event_id].count += 1;
        if (row.user_id === session?.user?.id) attendanceMap[row.event_id].isAttending = true;
      });
      setAttendanceState(attendanceMap);
    } else {
      setAttendanceState({});
    }

    const merged = [...posts, ...events].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setTimelineItems(merged);
    setLoadingTimeline(false);
  }, [userId, session?.user?.id]);

  const loadFollowStatus = useCallback(async () => {
    if (!userId || !session?.user?.id || userId === session.user.id) return;
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', session.user.id)
      .eq('followed_id', userId)
      .maybeSingle();
    setIsFollowing(!!data);
  }, [userId, session?.user?.id]);

  useEffect(() => {
    loadProfile();
    loadTimeline();
    loadFollowStatus();
  }, [loadProfile, loadTimeline, loadFollowStatus]);

  const handleToggleFollow = async () => {
    if (!session?.user?.id) return;
    setFollowBusy(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    const { error } = await toggleFollow(session.user.id, userId, wasFollowing);
    if (error) {
      setIsFollowing(wasFollowing);
      Alert.alert('Error', 'No se pudo actualizar. Intentá de nuevo.');
    }
    setFollowBusy(false);
  };

  const handleToggleLike = async (postId) => {
    if (!session?.user?.id) return;
    const current = likeState[postId] || { count: 0, isLiked: false };
    const nextIsLiked = !current.isLiked;
    setLikeState((prev) => ({ ...prev, [postId]: { count: current.count + (nextIsLiked ? 1 : -1), isLiked: nextIsLiked } }));
    const { error } = await toggleLike(postId, session.user.id, current.isLiked);
    if (error) setLikeState((prev) => ({ ...prev, [postId]: current }));
  };

  const handleToggleAttendance = async (eventId) => {
    if (!session?.user?.id) return;
    const current = attendanceState[eventId] || { count: 0, isAttending: false };
    const nextIsAttending = !current.isAttending;
    setAttendanceState((prev) => ({ ...prev, [eventId]: { count: current.count + (nextIsAttending ? 1 : -1), isAttending: nextIsAttending } }));
    const { error } = await toggleAttendance(eventId, session.user.id, current.isAttending);
    if (error) setAttendanceState((prev) => ({ ...prev, [eventId]: current }));
  };

  const togglePin = async (item) => {
    const willPin = !item.is_pinned;
    if (willPin) {
      await supabase.from('posts').update({ is_pinned: false }).eq('author_id', userId);
      await supabase.from('events').update({ is_pinned: false }).eq('organizer_id', userId);
    }
    const table = item.type === 'post' ? 'posts' : 'events';
    const { error } = await supabase.from(table).update({ is_pinned: willPin }).eq('id', item.id);
    if (error) {
      Alert.alert('Error', 'No se pudo actualizar el pin.');
      return;
    }
    loadTimeline();
  };

  const handleOpenLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Link inválido', 'No se pudo abrir ese enlace.');
    }
  };

  const handleNewPost = () => {
    if (onNewPost) {
      onNewPost();
    } else {
      Alert.alert('Próximamente', 'Acá vas a poder crear una nueva publicación.');
    }
  };

  const displayName = profile?.aka || profile?.username || 'Usuario';
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

          {isOwnProfile ? (
            <TouchableOpacity
              onPress={onEditProfile}
              style={{ backgroundColor: '#facc15', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}
            >
              <Text style={{ color: '#000000', fontWeight: '800', fontSize: 13 }}>Editar perfil</Text>
            </TouchableOpacity>
          ) : (
            !!session?.user?.id && (
              <TouchableOpacity
                onPress={handleToggleFollow}
                disabled={followBusy}
                style={{
                  backgroundColor: isFollowing ? 'transparent' : '#facc15',
                  borderWidth: 1,
                  borderColor: '#facc15',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: isFollowing ? '#facc15' : '#000000', fontWeight: '800', fontSize: 13 }}>
                  {isFollowing ? 'Dejar de seguir' : 'Seguir'}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#facc15" style={{ marginTop: 40 }} />
        ) : !profile ? (
          <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 40 }}>
            No se encontró este usuario.
          </Text>
        ) : (
          <View style={{ width: '100%' }}>
            {/* CABECERA: FOTO A LA IZQUIERDA + AKA/@/DISCIPLINA APILADOS */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ uri: profile.avatar_url || DEFAULT_AVATAR }}
                  style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#facc15' }}
                />
                {profile.is_verified === true && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: '#facc15',
                      borderRadius: 12,
                      width: 24,
                      height: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: '#020617',
                    }}
                  >
                    <Ionicons name="checkmark-sharp" size={14} color="#000000" />
                  </View>
                )}
              </View>

              <View style={{ flex: 1, marginLeft: 16, paddingTop: 4 }}>
                <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800' }} numberOfLines={2}>
                  {displayName}
                </Text>
                {!!profile.username && (
                  <Text style={{ color: '#facc15', fontSize: 14, fontWeight: '600', marginTop: 4 }}>
                    @{profile.username}
                  </Text>
                )}
                {disciplines.length > 0 && (
                  <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                    {disciplines.join(' · ')}
                  </Text>
                )}
              </View>
            </View>

            {/* BIO */}
            {!!profile.bio && (
              <Text style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 20, marginTop: 16 }}>
                {profile.bio}
              </Text>
            )}

            {/* UBICACIÓN */}
            {!!profile.location && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                <Ionicons name="location-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600' }}>{profile.location}</Text>
              </View>
            )}

            {/* REDES SOCIALES Y WEB */}
            {socialLinks.length > 0 && (
              <View style={{ marginTop: 16 }}>
                {socialLinks.map((link) => (
                  <TouchableOpacity
                    key={link.key}
                    onPress={() => handleOpenLink(link.url)}
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
                  >
                    {link.family === 'MaterialCommunityIcons' ? (
                      <MaterialCommunityIcons name={link.icon} size={16} color="#facc15" style={{ marginRight: 8 }} />
                    ) : (
                      <Ionicons name={link.icon} size={16} color="#facc15" style={{ marginRight: 8 }} />
                    )}
                    <Text style={{ color: '#facc15', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' }}>
                      {link.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* SEPARADOR + NUEVA PUBLICACIÓN */}
            {isOwnProfile && (
              <>
                <View style={{ height: 1, backgroundColor: '#1e293b', marginTop: 20, marginBottom: 16 }} />
                <TouchableOpacity onPress={handleNewPost}>
                  <Text style={{ color: '#64748b', fontSize: 15, fontStyle: 'italic' }}>Spit yo' mind</Text>
                </TouchableOpacity>
              </>
            )}

            {/* TIMELINE: POSTS Y EVENTOS DEL USUARIO */}
            <View style={{ marginTop: 24 }}>
              {loadingTimeline ? (
                <ActivityIndicator size="small" color="#facc15" style={{ marginTop: 20 }} />
              ) : timelineItems.length === 0 ? (
                <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
                  Todavía no hay publicaciones ni eventos.
                </Text>
              ) : (
                timelineItems.map((item) => {
                  if (item.type === 'event') {
                    const attendance = attendanceState[item.id] || { count: 0, isAttending: false };
                    return (
                      <View key={`event-${item.id}`} style={{ position: 'relative' }}>
                        {isOwnProfile && (
                          <TouchableOpacity
                            onPress={() => togglePin(item)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{ position: 'absolute', top: 10, left: 10, zIndex: 20, backgroundColor: 'rgba(2,6,23,0.7)', borderRadius: 14, padding: 6 }}
                          >
                            <Ionicons name={item.is_pinned ? 'pin' : 'pin-outline'} size={16} color={item.is_pinned ? '#facc15' : '#ffffff'} />
                          </TouchableOpacity>
                        )}
                        <EventCard
                          event={item}
                          selected={item.is_pinned}
                          onPress={() => {}}
                          isAttending={attendance.isAttending}
                          attendanceCount={attendance.count}
                          onToggleAttendance={() => handleToggleAttendance(item.id)}
                          disabled={!session?.user?.id}
                        />
                      </View>
                    );
                  }

                  const like = likeState[item.id] || { count: 0, isLiked: false };

                  return (
                    <View
                      key={`post-${item.id}`}
                      style={{
                        backgroundColor: '#0f172a',
                        borderColor: item.is_pinned ? '#facc15' : '#1e293b',
                        borderWidth: 1,
                        borderRadius: 18,
                        padding: 14,
                        marginBottom: 14,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                          Posteo · {formatItemDate(item.created_at)}
                        </Text>
                        {isOwnProfile && (
                          <TouchableOpacity onPress={() => togglePin(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name={item.is_pinned ? 'pin' : 'pin-outline'} size={18} color={item.is_pinned ? '#facc15' : '#64748b'} />
                          </TouchableOpacity>
                        )}
                      </View>

                      {item.image_urls?.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                          {item.image_urls.map((url) => (
                            <Image key={url} source={{ uri: url }} style={{ width: 140, height: 140, borderRadius: 12, marginRight: 8, backgroundColor: '#1e293b' }} />
                          ))}
                        </ScrollView>
                      )}
                      {!!item.text && (
                        <Text style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 20, marginBottom: 8 }}>{item.text}</Text>
                      )}
                      {!!item.location_name && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <Ionicons name="location" size={13} color="#facc15" style={{ marginRight: 4 }} />
                          <Text style={{ color: '#94a3b8', fontSize: 12 }} numberOfLines={1}>{item.location_name}</Text>
                        </View>
                      )}
                      {!!item.tagged_event && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#020617', borderRadius: 10, padding: 8, marginBottom: 6 }}>
                          <Ionicons name="calendar" size={13} color="#facc15" style={{ marginRight: 6 }} />
                          <Text style={{ color: '#facc15', fontSize: 12, fontWeight: '700' }} numberOfLines={1}>{item.tagged_event.title}</Text>
                        </View>
                      )}
                      {item.taggedUsers?.length > 0 && (
                        <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>
                          Con: {item.taggedUsers.map((u) => `@${u.username || u.aka}`).join(', ')}
                        </Text>
                      )}

                      <TouchableOpacity
                        onPress={() => handleToggleLike(item.id)}
                        disabled={!session?.user?.id}
                        style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 4 }}
                      >
                        <Ionicons name={like.isLiked ? 'heart' : 'heart-outline'} size={18} color={like.isLiked ? '#ef4444' : '#94a3b8'} style={{ marginRight: 6 }} />
                        {like.count > 0 && <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '700' }}>{like.count}</Text>}
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
