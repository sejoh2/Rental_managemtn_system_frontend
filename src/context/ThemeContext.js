import { createContext, useContext } from 'react'

export const ThemeContext = createContext(null)

/*
  const { mode, shown, setMode } = useTheme()
  mode:  'light' | 'dark' | 'system'   what the user chose
  shown: 'light' | 'dark'              what is on screen now
*/
export function useTheme() {
  return useContext(ThemeContext)
}
