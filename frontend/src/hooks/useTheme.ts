import { useThemeStore } from '@/stores/themeStore'

export function useTheme() {
  const theme = useThemeStore((s) => s.theme)
  const toggle = useThemeStore((s) => s.toggle)
  const setTheme = useThemeStore((s) => s.setTheme)

  return {
    theme,
    toggleTheme: toggle,
    setTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  }
}