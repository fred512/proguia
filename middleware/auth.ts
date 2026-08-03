// Proteção de navegação apenas. A barreira real são as policies de RLS: mesmo
// que alguém chegue à tela do painel sem sessão, o banco não devolve linha
// nenhuma de outra guia nem permite publicar a si mesmo.
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { user, isAdmin, hasGuideProfile, init, redeemPendingInvite } = useAuth()
  await init()

  if (!user.value) return navigateTo('/painel/entrar')

  if (!hasGuideProfile.value && !isAdmin.value) {
    // O token pode chegar pela URL de retorno do OAuth ou pelo localStorage.
    await redeemPendingInvite(String(to.query.convite ?? ''))
  }

  // Conta válida, mas sem convite e sem ser administrador — não há painel
  // para mostrar. O motivo da recusa, quando existe, fica em `inviteError` e
  // é exibido na tela de entrada.
  if (!hasGuideProfile.value && !isAdmin.value) {
    return navigateTo('/painel/entrar?sem-convite=1')
  }
})
