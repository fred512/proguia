export type ThemeName = 'light' | 'dark'

export const useTheme = () => {
  const theme = useState<ThemeName>('proguia-theme', () => 'dark')

  const isDark = computed(() => theme.value === 'dark')

  const persistTheme = (nextTheme: ThemeName) => {
    if (!import.meta.client) return

    window.localStorage.setItem('proguia-theme', nextTheme)
    document.cookie = `proguia-theme=${nextTheme}; Path=/; Max-Age=31536000; SameSite=Lax`
  }

  const restoreTheme = () => {
    if (!import.meta.client) return

    const localTheme = window.localStorage.getItem('proguia-theme')
    const cookieTheme = document.cookie.match(/(?:^|; )proguia-theme=(light|dark)/)?.[1]
    const savedTheme = localTheme ?? cookieTheme

    if (savedTheme === 'light' || savedTheme === 'dark') theme.value = savedTheme
  }

  onMounted(restoreTheme)

  const toggleTheme = () => {
    theme.value = isDark.value ? 'light' : 'dark'
    persistTheme(theme.value)
  }

  return { theme, isDark, toggleTheme }
}
