import type { TravelRoute } from '~/components/RouteCard.vue'

export type PublicHost = {
  id: string
  name: string
  slug: string
  region: string
  languages: string
  group_limit: number
  bio: string
  photo_url: string | null
}

const HOST_FIELDS = 'id, name, slug, region, languages, group_limit, bio, photo_url'
const ROUTE_FIELDS = 'id, title, category, description, price_per_day, capacity, cover_image, highlights, gallery'

// O RLS continua sendo a barreira, mas não basta como filtro: a policy
// `guides_admin_read` dá ao administrador acesso a todos os perfis, então sem
// o `.eq('published', true)` explícito ele enxergaria no site público os
// perfis despublicados — um site diferente do que o visitante vê, que é o
// pior cenário para quem precisa conferir se está tudo certo.
export const usePublicHosts = () => {
  const supabase = useSupabase()

  const listHosts = async () => {
    const { data, error } = await supabase
      .from('guides')
      .select(HOST_FIELDS)
      .eq('published', true)
      .order('name', { ascending: true })

    if (error) return { hosts: [] as PublicHost[], error: error.message }
    return { hosts: (data ?? []) as PublicHost[], error: '' }
  }

  const getHost = async (slug: string) => {
    const { data, error } = await supabase
      .from('guides')
      .select(HOST_FIELDS)
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()

    if (error) return { host: null, error: error.message }
    return { host: (data as PublicHost | null), error: '' }
  }

  // Mesma razão: `routes_admin_read` deixaria o administrador ver rascunhos na
  // página pública do anfitrião.
  const getRoutes = async (hostId: string) => {
    const { data, error } = await supabase
      .from('routes')
      .select(ROUTE_FIELDS)
      .eq('guide_id', hostId)
      .eq('active', true)
      .order('position', { ascending: true })

    if (error) return { routes: [] as TravelRoute[], error: error.message }
    return { routes: (data ?? []) as TravelRoute[], error: '' }
  }

  return { listHosts, getHost, getRoutes }
}
