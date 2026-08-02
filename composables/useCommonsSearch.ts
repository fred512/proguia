export type CommonsImage = {
  title: string
  thumb: string
  image: string
  credit: string
  license: string
  source: string
}

const API = 'https://commons.wikimedia.org/w/api.php'

// O campo Artist do Commons vem como HTML (link para o perfil do autor).
const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

// Buscar pelo nome da cidade devolve posto de gasolina e ônibus urbano; as
// fotos boas estão catalogadas pelo nome do ponto turístico.
export const COMMONS_SUGGESTIONS = [
  'Iguazu Falls',
  'Itaipu Dam',
  'Hito de las Tres Fronteras',
  'Parque Nacional do Iguaçu',
  'Ciudad del Este',
  'Shopping Paris Ciudad del Este',
  'Marco das Três Fronteiras',
  'Templo Budista Foz do Iguaçu'
]

export const useCommonsSearch = () => {
  const results = ref<CommonsImage[]>([])
  const searching = ref(false)
  const searchError = ref('')

  const search = async (term: string, limit = 12) => {
    const query = term.trim()
    if (!query) return

    searchError.value = ''
    searching.value = true
    results.value = []

    // origin=* libera CORS: a chamada sai do navegador, sem servidor e sem chave.
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrsearch: query,
      gsrnamespace: '6',
      gsrlimit: String(limit),
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '400',
      origin: '*'
    })

    try {
      const response = await fetch(`${API}?${params}`)
      if (!response.ok) throw new Error(`Commons respondeu ${response.status}`)

      const payload = await response.json()
      const pages = payload?.query?.pages ?? {}

      results.value = Object.values(pages)
        .map((page: any) => {
          const info = page?.imageinfo?.[0]
          if (!info?.thumburl) return null

          const meta = info.extmetadata ?? {}
          const filename = String(page.title).replace(/^File:/, '')

          return {
            title: filename.replace(/\.[^.]+$/, ''),
            thumb: info.thumburl,
            // Mesmo padrão já usado nos roteiros: versão redimensionada, não o
            // original, que costuma ter dezenas de megabytes.
            image: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=1200`,
            credit: stripHtml(meta.Artist?.value ?? '') || 'Autor não informado',
            license: stripHtml(meta.LicenseShortName?.value ?? '') || 'ver no Commons',
            source: info.descriptionurl ?? ''
          }
        })
        .filter(Boolean) as CommonsImage[]

      if (!results.value.length) {
        searchError.value = 'Nada encontrado. Tente o nome do ponto turístico em vez do nome da cidade.'
      }
    } catch (error) {
      searchError.value = `Falha na busca: ${(error as Error).message}`
    } finally {
      searching.value = false
    }
  }

  return { results, searching, searchError, search, COMMONS_SUGGESTIONS }
}
