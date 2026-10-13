import { api } from './client'

// -> { sent_this_month, accepted_count, accepted_percentage, failed_count, scheduled_count,
//      next_scheduled_at, accepted_cost, cost_per_message, sms_mode }
// "accepted" means the SMS provider took the message; handset delivery is not tracked.
export async function getSmsStats() {
  const { data } = await api.get('/api/sms/stats')

  return data
}

// filters: { property_id?, tenant_id?, status?, limit? }
export async function listSmsMessages(filters) {
  const { data } = await api.get('/api/sms/messages', filters)

  return data
}

export function retrySmsMessage(messageId) {
  return api.post(`/api/sms/messages/${messageId}/retry`)
}

export async function listSmsTemplates() {
  const { data } = await api.get('/api/sms/templates')

  return data
}

// body: { name, body }
export async function createSmsTemplate(body) {
  const { data } = await api.post('/api/sms/templates', body)

  return data
}

export async function updateSmsTemplate(templateId, body) {
  const { data } = await api.patch(`/api/sms/templates/${templateId}`, body)

  return data
}

export function deleteSmsTemplate(templateId) {
  return api.delete(`/api/sms/templates/${templateId}`)
}

// filters: { status?, limit? }
export async function listSmsBroadcasts(filters) {
  const { data } = await api.get('/api/sms/broadcasts', filters)

  return data
}

// target: { recipient_group, property_id? } -> { recipient_count, cost_per_message, estimated_cost }
export async function estimateSmsRecipients(target) {
  const { data } = await api.post('/api/sms/recipients/estimate', target)

  return data
}

// body: { recipient_group, property_id?, template_id?, message, send_at? }
// Without send_at it is sent now. With send_at, recipients and balances are worked out at that time.
export async function createSmsBroadcast(body) {
  const { data } = await api.post('/api/sms/broadcasts', body)

  return data
}

// Only a broadcast that is still scheduled can be cancelled.
// Only while it is still waiting for its time. body as createSmsBroadcast, with send_at.
export async function updateSmsBroadcast(broadcastId, body) {
  const { data } = await api.patch(`/api/sms/broadcasts/${broadcastId}`, body)

  return data
}

export function cancelSmsBroadcast(broadcastId) {
  return api.post(`/api/sms/broadcasts/${broadcastId}/cancel`)
}
