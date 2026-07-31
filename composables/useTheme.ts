export type ThemeName = 'light' | 'dark'

export const useTheme = () => {
  const theme = useCookie<ThemeName>('proguia-theme', {
    default: () => 'dark',
    sameSite: 'lax',
    watch: true
  })

  const isDark = computed(() => theme.value === 'dark')

  const toggleTheme = () => {
    theme.value = isDark.value ? 'light' : 'dark'
  }

  return { theme, isDark, toggleTheme }
}
