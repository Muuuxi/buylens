import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@/lib/types';

function db() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase persistence is not configured. Set the server environment variables and create the sessions table.');
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function loadSession(id: string): Promise<{ session: Session; updatedAt: string }> {
  const { data, error } = await db().from('sessions').select('data, updated_at').eq('id', id).single();
  if (error || !data) throw new Error('The saved session could not be loaded. Check the sessions table and server configuration.');
  const session = data.data as Session;
  if (session.id !== id || !Array.isArray(session.log) || !Array.isArray(session.criteria)) throw new Error('The saved session format is not supported. Start a new task.');
  return { session, updatedAt: data.updated_at as string };
}
export async function insertSession(s: Session) {
  const { error } = await db().from('sessions').insert({ id: s.id, state: s.phase, data: s });
  if (error) throw new Error('Could not save this task to Supabase. Check the sessions table and server configuration.');
}
export async function saveSession(s: Session, updatedAt: string) {
  const { data, error } = await db().from('sessions').update({ state: s.phase, data: s, updated_at: new Date().toISOString() }).eq('id', s.id).eq('updated_at', updatedAt).select('updated_at');
  if (error) throw new Error('The task could not be saved. Retry after checking the connection.');
  if (!data?.length) throw new Error('This task changed in another request. Reload before continuing.');
  return data[0].updated_at as string;
}
