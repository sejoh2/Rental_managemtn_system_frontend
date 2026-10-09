// Shared form state for the Add property and Edit property modals.

export const emptyAccount = {
  accountType: 'paybill',
  businessNumber: '',
  consumerKey: '',
  consumerSecret: '',
  environment: 'sandbox',
  // idle | connecting | connected
  status: 'idle',
  connectionId: null,
  expiresAt: 0,
  error: null,
}

export const emptyCaretaker = {
  // none | existing | new
  mode: 'none',
  caretakerId: '',
  first_name: '',
  last_name: '',
  phone: '',
  permission_level: 'level_1',
}

// The API returns one row per assignment, so a caretaker with two properties appears twice.
export function uniqueCaretakers(rows) {
  return [
    ...new Map(
      (rows || [])
        .filter((item) => item.user_status !== 'suspended')
        .map((item) => [item.caretaker_id, item])
    ).values(),
  ]
}

// Body for the assign-caretaker endpoint, or null when no caretaker is chosen.
export function caretakerDetails(caretaker, existingCaretakers) {
  if (caretaker.mode === 'new') {
    return {
      first_name: caretaker.first_name.trim(),
      last_name: caretaker.last_name.trim(),
      phone: caretaker.phone.replace(/\s/g, ''),
      permission_level: caretaker.permission_level,
    }
  }

  if (caretaker.mode === 'existing') {
    const selected = existingCaretakers.find(
      (item) => String(item.caretaker_id) === caretaker.caretakerId
    )

    return selected
      ? {
          first_name: selected.first_name,
          last_name: selected.last_name,
          phone: selected.phone,
          permission_level: caretaker.permission_level,
        }
      : null
  }

  return null
}
