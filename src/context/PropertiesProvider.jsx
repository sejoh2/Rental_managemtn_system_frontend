import { listProperties } from '../api/properties'
import { useApi } from '../hooks/useApi'
import { PropertiesContext } from './PropertiesContext'

function PropertiesProvider({ children }) {
  const properties = useApi('properties', listProperties)

  return <PropertiesContext.Provider value={properties}>{children}</PropertiesContext.Provider>
}

export default PropertiesProvider
