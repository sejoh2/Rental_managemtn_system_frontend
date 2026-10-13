import { api, upload } from './client'

/*
  Files attached to a record. kind is 'tenant_document', 'expense_receipt'
  or 'meter_photo'; targetId is the tenant, expense or water reading.
  Files are private: one is opened through a link that works for 5 minutes.
*/

// -> [{ id, name, label, content_type, size_bytes, uploaded_by_name, created_at }]
export async function listFiles(kind, targetId) {
  const { data } = await api.get('/api/files', { kind, target_id: targetId })

  return data
}

// How many files each record has. -> { "<targetId>": count }
export async function countFiles(kind, targetIds) {
  if (!targetIds.length) return {}

  const { data } = await api.get('/api/files/counts', { kind, target_ids: targetIds.join(',') })

  return data
}

// file: a File from an <input type="file">. JPG, PNG, WEBP or PDF, up to 5 MB.
export async function uploadFile(kind, targetId, file, label) {
  const { data } = await upload('/api/files', file, {
    kind,
    target_id: targetId,
    name: file.name,
    label,
  })

  return data
}

// -> { url, expires_in_seconds }
export async function getFileLink(fileId) {
  const { data } = await api.get(`/api/files/${fileId}/link`)

  return data
}

export function deleteFile(fileId) {
  return api.delete(`/api/files/${fileId}`)
}
