import { createContext, useContext } from 'react'

export const PropertiesContext = createContext(null)

/*
  The owner's properties, shared by every dashboard page, and the one chosen
  in the top bar. Every page shows that property, or all of them.

  const { data, loading, error, reload, selectedId, selected, selectProperty } = useProperties()
  data is null until the first load finishes.
  selectedId: '' for all properties, else the property id as a string.
  selected: that property, or null for all properties.
  oneProperty: for pages about one property: selected, or the only property there is.
*/
export function useProperties() {
  return useContext(PropertiesContext)
}
