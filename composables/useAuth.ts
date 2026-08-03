import type { User } from '@supabase/supabase-js'

const INVITE_STORAGE_KEY = 'proguia-invite'

export const useAuth = () => {
  const user = useState<User | null>('proguia-user', () => null)
  const isAdmin = useState<boolean>('proguia-is-admin', () => false)
  const hasGuideProfile = useState<boolean>('proguia-has-guide', () => false)
  const ready = useState<boolean>('proguia-auth-ready', () => false)
  // Motivo da recusa do convite, para a tela de entrada explicar em vez de
  // mostrar a mensagem genérica de "sem convite".
  const inviteError = useState<string>('proguia-invite-error', () => '')

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

  // Três canais porque o login por Google sai da página e volta, e cada canal
  // falha num cenário diferente: cookie sobrevive à navegação de topo vinda do
  // provedor, localStorage sobrevive a recarregamento, e a URL cobre o caso de
  // o navegador descartar os dois.
  const inviteCookie = () =>
    useCookie<string | null>(INVITE_STORAGE_KEY, {
      maxAge: 60 * 30,
      sameSite: 'lax',
      path: '/'
    })

  const rememberInvite = (token: string) => {
    if (!token) return
    inviteCookie().value = token
    if (import.meta.client) window.localStorage.setItem(INVITE_STORAGE_KEY, token)
  }

  const pendingInvite = () => {
    const fromCookie = inviteCookie().value
    if (fromCookie) return fromCookie
    return import.meta.client ? window.localStorage.getItem(INVITE_STORAGE_KEY) : null
  }

  const forgetInvite = () => {
    inviteCookie().value = null
    if (import.meta.client) window.localStorage.removeItem(INVITE_STORAGE_KEY)
  }

  // Aceita o token vindo da URL além do localStorage: o retorno do OAuth pode
  // cair numa janela diferente da que abriu o convite, e aí o storage não
  // acompanha.
  const redeemPendingInvite = async (tokenFromUrl?: string) => {
    const token = tokenFromUrl || pendingInvite()
    if (!token || !user.value || hasGuideProfile.value) return null

    const { error } = await useSupabase().rpc('redeem_guide_invite', { p_token: token })
    forgetInvite()

    if (error) {
      inviteError.value = error.message
      return error.message
    }

    inviteError.value = ''
    await loadRoles()
    return null
  }

  // Leva o convite na URL de retorno, para sobreviver ao desvio pelo provedor.
  const redirectTo = () => {
    const token = pendingInvite()
    const base = `${window.location.origin}/painel`
    return token ? `${base}?convite=${encodeURIComponent(token)}` : base
  }

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
    inviteError,
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
