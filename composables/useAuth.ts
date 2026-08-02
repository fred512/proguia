import type { User } from '@supabase/supabase-js'

const INVITE_STORAGE_KEY = 'proguia-invite'

export const useAuth = () => {
  const user = useState<User | null>('proguia-user', () => null)
  const isAdmin = useState<boolean>('proguia-is-admin', () => false)
  const hasGuideProfile = useState<boolean>('proguia-has-guide', () => false)
  const ready = useState<boolean>('proguia-auth-ready', () => false)

  const loadRoles = async () => {
    if (!user.value) {
      isAdmin.value = false
      hasGuideProfile.value = false
      return
    }

    const supabase = useSupabase()
    const [admin, guide] = await Promise.all([
      supabase.rpc('is_platform_admin'),
      supabase.from('guides').select('id').eq('id', user.value.id).maybeSingle()
    ])

    isAdmin.value = admin.data === true
    hasGuideProfile.value = Boolean(guide.data)
  }

  // O site é gerado estaticamente, então a sessão só existe no navegador.
  const init = async () => {
    if (!import.meta.client || ready.value) return

    const supabase = useSupabase()
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    await loadRoles()

    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      await loadRoles()
    })

    ready.value = true
  }

  // O token fica em localStorage porque o login por Google sai da página: o
  // parâmetro da URL não sobrevive à ida e volta pelo provedor.
  const rememberInvite = (token: string) => {
    if (import.meta.client && token) window.localStorage.setItem(INVITE_STORAGE_KEY, token)
  }

  const pendingInvite = () =>
    import.meta.client ? window.localStorage.getItem(INVITE_STORAGE_KEY) : null

  const forgetInvite = () => {
    if (import.meta.client) window.localStorage.removeItem(INVITE_STORAGE_KEY)
  }

  const redeemPendingInvite = async () => {
    const token = pendingInvite()
    if (!token || !user.value || hasGuideProfile.value) return null

    const { error } = await useSupabase().rpc('redeem_guide_invite', { p_token: token })
    forgetInvite()

    if (error) return error.message

    await loadRoles()
    return null
  }

  const redirectTo = () => `${window.location.origin}/painel`

  // Magic link: sem senha para gerenciar, esquecer ou vazar.
  const signInWithEmail = (email: string) =>
    useSupabase().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo() }
    })

  const signInWithGoogle = () =>
    useSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo() }
    })

  const signOut = async () => {
    await useSupabase().auth.signOut()
    user.value = null
    isAdmin.value = false
    hasGuideProfile.value = false
    await navigateTo('/painel/entrar')
  }

  return {
    user,
    isAdmin,
    hasGuideProfile,
    ready,
    init,
    loadRoles,
    rememberInvite,
    pendingInvite,
    forgetInvite,
    redeemPendingInvite,
    signInWithEmail,
    signInWithGoogle,
    signOut
  }
}
