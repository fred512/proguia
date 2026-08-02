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

// Tudo aqui roda com a chave publishable, sem sessão. Quem filtra é o RLS:
// `guides_public_read` só devolve published, e `routes_public_read` só devolve
// roteiro ativo de anfitrião publicado. O `.eq('active', true)` abaixo é
// conveniência de consulta, não a barreira.
export const usePublicHosts = () => {
  const supabase = useSupabase()

  const listHosts = async () => {
    const { data, error } = await supabase
      .from('guides')
      .select(HOST_FIELDS)
      .order('name', { ascending: true })

    if (error) return { hosts: [] as PublicHost[], error: error.message }
    return { hosts: (data ?? []) as PublicHost[], error: '' }
  }

  const getHost = async (slug: string) => {
    const { data, error } = await supabase
      .from('guides')
      .select(HOST_FIELDS)
      .eq('slug', slug)
      .maybeSingle()

    if (error) return { host: null, error: error.message }
    return { host: (data as PublicHost | null), error: '' }
  }

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
