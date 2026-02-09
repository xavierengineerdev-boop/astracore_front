import { createTheme } from '@mui/material/styles'
import type { PaletteMode } from '@mui/material'

export type ThemeName = 'dark' | 'light'

const cosmic = {
  indigo: '#2b2d81',
  violet: '#6a4fbf',
  nebula: '#2ec4b6',
  star: '#ffd166',
  deep: '#0b1020',
  mid: '#111827',
}

export function getTheme(mode: ThemeName) {
  const paletteMode: PaletteMode = mode === 'dark' ? 'dark' : 'light'
  if (mode === 'dark') {
    return createTheme({
      palette: {
        mode: paletteMode,
        background: { default: cosmic.deep, paper: cosmic.mid },
        primary: { main: cosmic.violet },
        secondary: { main: cosmic.nebula },
        info: { main: cosmic.indigo },
      },
      typography: { fontFamily: 'Inter, Roboto, Arial' },
    })
  }

  return createTheme({
    palette: {
      mode: paletteMode,
      background: { default: '#f4f6f8', paper: '#ffffff' },
      primary: { main: cosmic.violet },
      secondary: { main: cosmic.nebula },
      info: { main: cosmic.indigo },
    },
    typography: { fontFamily: 'Inter, Roboto, Arial' },
  })
}
