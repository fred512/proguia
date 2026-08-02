// Camada de navegação. Quem manda de verdade é `is_platform_admin()`: as
// policies e os RPCs de publicação e convite recusam qualquer outro usuário,
// mesmo que ele chegue nesta rota.
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const { user, isAdmin, init } = useAuth()
  await init()

  if (!user.value) return navigateTo('/painel/entrar')
  if (!isAdmin.value) return navigateTo('/painel')
})
