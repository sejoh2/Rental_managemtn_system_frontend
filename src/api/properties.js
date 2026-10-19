import { api } from './client'

export async function listProperties() {
  const { data } = await api.get('/api/properties')

  return data
}

export async function createProperty(body) {
  const { data } = await api.post('/api/properties', body)

  return data
}

export async function updateProperty(propertyId, body) {
  const { data } = await api.patch(`/api/properties/${propertyId}`, body)

  return data
}

export function archiveProperty(propertyId) {
  return api.delete(`/api/properties/${propertyId}`)
}

// Validates M-Pesa credentials. -> { connection_id, expires_in_seconds, ... }
// propertyId is passed only when an existing property is changing this account.
export async function connectPaymentAccount(accountFor, account, propertyId) {
  const { data } = await api.post('/api/properties/payment-accounts/connect', {
    account_for: accountFor,
    account,
    ...(propertyId ? { property_id: propertyId } : {}),
  })

  return data
}

// Switches the property's rent or water account to a validated connection.
export async function replacePaymentAccount(propertyId, accountFor, connectionId) {
  const { data } = await api.put(
    `/api/properties/${propertyId}/payment-accounts/${accountFor}`,
    { connection_id: connectionId }
  )

  return data
}

/*
  Registers the account's payment notice addresses with Safaricom again,
  with a new secret. Needed once for accounts connected before notices
  had a secret; their payments are not recorded until then.
*/
export async function secureNoticeAddress(propertyId, paymentAccountId) {
  const { data } = await api.post(`/api/properties/${propertyId}/payment-accounts/${paymentAccountId}/register-c2b-urls`)

  return data
}

// Removes the optional water or electricity account; those charges then go through the rent account.
export async function removePaymentAccount(propertyId, accountFor) {
  const { data } = await api.delete(`/api/properties/${propertyId}/payment-accounts/${accountFor}`)

  return data
}

// Automatic payment reminders of a property.
// -> { enabled, days_before: [3, 0], hour, late_enabled, late_days_after }
export async function getPaymentReminders(propertyId) {
  const { data } = await api.get(`/api/properties/${propertyId}/reminders`)

  return data
}

export async function savePaymentReminders(propertyId, body) {
  const { data } = await api.put(`/api/properties/${propertyId}/reminders`, body)

  return data
}
