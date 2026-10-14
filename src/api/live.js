import { API_URL, request } from './client'

/*
  Live bells. The server keeps a connection open and says "look again" the
  moment something a bell counts changes; nothing else travels on it.

  The connection cannot carry the sign-in token, so it opens with a pass that
  works for one minute. scope: 'admin' (the admin's bell) | 'owner' (the bell of
  the owner account in use, also for an admin inside an owner's account).
*/
export async function openLiveBell(scope) {
  const { data } = await request('/api/live/ticket', { method: 'POST', query: { for: scope } })

  return new EventSource(`${API_URL}/api/live/stream?ticket=${encodeURIComponent(data.ticket)}`)
}
