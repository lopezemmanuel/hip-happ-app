import { supabase } from './supabase';

export async function archivePost(postId) {
  return supabase.from('posts').update({ is_archived: true }).eq('id', postId);
}

export async function unarchivePost(postId) {
  return supabase.from('posts').update({ is_archived: false }).eq('id', postId);
}

export async function deletePost(postId) {
  return supabase.from('posts').delete().eq('id', postId);
}

export async function reportPost(postId, reporterId, reason, detail) {
  return supabase.from('post_reports').insert([{ post_id: postId, reporter_id: reporterId, reason, detail: detail || null }]);
}

// Todavía no existe una página web pública por posteo: por ahora el link es
// simbólico (usa el scheme de la app, definido en app.json) y sirve para
// pegarlo como referencia, no para abrir el contenido desde afuera.
export function buildPostShareLink(postId) {
  return `hiphapp://post/${postId}`;
}
