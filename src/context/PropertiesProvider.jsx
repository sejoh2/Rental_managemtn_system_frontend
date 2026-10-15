import { useCallback, useMemo, useState } from 'react'
import { listProperties } from '../api/properties'
import { useApi } from '../hooks/useApi'
import { useAuth } from './AuthContext'
import { PropertiesContext } from './PropertiesContext'

// One remembered choice per account, so an admin opening owners does not carry one across.
function storageKey(ownerId) {
  return `selected-property-${ownerId}`
}

function readChoice(key) {
  try {
    return localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

function PropertiesProvider({ children }) {
  const { user, actingOwner } = useAuth()
  const key = storageKey(actingOwner ? actingOwner.user_id : user?.user_id)
  const properties = useApi('properties', listProperties)
  const [chosenId, setChosenId] = useState(() => readChoice(key))

  const selectProperty = useCallback(
    (propertyId) => {
      const value = propertyId ? String(propertyId) : ''

      setChosenId(value)

      try {
        if (value) localStorage.setItem(key, value)
        else localStorage.removeItem(key)
      } catch {
        // Not remembered after a reload; the choice still holds for now.
      }
    },
    [key]
  )

  // A property that was deleted, or belongs to another account, falls back to all.
  const selected = properties.data?.find((property) => String(property.id) === chosenId) || null
  const selectedId = selected ? chosenId : properties.data ? '' : chosenId
  // For pages about one property: the chosen one, or the only one there is.
  const oneProperty = selected || (properties.data?.length === 1 ? properties.data[0] : null)

  const value = useMemo(
    () => ({ ...properties, selectedId, selected, oneProperty, selectProperty }),
    [properties, selectedId, selected, oneProperty, selectProperty]
  )

  return <PropertiesContext.Provider value={value}>{children}</PropertiesContext.Provider>
}

export default PropertiesProvider
