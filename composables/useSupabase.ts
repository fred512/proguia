import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// O cliente é guardado no nuxtApp em vez de numa variável de módulo: durante o
// prerender o módulo é compartilhado entre rotas, e sessão não deve vazar de
// uma para outra.
export const useSupabase = (): SupabaseClient => {
  const nuxtApp = useNuxtApp() as { _supabase?: SupabaseClient }
  if (nuxtApp._supabase) return nuxtApp._supabase

  const { supabaseUrl, supabasePublishableKey } = useRuntimeConfig().public

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Supabase não configurado. Defina NUXT_PUBLIC_SUPABASE_URL e NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.'
    )
  }

  nuxtApp._supabase = createClient(String(supabaseUrl), String(supabasePublishableKey), {
    auth: {
      persistSession: import.meta.client,
      autoRefreshToken: import.meta.client,
      detectSessionInUrl: import.meta.client
    }
  })

  return nuxtApp._supabase
}
