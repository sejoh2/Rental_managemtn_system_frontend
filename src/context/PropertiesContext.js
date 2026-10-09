import { createContext, useContext } from 'react'

export const PropertiesContext = createContext(null)

/*
  The owner's properties, shared by every dashboard page.

  const { data, loading, error, reload } = useProperties()
  data is null until the first load finishes.
*/
export function useProperties() {
  return useContext(PropertiesContext)
}
