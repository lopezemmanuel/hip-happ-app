import { supabase } from './supabase';

export async function toggleLike(postId, userId, isCurrentlyLiked) {
  if (isCurrentlyLiked) {
    return supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
  }
  return supabase.from('post_likes').insert([{ post_id: postId, user_id: userId }]);
}

export async function toggleAttendance(eventId, userId, isCurrentlyAttending) {
  if (isCurrentlyAttending) {
    return supabase.from('event_attendance').delete().eq('event_id', eventId).eq('user_id', userId);
  }
  return supabase.from('event_attendance').insert([{ event_id: eventId, user_id: userId }]);
}

export async function toggleFollow(followerId, followedId, isCurrentlyFollowing) {
  if (isCurrentlyFollowing) {
    return supabase.from('follows').delete().eq('follower_id', followerId).eq('followed_id', followedId);
  }
  return supabase.from('follows').insert([{ follower_id: followerId, followed_id: followedId }]);
}
