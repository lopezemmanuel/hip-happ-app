import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { toggleLike, toggleAttendance } from '../lib/toggles';
import EventCard from '../components/EventCard';

function authorName(user) {
  return user?.aka || user?.username || 'Usuario';
}

function formatRelativeTime(isoDate) {
  const date = new Date(isoDate);
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMin < 60) return `${Math.max(diffMin, 1)}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d`;

  const day = String(date.getDate()).padStart(2, '0');
  const month = date.getMonth() + 1;
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

export default function HomeFeedScreen({ session, onSelectUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likeState, setLikeState] = useState({});
  const [attendanceState, setAttendanceState] = useState({});
  const [expandedNewsIds, setExpandedNewsIds] = useState({});

  const toggleNewsExpanded = (id) => {
    setExpandedNewsIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const loadFeed = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: followRows } = await supabase
      .from('follows')
      .select('followed_id')
      .eq('follower_id', session.user.id);

    const followedIds = Array.from(new Set([...(followRows || []).map((r) => r.followed_id), session.user.id]));

    // Eventos y noticias/notas son públicos: aparecen para todos por defecto.
    // Posteos y asistencias siguen dependiendo de a quién seguís (más
    // adelante va a haber una config para elegir qué ver).
    const [postsRes, eventsRes, attendanceRes, newsRes] = await Promise.all([
      supabase
        .from('posts')
        .select('*, author:users!posts_author_id_fkey(id, username, aka, avatar_url)')
        .in('author_id', followedIds)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('events')
        .select('*, organizer:users!events_organizer_id_fkey(id, username, aka, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('event_attendance')
        .select('created_at, user:users(id, username, aka, avatar_url), event:events(*)')
        .in('user_id', followedIds)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('news')
        .select('id, title, content, image_url, created_at, author:users!news_author_id_fkey(id, username, aka, avatar_url)')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    if (postsRes.error) console.log('Error cargando posteos del feed:', postsRes.error.message);
    if (eventsRes.error) console.log('Error cargando eventos del feed:', eventsRes.error.message);
    if (attendanceRes.error) console.log('Error cargando asistencias del feed:', attendanceRes.error.message);
    if (newsRes.error) console.log('Error cargando noticias del feed:', newsRes.error.message);

    const posts = (postsRes.data || []).map((p) => ({ feedType: 'post', sortDate: p.created_at, ...p }));
    const events = (eventsRes.data || []).map((e) => ({ feedType: 'event', sortDate: e.created_at, ...e }));
    const attendances = (attendanceRes.data || [])
      .filter((a) => a.event)
      .map((a) => ({ feedType: 'attendance', sortDate: a.created_at, user: a.user, event: a.event }));
    const newsItems = (newsRes.data || []).map((n) => ({ feedType: 'news', sortDate: n.created_at, ...n }));

    // Un mismo evento puede llegar por dos caminos (lo creó alguien que seguís
    // Y alguien que seguís marcó que va a asistir): nos quedamos con la
    // actividad más reciente de cada evento para no mostrarlo duplicado.
    const seenEventIds = new Set();
    const merged = [...posts, ...events, ...attendances, ...newsItems]
      .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate))
      .filter((item) => {
        if (item.feedType !== 'event' && item.feedType !== 'attendance') return true;
        const eventId = item.feedType === 'attendance' ? item.event.id : item.id;
        if (seenEventIds.has(eventId)) return false;
        seenEventIds.add(eventId);
        return true;
      });

    const postIds = posts.map((p) => p.id);
    if (postIds.length > 0) {
      const { data: likeRows } = await supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds);
      const likeMap = {};
      (likeRows || []).forEach((row) => {
        if (!likeMap[row.post_id]) likeMap[row.post_id] = { count: 0, isLiked: false };
        likeMap[row.post_id].count += 1;
        if (row.user_id === session.user.id) likeMap[row.post_id].isLiked = true;
      });
      setLikeState(likeMap);
    } else {
      setLikeState({});
    }

    const eventIds = Array.from(new Set([...events.map((e) => e.id), ...attendances.map((a) => a.event.id)]));
    if (eventIds.length > 0) {
      const { data: attendanceRows } = await supabase.from('event_attendance').select('event_id, user_id').in('event_id', eventIds);
      const attMap = {};
      (attendanceRows || []).forEach((row) => {
        if (!attMap[row.event_id]) attMap[row.event_id] = { count: 0, isAttending: false };
        attMap[row.event_id].count += 1;
        if (row.user_id === session.user.id) attMap[row.event_id].isAttending = true;
      });
      setAttendanceState(attMap);
    } else {
      setAttendanceState({});
    }

    setItems(merged);
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleToggleLike = async (postId) => {
    const current = likeState[postId] || { count: 0, isLiked: false };
    const next = !current.isLiked;
    setLikeState((prev) => ({ ...prev, [postId]: { count: current.count + (next ? 1 : -1), isLiked: next } }));
    const { error } = await toggleLike(postId, session.user.id, current.isLiked);
    if (error) setLikeState((prev) => ({ ...prev, [postId]: current }));
  };

  const handleToggleAttendance = async (eventId) => {
    const current = attendanceState[eventId] || { count: 0, isAttending: false };
    const next = !current.isAttending;
    setAttendanceState((prev) => ({ ...prev, [eventId]: { count: current.count + (next ? 1 : -1), isAttending: next } }));
    const { error } = await toggleAttendance(eventId, session.user.id, current.isAttending);
    if (error) setAttendanceState((prev) => ({ ...prev, [eventId]: current }));
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#facc15" style={{ marginTop: 40 }} />;
  }

  if (items.length === 0) {
    return (
      <View style={{ marginTop: 40, alignItems: 'center' }}>
        <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
          Todavía no hay actividad para mostrar.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ width: '100%' }}>
      {items.map((item) => {
        const person = item.feedType === 'post' ? item.author
          : item.feedType === 'event' ? item.organizer
          : item.feedType === 'news' ? item.author
          : item.user;
        const actionLabel = item.feedType === 'post' ? 'posteó'
          : item.feedType === 'event' ? 'ha creado un evento'
          : item.feedType === 'news' ? 'publicó una nota'
          : `asistirá a ${item.event.title}`;
        const targetEvent = item.feedType === 'attendance' ? item.event : item;

        return (
          <View key={`${item.feedType}-${item.id || item.event?.id}-${item.sortDate}`} style={{ marginBottom: 20, width: '100%' }}>
            <TouchableOpacity
              onPress={() => person && onSelectUser?.(person)}
              disabled={!person}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
            >
              {person?.avatar_url ? (
                <Image source={{ uri: person.avatar_url }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: '#1e293b' }} />
              ) : (
                <View style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={item.feedType === 'news' ? 'newspaper' : 'person'} size={16} color="#64748b" />
                </View>
              )}
              <Text style={{ fontSize: 13, flex: 1 }}>
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>{person ? authorName(person) : 'Hip-Happ'}</Text>
                {!!person?.username && <Text style={{ color: '#94a3b8', fontWeight: '600' }}> @{person.username}</Text>}
                <Text style={{ color: '#94a3b8' }}> {actionLabel} · {formatRelativeTime(item.sortDate)}</Text>
              </Text>
            </TouchableOpacity>

            {item.feedType === 'post' && (
              <View style={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1, borderRadius: 18, padding: 14 }}>
                {item.image_urls?.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    {item.image_urls.map((url) => (
                      <Image key={url} source={{ uri: url }} style={{ width: 160, height: 160, borderRadius: 12, marginRight: 8, backgroundColor: '#1e293b' }} />
                    ))}
                  </ScrollView>
                )}
                {!!item.text && <Text style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 20, marginBottom: 8 }}>{item.text}</Text>}
                {!!item.location_name && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="location" size={13} color="#facc15" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#94a3b8', fontSize: 12 }} numberOfLines={1}>{item.location_name}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => handleToggleLike(item.id)} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
                  <Ionicons name={likeState[item.id]?.isLiked ? 'heart' : 'heart-outline'} size={18} color={likeState[item.id]?.isLiked ? '#ef4444' : '#94a3b8'} style={{ marginRight: 6 }} />
                  {likeState[item.id]?.count > 0 && <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '700' }}>{likeState[item.id].count}</Text>}
                </TouchableOpacity>
              </View>
            )}

            {item.feedType === 'news' && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => toggleNewsExpanded(item.id)}
                style={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1, borderRadius: 18, overflow: 'hidden' }}
              >
                {!!item.image_url && (
                  <Image source={{ uri: item.image_url }} style={{ width: '100%', aspectRatio: 1 }} contentFit="cover" />
                )}
                <View style={{ padding: 14 }}>
                  <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800', marginBottom: 6 }}>{item.title}</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 13, lineHeight: 18 }} numberOfLines={expandedNewsIds[item.id] ? undefined : 3}>{item.content}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
                    <Ionicons name={expandedNewsIds[item.id] ? 'chevron-up' : 'chevron-down'} size={16} color="#64748b" />
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {(item.feedType === 'event' || item.feedType === 'attendance') && (
              <EventCard
                event={targetEvent}
                isAttending={attendanceState[targetEvent.id]?.isAttending}
                attendanceCount={attendanceState[targetEvent.id]?.count || 0}
                onToggleAttendance={() => handleToggleAttendance(targetEvent.id)}
                onPress={() => {}}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
