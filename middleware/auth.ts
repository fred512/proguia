// Proteção de navegação apenas. A barreira real são as policies de RLS: mesmo
// que alguém chegue à tela do painel sem sessão, o banco não devolve linha
// nenhuma de outra guia nem permite publicar a si mesmo.
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const { user, isAdmin, hasGuideProfile, init, redeemPendingInvite } = useAuth()
  await init()

  if (!user.value) return navigateTo('/painel/entrar')

  // Chegou com convite guardado e ainda não é guia: resgata agora.
  if (!hasGuideProfile.value && !isAdmin.value) {
    await redeemPendingInvite()
  }

  // Conta válida, mas sem convite e sem ser administrador — não há painel
  // para mostrar.
  if (!hasGuideProfile.value && !isAdmin.value) {
    return navigateTo('/painel/entrar?sem-convite=1')
  }
})
