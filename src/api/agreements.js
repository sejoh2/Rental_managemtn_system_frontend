import { api, download } from './client'

// filters: { property_id?, status?: 'awaiting_signature' | 'signed' }
export async function listAgreements(filters) {
  const { data } = await api.get('/api/agreements', filters)

  return data
}

// body: { signed_at?: 'YYYY-MM-DD', signed_notes? }
export async function markAgreementSigned(agreementId, body) {
  const { data } = await api.patch(`/api/agreements/${agreementId}/sign`, body)

  return data
}

// Reverses a mistaken "signed" mark; the agreement awaits signature again.
export async function unmarkAgreementSigned(agreementId) {
  const { data } = await api.patch(`/api/agreements/${agreementId}/unsign`)

  return data
}

// Rewrites an unsigned agreement from the current template and tenant details.
export async function regenerateAgreement(agreementId) {
  const { data } = await api.post(`/api/agreements/${agreementId}/regenerate`)

  return data
}

export function downloadAgreement(agreementId) {
  return download(`/api/agreements/${agreementId}/download`, {
    filename: 'tenancy-agreement.pdf',
  })
}

// -> { name, content, notice_period_days, version }
export async function getDefaultTemplate() {
  const { data } = await api.get('/api/agreement-templates/default')

  return data
}

// body: { name?, content, notice_period_days }
export async function saveDefaultTemplate(body) {
  const { data } = await api.put('/api/agreement-templates/default', body)

  return data
}

// -> { property_template, effective_template, using_default }
export async function getPropertyTemplate(propertyId) {
  const { data } = await api.get(`/api/properties/${propertyId}/agreement-template`)

  return data
}

export async function savePropertyTemplate(propertyId, body) {
  const { data } = await api.put(`/api/properties/${propertyId}/agreement-template`, body)

  return data
}

// The property goes back to using the default template.
export function deletePropertyTemplate(propertyId) {
  return api.delete(`/api/properties/${propertyId}/agreement-template`)
}
